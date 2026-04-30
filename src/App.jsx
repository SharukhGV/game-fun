import React, { useState, useEffect, useRef } from 'react';

const TrackingGame = () => {
  const [distance, setDistance] = useState(200);
  const [socket, setSocket] = useState(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [timer, setTimer] = useState(20);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  const hints = [
    { q: "What has keys but can't open locks?", a: "piano", hint: "It's near something musical." },
    { q: "I have hands but no arms.", a: "clock", hint: "Check the walls where time stands still." },
    { q: "I have a spine but no bones.", a: "book", hint: "Search the library shelf." }
  ];

  // ================= WS CONNECTION =================
  useEffect(() => {
    const ws = new WebSocket('ws://192.168.4.1:81');
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'distance') setDistance(data.value);
    };
    setSocket(ws);
    return () => ws.close();
  }, []);

  // ================= HINT TIMER =================
  useEffect(() => {
    if (timer > 0 && !isCorrect) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer, isCorrect]);

  const checkAnswer = () => {
    if (userInput.toLowerCase().trim() === hints[hintIndex].a) {
      setIsCorrect(true);
      if (socket) socket.send("SUCCESS_CHIRP"); // Tell ESP32 to beep!
    } else {
      alert("Incorrect! Try again.");
    }
  };

  const nextMission = () => {
    setHintIndex((prev) => (prev + 1) % hints.length);
    setTimer(20);
    setIsCorrect(false);
    setUserInput("");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>MISSION: TRACKER</h1>
      
      {/* RADAR UI */}
      <div style={{...styles.radar, borderColor: distance < 50 ? '#ff0000' : '#00ff9f'}}>
        <div style={styles.distText}>{distance}cm</div>
        <div style={styles.label}>PROXIMITY</div>
      </div>

      {/* HINT SYSTEM */}
      <div style={styles.hintCard}>
        {timer > 0 && !isCorrect ? (
          <p style={styles.timer}>Next Hint Unlocks in: {timer}s</p>
        ) : (
          <div>
            {!isCorrect ? (
              <>
                <h3>RIDDLE: {hints[hintIndex].q}</h3>
                <input 
                  style={styles.input} 
                  value={userInput} 
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter answer..."
                />
                <button style={styles.btn} onClick={checkAnswer}>DECODE</button>
              </>
            ) : (
              <div style={styles.success}>
                <h2>ACCESS GRANTED</h2>
                <p>📍 {hints[hintIndex].hint}</p>
                <button style={styles.btn} onClick={nextMission}>NEXT MISSION</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', backgroundColor: '#000', color: '#00ff9f', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  title: { letterSpacing: '5px', marginBottom: '30px' },
  radar: { width: '200px', height: '200px', borderRadius: '50%', border: '4px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: '0.3s' },
  distText: { fontSize: '3rem', fontWeight: 'bold' },
  hintCard: { marginTop: '40px', padding: '20px', border: '1px solid #333', borderRadius: '10px', textAlign: 'center', width: '100%', maxWidth: '400px' },
  input: { padding: '10px', borderRadius: '5px', border: 'none', width: '80%', marginBottom: '10px' },
  btn: { padding: '10px 20px', backgroundColor: '#00ff9f', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  timer: { fontSize: '1.2rem', color: '#ffcc00' },
  success: { color: '#00ff9f' }
};

export default TrackingGame;