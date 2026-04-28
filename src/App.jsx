import React, { useState, useEffect } from 'react';

const TrackingGame = () => {
  const [distance, setDistance] = useState(200);
  const [presence, setPresence] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [status, setStatus] = useState("INITIALIZING");
  const [mode, setMode] = useState("detecting"); // 'demo' | 'real'
  const [showRipple, setShowRipple] = useState(false);
  const [lastPresence, setLastPresence] = useState(false);

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

  // ================= RIPPLE EFFECT =================
  useEffect(() => {
    if (presence && !lastPresence && !hasWon && !isCalibrating) {
      if (window.navigator?.vibrate) window.navigator.vibrate(80);
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 300);
    }
    setLastPresence(presence);
  }, [presence, lastPresence, hasWon, isCalibrating]);

  // ================= UI HELPERS =================
  const getColor = () => {
    if (distance > 150) return '#ff3b3b';
    if (distance > 60) return '#ffd900';
    return '#00ff9f';
  };

  const intensity = Math.max(0.2, 1 - distance / 200);
  const scale = Math.max(0.8, 2 - distance / 120);
  const bars = Math.max(1, Math.floor((200 - distance) / 40));
  const shakeClass = distance < 40 ? 'shake-active' : '';

  // ================= VICTORY =================
  if (hasWon) {
    return (
      <div className="victory-neon">
        <div className="victory-content">
          <div className="victory-icon">🏆🎯</div>
          <h1 className="victory-title">TARGET SECURED</h1>
          <p className="victory-sub">Mission accomplished!</p>
          <button className="victory-btn" onClick={() => setHasWon(false)}>
            ⚡ NEW MISSION ⚡
          </button>
          {mode === "demo" && (
            <button className="victory-btn secondary" onClick={tryConnect}>
              ⟳ CONNECT TO DEVICE
            </button>
          )}
        </div>
        <style>{victoryStyles}</style>
      </div>
    );
  }

  return (
    <div className={`game-container ${shakeClass}`}>
      <div className="scan-overlay"></div>

      {/* HUD */}
      <div className="hud-panel">
        <div className="status-badge">
          <span className={`status-led ${mode === 'real' ? 'online' : 'offline'}`}></span>
          <span className="status-text">{status}</span>
        </div>
        <div className="proximity-bars">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`proximity-bar ${i <= bars ? 'lit' : ''}`}></div>
          ))}
        </div>
      </div>

      {/* MANUAL CONNECT BUTTON */}
      {mode === "demo" && (
        <button className="connect-btn-mobile" onClick={tryConnect}>
          🔌 CONNECT TO DEVICE
        </button>
      )}

      {/* CALIBRATION */}
      {isCalibrating ? (
        <div className="calibration-overlay">
          <div className="calib-spinner"></div>
          <h2>⚡ CALIBRATING ⚡</h2>
          <p>Initializing sensors...</p>
          <div className="calib-progress"></div>
        </div>
      ) : (
        <>
          {/* RADAR ZONE */}
          <div className="radar-zone">
            <div className="radar-dish">
              <div className="sweep-beam"></div>
              <div className="radar-grid"></div>
              <div className="pulse-ring" style={{ opacity: intensity * 0.5 }}></div>
              <div className="pulse-ring delay" style={{ opacity: intensity * 0.3 }}></div>
              
              <div
                className="radar-core"
                style={{
                  backgroundColor: getColor(),
                  boxShadow: `0 0 ${40 + 50 * intensity}px ${getColor()}`,
                  transform: `scale(${scale})`,
                  transition: 'transform 0.08s linear, box-shadow 0.1s'
                }}
              >
                <span className="distance-value">{Math.round(distance)}<span className="unit">cm</span></span>
              </div>
              
              {showRipple && <div className="presence-ripple"></div>}
            </div>

            {/* STATUS MESSAGE */}
            <div className={`status-message ${presence ? 'alert' : 'idle'}`}>
              {presence ? (
                <div className="danger-glow">
                  <span className="blink-icon">⚠️</span> TARGET DETECTED <span className="blink-icon">⚠️</span>
                </div>
              ) : (
                <span className="scan-text">⟳ SCANNING PERIMETER ⟳</span>
              )}
            </div>

            {/* DISTANCE RING */}
            <div className="distance-ring">
              <svg viewBox="0 0 120 120" className="distance-svg">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1f2a3a" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke={getColor()}
                  strokeWidth="6"
                  strokeDasharray="326.9"
                  strokeDashoffset={326.9 * (1 - (200 - Math.min(200, distance)) / 200)}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ filter: `drop-shadow(0 0 6px ${getColor()})` }}
                />
                <text x="60" y="70" textAnchor="middle" fill="#b0f0ff" fontSize="18" fontWeight="bold" dy=".3em">
                  {distance < 40 ? 'HOT' : 'RANGE'}
                </text>
              </svg>
            </div>
          </div>
        </>
      )}

      {/* FOOTER INFO */}
      <div className="info-footer">
        <div className="footer-text">
          {mode === "real" ? "📡 REAL-TIME TRACKING" : "🎮 DEMO MODE • MOVE CLOSER"}
        </div>
        {mode === "demo" && (
          <button className="icon-btn" onClick={tryConnect} title="Connect to device">
            🔄
          </button>
        )}
      </div>

      <style>{gameStyles}</style>
    </div>
  );
};

