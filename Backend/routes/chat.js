import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse, { generateChatTitle, streamOpenAIAPIResponse } from "../utils/openai.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { v4 as uuidv4 } from "uuid";


const router = express.Router();

// ----------------------- GET ALL THREADS -----------------------
router.get("/thread", authMiddleware, async (req, res) => {
    try {
        const threads = await Thread.find({ userId: req.user.id })
            .sort({ updatedAt: -1 });

        res.json(threads);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});


// ----------------------- GET SPECIFIC THREAD -----------------------
router.get("/thread/:threadId", authMiddleware, async (req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({
            threadId,
            userId: req.user.id
        });


        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.json(thread.messages);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch the chat" });
    }
});


// ----------------------- DELETE THREAD -----------------------
router.delete("/thread/:threadId", authMiddleware, async (req, res) => {
    const { threadId } = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({
            threadId,
            userId: req.user.id
        });


        if (!deletedThread) {
            return res.status(404).json({ error: "Thread cannot be deleted" });
        }

        res.status(200).json({ success: "Thread deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to delete the thread" });
    }
});

// ----------------------- POST THREAD -----------------------

router.post("/chat", authMiddleware, async (req, res) => {
    let { threadId, message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        let thread = null;

        if (threadId) {
            thread = await Thread.findOne({
                threadId,
                userId: req.user.id
            });
        }

        if (!thread) {
            threadId = uuidv4();
            const aiTitle = await generateChatTitle(message);

            thread = new Thread({
                threadId,
                userId: req.user.id,
                title: aiTitle || message.slice(0, 60),
                messages: []
            });
            thread.messages.push({ role: "user", content: message });
            await thread.save(); // Save immediately so client can fetch it!
        } else {
            thread.messages.push({ role: "user", content: message });
            await thread.save(); // Save immediately so client can fetch it!
        }

        // Set up headers for Server-Sent Events (SSE)
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });

        // Send initial threadId metadata to client
        res.write(`data: ${JSON.stringify({ threadId: thread.threadId })}\n\n`);

        // 🛑 Crisis pre-check (important for mental health apps)
        if (/suicide|kill myself|end my life|want to die|no reason to live|hurt myself/i.test(message)) {
            const safeReply =
                "I'm really sorry you're feeling this way. You deserve support. Please consider reaching out to a trusted person or a local mental health helpline immediately.";

            thread.messages.push({ role: "assistant", content: safeReply });
            await thread.save();

            res.write(`data: ${JSON.stringify({ content: safeReply })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
            return;
        }

        const stream = await streamOpenAIAPIResponse(thread.messages);
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let assistantReply = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine) continue;
                if (cleanLine === "data: [DONE]") continue;

                if (cleanLine.startsWith("data: ")) {
                    try {
                        const parsed = JSON.parse(cleanLine.slice(6));
                        const content = parsed.choices?.[0]?.delta?.content || "";
                        if (content) {
                            assistantReply += content;
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        // ignore malformed chunks
                    }
                }
            }
        }

        if (buffer && buffer.startsWith("data: ") && buffer !== "data: [DONE]") {
            try {
                const parsed = JSON.parse(buffer.slice(6));
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                    assistantReply += content;
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            } catch (e) {
                // ignore
            }
        }

        const finalReply = assistantReply || "Sorry, I couldn't generate a response. Please try again.";
        thread.messages.push({ role: "assistant", content: finalReply });
        thread.updatedAt = new Date();
        await thread.save();

        res.write("data: [DONE]\n\n");
        res.end();

    } catch (err) {
        console.log(err);
        // If headers weren't sent yet, we can send 500. Otherwise we just end the stream
        if (!res.headersSent) {
            res.status(500).json({ error: "Something went wrong..." });
        } else {
            res.write(`data: ${JSON.stringify({ error: "Stream error occurred." })}\n\n`);
            res.end();
        }
    }
});


export default router;
