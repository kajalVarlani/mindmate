import { Link } from "react-router-dom";
import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useEffect, useState, useRef } from "react";

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
  const textareaRef = useRef(null);

  // Auto-resize input area dynamically as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

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

        <Link to="/" className="chat-back-home-btn">
          <i className="fa-solid fa-arrow-left"></i> Home
        </Link>
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

          <textarea
            ref={textareaRef}
            placeholder="How are you feeling today?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            style={{
              flexGrow: 1,
              padding: "12px 18px",
              border: "1.5px solid rgba(106, 191, 143, 0.15)",
              borderRadius: "var(--radius-sm)",
              fontSize: "15px",
              color: "var(--text)",
              background: "rgba(0, 0, 0, 0.2)",
              outline: "none",
              resize: "none",
              overflowY: "hidden",
              transition: "var(--transition-fast)",
              boxSizing: "border-box",
              fontFamily: "inherit",
              lineHeight: "1.5"
            }}
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
