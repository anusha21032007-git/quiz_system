import fetch from 'node-fetch';

async function testAIGen() {
    const topic = "Java OOPS";
    console.log(`Testing AI Generation for topic: ${topic}`);

    try {
        const response = await fetch('http://localhost:5000/api/ai/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: topic,
                count: 3,
                difficulty: 'medium',
                marks: 2,
                timeLimitSeconds: 60
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("Test failed:", err);
            return;
        }

        const data = await response.json();
        console.log("Success! Received questions:");
        console.log(JSON.stringify(data, null, 2));

        // Basic validation in test script
        if (data.questions.length !== 3) {
            console.error(`Expected 3 questions, got ${data.questions.length}`);
        }

        data.questions.forEach((q, i) => {
            if (q.options.length !== 4) console.error(`Q${i + 1} does not have 4 options`);
            if (q.correctIndex < 0 || q.correctIndex > 3) console.error(`Q${i + 1} has invalid correctIndex`);
            if (!q.question.toLowerCase().includes("java") && !q.question.toLowerCase().includes("oop")) {
                console.warn(`Q${i + 1} might not be relevant enough (topic check)`);
            }
        });

    } catch (err) {
        console.error("Test error:", err);
    }
}

testAIGen();
