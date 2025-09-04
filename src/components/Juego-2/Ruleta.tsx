import { useState, useEffect } from "react";
import axios from "axios";
import "./Ruleta.css";
import ruletaImg from "./roulette_2.png";
import tablaImg from "./Board.png";

// ===============================
// Datos de la tabla
// ===============================
const W = 1623;
const H = 679;
const X = [143, 259, 372, 485, 598, 711, 824, 936, 1049, 1162, 1275, 1388, 1500];
const X_LEFT = 7;
const X_RIGHT = 1615;
const Y_TOP = 7;
const Y_ROW1 = 152;
const Y_ROW2 = 290;
const Y_ROW3 = 431;
const Y_DOZENS_TOP = 431;
const Y_DOZENS_BOT = 539;
const Y_BOTTOM_TOP = 539;
const Y_BOTTOM_BOT = 672;
const X_BOTTOM = [143, 372, 598, 826, 1049, 1275, 1500];

const pxX = (px: number) => (px / W) * 100;
const pxY = (px: number) => (px / H) * 100;

// Filas y columnas
const TOP_ROW = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
const MID_ROW = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
const BOTTOM_ROW = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];

type Area = { id: string; left: number; top: number; width: number; height: number };
function buildAreas(): Area[] {
  const areas: Area[] = [];

  // 0
  areas.push({
    id: "0",
    left: pxX(X_LEFT),
    top: pxY(Y_TOP),
    width: pxX(X[0] - X_LEFT),
    height: pxY(Y_ROW3 - Y_TOP),
  });

  // 1–36
  const rows = [
    { ids: TOP_ROW, y1: Y_TOP, y2: Y_ROW1 },
    { ids: MID_ROW, y1: Y_ROW1, y2: Y_ROW2 },
    { ids: BOTTOM_ROW, y1: Y_ROW2, y2: Y_ROW3 },
  ];
  rows.forEach((row) => {
    row.ids.forEach((num, i) => {
      areas.push({
        id: String(num),
        left: pxX(X[i]),
        top: pxY(row.y1),
        width: pxX(X[i + 1] - X[i]),
        height: pxY(row.y2 - row.y1),
      });
    });
  });

  // Columnas 2:1
  [
    { id: "2:1_top", y1: Y_TOP, y2: Y_ROW1 },
    { id: "2:1_mid", y1: Y_ROW1, y2: Y_ROW2 },
    { id: "2:1_bot", y1: Y_ROW2, y2: Y_ROW3 },
  ].forEach((c) => {
    areas.push({
      id: c.id,
      left: pxX(X[X.length - 1]),
      top: pxY(c.y1),
      width: pxX(X_RIGHT - X[X.length - 1]),
      height: pxY(c.y2 - c.y1),
    });
  });

  // Docenas
  const dozenCuts = [X[0], X[4], X[8], X[12]];
  [
    { id: "1st12", x1: dozenCuts[0], x2: dozenCuts[1] },
    { id: "2nd12", x1: dozenCuts[1], x2: dozenCuts[2] },
    { id: "3rd12", x1: dozenCuts[2], x2: dozenCuts[3] },
  ].forEach((d) => {
    areas.push({
      id: d.id,
      left: pxX(d.x1),
      top: pxY(Y_DOZENS_TOP),
      width: pxX(d.x2 - d.x1),
      height: pxY(Y_DOZENS_BOT - Y_DOZENS_TOP),
    });
  });

  // Fila inferior
  const bottomIds = ["1to18", "EVEN", "RED", "BLACK", "ODD", "19to36"];
  for (let i = 0; i < bottomIds.length; i++) {
    areas.push({
      id: bottomIds[i],
      left: pxX(X_BOTTOM[i]),
      top: pxY(Y_BOTTOM_TOP),
      width: pxX(X_BOTTOM[i + 1] - X_BOTTOM[i]),
      height: pxY(Y_BOTTOM_BOT - Y_BOTTOM_TOP),
    });
  }

  return areas;
}
const AREAS = buildAreas();

// ===============================
// Ruleta
// ===============================
const ordenNumeros = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27,
  13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const ROJOS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function calcularPago(apuesta: string, numero: number, cantidad: number): number {
  if (!apuesta) return 0;

  if (apuesta === String(numero)) return cantidad * 35;
  if (apuesta === "1st12" && numero >= 1 && numero <= 12) return cantidad * 2;
  if (apuesta === "2nd12" && numero >= 13 && numero <= 24) return cantidad * 2;
  if (apuesta === "3rd12" && numero >= 25 && numero <= 36) return cantidad * 2;

  const col1 = [1,4,7,10,13,16,19,22,25,28,31,34];
  const col2 = [2,5,8,11,14,17,20,23,26,29,32,35];
  const col3 = [3,6,9,12,15,18,21,24,27,30,33,36];
  if (apuesta === "2:1_bot" && col1.includes(numero)) return cantidad * 2;
  if (apuesta === "2:1_mid" && col2.includes(numero)) return cantidad * 2;
  if (apuesta === "2:1_top" && col3.includes(numero)) return cantidad * 2;

  if (apuesta === "EVEN" && numero !== 0 && numero % 2 === 0) return cantidad;
  if (apuesta === "ODD" && numero % 2 === 1) return cantidad;
  if (apuesta === "1to18" && numero >= 1 && numero <= 18) return cantidad;
  if (apuesta === "19to36" && numero >= 19 && numero <= 36) return cantidad;
  if (apuesta === "RED" && ROJOS.has(numero)) return cantidad;
  if (apuesta === "BLACK" && numero !== 0 && !ROJOS.has(numero)) return cantidad;

  return 0;
}

