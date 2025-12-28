import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import { BounceLoader } from "react-spinners";
import BreathingWidget from "./components/BreathingWidget.jsx";
import { useNavigate } from "react-router-dom";

function ChatWindow() {
    const navigate = useNavigate();
    const { prompt, setPrompt, reply, setReply, currThreadId, prevChats, setPrevChats, newChat, setNewChat } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const { fetchThreads } = useContext(MyContext);
    useEffect(() => {
        if (newChat) {
            // CLEAR UI
            setPrevChats([]);
            setReply(null);
            setPrompt("");
            setNewChat(false);
        }
    }, [newChat]);

    const getReply = async () => {
        setLoading(true);

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId
            })
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
            await fetchThreads();
        } catch (err) {
            console.log(err);
        }

        setLoading(false);
    };

    //Append new chat toprevChats
    useEffect(() => {
        if (prompt && reply) {
            setPrevChats(prevChats =>
                [...prevChats,
                {
                    role: "user",
                    content: prompt
                },
                {
                    role: "assistant",
                    content: reply
                }]
            )
        }
        setPrompt("");
    }, [reply])

    return (
        <div className="chatWindow">

            {/* NAVBAR */}
            <div className="navbar">
                <span className="title"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/")}>
                    MindMate <i className="fa-solid fa-chevron-down"></i>
                </span>

                <div className="userIconDiv">
                    <span className="userIcon">
                        <i className="fa-solid fa-user"></i>
                    </span>
                </div>
            </div>

            {/* MESSAGES AREA */}
            <div className="messagesArea">
                <Chat />

                {loading && (
                    <div className="loaderWrapper">
                        <BounceLoader color="#4868c8" />
                    </div>
                )}
            </div>

            {/* INPUT SECTION */}
            <div className="chatInput">
                <div className="inputBox">
                    <input
                        placeholder="How are you feeling today?"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => (e.key === 'Enter' ? getReply() : '')}
                    />

                    <button className="sendBtn" onClick={getReply}>
                        <i className="fa-solid fa-paper-plane"></i>
                    </button>
                </div>

                <p className="info">
                    MindMate provides emotional support.
                    If you are in crisis, please contact your local helpline.
                </p>
            </div>

        </div>

    );
}

export default ChatWindow;
