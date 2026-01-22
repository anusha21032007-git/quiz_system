import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const key = process.env.VITE_GEMINI_API_KEY;
    console.log("Using Key:", key ? (key.substring(0, 5) + "...") : "MISSING");
    if (!key) return;

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

test();
