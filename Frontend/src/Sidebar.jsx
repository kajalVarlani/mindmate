import "./Sidebar.css";
import { useContext } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

function Sidebar() {
  const { 
        allThreads, setCurrThreadId, setNewChat, 
        currThreadId, isSidebarOpen, setSidebarOpen 
    } = useContext(MyContext);

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/thread/${newThreadId}`);
            const res = await response.json();
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.log("Error switching thread:", err);
        }
    };

    const deleteThread = async (e, threadId) => {
        e.stopPropagation(); // Prevents switching to the thread while deleting
        if (!window.confirm("Delete this conversation?")) return;

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/thread/${threadId}`, { method: 'DELETE' });
            setAllThreads(prev => prev.filter(t => t.threadId !== threadId));
            if (currThreadId === threadId) {
                setNewChat(true);
                setPrevChats([]);
            }
        } catch (err) {
            console.log("Delete failed:", err);
        }
    };

    return (
        <section className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        
        {/* Step 1: Close Button ko top par rakhein */}
        <button className="close-sidebar-mobile" onClick={() => setSidebarOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Step 2: New Session Button */}
        <button className="newChatBtn" onClick={() => { 
            setCurrThreadId(uuidv1()); 
            setNewChat(true); 
            setSidebarOpen(false); // Mobile par click hote hi sidebar band ho jaye
        }}>
            <span className="newChatIcon"><i className="fa-solid fa-plus"></i></span>
            <span className="newChatText">New Session</span>
        </button>

            <ul className="history">
                {allThreads.map((thread) => (
                    <li
                        key={thread.threadId}
                        className={`history-item ${currThreadId === thread.threadId ? 'active' : ''}`}
                        onClick={() => changeThread(thread.threadId)}
                    >
                        <i className="fa-regular fa-message chat-icon-lead"></i>
                        <span className="thread-title">
                            {thread.title.length > 28 ? thread.title.slice(0, 28) + "..." : thread.title}
                        </span>
                        <button className="delete-thread-btn" onClick={(e) => deleteThread(e, thread.threadId)}>
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