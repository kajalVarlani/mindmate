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
import { v1 as uuidv1 } from "uuid";
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
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);


  const fetchThreads = async () => {
    try {
      const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/thread`
);

      const data = await res.json();
      setAllThreads(data);
    } catch (err) {
      console.log(err);
    }
  };
  const isLoggedIn = () => {
    return !!localStorage.getItem("token");
  };


  useEffect(() => {
    fetchThreads();
  }, []);

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    prevChats, setPrevChats,
    newChat, setNewChat,
    allThreads, setAllThreads,
    fetchThreads,
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
