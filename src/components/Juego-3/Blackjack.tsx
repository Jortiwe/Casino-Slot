import { useState, useEffect } from "react";
import axios from "axios";
import "./Blackjack.css";

type Card = {
  suit: string;
  value: string;
  isFaceUp?: boolean;
};

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createDeck(): Card[] {
  return suits.flatMap(suit =>
    values.map(value => ({ suit, value, isFaceUp: false }))
  ).sort(() => Math.random() - 0.5);
}

function getCardValue(card: Card): number {
  if (["J", "Q", "K"].includes(card.value)) return 10;
  if (card.value === "A") return 11;
  return parseInt(card.value);
}

export default function Blackjack({
  balance,
  setBalance,
  userId
}: {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  userId: number;
}) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [bet, setBet] = useState(50);
  const [message, setMessage] = useState("");
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 🔹 Traer saldo inicial desde la DB
  useEffect(() => {
    const fetchBalance = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`http://localhost:5000/users/${userId}`);
        setBalance(res.data.balance);
      } catch (err) {
        console.error("Error trayendo saldo:", err);
      }
    };
    fetchBalance();
  }, [userId, setBalance]);

  // 🔹 Actualizar saldo en backend
  const actualizarSaldoBD = async (nuevoSaldo: number) => {
    if (!userId) return;
    try {
      await axios.put(`http://localhost:5000/users/${userId}/balance`, { balance: nuevoSaldo });
      setBalance(nuevoSaldo);
    } catch (err) {
      console.error("Error actualizando saldo:", err);
    }
  };

  const getHandValue = (hand: Card[]): number => {
    let value = hand.reduce((acc, c) => acc + getCardValue(c), 0);
    let aces = hand.filter(c => c.value === "A").length;
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  };

  const dealCard = async (card: Card, target: "player" | "dealer", hideDealerSecond = true) => {
    const setHand = target === "player" ? setPlayerHand : setDealerHand;

    setHand(prev => [...prev, { ...card, isFaceUp: false }]);
    await new Promise(res => setTimeout(res, 300));

    setHand(prev =>
      prev.map((c, i) => {
        if (i === prev.length - 1) {
          if (target === "dealer" && hideDealerSecond && i === 1) return { ...c, isFaceUp: false };
          return { ...c, isFaceUp: true };
        }
        return c;
      })
    );

    await new Promise(res => setTimeout(res, 300));
  };

  // Iniciar nueva ronda
  const startGame = async () => {
    if (isAnimating || isRoundActive) return;
    if (bet > balance) {
      alert("No tienes suficiente saldo para esta apuesta");
      return;
    }

    setIsAnimating(true);
    setIsRoundActive(false);
    setMessage("");
    setPlayerHand([]);
    setDealerHand([]);

    // ⚡ Descontar apuesta de inmediato
    const saldoPostApuesta = balance - bet;
    setBalance(saldoPostApuesta);
    await actualizarSaldoBD(saldoPostApuesta);

    const newDeck = createDeck();
    setDeck(newDeck);

    await dealCard(newDeck[0], "player");
    await dealCard(newDeck[1], "player");
    await dealCard(newDeck[2], "dealer");
    await dealCard(newDeck[3], "dealer", true);

    setIsRoundActive(true);
    setIsAnimating(false);
    setMessage("Tu turno...");
  };

  const hit = async () => {
    if (!isRoundActive || isAnimating || deck.length === 0) return;
    setIsAnimating(true);

    const [card, ...rest] = deck;
    setDeck(rest);
    await dealCard(card, "player");

    const newPlayerHand = [...playerHand, { ...card, isFaceUp: true }];
    if (getHandValue(newPlayerHand) > 21) {
      await stand();
    }

    setIsAnimating(false);
  };

  const stand = async () => {
    if (!isRoundActive || isAnimating) return;
    setIsAnimating(true);

    let dealer = dealerHand.map((c, i) =>
      i === 1 ? { ...c, isFaceUp: true } : c
    );
    setDealerHand([...dealer]);

    let restDeck = [...deck];

    while (getHandValue(dealer) < 17 && restDeck.length > 0) {
      const [card, ...rest] = restDeck;

      dealer.push({ ...card, isFaceUp: false });
      setDealerHand([...dealer]);
      await new Promise(r => setTimeout(r, 300));

      dealer = dealer.map((c, i) =>
        i === dealer.length - 1 ? { ...c, isFaceUp: true } : c
      );
      setDealerHand([...dealer]);
      restDeck = rest;
      setDeck(restDeck);
      await new Promise(r => setTimeout(r, 300));
    }

    // 🔹 Pasar saldo actual descontando la apuesta
    checkWinner(dealer, balance);
    setIsRoundActive(false);
    setIsAnimating(false);
  };

  // Determinar ganador
  const checkWinner = (dealer: Card[], saldoActual: number) => {
    const playerScore = getHandValue(playerHand);
    const dealerScore = getHandValue(dealer);

    let saldoFinal = saldoActual;

    if (playerScore > 21) {
      setMessage("Te pasaste. Pierdes 😢");
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      saldoFinal += bet * 2; 
      setMessage("¡Ganaste! 🎉");
    } else if (dealerScore === playerScore) {
      saldoFinal += bet; 
      setMessage("Empate 🤝");
    } else {
      setMessage("La banca gana 💀");
    }

    setBalance(saldoFinal);
    actualizarSaldoBD(saldoFinal);
  };

  return (
    <div className="blackjack-container">
      <h1 className="title">🃏 BLACKJACK 🃏</h1>

      <div className="hand-container">
        <h2>Cartas de la Banca</h2>
        <div className="hand">
          {dealerHand.map((c, i) => (
            <div key={i} className={`card ${c.isFaceUp ? "face-up" : "face-down"}`}>
              <span className="card-content">{c.isFaceUp ? `${c.value}${c.suit}` : "❓"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hand-container">
        <h2>Tus Cartas</h2>
        <div className="hand">
          {playerHand.map((c, i) => (
            <div key={i} className={`card ${c.isFaceUp ? "face-up" : "face-down"}`}>
              <span className="card-content">{c.isFaceUp ? `${c.value}${c.suit}` : "❓"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <p className="balance">💰 Saldo: ${balance}</p>
        <label htmlFor="bet">🎲 Apuesta: ${bet}</label>
        <input
          id="bet"
          type="range"
          min={1}
          max={balance}
          value={bet}
          onChange={(e) => setBet(parseInt(e.target.value))}
          disabled={isRoundActive}
        />

        <div className="buttons">
          <button onClick={startGame} disabled={isRoundActive}>Nueva Ronda</button>
          <button onClick={hit} disabled={!isRoundActive}>Pedir</button>
          <button onClick={stand} disabled={!isRoundActive}>Plantarse</button>
        </div>

        <p className="message">{message}</p>
      </div>
    </div>
  );
}
