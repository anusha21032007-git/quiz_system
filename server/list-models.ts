import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function listModels() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data: any = await response.json();
        if (data.models) {
            const names = data.models.map((m: any) => m.name).join('\n');
            fs.writeFileSync(path.resolve(__dirname, 'available_models.txt'), names);
            console.log("Model names saved to available_models.txt");
        } else {
            console.log("No models found or error:", JSON.stringify(data));
        }
    } catch (err: any) {
        console.error("Error listing models:", err.message);
    }
}

listModels();