// ================= STYLES =================
const gameStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  .game-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    background: radial-gradient(ellipse at 30% 40%, #010514, #000000);
    overflow: hidden;
    font-family: 'Courier New', 'Orbitron', monospace;
  }

  .scan-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(0deg, rgba(0,255,100,0.02) 0px, rgba(0,255,100,0.02) 2px, transparent 2px, transparent 8px);
    pointer-events: none;
    z-index: 1;
  }

  .shake-active {
    animation: shake-sensor 0.12s infinite ease;
  }

  @keyframes shake-sensor {
    0% { transform: translate(1px, 0px);}
    50% { transform: translate(-1px, 1px);}
    100% { transform: translate(0, -1px);}
  }

  /* HUD Panel */
  .hud-panel {
    width: 100%;
    padding: 18px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 5, 15, 0.7);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0, 255, 200, 0.3);
    z-index: 20;
    gap: 12px;
    flex-wrap: wrap;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #0a0f1a;
    padding: 6px 14px;
    border-radius: 40px;
    border: 1px solid #2affb0;
    box-shadow: 0 0 6px rgba(0,255,150,0.3);
  }

  .status-led {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #888;
    transition: all 0.3s ease;
  }

  .status-led.online {
    background: #00ffaa;
    box-shadow: 0 0 8px #0f0;
    animation: pulse 1.5s infinite;
  }

  .status-led.offline {
    background: #ff4444;
    box-shadow: 0 0 6px red;
  }

  @keyframes pulse {
    0% { opacity: 0.4; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1.2); }
  }

  .status-text {
    font-size: 0.75rem;
    letter-spacing: 2px;
    font-weight: bold;
    color: #ccf;
  }

  .proximity-bars {
    display: flex;
    gap: 6px;
    background: #080c14;
    padding: 6px 12px;
    border-radius: 50px;
  }

  .proximity-bar {
    width: 32px;
    height: 8px;
    background: #2a3342;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .proximity-bar.lit {
    background: #00ffb3;
    box-shadow: 0 0 10px #0fdb95;
  }

  /* Connect Button Mobile */
  .connect-btn-mobile {
    background: linear-gradient(135deg, #1a5f5f, #0a2f2f);
    border: 2px solid #00ffcc;
    padding: 12px 28px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 1rem;
    letter-spacing: 2px;
    color: #00ffcc;
    backdrop-filter: blur(8px);
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 10px 0;
    z-index: 15;
    box-shadow: 0 0 20px rgba(0,255,200,0.3);
  }

  .connect-btn-mobile:active {
    transform: scale(0.96);
    background: #0f3f4a;
  }

  /* Radar Zone */
  .radar-zone {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    position: relative;
    z-index: 5;
  }

  .radar-dish {
    position: relative;
    width: min(65vw, 65vh, 360px);
    height: min(65vw, 65vh, 360px);
    background: radial-gradient(circle, #001622, #000205);
    border-radius: 50%;
    box-shadow: 0 0 30px rgba(0,255,180,0.2), inset 0 0 20px rgba(0,255,200,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0;
  }

  .sweep-beam {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(from 0deg, rgba(0,255,200,0) 0deg, rgba(0,255,200,0.2) 30deg, rgba(0,255,200,0) 70deg);
    animation: sweepRotate 2.4s linear infinite;
    pointer-events: none;
  }

  @keyframes sweepRotate {
    100% { transform: rotate(360deg); }
  }

  .radar-grid {
    position: absolute;
    width: 90%;
    height: 90%;
    border-radius: 50%;
    background-image: radial-gradient(circle, rgba(0,255,180,0.1) 1px, transparent 1px);
    background-size: 15px 15px;
    border: 1px solid rgba(0,255,200,0.2);
  }

  .pulse-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid #0f0;
    width: 70%;
    height: 70%;
    opacity: 0;
    animation: radarPulse 2s infinite;
  }

  .pulse-ring.delay {
    animation-delay: 1s;
    width: 85%;
    height: 85%;
    border-color: cyan;
  }

  @keyframes radarPulse {
    0% { transform: scale(0.6); opacity: 0.6; }
    100% { transform: scale(1.4); opacity: 0; }
  }

  .radar-core {
    width: 40%;
    height: 40%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.06s linear;
    z-index: 10;
    backdrop-filter: blur(4px);
  }

  .distance-value {
    font-size: clamp(1.4rem, 6vw, 2.2rem);
    font-weight: 800;
    color: white;
    text-shadow: 0 0 15px currentColor;
    font-family: monospace;
  }

  .unit {
    font-size: 0.6rem;
    margin-left: 2px;
  }

  .presence-ripple {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 60, 60, 0.5), transparent);
    animation: flashRipple 0.4s ease-out;
    pointer-events: none;
  }

  @keyframes flashRipple {
    0% { transform: scale(0.5); opacity: 0.8; }
    100% { transform: scale(1.2); opacity: 0; }
  }

  /* Status Message */
  .status-message {
    margin-top: 18px;
    text-align: center;
    font-size: 1rem;
    font-weight: bold;
    letter-spacing: 2px;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(8px);
    padding: 10px 20px;
    border-radius: 60px;
    border: 1px solid rgba(0,255,200,0.3);
  }

  .status-message.alert .danger-glow {
    color: #ff4d6d;
    text-shadow: 0 0 8px red;
    animation: textPulse 0.7s infinite alternate;
  }

  .scan-text {
    color: #8deeff;
    font-family: monospace;
  }

  @keyframes textPulse {
    0% { opacity: 0.6; text-shadow: 0 0 2px red; }
    100% { opacity: 1; text-shadow: 0 0 16px #ff5555; }
  }

  .blink-icon {
    display: inline-block;
    animation: blink 0.8s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* Distance Ring */
  .distance-ring {
    margin-top: 18px;
    width: 100px;
    height: 100px;
  }

  .distance-svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 6px cyan);
  }

  /* Footer */
  .info-footer {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 22px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    font-size: 0.7rem;
    color: #7fbcb0;
    border-top: 1px solid #2affb044;
    z-index: 10;
  }

  .footer-text {
    font-family: monospace;
    letter-spacing: 1px;
  }

  .icon-btn {
    background: #10161f;
    border: none;
    border-radius: 40px;
    padding: 8px 16px;
    color: #0fa;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .icon-btn:active {
    transform: scale(0.95);
    background: #1a2a3a;
  }

  /* Calibration Overlay */
  .calibration-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 200;
    gap: 1rem;
    animation: fadeIn 0.3s;
  }

  .calib-spinner {
    width: 70px;
    height: 70px;
    border: 5px solid #3affb0;
    border-top: 5px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .calibration-overlay h2 {
    color: #00ffcc;
    text-shadow: 0 0 10px cyan;
    letter-spacing: 3px;
  }

  .calibration-overlay p {
    color: #88ffdd;
  }

  .calib-progress {
    width: 200px;
    height: 3px;
    background: #1a3a3a;
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }

  .calib-progress::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, #00ffcc, #00ff66);
    animation: progress 3s ease-out forwards;
  }

  @keyframes progress {
    0% { width: 0%; }
    100% { width: 100%; }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Mobile Responsive */
  @media (max-width: 550px) {
    .proximity-bar {
      width: 18px;
    }
    
    .hud-panel {
      padding: 12px 16px;
    }
    
    .status-text {
      font-size: 0.65rem;
    }
    
    .connect-btn-mobile {
      padding: 8px 20px;
      font-size: 0.85rem;
    }
    
    .status-message {
      font-size: 0.85rem;
      padding: 8px 16px;
    }
  }

  @media (max-width: 380px) {
    .proximity-bar {
      width: 14px;
    }
    
    .radar-dish {
      width: min(75vw, 280px);
      height: min(75vw, 280px);
    }
  }
`;

const victoryStyles = `
  .victory-neon {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle at center, #061d1f, #010101);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', monospace;
  }
  
  .victory-content {
    text-align: center;
    background: rgba(0, 0, 0, 0.7);
    padding: 2rem;
    border-radius: 70px;
    border: 2px solid #0f0;
    box-shadow: 0 0 60px #00ffaa55;
    backdrop-filter: blur(12px);
    animation: victoryGlow 1.5s ease-in-out infinite alternate;
  }
  
  @keyframes victoryGlow {
    from { box-shadow: 0 0 30px #00ffaa55; border-color: #0f0; }
    to { box-shadow: 0 0 80px #00ffaaff; border-color: #ff0; }
  }
  
  .victory-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 0.8s ease infinite;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .victory-title {
    font-size: clamp(1.6rem, 8vw, 2.5rem);
    color: #0ff;
    text-shadow: 0 0 15px cyan;
    margin-bottom: 0.5rem;
  }
  
  .victory-sub {
    color: #88ffaa;
    margin-bottom: 1.5rem;
  }
  
  .victory-btn {
    margin: 12px;
    padding: 14px 28px;
    background: linear-gradient(135deg, #0a241f, #05201a);
    border: 1px solid #0ef;
    color: cyan;
    font-weight: bold;
    border-radius: 80px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .victory-btn:active {
    transform: scale(0.96);
  }
  
  .victory-btn.secondary {
    background: linear-gradient(135deg, #221c2e, #1a1224);
    border-color: #ff66cc;
    color: #ffaaff;
  }
  
  @media (max-width: 550px) {
    .victory-content {
      padding: 1.5rem;
      margin: 1rem;
    }
    
    .victory-btn {
      padding: 10px 20px;
      font-size: 0.85rem;
      margin: 8px;
    }
  }
`;

export default TrackingGame;