// ===============================
// Componente Ruleta
// ===============================
export default function JuegoRuleta({
  balance,
  setBalance,
  userId,
}: {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  userId: number;
}) {
  const [apuesta, setApuesta] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(0);
  const [rotacion, setRotacion] = useState(0);
  const [girando, setGirando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  // 🔹 Traer saldo inicial
  useEffect(() => {
    if (!userId) return;
    axios
      .get(`http://localhost:5000/users/${userId}`)
      .then((res) => setBalance(res.data.balance))
      .catch((err) => console.error("Error trayendo saldo:", err));
  }, [userId, setBalance]);

  // 🔹 Actualizar saldo en backend
  const actualizarSaldoBD = async (nuevoSaldo: number) => {
    if (!userId) return;
    try {
      await axios.put(`http://localhost:5000/users/${userId}/balance`, {
        balance: nuevoSaldo,
      });
      setBalance(nuevoSaldo);
    } catch (err) {
      console.error("Error actualizando saldo:", err);
    }
  };

  const girar = () => {
    if (!apuesta) return alert("Selecciona una apuesta primero");
    if (cantidad <= 0) return alert("Debes apostar una cantidad mayor a 0");
    if (cantidad > balance) return alert("No tienes suficiente saldo");

    // ⚡ Descontar apuesta de inmediato
    const saldoPostApuesta = balance - cantidad;
    setBalance(saldoPostApuesta);
    actualizarSaldoBD(saldoPostApuesta);
    setResultado(null);

    const numero = Math.floor(Math.random() * 37);
    const index = ordenNumeros.indexOf(numero);
    const gradosPorNumero = 360 / ordenNumeros.length;
    const vueltas = 5 * 360;
    const destino = vueltas + (360 - index * gradosPorNumero);

    setRotacion(0);
    setTimeout(() => {
      setGirando(true);
      setRotacion(destino);

      setTimeout(() => {
        setGirando(false);

        // 🔹 Calcular ganancia
        const ganancia = calcularPago(apuesta, numero, cantidad);
        let saldoFinal = saldoPostApuesta;
        if (ganancia > 0) {
          saldoFinal += ganancia + cantidad; // incluye apuesta inicial
          setResultado(`🎉 ¡Ganaste! Salió ${numero}, cobraste ${ganancia}`);
        } else {
          setResultado(`❌ Perdiste. Salió ${numero}`);
        }

        actualizarSaldoBD(saldoFinal);
      }, 8000);
    }, 50);
  };

  return (
  <div className="juego">
  <div className="columna-izquierda">
    <h1>🎡 Juego de Ruleta</h1>
    <p>Saldo: ${balance}</p>

    <div className="apuesta-input">
      <label>
        Apuesta: ${cantidad}
        <input
          type="range"
          min={1}
          max={balance}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="slider"
        />
      </label>
    </div>

    <div className="ruleta-wrapper">
      <div className="flecha">▼</div>
      <img
        src={ruletaImg}
        alt="Ruleta"
        className="rueda"
        style={{
          transform: `rotate(${rotacion}deg)`,
          transition: girando
            ? "transform 8s cubic-bezier(0.33,1,0.68,1)"
            : "none",
        }}
      />
    </div>

    <button className="btn-girar" onClick={girar} disabled={girando}>
      Girar
    </button>
  </div>

  <div className="columna-derecha">
    <div className="tabla-wrapper">
      <img src={tablaImg} alt="Tabla" className="tabla-img" />
      <div className="tabla-overlay">
        {AREAS.map((area) => (
          <div
            key={area.id}
            className={`area ${apuesta === area.id ? "selected" : ""}`}
            style={{
              left: `${area.left}%`,
              top: `${area.top}%`,
              width: `${area.width}%`,
              height: `${area.height}%`,
            }}
            onClick={() => setApuesta(area.id)}
          />
        ))}
      </div>

      {apuesta && <p className="resultado">Apuesta seleccionada: {apuesta}</p>}
      {resultado && <p className="resultado">{resultado}</p>}
    </div>
  </div>
</div>
  );
}

