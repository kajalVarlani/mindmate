import "./Sidebar.css";
import { useContext } from "react";
import { MyContext } from "./MyContext.jsx";

function Sidebar() {

  const {
    allThreads,
    setAllThreads,
    setCurrThreadId,
    setNewChat,
    currThreadId,
    isSidebarOpen,
    setSidebarOpen,
    setPrevChats,
    setReply
  } = useContext(MyContext);

  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  // ✅ SWITCH THREAD
  const changeThread = async (newThreadId) => {

    setCurrThreadId(newThreadId);

    try {

      const response = await fetch(`${API}/api/thread/${newThreadId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const res = await response.json();

      setPrevChats(res);
      setReply(null);
      setNewChat(false);
      setSidebarOpen(false);

    } catch (err) {
      console.log("Error switching thread:", err);
    }
  };

  // ✅ DELETE THREAD
  const deleteThread = async (e, threadId) => {

    e.stopPropagation();

    if (!window.confirm("Delete this conversation?")) return;

    try {

      await fetch(`${API}/api/thread/${threadId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setAllThreads(prev => prev.filter(t => t.threadId !== threadId));

      // if deleted active thread → reset UI
      if (currThreadId === threadId) {
        setCurrThreadId(null);
        setPrevChats([]);
        setReply(null);
        setNewChat(true);
      }

    } catch (err) {
      console.log("Delete failed:", err);
    }
  };

  // ✅ NEW SESSION
  const handleNewSession = () => {
    setCurrThreadId(null);   // ⭐ backend will generate ID
    setPrevChats([]);
    setReply(null);
    setNewChat(true);
    setSidebarOpen(false);
  };

  return (

    <section className={`sidebar ${isSidebarOpen ? "open" : ""}`}>

      {/* CLOSE BUTTON */}
      <button
        className="close-sidebar-mobile"
        onClick={() => setSidebarOpen(false)}
      >
        <i className="fa-solid fa-xmark"></i>
      </button>

      {/* NEW SESSION */}
      <button className="newChatBtn" onClick={handleNewSession}>
        <span className="newChatIcon">
          <i className="fa-solid fa-plus"></i>
        </span>
        <span className="newChatText">New Session</span>
      </button>

      {/* THREAD LIST */}
      <ul className="history">

        {allThreads.map((thread) => (

          <li
            key={thread.threadId}
            className={`history-item ${
              currThreadId === thread.threadId ? "active" : ""
            }`}
            onClick={() => changeThread(thread.threadId)}
          >

            <i className="fa-regular fa-message chat-icon-lead"></i>

            <span className="thread-title">
              {thread.title.length > 28
                ? thread.title.slice(0, 28) + "..."
                : thread.title}
            </span>

            <button
              className="delete-thread-btn"
              onClick={(e) => deleteThread(e, thread.threadId)}
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>

          </li>

        ))}

      </ul>

      <div className="sign">
        <div className="sidebar-footer-glow"></div>
        <p>MINDMATE AI</p>
      </div>

    </section>
  );
}

export default Sidebar;
