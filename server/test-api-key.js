const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAllModels() {
    const apiKey = "AIzaSyD7lQtPtOhxM616t0k_QT7aEikbTa8tlKg";
    console.log("Testing API Key:", apiKey.substring(0, 10) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try different model variations
    const modelsToTest = [
        "gemini-pro",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "models/gemini-pro",
        "models/gemini-1.5-flash"
    ];

    for (const modelName of modelsToTest) {
        console.log(`\n--- Testing: ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello");
            const response = await result.response;
            const text = response.text();
            console.log(`✅ SUCCESS with ${modelName}`);
            console.log(`Response: ${text.substring(0, 50)}...`);
            return; // Exit on first success
        } catch (error) {
            console.log(`❌ FAILED with ${modelName}`);
            console.log(`Error: ${error.message}`);
        }
    }

    console.log("\n⚠️ All models failed. API key may be invalid or restricted.");
}

testAllModels().catch(console.error);
