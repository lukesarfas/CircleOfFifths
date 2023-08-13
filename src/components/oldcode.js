import React, { useState, useRef } from "react";
import * as Tone from 'tone';

const CircleOfFifths = ({ size = 500 }) => {

  // Definitions
  const width = size;
  const height = size;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.85;

  const majorKeys = [
    "C",
    "G",
    "D",
    "A",
    "E",
    "B",
    "F♯",
    "D♭",
    "A♭",
    "E♭",
    "B♭",
    "F",
  ];

  const noteFrequencies = {
    "C": 261.63,
    "G": 392.0,
    "D": 293.66,
    "A": 440.0,
    "E": 329.63,
    "B": 493.88,
    "F♯": 369.99,
    "D♭": 277.18,
    "A♭": 415.3,
    "E♭": 311.13,
    "B♭": 466.16,
    "F": 349.23,
  };

  // State for all currently playing notes
  const [activeNotes, setActiveNotes] = useState({});
  // State
  const frequencies = noteFrequencies;



  const synths = useRef({}); // Store the synth instances

  const toggleTone = (key) => {
    if (activeNotes[key]) {
      synths.current[key].triggerRelease();
      synths.current[key] = null;
    } else {
      const synth = new Tone.Synth({
        oscillator: {
          type: 'triangle',
          frequency: frequencies[key]
        },
        envelope: {
          attack: 0.04,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      }).toDestination();
      
      synth.triggerAttack(frequencies[key]);
      synths.current[key] = synth;
    }

    setActiveNotes(prevNotes => ({
        ...prevNotes,
        [key]: !prevNotes[key]
    }));
};

  const calculatePosition = (index) => {
    const angle = (index / 12) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  const linesBetweenActiveNotes = () => {
    const activeKeys = Object.keys(activeNotes).filter((k) => activeNotes[k]);
    const positions = activeKeys.map((key) => {
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
          />,
        );
      }
    }
    return lines;
  };

  const noteCircleRadius = 22;
  const buttonDistance = 35; 
  const buttonRadius = 12;


  // Styles
  const baseNoteStyle = {
    fill: "#f0f8ff", // AliceBlue
    stroke: "#4682b4", // SteelBlue
    strokeWidth: 2,
  };

  const activeNoteStyle = {
    ...baseNoteStyle,
    fill: "#ffa07a", // LightSalmon
  };

  const buttonStyle = {
    fill: "#e0ffff", // LightCyan
    stroke: "#20b2aa", // LightSeaGreen
    strokeWidth: 1.5,
    cursor: "pointer",
  };

  // New state to track frequency adjustments
  const [frequencyAdjustments, setFrequencyAdjustments] = useState(
    majorKeys.reduce((acc, key) => {
      acc[key] = 1; // No adjustment initially
      return acc;
    }, {}),
  );

  const adjustOctave = (key, adjustment) => {
    if (!activeNotes[key]) return;

    let currentAdjustment = frequencyAdjustments[key];
    currentAdjustment =
      adjustment === "up" ? currentAdjustment * 2 : currentAdjustment / 2;

    setFrequencyAdjustments((prev) => ({
      ...prev,
      [key]: currentAdjustment,
    }));

    const newFrequency = noteFrequencies[key] * currentAdjustment;

    if (synths.current[key]) {
      synths.current[key].set({ "oscillator": { "frequency": newFrequency } });
    }
  };

  return (
    <svg
      width={width}
      height={height}
      style={{
        fill: "none",
        stroke: "#e0e0e0",
        padding: "10px",
        background: "#fafafa",
      }}
    >
      {/* Primary Circle */}
      <circle cx={centerX} cy={centerY} r={radius} />

      {/* Lines between active notes */}
      {linesBetweenActiveNotes()}

      {/* Major Keys with Encasing Circles */}
      {majorKeys.map((key, index) => {
        const position = calculatePosition(index);
        const isActive = activeNotes[key];
        return (
          <g
            key={key}
            onClick={() => toggleTone(key)}
            style={{ cursor: "pointer" }}
          >
            {/* Encasing Circle */}
            <circle
              cx={position.x}
              cy={position.y}
              r={noteCircleRadius}
              {...(isActive ? activeNoteStyle : baseNoteStyle)}
            />

            {/* Note Label */}
            <text
              x={position.x}
              y={position.y}
              fontSize="16px"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={isActive ? "#b22222" : "#4682b4"}
              fontFamily="sans-serif"
            >
              {key}
            </text>

            {/* Octave Controls */}
            {isActive && (
              <>
                {/* + Button */}
                <g
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustOctave(key, "up");
                  }}
                >
                  <circle
                    cx={position.x}
                    cy={position.y - buttonDistance}
                    r={buttonRadius}
                    {...buttonStyle}
                  />
                  <text
                    x={position.x}
                    y={position.y - buttonDistance}
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#20b2aa"
                  >
                    +
                  </text>
                </g>
                {/* - Button */}
                <g
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustOctave(key, "down");
                  }}
                >
                  <circle
                    cx={position.x}
                    cy={position.y + buttonDistance}
                    r={buttonRadius}
                    {...buttonStyle}
                  />
                  <text
                    x={position.x}
                    y={position.y + buttonDistance}
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#20b2aa"
                  >
                    -
                  </text>
                </g>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default CircleOfFifths;
