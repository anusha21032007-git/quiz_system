import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { topic, difficulty, count, optionsCount, marks, timeLimitSeconds } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in Supabase secrets')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `Generate exactly ${count} multiple-choice questions for the topic: "${topic}".
Difficulty level: ${difficulty}.
Each question must have ${optionsCount} options.
Marks per question: ${marks}.
Time limit per question: ${timeLimitSeconds} seconds.

Return the response in STRICT JSON format with this structure:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

DO NOT include any Markdown formatting or extra text. Return ONLY the JSON object.`

        const generateQuestions = async (retry = false) => {
            const result = await model.generateContent(prompt)
            const text = result.response.text()

            try {
                // Clean up potential markdown formatting
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
                return JSON.parse(cleanJson)
            } catch (e) {
                if (!retry) {
                    console.log("JSON parse failed, retrying once...")
                    return generateQuestions(true)
                }
                throw new Error("Failed to parse AI response as JSON after retry")
            }
        }

        const aiResponse = await generateQuestions()

        return new Response(JSON.stringify(aiResponse), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error("error:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
