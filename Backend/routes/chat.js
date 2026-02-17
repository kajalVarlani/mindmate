import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse, { generateChatTitle } from "../utils/openai.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { v4 as uuidv4 } from "uuid";


const router = express.Router();
router.use(authMiddleware);   // ✅ ADD THIS LINE

// ----------------------- GET ALL THREADS -----------------------
router.get("/thread", async (req, res) => {
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
router.get("/thread/:threadId", async (req, res) => {
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
router.delete("/thread/:threadId", async (req, res) => {
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

router.post("/chat", async (req, res) => {
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


        }
        else {
            thread.messages.push({ role: "user", content: message });
        }



        // 🛑 Crisis pre-check (important for mental health apps)
        if (/suicide|kill myself|end my life|want to die|no reason to live|hurt myself/i.test(message)) {
    const safeReply =
        "I'm really sorry you're feeling this way. You deserve support. Please consider reaching out to a trusted person or a local mental health helpline immediately.";

    thread.messages.push({ role: "assistant", content: safeReply });
    await thread.save();
    return res.json({
        reply: safeReply,
        threadId: thread.threadId
    });

}

const assistantReply = await getOpenAIAPIResponse(thread.messages);


const finalReply =
    assistantReply || "Sorry, I couldn't generate a response. Please try again.";

thread.messages.push({
    role: "assistant",
    content: finalReply
});

thread.updatedAt = new Date();
await thread.save();

res.json({
    reply: finalReply,
    threadId: thread.threadId
});


    } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong..." });
}
});


export default router;
