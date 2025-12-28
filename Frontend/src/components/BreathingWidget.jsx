// src/components/BreathingWidget.jsx
import React, { useEffect, useState, useRef } from "react";
import "./BreathingWidget.css";

export default function BreathingWidget({
  inhale = 4000,
  hold = 4000,
  exhale = 6000
}) {
  const [running, setRunning] = useState(true);
  const [phase, setPhase] = useState("inhale");
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(inhale / 1000));

  const timeoutRef = useRef(null);
  const intervalRef = useRef(null); 

  useEffect(() => {
    if (!running) {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
      return;
    }

    const runPhase = (p) => {
      setPhase(p);
      const dur = p === "inhale" ? inhale : p === "hold" ? hold : exhale;

      setSecondsLeft(Math.ceil(dur / 1000));

   
      clearInterval(intervalRef.current);

      // single interval
      let tick = Math.ceil(dur / 1000);
      intervalRef.current = setInterval(() => {
        tick -= 1;
        setSecondsLeft(Math.max(0, tick));
      }, 1000);

      // schedule next phase
      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        if (p === "inhale") runPhase("hold");
        else if (p === "hold") runPhase("exhale");
        else runPhase("inhale");
      }, dur);
    };

    runPhase("inhale");

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, [running, inhale, hold, exhale]);

  const toggle = () => {
    setRunning((r) => !r);
    if (running) {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    }
  };

  const label =
    phase === "inhale" ? "Inhale" : phase === "hold" ? "Hold" : "Exhale";

  return (
    <div className="breathing-widget" aria-live="polite">
      <h2>Take a moment to breathe</h2>
      <div className={`breathing-card ${phase} ${running ? "running" : "paused"}`}>
        <div className="breathing-circle-outer" aria-hidden>
          <div className="breathing-circle-inner" />
        </div>

        <div className="breathing-text">
          <div className="label">{label}</div>
          <div className="counter">{secondsLeft}s</div>
        </div>
      </div>

      <div className="breathing-controls">
        <button className="control-btn" onClick={toggle}>
          {running ? "Pause" : "Start"}
        </button>

        <button
          className="control-btn muted"
          onClick={() => {
            clearTimeout(timeoutRef.current);
            clearInterval(intervalRef.current);
            setRunning(false);
            setTimeout(() => {
              setPhase("inhale");
              setSecondsLeft(Math.ceil(inhale / 1000));
              setRunning(true);
            }, 50);
          }}
        >
          Restart
        </button>
      </div>

      <p className="breathing-note">
        Follow the circle — breathe slowly. This is a short grounding exercise.
      </p>
    </div>
  );
}
