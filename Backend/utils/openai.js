import "dotenv/config";

/* 🧠 SYSTEM PROMPT */
const SYSTEM_PROMPT = `
You are MindMate, an empathetic and calm mental health support assistant.

Guidelines:
- Be warm, kind, and non-judgmental.
- Focus on emotional validation and gentle coping strategies.
- Do NOT give medical or clinical diagnoses.
- Do NOT prescribe medication.
- Keep responses supportive and human, not robotic.
- If the user expresses self-harm or suicidal thoughts,
  encourage reaching out to a trusted person or local helpline.
- Suggest using the mindful tools on the website when they feel low, anxious, or panicky.
- If user mentions serious medical symptoms, suggest seeing a doctor immediately.
`;

const getOpenAIAPIResponse = async (messages) => {
    try {

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",

                    // ✅ FULL CONVERSATION MEMORY
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        ...messages
                    ],

                    temperature: 0.7,
                    max_tokens: 200
                })
            }
        );

        // ✅ HANDLE HTTP ERRORS PROPERLY
        if (!response.ok) {
            const text = await response.text();
            console.error("OpenAI HTTP error:", text);
            throw new Error(`OpenAI request failed: ${response.status}`);
        }

        const data = await response.json();

        // ✅ SAFE RESPONSE PARSE
        const reply = data?.choices?.[0]?.message?.content;

        if (!reply) {
            throw new Error("Empty OpenAI reply");
        }

        return reply.trim();

    } catch (err) {
        console.error("OpenAI API Error:", err.message);
        return null;
    }
};
export const generateChatTitle = async (message) => {
    try {

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "Generate a very short 3-5 word chat title summarizing the topic."
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    max_tokens: 12,
                    temperature: 0.5
                })
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data?.choices?.[0]?.message?.content?.trim();

    } catch {
        return null;
    }
};

export default getOpenAIAPIResponse;
