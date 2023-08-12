import React, { useState, useRef } from 'react';

const CircleOfFifths = ({ size = 500 }) => {
    const width = size;
    const height = size;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.85;
    const textOffset = 20;

    const majorKeys = ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"];

    const noteFrequencies = {
        "C": 261.63,
        "G": 392.00,
        "D": 293.66,
        "A": 440.00,
        "E": 329.63,
        "B": 493.88,
        "F♯": 369.99,
        "D♭": 277.18,
        "A♭": 415.30,
        "E♭": 311.13,
        "B♭": 466.16,
        "F": 349.23
    };

    const [activeNotes, setActiveNotes] = useState({});
    const oscillators = useRef({});  // Using a ref to persist oscillators
    const audioCtx = useRef(new (window.AudioContext || window.webkitAudioContext)());  // Single AudioContext instance

    const toggleTone = (key) => {
      // If the note is already playing, stop it
      if (activeNotes[key]) {
          oscillators.current[key].gainNode.gain.setValueAtTime(0, audioCtx.current.currentTime);  // Fade out before stopping
          oscillators.current[key].oscillator.stop();
          delete oscillators.current[key];
          setActiveNotes(prevNotes => ({ ...prevNotes, [key]: false }));
          return;
      }

      const oscillator = audioCtx.current.createOscillator();
      const gainNode = audioCtx.current.createGain();

      oscillator.type = 'triangle';  // Changed waveform
      oscillator.frequency.setValueAtTime(noteFrequencies[key], audioCtx.current.currentTime);
      
      // Set up the gain node
      gainNode.gain.setValueAtTime(0.5, audioCtx.current.currentTime);  // 50% volume
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.current.destination);

      oscillator.start();
      oscillators.current[key] = { oscillator, gainNode };

      setActiveNotes(prevNotes => ({ ...prevNotes, [key]: true }));
  };

  const calculatePosition = (index) => {
    const angle = (index / 12) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(angle - Math.PI / 2);
    return { x, y };
};

const linesBetweenActiveNotes = () => {
    const activeKeys = Object.keys(activeNotes).filter(k => activeNotes[k]);
    const positions = activeKeys.map(key => {
        const index = majorKeys.indexOf(key);
        return calculatePosition(index);
    });

    const lines = [];
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            lines.push(
                <line 
                    key={`${activeKeys[i]}-${activeKeys[j]}`} 
                    x1={positions[i].x} 
                    y1={positions[i].y} 
                    x2={positions[j].x} 
                    y2={positions[j].y} 
                    stroke="gray"
                />
            );
        }
    }
    return lines;
};

const noteCircleRadius = 20;
const buttonDistance = 30; // Distance from the note circle center to "+" or "-" button

// New state to track frequency adjustments
const [frequencyAdjustments, setFrequencyAdjustments] = useState(
    majorKeys.reduce((acc, key) => {
        acc[key] = 1;  // No adjustment initially
        return acc;
    }, {})
);

const adjustOctave = (key, adjustment) => {
    if (!activeNotes[key]) return; // Only adjust octave for active notes

    // Adjust based on current frequency adjustment
    let currentAdjustment = frequencyAdjustments[key];
    currentAdjustment = adjustment === 'up' ? currentAdjustment * 2 : currentAdjustment / 2;

    // Update frequencyAdjustments state
    setFrequencyAdjustments(prev => ({
        ...prev,
        [key]: currentAdjustment
    }));

    const newFrequency = noteFrequencies[key] * currentAdjustment;

    if (oscillators.current[key]) {
        oscillators.current[key].oscillator.frequency.setValueAtTime(newFrequency, audioCtx.current.currentTime);
    }
};

    return (
        <svg width={width} height={height} style={{ fill: 'none', stroke: 'black' }}>
            {/* Primary Circle */}
            <circle cx={centerX} cy={centerY} r={radius} />

            {/* Lines between active notes */}
            {linesBetweenActiveNotes()}

            {/* Major Keys with Encasing Circles */}
            {majorKeys.map((key, index) => {
                const position = calculatePosition(index);
                const isActive = activeNotes[key];
                return (
                    <g key={key}>
                        {/* Encasing Circle */}
                        <circle 
                            cx={position.x} 
                            cy={position.y} 
                            r={noteCircleRadius} 
                            fill={isActive ? "#FFD700" : "white"}  
                            stroke="black"
                        />
                        {/* Octave Controls */}
                        {isActive && (
                            <>
                                <text 
                                    x={position.x} 
                                    y={position.y - buttonDistance} 
                                    fontSize="16"
                                    textAnchor="middle" 
                                    alignmentBaseline="middle"
                                    onClick={() => adjustOctave(key, 'up')}
                                    style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    +
                                </text>
                                <text 
                                    x={position.x} 
                                    y={position.y + buttonDistance} 
                                    fontSize="16"
                                    textAnchor="middle" 
                                    alignmentBaseline="middle"
                                    onClick={() => adjustOctave(key, 'down')}
                                    style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    -
                                </text>
                            </>
                        )}
                        {/* Note Label */}
                        <text 
                            x={position.x} 
                            y={position.y} 
                            fontSize="16" 
                            textAnchor="middle" 
                            alignmentBaseline="middle"
                            onClick={() => toggleTone(key)}
                            style={{ cursor: 'pointer', fill: isActive ? 'red' : 'black' }}
                        >
                            {key}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default CircleOfFifths;