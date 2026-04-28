// TrackingGame.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

const TrackingGame = () => {
  // ---------- Core state ----------
  const [distance, setDistance] = useState(200);
  const [presence, setPresence] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [status, setStatus] = useState("CONNECTING");
  const [showRipple, setShowRipple] = useState(false);
  const [lastPresence, setLastPresence] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // ---------- WebSocket management ----------
  const connectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();

    const socket = new WebSocket('ws://192.168.4.1:81');
    wsRef.current = socket;
    setStatus("CONNECTING");

    socket.onopen = () => setStatus("ONLINE");
    socket.onclose = () => {
      setStatus("OFFLINE");
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!hasWon) connectWebSocket();
      }, 3000);
    };
    socket.onerror = () => setStatus("ERROR");

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'motion') setPresence(!!data.value);
        if (data.type === 'distance') setDistance(Math.min(200, Math.max(0, data.value)));
        if (data.type === 'victory') setHasWon(true);
      } catch (e) {}
    };
  }, [hasWon]);

  useEffect(() => {
    connectWebSocket();
    const timer = setTimeout(() => setIsCalibrating(false), 6000);
    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearTimeout(timer);
    };
  }, [connectWebSocket]);

  // ---------- Haptic & ripple feedback ----------
  useEffect(() => {
    if (presence && !lastPresence && !hasWon && !isCalibrating) {
      if (window.navigator?.vibrate) window.navigator.vibrate(80);
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 300);
    }
    setLastPresence(presence);
  }, [presence, lastPresence, hasWon, isCalibrating]);

  // ---------- Helpers ----------
  const getColor = () => {
    if (distance > 150) return '#ff3b3b';
    if (distance > 60) return '#ffd900';
    return '#00ff9f';
  };
  const intensity = Math.max(0.2, 1 - distance / 200);
  const scale = Math.max(0.8, 2 - distance / 120);
  const barsCount = Math.max(1, Math.min(5, Math.floor((200 - distance) / 40)));
  const shakeClass = distance < 40 ? 'shake-active' : '';

  const handleReconnect = () => {
    wsRef.current?.close();
    connectWebSocket();
    if (window.navigator?.vibrate) window.navigator.vibrate(30);
  };

  const handleRecalibrate = () => {
    if (isCalibrating) return;
    setIsCalibrating(true);
    setTimeout(() => setIsCalibrating(false), 2200);
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
  };

  const handleRestart = () => {
    setHasWon(false);
    setDistance(200);
    setPresence(false);
    setIsCalibrating(false);
    if (status !== "ONLINE") handleReconnect();
    if (window.navigator?.vibrate) window.navigator.vibrate(100);
  };

  // ---------- Victory screen ----------
  if (hasWon) {
    return (
      <div className="victory-neon">
        <div className="victory-content">
          <div className="victory-icon">🏆🎯</div>
          <h1 className="victory-title">TARGET SECURED</h1>
          <p className="victory-sub">proximity breach terminated</p>
          <button className="victory-btn" onClick={handleRestart}>⚡ NEW MISSION ⚡</button>
          <button className="victory-btn secondary" onClick={handleReconnect}>⟳ RECONNECT</button>
        </div>
        <style>{victoryStyles}</style>
      </div>
    );
  }

  // ---------- Main game UI ----------
  return (
    <div className={`game-container ${shakeClass}`}>
      <div className="scan-overlay"></div>

      {/* HUD */}
      <div className="hud-panel">
        <div className="status-badge">
          <span className={`status-led ${status.toLowerCase()}`}></span>
          <span className="status-text">{status}</span>
          {status !== "ONLINE" && (
            <button className="reconnect-mini" onClick={handleReconnect}>⟳</button>
          )}
        </div>
        <div className="proximity-bars">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`proximity-bar ${i <= barsCount ? 'lit' : ''}`}></div>
          ))}
        </div>
        <button className="recalibrate-btn" onClick={handleRecalibrate}>🔄 CAL</button>
      </div>

      {/* Calibration overlay */}
      {isCalibrating && (
        <div className="calibration-overlay">
          <div className="calib-spinner"></div>
          <h2>⚡ CALIBRATING ⚡</h2>
          <p>stabilizing sensors ...</p>
        </div>
      )}

      {/* Radar zone */}
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
            }}
          >
            <span className="distance-value">{Math.round(distance)}<span className="unit">cm</span></span>
          </div>
          {showRipple && <div className="presence-ripple"></div>}
        </div>

        <div className={`status-message ${presence ? 'alert' : 'idle'}`}>
          {presence ? (
            <div className="danger-glow">⚠️ TARGET DETECTED ⚠️</div>
          ) : (
            <span className="scan-text">⟳ SCANNING PERIMETER ⟳</span>
          )}
        </div>

        <div className="distance-ring">
          <svg viewBox="0 0 120 120" className="distance-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#1f2a3a" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke={getColor()} strokeWidth="6"
              strokeDasharray="326.9"
              strokeDashoffset={326.9 * (1 - (200 - Math.min(200, distance)) / 200)}
              strokeLinecap="round" transform="rotate(-90 60 60)"
            />
            <text x="60" y="70" textAnchor="middle" fill="#b0f0ff" fontSize="18" fontWeight="bold">
              {distance < 40 ? 'HOT' : 'RANGE'}
            </text>
          </svg>
        </div>
      </div>

      <div className="info-footer">
        <div className="footer-text">⚡ move closer → bars fill + core expands</div>
        <button className="icon-btn" onClick={handleReconnect}>⟳</button>
      </div>

      {/* Inject styles (or use CSS module) */}
      <style>{gameStyles}</style>
    </div>
  );
};

