import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

// Force load env from current dir
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testGemini() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in", path.resolve(__dirname, '.env'));
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    for (const modelName of models) {
        console.log(`--- Testing model: ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'Success' if you can hear me.");
            const response = await result.response;
            console.log(`RESULT: ${response.text().trim()}`);
            break;
        } catch (err: any) {
            console.error(`ERROR with ${modelName}:`, err.message);
            if (err.stack) {
                // console.error(err.stack);
            }
        }
    }
}

testGemini();
