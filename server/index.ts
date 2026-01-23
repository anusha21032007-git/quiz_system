import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from 'zod';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!API_KEY) {
    console.error("GOOGLE_GENERATIVE_AI_API_KEY is missing in backend .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Schema for request validation
const GenerateRequestSchema = z.object({
    topic: z.string().min(2),
    count: z.number().min(1).max(20),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    marks: z.number().min(1),
    timeLimitSeconds: z.number().min(10)
});

// Schema for AI response validation
const QuestionSchema = z.object({
    id: z.number(),
    question: z.string().min(10),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().min(0).max(3),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    marks: z.number(),
    timeLimitSeconds: z.number()
});

const AIResponseSchema = z.object({
    topic: z.string(),
    questions: z.array(QuestionSchema)
});

type Question = z.infer<typeof QuestionSchema>;

/**
 * Validates topic relevance using keyword matching.
 */
function validateTopicRelevance(question: Question, topic: string): boolean {
    const topicWords = topic.toLowerCase().split(' ').filter(word => word.length > 3);
    const questionLower = question.question.toLowerCase();
    const optionsLower = question.options.join(' ').toLowerCase();
    const fullText = `${questionLower} ${optionsLower}`;

    // Check if at least one significant topic word is present or the whole topic string is present
    const containsWholeTopic = fullText.includes(topic.toLowerCase());
    const matchedWordsCount = topicWords.filter(word => fullText.includes(word)).length;

    // Requirement: Must contain at least 1-2 strong keywords related to the topic
    return containsWholeTopic || matchedWordsCount >= 1;
}

/**
 * Generates MCQs from the given topic.
 */
async function generateFromAI(topic: string, count: number, difficulty: string, marks: number, timeLimitSeconds: number): Promise<any> {
    const prompt = `You are an expert university-level question paper setter.

TASK:
Generate EXACTLY ${count} high-quality MCQ questions for the topic: "${topic}".

STRICT RULES:
1) Each question must be DIRECTLY and STRICTLY about "${topic}" only.
2) Do not mix parent topics or related topics.
3) Avoid vague questions. Match the topic precisely.
4) Options must be realistic and related to the question.
5) Exactly 4 options per question.
6) Exactly one correct answer per question.
7) Return ONLY JSON format.
8) Difficulty level: ${difficulty.toUpperCase()}.

Format:
{
  "topic": "${topic}",
  "questions": [
    {
      "id": number,
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": number,
      "difficulty": "${difficulty}",
      "marks": ${marks},
      "timeLimitSeconds": ${timeLimitSeconds}
    }
  ]
}

Only return the JSON object.`;

    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Using model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log("AI Raw Output Start ---");
            console.log(text.substring(0, 200) + "...");
            console.log("AI Raw Output End ---");

            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return parsed;
        } catch (err: any) {
            console.error(`Model ${modelName} failed:`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error("All models failed");
}

app.post('/api/ai/generate-questions', async (req, res) => {
    try {
        const { topic, count, difficulty, marks, timeLimitSeconds } = GenerateRequestSchema.parse(req.body);

        let finalQuestions: Question[] = [];
        let retryCount = 0;
        const MAX_RETRIES = 3;

        while (finalQuestions.length < count && retryCount < MAX_RETRIES) {
            try {
                const neededCount = count - finalQuestions.length;
                console.log(`Generating ${neededCount} questions (Attempt ${retryCount + 1})...`);

                const aiResponse = await generateFromAI(topic, neededCount, difficulty, marks, timeLimitSeconds);
                const validatedData = AIResponseSchema.parse(aiResponse);

                for (const q of validatedData.questions) {
                    if (validateTopicRelevance(q, topic) && finalQuestions.length < count) {
                        // Ensure unique questions by simple text match
                        if (!finalQuestions.some(existing => existing.question === q.question)) {
                            finalQuestions.push(q);
                        }
                    }
                }

                if (finalQuestions.length < count) {
                    retryCount++;
                }
            } catch (err: any) {
                console.error("AI Generation attempt failed:");
                if (err.response) {
                    console.error("Status:", err.response.status);
                    console.error("Status Text:", err.response.statusText);
                    console.error("Data:", JSON.stringify(err.response.data, null, 2));
                } else {
                    console.error(err);
                }
                retryCount++;
            }
        }

        if (finalQuestions.length < count) {
            return res.status(500).json({
                error: `Failed to generate ${count} questions. Only generated ${finalQuestions.length}.`,
                hint: "This usually means your API key is invalid. Please get a new key from https://aistudio.google.com/app/apikey",
                instructions: "Update server/.env with: GOOGLE_GENERATIVE_AI_API_KEY=your_new_key"
            });
        }

        res.json({
            topic,
            questions: finalQuestions.slice(0, count)
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Server error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Validate API key on startup
async function validateApiKey() {
    console.log("\n🔑 Validating Google AI API Key...");
    try {
        const testModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await testModel.generateContent("test");
        await result.response;
        console.log("✅ API Key is VALID and working!\n");
        return true;
    } catch (error: any) {
        console.error("❌ API Key validation FAILED!");
        console.error("Error:", error.message);
        console.error("\n⚠️  ACTION REQUIRED:");
        console.error("1. Visit: https://aistudio.google.com/app/apikey");
        console.error("2. Create a new API key");
        console.error("3. Update server/.env with: GOOGLE_GENERATIVE_AI_API_KEY=your_new_key");
        console.error("4. Restart this server\n");
        return false;
    }
}

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Network access: http://<your-ip>:${PORT}`);
    await validateApiKey();
});
