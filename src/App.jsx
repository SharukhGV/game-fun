import React, { useState } from 'react';

const TrackingGame = () => {
  // ================= DISTANCE SENSOR CODE (REMOVED / COMMENTED OUT) =================
  // const [distance, setDistance] = useState(200);
  // const [socket, setSocket] = useState(null);
  // useEffect(() => {
  //   const ws = new WebSocket('ws://192.168.4.1:81');
  //   ws.onmessage = (e) => {
  //     const data = JSON.parse(e.data);
  //     if (data.type === 'distance') setDistance(data.value);
  //   };
  //   setSocket(ws);
  //   return () => ws.close();
  // }, []);
  // ================================================================================

  // Game state for riddles
  const [hintIndex, setHintIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  // Expanded collection of riddles (more questions for extended gameplay)
  const hints = [
    { q: "What has keys but can't open locks?", a: "piano", hint: "🔍 It's near something musical. Find the instrument." },
    { q: "I have hands but no arms. I have a face but no eyes. What am I?", a: "clock", hint: "🔍 Check the wall where time stands still." },
    { q: "I have a spine but no bones. What am I?", a: "book", hint: "🔍 Search the library shelf among novels." },
    { q: "What is full of holes but still holds water?", a: "sponge", hint: "🔍 Look in the kitchen or bathroom — it's absorbent." },
    { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind.", a: "echo", hint: "🔍 Try shouting in a canyon or an empty room." },
    { q: "The more you take, the more you leave behind. What am I?", a: "footsteps", hint: "🔍 Check the ground as you walk." },
    { q: "I am taken from a mine and shut up in a wooden case, from which I am never released, yet I am used by almost every person.", a: "pencil lead", hint: "🔍 It's in your desk, helps you write." },
    { q: "What has a head, a tail, is brown, and has no legs?", a: "penny", hint: "🔍 Look in your pockets or coin jar." },
    { q: "The more there is, the less you see. What am I?", a: "darkness", hint: "🔍 Turn off the lights — it's what surrounds you." },
    { q: "What can you catch but not throw?", a: "cold", hint: "🔍 Think about winter or a sneeze." }
  ];

  // Check the user's answer against the current riddle
  const checkAnswer = () => {
    if (userInput.toLowerCase().trim() === hints[hintIndex].a) {
      setIsCorrect(true);
      // Optional: success sound / signal (distance sensor beep removed)
      // if (socket) socket.send("SUCCESS_CHIRP");  // Removed with sensor code
    } else {
      alert("❌ Incorrect! Study the riddle and try again.");
    }
  };

  // Move to the next riddle, reset answer state
  const nextMission = () => {
    setHintIndex((prev) => (prev + 1) % hints.length);
    setIsCorrect(false);
    setUserInput("");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧩 RIDDLE CHALLENGE</h1>

      {/* Main Riddle Card */}
      <div style={styles.riddleCard}>
        {!isCorrect ? (
          <>
            <h3 style={styles.riddleQuestion}>📜 {hints[hintIndex].q}</h3>
            <input
              style={styles.input}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your answer here..."
              onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
            />
            <button style={styles.btn} onClick={checkAnswer}>🔓 DECODE</button>
          </>
        ) : (
          <div style={styles.success}>
            <h2>✅ ACCESS GRANTED</h2>
            <p style={styles.hintMessage}>📍 {hints[hintIndex].hint}</p>
            <button style={styles.btn} onClick={nextMission}>➡️ NEXT RIDDLE</button>
          </div>
        )}
      </div>

      {/* Optional progress indicator */}
      <div style={styles.progress}>
        Riddle {hintIndex + 1} of {hints.length}
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    backgroundColor: '#0a0f1e',
    color: '#b3f0ff',
    fontFamily: "'Courier New', monospace",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  title: {
    letterSpacing: '4px',
    marginBottom: '30px',
    fontSize: '2rem',
    textShadow: '0 0 5px #00ccff',
    borderBottom: '2px solid #2a6f8f',
    paddingBottom: '10px'
  },
  riddleCard: {
    marginTop: '20px',
    padding: '30px 25px',
    border: '1px solid #2a6f8f',
    borderRadius: '20px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '550px',
    backgroundColor: '#121827',
    boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
    transition: '0.2s'
  },
  riddleQuestion: {
    fontSize: '1.6rem',
    marginBottom: '25px',
    lineHeight: '1.4',
    fontWeight: '500',
    color: '#e0f2fe'
  },
  input: {
    padding: '12px 15px',
    borderRadius: '40px',
    border: '1px solid #2a6f8f',
    backgroundColor: '#1e2a3a',
    color: '#b3f0ff',
    width: '85%',
    marginBottom: '20px',
    fontSize: '1rem',
    outline: 'none',
    textAlign: 'center',
    fontFamily: 'monospace'
  },
  btn: {
    padding: '10px 28px',
    backgroundColor: '#1e6f5c',
    border: 'none',
    borderRadius: '40px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    color: '#ffffff',
    letterSpacing: '1px',
    transition: '0.2s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
  },
  success: {
    color: '#b3ffcf'
  },
  hintMessage: {
    backgroundColor: '#0e2a2a',
    padding: '12px',
    borderRadius: '12px',
    margin: '20px 0',
    fontSize: '1.1rem'
  },
  progress: {
    marginTop: '30px',
    fontSize: '0.85rem',
    color: '#6a9fb5',
    backgroundColor: '#0f1722',
    padding: '6px 12px',
    borderRadius: '20px'
  }
};

export default TrackingGame;