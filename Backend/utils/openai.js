import "dotenv/config";

/* 🧠 SYSTEM PROMPT — THIS IS THE MAGIC */
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
  -suggest user to use the breathing exercise provided on the side of the page when they feel low or anxious or panicky
  say "you can see a breathing widget on the right side of the page, follow that and calm yourself"
  if user mentions any medical related issue or symptoms ask to see doctor immediately
  any medical issue which involves hamperness of normal thing ask user to see doctor immediately
  anything like breathing difficulty or any medical emergency or health related problem
  ask user to see doctor or tell someone they trust
`;

const getOpenAIAPIResponse = async (message) => {
    const options = {
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
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.7,
            max_tokens: 200
        })
    };

    try {
        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            options
        );

        const data = await response.json();

        // 🔍 DEBUG (temporary)
        console.log("OpenAI raw response:", JSON.stringify(data, null, 2));

        // ✅ SAFETY CHECK
        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error("Invalid OpenAI response");
        }

        return data.choices[0].message.content;

    } catch (err) {
        console.error("OpenAI API Error:", err.message);
        return null; // VERY IMPORTANT
    }
};

export default getOpenAIAPIResponse;
