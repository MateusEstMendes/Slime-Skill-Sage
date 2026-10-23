import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Controls.jsx";
import { Frame, MagicCircle } from "./Ornaments.jsx";

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return reduced;
}

const outcomes = ["Avanço", "Descoberta", "Reserva", "Renovação"];
export function Roulette() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("Aguardando sorteio");
  const [spinning, setSpinning] = useState(false);
  const timer = useRef();
  const reduced = useReducedMotion();
  useEffect(() => () => clearTimeout(timer.current), []);
  function spin() {
    if (spinning) return;
    const index = Math.floor(Math.random() * outcomes.length);
    if (reduced) {
      setResult(`${index + 1} · ${outcomes[index]}`);
      return;
    }
    setSpinning(true);
    setResult("Sorteando…");
    const target = (360 - (index * 90 + 45)) % 360;
    setRotation(
      (previous) => previous + 720 + ((target - (previous % 360) + 360) % 360),
    );
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--duration-wheel")
      .trim();
    const duration = parseFloat(raw) * (raw.endsWith("ms") ? 1 : 1000);
    timer.current = setTimeout(() => {
      setResult(`${index + 1} · ${outcomes[index]}`);
      setSpinning(false);
    }, duration);
  }
  return (
    <Frame className="roulette-card">
      <span className="eyebrow">Círculo de sorteio</span>
      <div className="roulette-stage">
        <span className="roulette-pointer" aria-hidden="true">
          ▼
        </span>
        <div
          className="roulette-rotor"
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-hidden="true"
        >
          <MagicCircle />
          <svg
            className="roulette-numbers"
            viewBox="0 0 300 300"
            fill="none"
            stroke="currentColor"
          >
            {[
              [215, 85],
              [215, 215],
              [85, 215],
              [85, 85],
            ].map(([x, y], index) => (
              <g key={index}>
                <circle cx={x} cy={y} r="20" />
                <text x={x} y={y + 6}>
                  {index + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
      <ol className="roulette-legend">
        {outcomes.map((outcome) => (
          <li key={outcome}>{outcome}</li>
        ))}
      </ol>
      <Button model="plaque" onClick={spin} disabled={spinning}>
        Girar roleta
      </Button>
      <output
        className="game-result"
        data-testid="roulette-result"
        aria-live="polite"
      >
        {result}
      </output>
      <p className="help">
        Use Enter ou Espaço no botão. Movimento reduzido entrega o resultado sem
        girar.
      </p>
    </Frame>
  );
}

export function Dice() {
  const [value, setValue] = useState(null);
  const [sides, setSides] = useState(20);
  return (
    <Frame className="dice-card">
      <span className="eyebrow">Rolagem de dado</span>
      <div className="dice-emblem" aria-hidden="true">
        <svg viewBox="0 0 160 160" fill="none" stroke="currentColor">
          {sides === 20 ? (
            <path d="m80 8 62 36v72l-62 36-62-36V44zM80 8 45 62l35 42 35-42zM18 44l27 18-27 54M142 44l-27 18 27 54M18 116l62-12 62 12M45 62l-27-18M115 62l27-18M80 104v48" />
          ) : (
            <>
              <rect x="24" y="24" width="112" height="112" rx="6" />
              <path d="M31 31h98v98H31z" />
            </>
          )}
        </svg>
        <span>{value ?? sides}</span>
      </div>
      <div className="field dice-select">
        <label htmlFor="dice-sides">Tipo de dado</label>
        <select
          id="dice-sides"
          value={sides}
          onChange={(e) => {
            setSides(Number(e.target.value));
            setValue(null);
          }}
        >
          <option value="20">d20</option>
          <option value="6">d6</option>
        </select>
      </div>
      <Button
        model="cut"
        onClick={() => setValue(1 + Math.floor(Math.random() * sides))}
      >
        Rolar dado
      </Button>
      <output
        className="game-result"
        data-testid="dice-result"
        aria-live="polite"
      >
        {value ? `Resultado: ${value} de ${sides}` : "Pronto para rolar"}
      </output>
      <p className="help">
        A leitura do resultado tem prioridade; o dado não usa giro decorativo.
      </p>
    </Frame>
  );
}
