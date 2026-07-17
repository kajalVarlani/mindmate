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
import { useToast } from "./components/Toast";
import ForgotPassword from "./ForgotPassword";

// Therapist and Admin module pages
import TherapistDirectory from "./TherapistDirectory";
import TherapistProfile from "./TherapistProfile";
import MyTherapist from "./MyTherapist";
import SessionChat from "./SessionChat";
import TherapistRegister from "./TherapistRegister";
import TherapistLogin from "./TherapistLogin";
import TherapistDashboard from "./TherapistDashboard";
import TherapistSetup from "./TherapistSetup";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";

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

  const { isAuthenticated, userRole, loading } = useAuth();
  const showToast = useToast();

  // ✅ Fetch threads WITH token
  const fetchThreads = async () => {
    try {
      const res = await api.get("/api/thread");
      setAllThreads(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Fetch threads only for regular users (not admin/therapist)
  useEffect(() => {
    if (isAuthenticated && userRole === "user") {
      fetchThreads();
    }
  }, [isAuthenticated, userRole]);

  // ⭐ CENTRAL CHAT SEND FUNCTION (important architecture fix - now with real streaming)
  const sendMessage = async () => {
    if (!prompt.trim()) return;

    const userMessage = { role: "user", content: prompt };
    setPrevChats(prev => [...prev, userMessage]);
    setPrompt("");
    setReply(""); // Initialize reply as empty string to trigger streaming state in Chat UI

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMessage.content,
          threadId: currThreadId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedReply = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === "data: [DONE]") continue;

          if (cleanLine.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(cleanLine.slice(6));
              
              if (parsed.threadId && !currThreadId) {
                setCurrThreadId(parsed.threadId);
                fetchThreads();
              }
              
              if (parsed.content) {
                accumulatedReply += parsed.content;
                setReply(accumulatedReply);
              }
            } catch (e) {
              // ignore malformed lines
            }
          }
        }
      }

      if (accumulatedReply) {
        setPrevChats(prev => [...prev, { role: "assistant", content: accumulatedReply }]);
      }
      setReply(null);

    } catch (err) {
      showToast("Couldn't send message. Please try again.", "error");
      setReply(null);
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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--accent)', background: 'var(--bg)', fontStyle: 'italic', fontWeight: 600 }}>Loading MindMate...</div>;
  }

  return (
    <MyContext.Provider value={providerValues}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />

          <Route
            path="/chat"
            element={isAuthenticated && userRole === "user" ? <PageWrapper><ChatLayout /></PageWrapper> : <Navigate to="/login" />}
          />

          <Route
            path="/journal"
            element={isAuthenticated && userRole === "user" ? <PageWrapper><Journal /></PageWrapper> : <Navigate to="/login" />}
          />

          <Route
            path="/MindfulTools"
            element={isAuthenticated && userRole === "user" ? <PageWrapper><MindfulTools /></PageWrapper> : <Navigate to="/login" />}
          />

          {/* Therapist Module Routes */}
          <Route
            path="/therapists"
            element={isAuthenticated && userRole === "user" ? <PageWrapper><TherapistDirectory /></PageWrapper> : <Navigate to="/login" />}
          />
          <Route
            path="/therapists/:id"
            element={isAuthenticated && userRole === "user" ? <PageWrapper><TherapistProfile /></PageWrapper> : <Navigate to="/login" />}
          />
          <Route
            path="/my-therapist"
            element={isAuthenticated && userRole === "user" ? <PageWrapper><MyTherapist /></PageWrapper> : <Navigate to="/login" />}
          />
          <Route
            path="/session/:id"
            element={isAuthenticated ? <PageWrapper><SessionChat /></PageWrapper> : <Navigate to="/login" />}
          />
          <Route
            path="/therapist/register"
            element={isAuthenticated && userRole === "user" ? <PageWrapper><TherapistRegister /></PageWrapper> : <Navigate to="/login" />}
          />
          <Route path="/therapist/login" element={<PageWrapper><TherapistLogin /></PageWrapper>} />
          <Route
            path="/therapist/dashboard"
            element={isAuthenticated && userRole === "therapist" ? <PageWrapper><TherapistDashboard /></PageWrapper> : <Navigate to="/therapist/login" />}
          />
          <Route
            path="/therapist/setup"
            element={isAuthenticated && userRole === "therapist" ? <PageWrapper><TherapistSetup /></PageWrapper> : <Navigate to="/therapist/login" />}
          />

          {/* Admin Portal Routes */}
          <Route path="/admin/login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
          <Route
            path="/admin"
            element={isAuthenticated && userRole === "admin" ? <PageWrapper><AdminPanel /></PageWrapper> : <Navigate to="/admin/login" />}
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />

        </Routes>
      </AnimatePresence>
    </MyContext.Provider>
  );
}

export default App;
