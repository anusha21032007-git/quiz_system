import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = Number(process.env.PORT) || 5000;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
let OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.VITE_GEMINI_API_KEY || 'AIzaSyD7lQtPtOhxM616t0k_QT7aEikbTa8tlKg';

const DEBUG_FILE = path.join(__dirname, 'ai_debug.txt');

// Initialize Gemini
let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('YOUR_API_KEY')) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        console.log("✅ Gemini AI Initialized");
    } catch (e) {
        console.error("❌ Failed to initialize Gemini AI:", e);
    }
}

// Schema for request validation
const GenerateRequestSchema = z.object({
    topic: z.string().min(2),
    count: z.number().min(1).max(50),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    marks: z.number().min(1),
    timeLimitSeconds: z.number().min(10),
    optionsCount: z.number().min(2).max(6).optional().default(4)
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        ollama: {
            url: OLLAMA_BASE_URL,
            model: OLLAMA_MODEL
        },
        gemini: {
            initialized: !!genAI,
            model: "gemini-1.5-flash"
        }
    });
});

function cleanAIJson(text: string): string {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Sometimes models add explanatory text before or after the JSON
    // validation to ensure we only capture the JSON array or object
    const startBrace = cleaned.indexOf('{');
    const startBracket = cleaned.indexOf('[');

    // Determine which comes first to identify if it's an object or array
    let start = -1;
    if (startBrace !== -1 && startBracket !== -1) {
        start = Math.min(startBrace, startBracket);
    } else if (startBrace !== -1) {
        start = startBrace;
    } else {
        start = startBracket;
    }

    const endBrace = cleaned.lastIndexOf('}');
    const endBracket = cleaned.lastIndexOf(']');
    const end = Math.max(endBrace, endBracket);

    if (start === -1 || end === -1) {
        console.error("Failed to find JSON in response:", text); // Log original for debug
        throw new Error("No JSON object found in response");
    }

    return cleaned.substring(start, end + 1);
}

async function generateWithOllama(params: any): Promise<any> {
    const { topic, difficulty, marks, timeLimitSeconds, optionsCount, count } = params;
    const numOptions = optionsCount || 4;
    const qCount = count || 1;

    // TEXT-BASED ANSWER MATCHING (eliminates AI index confusion)
    const prompt = `You are an expert exam question setter.

Generate ${qCount} high-quality MCQ for: "${topic}"

Difficulty: ${difficulty}
Options: ${numOptions}

STRICT RULES:
1. Question must be 100% about "${topic}"
2. EXACTLY ONE option must be correct
3. Other options must be wrong but realistic
4. No vague questions
5. Correct answer must be verifiable

CRITICAL: Instead of providing correctIndex, provide the EXACT TEXT of the correct answer.

JSON FORMAT (ARRAY):
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": "Paris",
    "explanation": "Paris is the capital and largest city of France"
  }
]

IMPORTANT:
- "correctAnswer" must be the EXACT text that matches one of your options
- Copy it character-by-character from the options array
${numOptions === 2 ? '- For True/False, options must be ["True", "False"]' : ''}

Generate now:`;

    console.log(`[Ollama] Generating question for "${topic}" (text-based matching)...`);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            format: 'json',
            options: {
                temperature: 0.4,
                num_predict: 700,
                top_p: 0.9
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    const text = data.response || '';

    if (!text) throw new Error("Empty response from Ollama");

    const cleanedText = cleanAIJson(text);
    const parsed = JSON.parse(cleanedText);

    const questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);

    // POST-PROCESSING: Find correct index by matching text
    const mappedQuestions = questionsArray.map((q: any, idx: number) => {
        const correctAnswerText = q.correctAnswer || "";

        // Find which option matches the correctAnswer text (case-insensitive, trimmed)
        let correctIndex = q.options.findIndex((opt: string) =>
            opt.trim().toLowerCase() === correctAnswerText.trim().toLowerCase()
        );

        // Fallback: if exact match fails, try partial match
        if (correctIndex === -1) {
            correctIndex = q.options.findIndex((opt: string) =>
                opt.trim().toLowerCase().includes(correctAnswerText.trim().toLowerCase()) ||
                correctAnswerText.trim().toLowerCase().includes(opt.trim().toLowerCase())
            );
        }

        // If still not found, default to 0 and log error
        if (correctIndex === -1) {
            console.error(`[MATCH ERROR] Could not match correctAnswer "${correctAnswerText}" to any option`);
            console.error(`Options: ${JSON.stringify(q.options)}`);
            correctIndex = 0; // Fallback to first option
        }

        // Detailed logging
        console.log(`[Q${idx + 1}] "${q.question.substring(0, 60)}..."`);
        console.log(`[AI said correct]: "${correctAnswerText}"`);
        console.log(`[Matched to option ${correctIndex}]: "${q.options[correctIndex]}"`);

        return {
            id: idx + 1,
            question: q.question,
            options: q.options,
            correctIndex: correctIndex,  // OUR computed index, not AI's
            difficulty: difficulty,
            marks: marks,
            timeLimitSeconds: timeLimitSeconds,
            explanation: q.explanation || ''
        };
    });

    return mappedQuestions;
}

