import "dotenv/config";

const SYSTEM_PROMPT = `
You are MindMate, an empathetic and calm mental health support assistant.

Guidelines:
- Be warm, kind, and non-judgmental.
- Focus on emotional validation and gentle coping strategies.
- Do NOT give medical or clinical diagnoses.
- Do NOT prescribe medication.
- Keep responses supportive and human.
If the user expresses self-harm thoughts, encourage reaching out to trusted help.
`;

const getOpenAIAPIResponse = async (messages) => {

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({

      model: "llama3-8b-8192",

      // ⭐ CORRECT STRUCTURE
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages   // <-- conversation history
      ],

      temperature: 0.7,
      max_tokens: 200
    })
  };

  try {

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      options
    );

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid OpenAI response");
    }
    console.log(data);
    return data.choices[0].message.content;

  } catch (err) {
    console.error("OpenAI API Error:", err.message);
    return null;
  }
};


export const generateChatTitle = async (message) => {
    try {

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama3-8b-8192",
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
