import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./SlotMachine.css";

const SYMBOLS = ["🍒", "🍋", "🍇", "⭐", "🔔", "💎"] as const;
const ROW_H = 80; // alto de cada símbolo (px)
const REELS = 3;

// Parámetros de animación
const BASE_SPIN_TIME = 3000;
const STAGGER = 2000;
const LINEAR_TOTAL = 8000;
const FINISH_TIME = 1000;

// Distancias (en filas)
const SPIN_CYCLES_LONG = 20;
const STOP_CYCLES_SAFE = 24;

// Renderizamos suficientes símbolos
const REPEAT_SETS = 30;

interface SlotMachineProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  userId: number;
}

export const SlotMachine: React.FC<SlotMachineProps> = ({
  balance,
  setBalance,
  userId,
}) => {
  const [bet, setBet] = useState(1);
  const [message, setMessage] = useState("");
  const [spinning, setSpinning] = useState(false);

  const [offsets, setOffsets] = useState<number[]>(Array(REELS).fill(0));
  const [transitions, setTransitions] = useState<string[]>(
    Array(REELS).fill("none")
  );

  const timeoutsRef = useRef<number[]>([]);

  // Limpieza de timeouts al desmontar
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, []);

  const clearTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const setTransitionAt = (i: number, value: string) => {
    setTransitions((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const setOffsetAt = (i: number, value: number) => {
    setOffsets((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  // 🔹 Actualizar saldo en backend
  const updateBalanceDB = async (newBalance: number) => {
    try {
      await axios.put(`http://localhost:5000/users/${userId}/balance`, {
        balance: newBalance,
      });
    } catch (err) {
      console.error("Error actualizando saldo en DB:", err);
    }
  };

  const spin = () => {
    if (spinning) {
      setMessage("Espera a que termine el giro");
      return;
    }
    if (bet < 1) {
      setMessage("Apuesta mínima $1");
      return;
    }
    if (bet > 50) {
      setMessage("Apuesta máxima $50");
      return;
    }
    if (balance < bet) {
      setMessage("¡Saldo insuficiente!");
      return;
    }

    // Cobro inmediato de la apuesta
    const newBalance = balance - bet;
    setBalance(newBalance);
    updateBalanceDB(newBalance);

    setMessage("");
    setSpinning(true);

    // Resultado aleatorio
    const result = Array.from({ length: REELS }, () => {
      const idx = Math.floor(Math.random() * SYMBOLS.length);
      return SYMBOLS[idx];
    });

    // Reset de posición
    for (let i = 0; i < REELS; i++) {
      setTransitionAt(i, "none");
      setOffsetAt(i, 0);
    }

    // Giro largo lineal
    requestAnimationFrame(() => {
      for (let i = 0; i < REELS; i++) {
        setTransitionAt(i, `transform ${LINEAR_TOTAL}ms linear`);
        const longDistancePx = -ROW_H * SYMBOLS.length * SPIN_CYCLES_LONG;
        setOffsetAt(i, longDistancePx);
      }
    });

    // Paradas escalonadas
    const stopTimes = Array.from(
      { length: REELS },
      (_, i) => BASE_SPIN_TIME + i * STAGGER
    );

    stopTimes.forEach((t, i) => {
      const tm = window.setTimeout(() => {
        setTransitionAt(i, `transform ${FINISH_TIME}ms cubic-bezier(0.2,0.8,0.2,1)`);
        const finalIndex = SYMBOLS.indexOf(result[i]);
        const finalDistancePx =
          -ROW_H * (SYMBOLS.length * STOP_CYCLES_SAFE + finalIndex);
        setOffsetAt(i, finalDistancePx);
      }, t);
      timeoutsRef.current.push(tm);
    });

    // Cuando ya paró todo, calcular ganancias
    const allDone = stopTimes[stopTimes.length - 1] + FINISH_TIME + 100;
    const finalTm = window.setTimeout(() => {
      const counts: Record<string, number> = {};
      result.forEach((s) => (counts[s] = (counts[s] || 0) + 1));

      let win = 0;
      const values = Object.values(counts);
      if (values.includes(3)) win = bet * 10;
      else if (values.includes(2)) win = bet * 3;

      if (win > 0) {
        const updated = balance - bet + win;
        setBalance(updated);
        updateBalanceDB(updated);
        setMessage(`¡Ganaste ${win}$ apostando ${bet}$!`);
      } else {
        setMessage(`Perdiste ${bet}$`);
      }

      // Compactar offset
      result.forEach((sym, i) => {
        const idx = SYMBOLS.indexOf(sym);
        setTransitionAt(i, "none");
        setOffsetAt(i, -ROW_H * idx);
      });

      setSpinning(false);
      clearTimers();
    }, allDone);
    timeoutsRef.current.push(finalTm);
  };

  return (
    <div className="slot-machine-container">
      <h2>Saldo: ${balance}</h2>

      <div className="bet-section">
        <label>Apuesta:</label>
        <input
          type="range"
          min={1}
          max={Math.min(50, balance)}
          value={bet}
          onChange={(e) => setBet(Number(e.target.value))}
          disabled={spinning}
        />
        <span className="bet-value">{bet}$</span>
      </div>

      <div className="reels">
        {Array.from({ length: REELS }).map((_, i) => (
          <div key={i} className="reel">
            <div
              className="symbols"
              style={{
                transform: `translateY(${offsets[i]}px)`,
                transition: transitions[i],
              }}
            >
              {Array.from({ length: REPEAT_SETS })
                .flatMap(() => SYMBOLS)
                .map((s, idx) => (
                  <span key={idx}>{s}</span>
                ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="spin-button"
        onClick={spin}
        disabled={spinning || balance < 1}
      >
        {spinning ? "Girando..." : `Girar ($${bet})`}
      </button>

      <div className="message-area">
        <p>{message}</p>
      </div>
    </div>
  );
};
