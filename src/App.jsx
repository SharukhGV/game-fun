import React, { useState, useEffect } from 'react';

const TrackingGame = () => {
  const [distance, setDistance] = useState(200);
  const [presence, setPresence] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [status, setStatus] = useState("INITIALIZING");
  const [mode, setMode] = useState("detecting"); // 'demo' | 'real'

  const ESP32_IP = "192.168.4.1";
  const WS_URL = `ws://${ESP32_IP}:81`;

  // ================= DETECTION LOGIC =================
  const tryConnect = () => {
    try {
      const socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        setStatus("CONNECTED");
        setMode("real");

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'motion') setPresence(data.value);
            if (data.type === 'distance') setDistance(data.value);
            if (data.type === 'victory') setHasWon(true);
          } catch {}
        };
      };

      socket.onerror = () => {
        setMode("demo");
        setStatus("DEMO MODE");
      };

      socket.onclose = () => {
        if (mode !== "demo") {
          setMode("demo");
          setStatus("DISCONNECTED → DEMO");
        }
      };

      return socket;
    } catch {
      setMode("demo");
      setStatus("DEMO MODE");
    }
  };

  // ================= INIT =================
  useEffect(() => {
    const timer = setTimeout(() => setIsCalibrating(false), 4000);

    // If HTTPS → skip connection attempt (will fail anyway)
    if (window.location.protocol === "https:") {
      setMode("demo");
      setStatus("DEMO (SECURE MODE)");
      return;
    }

    const socket = tryConnect();

    return () => {
      if (socket) socket.close();
      clearTimeout(timer);
    };
  }, []);

  // ================= DEMO MODE =================
  useEffect(() => {
    if (mode === "demo") {
      const interval = setInterval(() => {
        setDistance(prev => {
          const next = prev + (Math.random() * 40 - 20);
          return Math.max(10, Math.min(200, next));
        });

        setPresence(Math.random() > 0.7);
      }, 500);

      return () => clearInterval(interval);
    }
  }, [mode]);

  // ================= UI HELPERS =================
  const getColor = () => {
    if (distance > 150) return '#ff3b3b';
    if (distance > 60) return '#ffd900';
    return '#00ff9f';
  };

  const scale = Math.max(0.8, 2 - distance / 120);
  const bars = Math.max(1, Math.floor((200 - distance) / 40));

  // ================= VICTORY =================
  if (hasWon) {
    return (
      <div className="victory-screen">
        <h1>🎯 TARGET SECURED</h1>
        <button onClick={() => setHasWon(false)}>RESTART</button>
      </div>
    );
  }

  return (
    <div className={`app ${distance < 40 ? 'shake' : ''}`}>

      {/* HUD */}
      <div className="hud">
        <div className="status">● {status}</div>

        <div className="bars">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`bar ${i <= bars ? 'active' : ''}`}></div>
          ))}
        </div>
      </div>

      {/* MANUAL CONNECT BUTTON */}
      {mode === "demo" && (
        <button className="connect-btn" onClick={() => tryConnect()}>
          CONNECT TO DEVICE
        </button>
      )}

      {/* CALIBRATION */}
      {isCalibrating ? (
        <div className="center">
          <h2>CALIBRATING...</h2>
        </div>
      ) : (
        <>
          {/* RADAR */}
          <div className="radar-wrapper">
            <div className="sweep"></div>

            <div
              className="radar-core"
              style={{
                backgroundColor: getColor(),
                boxShadow: `0 0 80px ${getColor()}`,
                transform: `scale(${scale})`
              }}
            >
              <span>{Math.round(distance)}cm</span>
            </div>
          </div>

          {/* STATUS */}
          <div className="status-text">
            {presence ? (
              <h1 className="danger">TARGET DETECTED</h1>
            ) : (
              <h2 className="idle">SCANNING...</h2>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TrackingGame;