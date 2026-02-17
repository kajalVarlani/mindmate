import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useEffect, useState } from "react";

function ChatWindow() {

  const {
    prompt,
    setPrompt,
    sendMessage,      // ⭐ use context function
    newChat,
    setNewChat,
    setPrevChats,
    setReply,
    setSidebarOpen
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);

  // ✅ Clear UI on new chat
  useEffect(() => {
    if (newChat) {
      setPrevChats([]);
      setReply(null);
      setPrompt("");
      setNewChat(false);
    }
  }, [newChat]);

  // ✅ Send message handler
  const handleSend = async () => {

    if (!prompt.trim()) return;

    setLoading(true);

    await sendMessage();   // ⭐ central API call

    setLoading(false);
  };

  return (
    <div className="chatWindow">

      {/* NAVBAR */}
      <div className="navbar">
        <button
          className="hamburger-menu"
          onClick={() => setSidebarOpen(true)}
        >
          <i className="fa-solid fa-bars-staggered"></i>
        </button>

        <span className="title">
          MindMate <i className="fa-solid fa-chevron-down"></i>
        </span>

        <div className="userIconDiv">
          <span className="userIcon">
            <i className="fa-solid fa-user"></i>
          </span>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="messagesArea">

        <Chat />

        {loading && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

      </div>

      {/* INPUT */}
      <div className="chatInput">
        <div className="inputBox">

          <input
            placeholder="How are you feeling today?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button className="sendBtn" onClick={handleSend}>
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
