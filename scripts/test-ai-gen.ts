import fetch from 'node-fetch';

async function testAIGen(topic: string) {
    console.log(`\n🔍 Testing AI Generation for topic: "${topic}"`);

    try {
        const response = await fetch('http://localhost:5000/api/ai/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: topic,
                count: 1, // Only need 1 for verification
                difficulty: 'medium',
                marks: 2,
                timeLimitSeconds: 60
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("❌ Test failed:", err.error || err);
            return false;
        }

        const data: any = await response.json();
        console.log("✅ Success! Received questions:");
        console.log(JSON.stringify(data.questions[0], null, 2));
        return true;

    } catch (err: any) {
        console.error("❌ Test error:", err.message);
        return false;
    }
}

async function runTests() {
    console.log("🚀 Starting verification tests for Ollama + Fuzzy Logic...");

    // Test 1: Classic topic
    await testAIGen("Python Lists");

    // Test 2: Typo topic (as reported by user)
    await testAIGen("cybersecurty");

    console.log("\n🏁 Done.");
}

runTests();
