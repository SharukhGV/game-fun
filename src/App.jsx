import React, { useState, useEffect } from 'react';

const TrackingGame = () => {
  const [distance, setDistance] = useState(200);
  const [presence, setPresence] = useState(false);
  const [hasWon, setHasWon] = useState(false); // New State
  const [isCalibrating, setIsCalibrating] = useState(true);
// Add this to your useState declarations at the top of the component
const [status, setStatus] = useState("Connecting...");

// And update the useEffect to set the status
useEffect(() => {
  const timer = setTimeout(() => setIsCalibrating(false), 30000);
  const socket = new WebSocket('ws://192.168.4.1:81'); 

  socket.onopen = () => setStatus("System Online"); // Added this
  socket.onclose = () => setStatus("System Offline"); // Added this

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'motion') setPresence(data.value);
    if (data.type === 'distance') setDistance(data.value);
    if (data.type === 'victory') setHasWon(true);
  };

  return () => {
    socket.close();
    clearTimeout(timer);
  };
}, []);
  useEffect(() => {
    const timer = setTimeout(() => setIsCalibrating(false), 30000);
    const socket = new WebSocket('ws://192.168.4.1:81'); 

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'motion') setPresence(data.value);
      if (data.type === 'distance') setDistance(data.value);
      if (data.type === 'victory') setHasWon(true); // Victory trigger
    };

    return () => {
      socket.close();
      clearTimeout(timer);
    };
  }, []);

  if (hasWon) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#00ff88',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1a1a1a'
      }}>
        <h1 style={{ fontSize: '4rem', textAlign: 'center' }}>🎉 CONGRATULATIONS! 🎉</h1>
        <h2 style={{ letterSpacing: '2px' }}>YOU HAVE WON THE GAME</h2>
        <button 
          onClick={() => setHasWon(false)}
          style={{ marginTop: '30px', padding: '10px 20px', cursor: 'pointer' }}
        >
          Play Again
        </button>
      </div>
    );
  }

  // Calculate color: Red (far) to Green (close)
  // Distance 200cm+ = Red | Distance 0cm = Green
  const getRadarColor = () => {
    if (distance > 150) return '#ff4d4d'; // Red
    if (distance > 50) return '#ffd700';  // Yellow/Gold
    return '#00ff88'; // Bright Green
  };

  // Pulse size logic: scale between 0.5 (far) and 2.0 (close)
  const pulseScale = Math.max(0.5, 2.5 - (distance / 100));

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: presence ? '#0a0a0a' : '#1a1a1a',
      color: 'white',
      fontFamily: 'monospace',
      transition: 'background-color 0.8s'
    }}>
      {isCalibrating ? (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ffd700' }}>INITIALIZING SENSORS...</h2>
          <p>Please stand still while PIR calibrates to the room.</p>
        </div>
      ) : (
        <>
          <div style={{ position: 'absolute', top: '20px' }}>
            <p>Status: <span style={{ color: getRadarColor() }}>{status}</span></p>
          </div>

          {/* The Pulsing Radar Circle */}
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            backgroundColor: getRadarColor(),
            boxShadow: `0 0 50px ${getRadarColor()}`,
            transform: `scale(${pulseScale})`,
            transition: 'transform 0.3s ease-out, background-color 0.5s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#000', fontWeight: 'bold' }}>
              {distance}cm
            </span>
          </div>

          <div style={{ marginTop: '100px', textAlign: 'center' }}>
            {presence ? (
              <h1 style={{ color: '#ff4d4d', letterSpacing: '5px', animation: 'blink 1s infinite' }}>
                TARGET ACQUIRED
              </h1>
            ) : (
              <h2 style={{ opacity: 0.5 }}>SCANNING AREA...</h2>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TrackingGame;