async function generateWithGemini(params: any): Promise<any> {
    const { topic, difficulty, marks, timeLimitSeconds, optionsCount, count } = params;

    if (!genAI) {
        throw new Error("Gemini AI not initialized (API Key missing)");
    }

    console.log(`[Gemini] Generating ${count || 1} questions for "${topic}"...`);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7
        }
    });

    const prompt = `You are an expert exam question setter.
Generate ${count || 1} high-quality MCQs for the topic: "${topic}"
Difficulty: ${difficulty}
Options per question: ${optionsCount || 4}
Marks per question: ${marks}
Time limit per question: ${timeLimitSeconds} seconds

STRICT RULES:
1. Questions must be 100% about "${topic}"
2. EXACTLY ONE option must be correct
3. Other options must be wrong but realistic
4. Provide a clear explanation for the correct answer

OUTPUT FORMAT (JSON ARRAY):
[
  {
    "question": "Text of the question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 1,
    "explanation": "Why Option B is correct"
  }
]

IMPORTANT: Return ONLY the JSON array.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = cleanAIJson(text);
    const parsed = JSON.parse(cleanedText);
    const questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);

    return questionsArray.map((q: any, idx: number) => ({
        id: idx + 1,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        difficulty: difficulty,
        marks: marks,
        timeLimitSeconds: timeLimitSeconds,
        explanation: q.explanation || ''
    }));
}

async function generateBatch(params: any, retryAttempt = 0): Promise<any> {
    console.log(`\n--- [Batch] Attempt ${retryAttempt + 1} | Topic: ${params.topic} | Count: ${params.count} ---`);

    try {
        console.log("[Batch] Attempting with Ollama...");
        return await generateWithOllama(params);
    } catch (err: any) {
        console.error(`[Batch] Ollama failed: ${err.message}`);

        // If it's a connection error or explicit failure, try Gemini if available
        if (genAI) {
            console.log("[Batch] Falling back to Gemini AI...");
            try {
                return await generateWithGemini(params);
            } catch (geminiErr: any) {
                console.error(`[Batch] Gemini fallback also failed: ${geminiErr.message}`);
            }
        }

        if (retryAttempt < 1) {
            console.log("[Batch] Retrying in 2 seconds...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            return generateBatch(params, retryAttempt + 1);
        }
        throw err;
    }
}

app.post('/api/ai/generate-questions', async (req, res) => {
    try {
        const params = GenerateRequestSchema.parse(req.body);
        const questions = await generateBatch(params);

        console.log(`[Success] Topic: "${params.topic}" | Returned: ${questions.length} questions`);
        res.json({
            topic: params.topic,
            questions: questions
        });
    } catch (error: any) {
        console.error(`[API Error] ${error.message}`);
        res.status(error instanceof z.ZodError ? 400 : 500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Schema for PDF Context request
const GenerateFromPdfSchema = z.object({
    textContent: z.string().optional(), // Can be empty if images are provided
    images: z.array(z.string()).optional(), // Base64 images for vision
    topic: z.string().optional(),
    count: z.number().min(1).max(50).default(5),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    marks: z.number().min(1).default(1),
    timeLimitSeconds: z.number().min(10).default(60),
    optionsCount: z.number().min(2).max(6).default(4)
});

async function generateFromContextWithOllama(params: any): Promise<any> {
    const { textContent, difficulty, marks, timeLimitSeconds, optionsCount } = params;

    const truncatedContext = textContent.slice(0, 12000);
    const qCount = params.count || 5;

    const prompt = `Step 1: Clean the EXTRACTED PDF TEXT by removing noise lines like:
- "Scanned with CamScanner"
- Repeated headers/footers
- Page numbers
- Random symbols/garbage characters

Step 2: Using ONLY the cleaned content, identify main topics and generate MCQs.

STRICT RULES:
1. If the cleaned content has fewer than 150 words of actual subject matter, return EXACTLY this JSON:
   {"error":"NOT_ENOUGH_CONTEXT_FROM_PDF"}
2. Questions must be strictly from the PDF text only.
3. No outside knowledge or guessing.
4. Each question must include a 1-line explanation from the text.

TASK:
Generate ${qCount} high-quality MCQs based on the content.

OUTPUT FORMAT (JSON ONLY):
{
  "questions": [
    {
      "question": "...",
      "options": ["A","B","C","D"],
      "correctAnswer": "Exact text of the correct option here",
      "explanation": "..."
    }
  ]
}

PDF TEXT:
<<<
${truncatedContext}
>>>

