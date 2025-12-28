import "./Chat.css";
import {useContext, useEffect, useRef, useState } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

function Chat() {
  const { newChat, prevChats, reply } = useContext(MyContext);
  const messagesEndRef = useRef(null);
  const [latestReply,setLatestReply]=useState(null);
  // auto-scroll to bottom when chats update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [prevChats]);
  useEffect(()=>{
    if(reply===null){
      setLatestReply(null);
      return;
    }
    if(!prevChats?.length) return;

    const content=reply.split(" ");

    let idx=0;
    const interval= setInterval(()=>{
      setLatestReply(content.slice(0,idx+1).join(" "));
      idx++;
      if(idx>=content.length) clearInterval(interval);
    }, 40);

    return ()=>clearInterval(interval);

  },[prevChats,reply]);

  return (
    <>
      {newChat && <h1 className="welcomeHeading">How are you feeling today?</h1>}

      <div className="chats">
        {prevChats?.length ? (
          prevChats?.slice(0,-1).map((chat, idx) => {
            return (
              <div
                className={chat.role === "user" ? "userWrap" : "gptWrap"}
                key={idx}
              >
                {chat.role === "user" ? (
                  <p className="userMessage">{chat.content}</p>
                ) : (
                  <div className="gptMessage">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{chat.content}
                  </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="emptyState">
            <p>Start a conversation — we're here to listen.</p>
          </div>
        )}

        {/* invisible anchor for scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {
        prevChats.length > 0 && latestReply !==null && 
        <div className="gptDiv" key={"typing"}>
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {latestReply}
          </ReactMarkdown>
        </div>
      }
        {
        prevChats.length > 0 && latestReply ===null && 
        <div className="gptDiv" key={"non-typing"}>
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {prevChats[prevChats.length-1].content}
          </ReactMarkdown>
        </div>
      }
    </>
  );
}

export default Chat;
