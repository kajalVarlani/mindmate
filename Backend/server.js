
//using open ai package from npm
/*import OpenAI from 'openai';
import 'dotenv/config';
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await client.responses.create({
  model: 'gpt-4o-mini',
  input: 'how many r in the word strawberry?',
});

console.log(response.output_text);*/



//using open ai api end point calls
import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import journalRoutes from "./routes/journalRoutes.js";
import userRoutes from "./routes/userRoutes.js";





const app=express();
const PORT=8080;


app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/journal", journalRoutes);

app.use("/api", chatRoutes);
app.use("/api/user", userRoutes);

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
    connectDB();
});
const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected with database");
    }
    catch(err){
        console.log("Failed to connect with DB", err);
    }
}

/*app.post("/test", async(req, res)=>{
    const options={
        method: "POST",
        headers:{
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages:[{
                role:"user",
                content:req.body.message
            }]
        })
    };

    try{
        const response=await fetch("https://api.openai.com/v1/chat/completions", options);
        const data=await response.json();
        console.log(data.choices[0].message.content);
        res.send(data.choices[0].message.content);
    }
    catch(err){
        console.log(err)
    }
})*/

