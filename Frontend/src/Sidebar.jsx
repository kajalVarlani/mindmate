import "./Sidebar.css";
import { useContext, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import api from "./services/api";
import { useToast } from "./components/Toast";
import ConfirmModal from "./components/ConfirmModal";

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

  const showToast = useToast();

  // ConfirmModal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // ✅ SWITCH THREAD
  const changeThread = async (newThreadId) => {
    setCurrThreadId(newThreadId);
    try {
      const response = await api.get(`/api/thread/${newThreadId}`);
      setPrevChats(response.data);
      setReply(null);
      setNewChat(false);
      setSidebarOpen(false);
    } catch (err) {
      showToast("Couldn't load this conversation.", "error");
    }
  };

  // ✅ Trigger delete confirmation
  const requestDelete = (e, threadId) => {
    e.stopPropagation();
    setPendingDeleteId(threadId);
    setConfirmOpen(true);
  };

  // ✅ Confirmed delete
  const confirmDelete = async () => {
    setConfirmOpen(false);
    const threadId = pendingDeleteId;
    setPendingDeleteId(null);

    try {
      await api.delete(`/api/thread/${threadId}`);
      setAllThreads(prev => prev.filter(t => t.threadId !== threadId));

      // If deleted thread was active → reset UI
      if (currThreadId === threadId) {
        setCurrThreadId(null);
        setPrevChats([]);
        setReply(null);
        setNewChat(true);
      }
      showToast("Conversation deleted.", "info");
    } catch (err) {
      showToast("Failed to delete conversation. Please try again.", "error");
    }
  };

  // ✅ NEW SESSION
  const handleNewSession = () => {
    setCurrThreadId(null);
    setPrevChats([]);
    setReply(null);
    setNewChat(true);
    setSidebarOpen(false);
  };

  return (
    <>
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Conversation?"
        message="This chat will be permanently deleted and cannot be recovered."
        confirmText="Delete"
        cancelText="Keep it"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
      />

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
              className={`history-item ${currThreadId === thread.threadId ? "active" : ""}`}
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
                onClick={(e) => requestDelete(e, thread.threadId)}
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
    </>
  );
}

export default Sidebar;