// ---------- Styles (kept inside component for portability) ----------
const gameStyles = `
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
    font-family: 'Courier New', monospace;
  }
  .scan-overlay {
    position: absolute;
    top:0; left:0; width:100%; height:100%;
    background: repeating-linear-gradient(0deg, rgba(0,255,100,0.02) 0px, rgba(0,255,100,0.02) 2px, transparent 2px, transparent 8px);
    pointer-events: none;
  }
  .shake-active {
    animation: shake-sensor 0.12s infinite ease;
  }
  @keyframes shake-sensor {
    0% { transform: translate(1px, 0px);}
    50% { transform: translate(-1px, 1px);}
    100% { transform: translate(0, -1px);}
  }
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
  }
  .status-led {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #888;
  }
  .status-led.online { background: #00ffaa; box-shadow: 0 0 8px #0f0; }
  .status-led.offline { background: #ff4444; }
  .status-led.connecting { background: #ffaa33; animation: pulse 1s infinite; }
  @keyframes pulse { 0% { opacity: 0.4; } 100% { opacity: 1; } }
  .status-text { font-size: 0.75rem; letter-spacing: 2px; color: #ccf; }
  .reconnect-mini { background: #1e2a3a; border: none; color: cyan; border-radius: 30px; width: 28px; cursor: pointer; }
  .proximity-bars { display: flex; gap: 6px; background: #080c14; padding: 6px 12px; border-radius: 50px; }
  .proximity-bar { width: 32px; height: 8px; background: #2a3342; border-radius: 4px; transition: 0.2s; }
  .proximity-bar.lit { background: #00ffb3; box-shadow: 0 0 10px #0fdb95; }
  .recalibrate-btn { background: rgba(0,20,40,0.9); border: 1px solid cyan; padding: 6px 16px; border-radius: 36px; font-weight: bold; color: #aaffdd; cursor: pointer; }
  .radar-zone { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; }
  .radar-dish {
    position: relative;
    width: min(65vw, 65vh, 360px);
    height: min(65vw, 65vh, 360px);
    background: radial-gradient(circle, #001622, #000205);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0;
  }
  .sweep-beam {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(from 0deg, rgba(0,255,200,0) 0deg, rgba(0,255,200,0.2) 30deg, rgba(0,255,200,0) 70deg);
    animation: sweepRotate 2.4s linear infinite;
    pointer-events: none;
  }
  @keyframes sweepRotate { 100% { transform: rotate(360deg); } }
  .radar-grid {
    position: absolute;
    width: 90%;
    height: 90%;
    border-radius: 50%;
    background-image: radial-gradient(circle, rgba(0,255,180,0.1) 1px, transparent 1px);
    background-size: 15px 15px;
  }
  .pulse-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid #0f0;
    width: 70%;
    height: 70%;
    animation: radarPulse 2s infinite;
  }
  .pulse-ring.delay { animation-delay: 1s; width: 85%; height: 85%; border-color: cyan; }
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
  }
  .distance-value { font-size: clamp(1.4rem, 6vw, 2.2rem); font-weight: 800; color: white; text-shadow: 0 0 15px currentColor; }
  .unit { font-size: 0.6rem; margin-left: 2px; }
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
  .status-message {
    margin-top: 18px;
    text-align: center;
    font-weight: bold;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(8px);
    padding: 10px 20px;
    border-radius: 60px;
  }
  .status-message.alert .danger-glow { color: #ff4d6d; text-shadow: 0 0 8px red; animation: textPulse 0.7s infinite alternate; }
  .scan-text { color: #8deeff; }
  @keyframes textPulse {
    0% { opacity: 0.6; }
    100% { opacity: 1; text-shadow: 0 0 16px #ff5555; }
  }
  .distance-ring { margin-top: 18px; width: 100px; height: 100px; }
  .distance-svg { width: 100%; height: 100%; filter: drop-shadow(0 0 6px cyan); }
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
  }
  .icon-btn { background: #10161f; border: none; border-radius: 40px; padding: 8px 16px; color: #0fa; font-size: 1.2rem; cursor: pointer; }
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
  }
  .calib-spinner { width: 70px; height: 70px; border: 5px solid #3affb0; border-top: 5px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @media (max-width: 550px) {
    .proximity-bar { width: 18px; }
    .hud-panel { padding: 12px 16px; }
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
    font-family: monospace;
  }
  .victory-content {
    text-align: center;
    background: rgba(0,0,0,0.7);
    padding: 2rem;
    border-radius: 70px;
    border: 2px solid #0f0;
    box-shadow: 0 0 60px #00ffaa55;
    backdrop-filter: blur(12px);
  }
  .victory-title { font-size: clamp(1.6rem, 8vw, 2.5rem); color: #0ff; text-shadow: 0 0 15px cyan; }
  .victory-btn {
    margin: 12px;
    padding: 14px 28px;
    background: #0a241f;
    border: 1px solid #0ef;
    color: cyan;
    font-weight: bold;
    border-radius: 80px;
    cursor: pointer;
  }
  .victory-btn.secondary { background: #221c2e; border-color: #ff66cc; color: #ffaaff; }
`;

export default TrackingGame;