Generate JSON now:`;

    console.log(`[Ollama] Generating cleaned PDF questions (Context length: ${truncatedContext.length})...`);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            format: 'json',
            options: {
                temperature: 0.1,
                num_predict: 2500,
                top_p: 0.9
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    const text = data.response || '';

    if (!text) throw new Error("Empty response from Ollama");

    const cleanedText = cleanAIJson(text);
    const parsed = JSON.parse(cleanedText);

    if (parsed.error === "NOT_ENOUGH_CONTEXT_FROM_PDF") {
        throw new Error("PDF content is too short (less than 150 words of subject matter) or contains only noise.");
    }

    let questionsArray: any[] = [];
    if (parsed.topics && Array.isArray(parsed.topics)) {
        parsed.topics.forEach((topic: any) => {
            if (topic.questions && Array.isArray(topic.questions)) {
                questionsArray.push(...topic.questions);
            }
        });
    } else {
        questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
    }

    return questionsArray.map((q: any, idx: number) => {
        let correctIndex = q.options.findIndex((opt: string) =>
            opt.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase()
        );

        if (correctIndex === -1) {
            correctIndex = q.options.findIndex((opt: string) =>
                opt.includes(q.correctAnswer) || q.correctAnswer.includes(opt)
            );
            if (correctIndex === -1) correctIndex = 0;
        }

        return {
            id: idx + 1,
            question: q.question,
            options: q.options,
            correctIndex: correctIndex,
            difficulty: difficulty,
            marks: marks,
            timeLimitSeconds: timeLimitSeconds,
            explanation: q.explanation || (q.topic ? `Topic: ${q.topic}` : "Derived from document context.")
        };
    });
}

async function generateFromImagesWithGemini(params: any): Promise<any> {
    const { images, difficulty, marks, timeLimitSeconds, count, optionsCount } = params;

    if (!genAI) throw new Error("Gemini AI is not initialized");

    console.log(`[Gemini Vision] Analyzing ${images.length} images...`);

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are an expert exam setter. Analyze these images of valid study material (notes, textbook pages, or diagrams).
    
    TASK:
    Generate ${count} multiple-choice questions (MCQs) based STRICTLY on the visual content.
    
    Difficulty: ${difficulty}
    Options per question: ${optionsCount}
    
    OUTPUT JSON ARRAY ONLY:
    [
      {
        "question": "Question text...",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0,
        "explanation": "Explanation..."
      }
    ]
    `;

    // Prepare image parts
    const imageParts = images.map((base64: string) => {
        // Remove header if present (data:image/jpeg;base64,...)
        const data = base64.replace(/^data:image\/\w+;base64,/, "");
        return {
            inlineData: {
                data: data,
                mimeType: "image/jpeg",
            },
        };
    });

    try {
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        const cleanedText = cleanAIJson(text);
        const parsed = JSON.parse(cleanedText);
        const questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);

        return questionsArray.map((q: any, idx: number) => ({
            id: idx + 1,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            difficulty: difficulty,
            marks: marks,
            timeLimitSeconds: timeLimitSeconds,
            explanation: q.explanation || "Derived from visual content"
        }));

    } catch (error: any) {
        console.error("Gemini Vision Error:", error);
        throw new Error("Failed to analyze images: " + error.message);
    }
}

app.post('/api/ai/generate-from-pdf', async (req, res) => {
    try {
        const params = GenerateFromPdfSchema.parse(req.body);

        let questions = [];

        if (params.images && params.images.length > 0) {
            console.log("[Request] Using Vision API (Images provided)");
            questions = await generateFromImagesWithGemini(params);
        } else if (params.textContent && params.textContent.length > 50) {
            console.log("[Request] Using Text API");
            questions = await generateFromContextWithOllama(params);
        } else {
            throw new Error("No valid content provided. Provide extracted text or images.");
        }

        console.log(`[Success] Content Gen | Returned: ${questions.length} questions`);
        res.json({
            topic: params.topic || "Document Analysis",
            questions: questions
        });
    } catch (error: any) {
        console.error(`[API Error] ${error.message}`);
        res.status(error instanceof z.ZodError ? 400 : 500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

async function autoDetectModel() {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (response.ok) {
            const data: any = await response.json();
            const names = (data.models || []).map((m: any) => m.name);
            console.log(`✅ Available Ollama Models: ${names.join(', ')}`);
            if (!names.includes(OLLAMA_MODEL)) {
                const fallback = names.find((n: string) => n.includes('llama3') || n.includes('mistral'));
                if (fallback) {
                    console.log(`🔄 Switching OLLAMA_MODEL to fallback: ${fallback}`);
                    OLLAMA_MODEL = fallback;
                }
            }
        }
    } catch (e) {
        console.warn("⚠️ Ollama connection failed. Ensure Ollama is running at", OLLAMA_BASE_URL);
    }
}

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n🚀 AI Generation Server running on port ${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}/api/ai/generate-questions`);
    console.log(`📍 Endpoint: http://localhost:${PORT}/api/ai/generate-from-pdf`);
    await autoDetectModel();
});
