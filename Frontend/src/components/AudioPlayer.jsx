import { useState, useRef, useEffect } from "react";

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const audioRef = useRef(null);

  // fallback list of public rain sounds
  const sources = [
    "https://raw.githubusercontent.com/Aris-Tatsu/RainyDays/master/assets/audio/rain.mp3",
    "https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e3/Bourne_woods_rain_2020-05-10_0757.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" // Last resort atmospheric track
  ];

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.volume = 1.0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error("Playback failed for source:", sources[sourceIndex], err);
            handleSourceError();
          });
      }
    }
  };

  const handleSourceError = () => {
    if (sourceIndex < sources.length - 1) {
      console.log("Switching to fallback audio source...");
      setSourceIndex(prev => prev + 1);
    } else {
      console.error("All audio sources failed.");
    }
  };

  // Re-play if source switched while playing
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [sourceIndex, isPlaying]);

  return (
    <div 
      className="audio-player-widget" 
      onClick={togglePlay}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(12px)',
        padding: '10px 18px',
        borderRadius: '35px',
        boxShadow: '0 8px 32px rgba(104, 96, 230, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(104, 96, 230, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(104, 96, 230, 0.15)';
      }}
    >
      <audio 
        ref={audioRef} 
        src={sources[sourceIndex]} 
        loop 
        crossOrigin="anonymous"
        onError={handleSourceError}
      />
      
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6860E6 0%, #a29bfe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        boxShadow: '0 4px 10px rgba(104, 96, 230, 0.3)',
        animation: isPlaying ? 'pulse 2s infinite' : 'none'
      }}>
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: '700', color: '#1a1a1a', fontSize: '14px', letterSpacing: '-0.2px' }}>
          {isPlaying ? "Breathe to the Rain" : "Focus Ambience"}
        </span>
        <span style={{ fontSize: '11px', color: '#666', fontWeight: '500' }}>
          {isPlaying ? "Nature is playing..." : "Click to start"}
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(104, 96, 230, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(104, 96, 230, 0); }
          100% { box-shadow: 0 0 0 0 rgba(104, 96, 230, 0); }
        }
      `}</style>
    </div>
  );
}
