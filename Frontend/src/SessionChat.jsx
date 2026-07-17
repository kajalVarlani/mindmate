import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import api from "./services/api";
import { useAuth } from "./Context/AuthContext";
import { useToast } from "./components/Toast";
import "./SessionChat.css";

export default function SessionChat() {
  const { id } = useParams();
  const { userRole, userName } = useAuth();
  
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  // Timer States
  const [timeLeftStr, setTimeLeftStr] = useState("00:00");
  const [warningMsg, setWarningMsg] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const timerIntervalRef = useRef(null);
  
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessionDetails();

    // Establish Socket connection
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const socket = io(socketUrl);
    socketRef.current = socket;

    // Get current userId securely (decode from localStorage token)
    const storedToken = localStorage.getItem("token");
    let currentUserId = "";
    if (storedToken) {
      try {
        const decoded = JSON.parse(atob(storedToken.split(".")[1]));
        currentUserId = decoded.userId;
      } catch (e) {
        console.error("Token decode failed", e);
      }
    }

    socket.emit("join_session", {
      sessionId: id,
      userId: currentUserId,
      role: userRole,
    });

    // Listen for incoming messages
    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for timer synchronization updates
    socket.on("timer_update", ({ remainingMs, status }) => {
      if (status === "completed") {
        setSessionEnded(true);
        setTimeLeftStr("Ended");
        return;
      }

      startTimerCountdown(remainingMs);
    });

    // Listen for warning events (5-minute banner)
    socket.on("time_warning", ({ message }) => {
      setWarningMsg(message);
      showToast(message, "warning", 6000);
    });

    // Listen for completion
    socket.on("session_ended", ({ message }) => {
      setSessionEnded(true);
      setTimeLeftStr("Ended");
      showToast(message, "info", 5000);
    });

    socket.on("error", (err) => {
      showToast(err.message || "Socket error occurred.", "error");
    });

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessionDetails = async () => {
    try {
      const endpoint = userRole === "therapist" ? "/api/therapist/sessions" : "/api/session/my";
      const res = await api.get(endpoint);
      const currentSession = res.data.find((s) => s._id === id);

      if (currentSession) {
        setSession(currentSession);
        setMessages(currentSession.messages || []);
        if (currentSession.status === "completed") {
          setSessionEnded(true);
        }
      } else {
        showToast("Active session not found.", "error");
        navigate(userRole === "therapist" ? "/therapist/dashboard" : "/my-therapist");
      }
    } catch {
      showToast("Error retrieving session logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const startTimerCountdown = (remainingMs) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    let timeLeft = Math.floor(remainingMs / 1000);

    if (timeLeft <= 0) {
      setSessionEnded(true);
      setTimeLeftStr("Ended");
      return;
    }

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    setTimeLeftStr(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);

    timerIntervalRef.current = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerIntervalRef.current);
        setSessionEnded(true);
        setTimeLeftStr("Ended");
        return;
      }

      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      setTimeLeftStr(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      
      // If remaining minutes is less than 5, render timer in red
      if (timeLeft < 300) {
        setWarningMsg("Session is ending soon.");
      }
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Get current userId securely
    const storedToken = localStorage.getItem("token");
    let currentUserId = "";
    if (storedToken) {
      try {
        const decoded = JSON.parse(atob(storedToken.split(".")[1]));
        currentUserId = decoded.userId;
      } catch (e) {
        console.error("Token decode failed", e);
      }
    }

    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        sessionId: id,
        senderId: currentUserId,
        senderRole: userRole,
        content: inputText,
      });
      setInputText("");
    }
  };

  if (loading) {
    return <div className="sc-loading">Joining Room...</div>;
  }

  const partnerName =
    userRole === "therapist"
      ? session?.userId?.name || "Patient"
      : session?.therapistId?.name
      ? `Dr. ${session.therapistId.name}`
      : "Therapist";

  return (
    <div className="sc-layout">
      {/* Session Top Bar */}
      <header className="sc-header">
        <div className="sc-partner-info">
          <Link
            to={userRole === "therapist" ? "/therapist/dashboard" : "/my-therapist"}
            className="sc-back-btn"
          >
            ← Leave Room
          </Link>
          <span className="partner-name">{partnerName}</span>
        </div>

        {/* Timer countdown banner */}
        <div className={`sc-timer-box ${timeLeftStr !== "Ended" && warningMsg ? "warning" : ""} ${sessionEnded ? "ended" : ""}`}>
          <span className="timer-icon">⏱️</span>
          <span className="timer-label">{sessionEnded ? "Session Completed" : `Time Remaining: ${timeLeftStr}`}</span>
        </div>
      </header>

      {/* Warning Alert Banner */}
      {!sessionEnded && warningMsg && (
        <div className="sc-warning-banner">
          ⚠️ {warningMsg}
        </div>
      )}

      {/* Messages area */}
      <div className="sc-messages">
        {messages.length === 0 ? (
          <div className="sc-empty">
            <p>Session started. Write a greeting to start your conversation.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.role === userRole;
            return (
              <div key={index} className={`message-bubble-wrapper ${isMe ? "me" : "partner"}`}>
                <div className="message-bubble">
                  <p>{msg.content}</p>
                  <span className="time-stamp">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="sc-input-area">
        {sessionEnded ? (
          <div className="sc-ended-overlay">
            🔒 This session has ended and the conversation is locked.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="sc-form">
            <input
              type="text"
              placeholder="Type your message here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              required
              autoFocus
            />
            <button type="submit">Send</button>
          </form>
        )}
      </div>
    </div>
  );
}
