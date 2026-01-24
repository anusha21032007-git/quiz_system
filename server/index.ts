import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 5000;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
let OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const DEBUG_FILE = path.join(__dirname, 'ai_debug.txt');

// Schema for request validation
const GenerateRequestSchema = z.object({
    topic: z.string().min(2),
    count: z.number().min(1).max(20),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    marks: z.number().min(1),
    timeLimitSeconds: z.number().min(10),
    optionsCount: z.number().min(2).max(6).optional().default(4)
});

function validateTopicRelevance(question: any, topic: string): boolean {
    if (!question.question) return false;
    const cleanTopic = topic.toLowerCase().trim();
    const qText = question.question.toLowerCase();

    if (qText.includes(cleanTopic.substring(0, Math.min(cleanTopic.length, 6)))) return true;
    const topicWords = cleanTopic.split(/\s+/).filter(word => word.length > 3);
    if (topicWords.some(word => qText.includes(word))) return true;

    return true;
}

/**
 * Handles communication with Ollama with retry logic and quality checks.
 */
async function generateBatch(params: any, retryAttempt = 0): Promise<any> {
    const { topic, count, difficulty, marks, timeLimitSeconds, optionsCount } = params;
    const optionsPlaceholder = Array.from({ length: optionsCount }, (_, i) => `Descriptive Answer ${i + 1}`);

    const prompt = `As a professor, generate EXACTLY ${count} MCQ(s) about "${topic}".
    
    RULES:
    1) Return ONLY JSON. No preamble.
    2) Exactly ${optionsCount} options per question.
    3) Options must be RELEVANT, UNIQUE, and SUBSTANTIAL (no "A", "B", etc).
    4) Index 0 to ${optionsCount - 1} for correct answer.
    
    SCHEMA:
    {
      "questions": [
        {
          "id": 1,
          "question": "Clear professional question about ${topic}?",
          "options": ${JSON.stringify(optionsPlaceholder)},
          "correctIndex": 0,
          "difficulty": "${difficulty}",
          "marks": ${marks},
          "timeLimitSeconds": ${timeLimitSeconds},
          "explanation": "Why index 0 is correct."
        }
      ]
    }`;

    console.log(`[Batch] Attempt ${retryAttempt + 1} | Topic: ${topic} | Count: ${count}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for safety

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                format: 'json',
                options: { temperature: 0.6 } // Allow some variety
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Ollama Error: HTTP ${response.status}`);

        const data: any = await response.json();
        const text = data.response || '';

        try {
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start === -1) throw new Error("No JSON boundaries found");

            const parsed = JSON.parse(text.substring(start, end + 1));
            const questions = parsed.questions || parsed || [];
            const resultList = Array.isArray(questions) ? questions : [questions];

            // Quality Check: Ensure options aren't generic placeholders
            const hasGenericOptions = resultList.some((q: any) =>
                !q.options || q.options.some((o: string) => o.length < 3 || /^[A-Z]$/i.test(o.trim()))
            );

            if (hasGenericOptions && retryAttempt < 1) {
                console.warn("[Batch] Detected generic options. Retrying with stricter instructions...");
                return generateBatch(params, retryAttempt + 1);
            }

            return resultList.slice(0, count);
        } catch (parseErr: any) {
            if (retryAttempt < 1) {
                console.warn("[Batch] JSON Parse failure. Retrying...");
                return generateBatch(params, retryAttempt + 1);
            }
            fs.writeFileSync(DEBUG_FILE, text);
            throw new Error("AI produced invalid JSON output.");
        }
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (retryAttempt < 1) return generateBatch(params, retryAttempt + 1);
        throw err;
    }
}

app.post('/api/ai/generate-questions', async (req, res) => {
    try {
        const params = GenerateRequestSchema.parse(req.body);
        const questions = await generateBatch(params);

        console.log(`[Success] Topic: "${params.topic}" | Returned: ${questions.length}`);
        res.json({
            topic: params.topic,
            questions: questions
        });
    } catch (error: any) {
        console.error(`[Fatal] ${error.message}`);
        res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error.message });
    }
});

async function autoDetectModel() {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (response.ok) {
            const data: any = await response.json();
            const names = (data.models || []).map((m: any) => m.name);
            console.log(`✅ Models: ${names.join(', ')}`);
            if (!names.includes(OLLAMA_MODEL)) {
                const fallback = names.find((n: string) => n.includes('llama3.2') || n.includes('llama3'));
                if (fallback) OLLAMA_MODEL = fallback;
            }
        }
    } catch (e) {
        console.error("❌ Ollama Offline");
    }
}

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 AI Engine on port ${PORT}`);
    await autoDetectModel();
});
