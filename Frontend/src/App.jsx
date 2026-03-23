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
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MindfulTools from "./MindfulTools";
import { useAuth } from "./Context/AuthContext";
import api from "./services/api";
import NotFound from "./NotFound";
import { AnimatePresence, motion } from "framer-motion";
import AudioPlayer from "./components/AudioPlayer";

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

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

function App() {

  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);

  // ✅ threadId should start NULL (backend generates)
  const [currThreadId, setCurrThreadId] = useState(null);

  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const API = import.meta.env.VITE_API_URL;

  const { isAuthenticated, loading } = useAuth();

  // ✅ Fetch threads WITH token
  const fetchThreads = async () => {
    try {
      const res = await api.get("/api/thread");
      setAllThreads(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Fetch threads when logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchThreads();
    }
  }, [isAuthenticated]);

  // ⭐ CENTRAL CHAT SEND FUNCTION (important architecture fix)
  const sendMessage = async () => {

    if (!prompt.trim()) return;

    const userMessage = { role: "user", content: prompt };

    setPrevChats(prev => [...prev, userMessage]);
    setPrompt("");
    setReply(null);

    try {
      const res = await api.post("/api/chat", {
        message: userMessage.content,
        threadId: currThreadId
      });

      const data = res.data;

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

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6860E6' }}>Loading MindMate...</div>;
  }

  return (
    <MyContext.Provider value={providerValues}>
      <AudioPlayer />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />

          <Route
            path="/chat"
            element={isAuthenticated ? <PageWrapper><ChatLayout /></PageWrapper> : <Navigate to="/login" />}
          />

          <Route
            path="/journal"
            element={isAuthenticated ? <PageWrapper><Journal /></PageWrapper> : <Navigate to="/login" />}
          />

          <Route
            path="/MindfulTools"
            element={isAuthenticated ? <PageWrapper><MindfulTools /></PageWrapper> : <Navigate to="/login" />}
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />

        </Routes>
      </AnimatePresence>
    </MyContext.Provider>
  );
}

export default App;
