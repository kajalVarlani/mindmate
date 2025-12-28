import React, { useState, useEffect } from 'react';
import './ThoughtDump.css';

export default function ThoughtDump() {
  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isStarted, setIsStarted] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let timer;
    if (isStarted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleRelease();
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  const handleRelease = () => {
    setIsDone(true);
    setText(""); // The "Delete" action
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isDone) {
    return (
      <div className="dump-finished">
        <div className="dissolve-animation">☁️</div>
        <h2 className="brand-glow">It's gone now.</h2>
        <p>You don't need to carry every thought with you. You are lighter now.</p>
        <button className="primary-btn" onClick={() => window.location.reload()}>New Session</button>
      </div>
    );
  }

  return (
    <div className="thought-dump">
      {!isStarted ? (
        <div className="dump-intro">
          <div className="sense-icon">🧠</div>
          <h2>The Void</h2>
          <p>You have 2 minutes to write anything on your mind. <br/> Once the timer ends, the text vanishes forever.</p>
          <button className="primary-btn" onClick={() => setIsStarted(true)}>Start Timer</button>
        </div>
      ) : (
        <div className="dump-active">
          <div className="dump-header">
            <span className="timer-pill">{formatTime(timeLeft)}</span>
            <p>Don't filter. Just write.</p>
          </div>
          <textarea 
            className="dump-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your worries, frustrations, or random thoughts here..."
            autoFocus
          />
          <button className="release-btn" onClick={handleRelease}>Release Early</button>
        </div>
      )}
    </div>
  );
}