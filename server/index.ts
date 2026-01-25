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
app.use(express.json());

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
    count: z.number().min(1).max(20),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    marks: z.number().min(1),
    timeLimitSeconds: z.number().min(10),
    optionsCount: z.number().min(2).max(6).optional().default(4)
});

function cleanAIJson(text: string): string {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const startBrace = cleaned.indexOf('{');
    const startBracket = cleaned.indexOf('[');
    const start = startBrace !== -1 && (startBracket === -1 || startBrace < startBracket) ? startBrace : startBracket;

    const endBrace = cleaned.lastIndexOf('}');
    const endBracket = cleaned.lastIndexOf(']');
    const end = endBrace !== -1 && endBrace > endBracket ? endBrace : endBracket;

    if (start === -1 || end === -1) {
        throw new Error("No JSON object found in response");
    }

    return cleaned.substring(start, end + 1);
}

async function generateWithOllama(params: any): Promise<any> {
    const { topic, difficulty, marks, timeLimitSeconds, optionsCount } = params;
    const numOptions = optionsCount || 4;

    // TEXT-BASED ANSWER MATCHING (eliminates AI index confusion)
    const prompt = `You are an expert exam question setter.

Generate 1 high-quality MCQ for: "${topic}"

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

async function generateBatch(params: any, retryAttempt = 0): Promise<any> {
    console.log(`\n--- [Batch] Attempt ${retryAttempt + 1} | Topic: ${params.topic} | Count: ${params.count} ---`);

    try {
        return await generateWithOllama(params);
    } catch (err: any) {
        console.error(`[Batch] Ollama failed: ${err.message}`);

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
    await autoDetectModel();
});
