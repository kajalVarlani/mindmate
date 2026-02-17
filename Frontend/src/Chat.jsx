import "./Chat.css";
import { useContext, useEffect, useRef, useState } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

function Chat() {
  const { newChat, prevChats, reply } = useContext(MyContext);

  const messagesEndRef = useRef(null);
  const [latestReply, setLatestReply] = useState(null);

  // ✅ Auto scroll when messages OR typing updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [prevChats, latestReply]);

  // ✅ Typing animation for assistant reply
  useEffect(() => {
    if (!reply) return;

    setLatestReply("");

    let i = 0;
    const interval = setInterval(() => {
      setLatestReply(prev => prev + reply[i]);
      i++;

      if (i >= reply.length) {
        clearInterval(interval);
        setLatestReply(null); // typing finished → rely on prevChats rendering
      }
    }, 15);

    return () => clearInterval(interval);
  }, [reply]);

  // ✅ Reset typing ONLY when starting new chat
  useEffect(() => {
    setLatestReply(null);
  }, [newChat]);

  return (
    <>
      {newChat && (
        <h1 className="welcomeHeading">
          How are you feeling today?
        </h1>
      )}

      <div className="chats">

        {prevChats?.length ? (

          prevChats.map((chat, idx) => (
            <div
              className={chat.role === "user" ? "userWrap" : "gptWrap"}
              key={idx}
            >
              {chat.role === "user" ? (
                <p className="userMessage">{chat.content}</p>
              ) : (
                <div className="gptMessage">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {chat.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))

        ) : (

          <div className="emptyState">
            <p>Start a conversation — we're here to listen.</p>
          </div>

        )}

        {/* ✅ Typing bubble while streaming reply */}
        {prevChats?.length > 0 && latestReply !== null && (
          <div className="gptWrap">
            <div className="gptMessage">
              {latestReply === "" ? (
                <p className="typing">MindMate is typing...</p>
              ) : (
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {latestReply}
                </ReactMarkdown>
              )}
            </div>
          </div>
        )}

        {/* scroll anchor */}
        <div ref={messagesEndRef} />

      </div>
    </>
  );
}

export default Chat;
