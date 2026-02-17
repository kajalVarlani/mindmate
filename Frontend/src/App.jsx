import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import BreathingWidget from "./components/BreathingWidget.jsx";
import LandingPage from "./LandingPage.jsx";
import Journal from "./Journal.jsx";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import { MyContext } from './MyContext.jsx';
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import MindfulTools from "./MindfulTools";

function ChatLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        <ChatWindow />
      </main>
      <aside className="right-aside">
        <BreathingWidget />
      </aside>
    </div>
  );
}

function App() {

  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);

  // ✅ threadId should start NULL (backend generates)
  const [currThreadId, setCurrThreadId] = useState(null);

  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  const isLoggedIn = () => !!localStorage.getItem("token");

  // ✅ Fetch threads WITH token
  const fetchThreads = async () => {
    try {

      const res = await fetch(`${API}/api/thread`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      setAllThreads(data);

    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Fetch threads when logged in
  useEffect(() => {
    if (isLoggedIn()) {
      fetchThreads();
    }
  }, []);

  // ⭐ CENTRAL CHAT SEND FUNCTION (important architecture fix)
  const sendMessage = async () => {

    if (!prompt.trim()) return;

    const userMessage = { role: "user", content: prompt };

    setPrevChats(prev => [...prev, userMessage]);
    setPrompt("");
    setReply(null);

    try {

      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          threadId: currThreadId
        })
      });

      const data = await res.json();

      // ⭐ IMPORTANT: backend returns threadId
      if (!currThreadId && data.threadId) {
        setCurrThreadId(data.threadId);
        fetchThreads();
      }

      const assistantMessage = {
        role: "assistant",
        content: data.reply
      };

      setPrevChats(prev => [...prev, assistantMessage]);
      setReply(data.reply);

    } catch (err) {
      console.log(err);
    }
  };

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    prevChats, setPrevChats,
    newChat, setNewChat,
    allThreads, setAllThreads,
    fetchThreads,
    sendMessage,     // ⭐ added
    isSidebarOpen, setSidebarOpen
  };

  return (
    <MyContext.Provider value={providerValues}>

      <Routes>

        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/chat"
          element={isLoggedIn() ? <ChatLayout /> : <Navigate to="/login" />}
        />

        <Route
          path="/journal"
          element={isLoggedIn() ? <Journal /> : <Navigate to="/login" />}
        />

        <Route
          path="/MindfulTools"
          element={isLoggedIn() ? <MindfulTools /> : <Navigate to="/login" />}
        />

      </Routes>

    </MyContext.Provider>
  );
}

export default App;
