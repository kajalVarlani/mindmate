import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse from "../utils/openai.js";

const router = express.Router();


// ----------------------- TEST ROUTE -----------------------
router.post("/test", async (req, res) => {
    try {
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread2"
        });

        const response = await thread.save();
        res.send(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to save in DB" });
    }
});


// ----------------------- GET ALL THREADS -----------------------
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({}).sort({ updatedAt: -1 });
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
        const thread = await Thread.findOne({ threadId });

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
        const deletedThread = await Thread.findOneAndDelete({ threadId });

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
    const { threadId, message } = req.body;
    console.log("Incoming threadId:", threadId);

    if (!threadId || !message) {
        return res.status(400).json({ error: "missing required fields" });
    }

    try {
        let thread = await Thread.findOne({ threadId });

        if (!thread) {
            thread = new Thread({
                threadId,
                title: message.slice(0, 60), // 👈 यही जगह hai
                messages: [{ role: "user", content: message }]
            });
        } else {
            thread.messages.push({ role: "user", content: message });
        }


        // 🛑 Crisis pre-check (important for mental health apps)
        if (/suicide|kill myself|end my life/i.test(message)) {
            const safeReply =
                "I'm really sorry you're feeling this way. You deserve support. Please consider reaching out to a trusted person or a local mental health helpline immediately.";

            thread.messages.push({ role: "assistant", content: safeReply });
            await thread.save();
            return res.json({ reply: safeReply });
        }

        // 🔒 SAFE OPENAI CALL
        const assistantReply = await getOpenAIAPIResponse(message);

        const finalReply =
            assistantReply || "Sorry, I couldn't generate a response. Please try again.";

        thread.messages.push({
            role: "assistant",
            content: finalReply
        });

        thread.updatedAt = new Date();
        await thread.save();

        res.json({ reply: finalReply });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Something went wrong..." });
    }
});


export default router;
