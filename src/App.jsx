import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const TrackingGame = () => {
  const [hintIndex, setHintIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [gameOver, setGameOver] = useState(false);
const [socket, setSocket] = useState(null);

useEffect(() => {
  const ws = new WebSocket('ws://192.168.4.1:81'); 
  ws.onopen = () => console.log("Connected to ESP32 Hardware");
  setSocket(ws);
  return () => ws.close();
}, []);
  const MASTER_PASSPHRASE = "chocolate";

  const missions = [
    { q: "I have keys but no locks, space but no room. You can enter, but you can’t go outside.", a: "keyboard", hint: "You are using it right now.", response: "Signal detected. A faint beep echoes somewhere..." },
    { q: "I speak without a mouth and hear without ears.", a: "echo", hint: "It repeats you.", response: "The beep grows louder..." },
    { q: "The more you take, the more you leave behind.", a: "footsteps", hint: "Think walking.", response: "You're getting closer to the sound..." },
    { q: "What has a heart that doesn’t beat?", a: "artichoke", hint: "A vegetable.", response: "The beeping is nearby now..." },
    { q: "What building has the most stories?", a: "library", hint: "Books live here.", response: "FINAL SIGNAL LOCKED." },

    // fallback riddles if beep not found
    { q: "I fly without wings. I cry without eyes.", a: "cloud", hint: "Look up.", response: "Backup path unlocked..." },
    { q: "What gets wetter the more it dries?", a: "towel", hint: "Bathroom item.", response: "Still searching..." },
    { q: "I shave every day, but my beard stays the same.", a: "barber", hint: "A job.", response: "Keep going..." },
    { q: "What has hands but can’t clap?", a: "clock", hint: "Time.", response: "Almost there..." },
    { q: "What has one eye but cannot see?", a: "needle", hint: "Used in sewing.", response: "Last fallback complete..." }
  ];

const triggerBeeps = () => {
  console.log("BEEP BEEP BEEP"); 
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send("SUCCESS_CHIRP");
  }
};

  const handleCheck = () => {
    const cleanInput = userInput.toLowerCase().trim();

    // MASTER PASS PHRASE OVERRIDE
    if (cleanInput === MASTER_PASSPHRASE) {
      setGameOver(true);
      triggerBeeps();
      return;
    }

    if (cleanInput === missions[hintIndex].a) {
      setIsCorrect(true);
      setShowHint(false);

      confetti({
        particleCount: 120,
        spread: 60,
        origin: { y: 0.6 }
      });

      triggerBeeps();
    } else {
      setShowModal(true);
    }
  };

  const nextMission = () => {
    setHintIndex((prev) => prev + 1);
    setIsCorrect(false);
    setUserInput("");
    setShowHint(false);
  };

  if (gameOver) {
    return (
      <div style={styles.container}>
        <div style={{...styles.riddleCard, borderColor: '#39ff14'}}>
          <h1 style={{color: '#39ff14'}}>🎁 LOCATION UNLOCKED</h1>

          <h2 style={{color: '#fff', marginTop: '20px'}}>
            Inside Book 10 of A Series of Unfortunate Events
          </h2>

          <p style={{color: '#88a', marginTop: '15px'}}>
            The trail ends in the pages. Look carefully.
          </p>

          <button 
            style={{...styles.decodeBtn, marginTop: '30px'}} 
            onClick={() => window.location.reload()}
          >
            RESTART
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚡ SIGNAL HUNT</h1>

      <div style={styles.instructions}>
        Solve riddles. Each correct answer triggers a beep.
        <br />
        Follow the beeping sound to discover the master passphrase.
        <br />
        Or… figure it out yourself.
      </div>

      <div style={styles.riddleCard}>
        {!isCorrect ? (
          <>
            <div style={styles.statusBadge}>RIDDLE {hintIndex + 1}</div>

            <h3 style={styles.riddleQuestion}>
              "{missions[hintIndex]?.q}"
            </h3>

            <button style={styles.hintBtn} onClick={() => setShowHint(!showHint)}>
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>

            {showHint && (
              <div style={styles.hintReveal}>
                {missions[hintIndex].hint}
              </div>
            )}

            <input
              style={styles.input}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Answer riddle OR enter master passphrase..."
              onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
            />

            <button style={styles.decodeBtn} onClick={handleCheck}>
              SUBMIT
            </button>
          </>
        ) : (
          <div style={styles.success}>
            <h2 style={styles.successTitle}>✔ CORRECT</h2>
            <p>{missions[hintIndex].response}</p>

            {hintIndex < missions.length - 1 && (
              <button style={styles.nextBtn} onClick={nextMission}>
                NEXT ➡️
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={{ color: '#ff4d4d' }}>WRONG</h2>
            <button onClick={() => setShowModal(false)}>TRY AGAIN</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    backgroundColor: '#050810',
    color: '#b3f0ff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: { marginBottom: '20px' },
  instructions: {
    maxWidth: '400px',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#88a',
    marginBottom: '20px'
  },
  riddleCard: {
    padding: '30px',
    backgroundColor: '#0c1220',
    border: '1px solid #00ccff',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center'
  },
  input: {
    padding: '12px',
    width: '80%',
    marginTop: '20px'
  },
  decodeBtn: {
    marginTop: '15px',
    padding: '10px 25px',
    backgroundColor: '#00ccff',
    border: 'none'
  },
  successTitle: { color: '#39ff14' },
  nextBtn: {
    marginTop: '15px',
    padding: '10px',
    border: '1px solid #39ff14',
    background: 'none',
    color: '#39ff14'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    backgroundColor: '#111',
    padding: '20px'
  }
};

export default TrackingGame;