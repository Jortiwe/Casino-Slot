import React, { useState, useRef } from "react";
import Header from "./components/Header";
import GameCard from "./components/GameCard";
import Footer from "./components/Footer";
import { SlotMachine } from "./components/Juego-1/SlotMachine";
import Ruleta from "./components/Juego-2/Ruleta";
import Blackjack from "./components/Juego-3/Blackjack";
import "./App.css";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("Usuario");
  const [balance, setBalance] = useState<number>(Number(localStorage.getItem("balance")) || 0);
  const [userId, setUserId] = useState<number>(Number(localStorage.getItem("userId")) || 0);
  const [activeGame, setActiveGame] = useState<null | "slot" | "ruleta" | "blackjack" | "other">(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);

  const scrollToHero = () => heroRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToGames = () => gamesRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSelectGame = (game: "slot" | "ruleta" | "blackjack" | "other") => {
    if (!isLoggedIn) { 
      alert("Debe iniciar sesión para jugar"); 
      return; 
    }
    setActiveGame(game);
  };

  const handleBackToGames = () => {
    setActiveGame(null);
    scrollToGames();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveGame(null);
    setUsername("");
    setBalance(0);
    setUserId(0);

    localStorage.removeItem("token");
    localStorage.removeItem("balance");
    localStorage.removeItem("userId");
  };

  // Renderizado del juego seleccionado
  const renderActiveGame = () => {
    if (!activeGame) return null;

    let GameComponent: JSX.Element | null = null;

    switch (activeGame) {
      case "slot":
        GameComponent = <SlotMachine balance={balance} setBalance={setBalance} userId={userId} />;
        break;
      case "ruleta":
        GameComponent = <Ruleta />;
        break;
      case "blackjack":
        GameComponent = <Blackjack />;
        break;
      case "other":
        GameComponent = <p>Juego en desarrollo...</p>;
        break;
      default:
        GameComponent = null;
    }

    return (
      <div className="game-wrapper">
        <button className="back-btn" onClick={handleBackToGames}>← Volver a juegos</button>
        {GameComponent}
      </div>
    );
  };

  return (
    <div className="app-container">
      <Header
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        setUsername={setUsername}
        setBalance={setBalance}
        setUserId={setUserId}
        scrollToGames={scrollToGames}
        scrollToHero={scrollToHero}
        onLogout={handleLogout}
      />

      {!activeGame && (
        <section className="hero" ref={heroRef}>
          {!isLoggedIn ? (
            <h1 className="hero-title">
              Bienvenido al <span className="highlight">Casino Prototipo</span>
            </h1>
          ) : (
            <>
              <h1 className="hero-title">
                Bienvenido, <span className="highlight">{username}</span>
              </h1>
              <button className="main-btn" onClick={scrollToGames}>JUGAR AHORA</button>
            </>
          )}
        </section>
      )}

      <section className="games" ref={gamesRef}>
        {!isLoggedIn ? (
          <p className="login-warning">Inicie sesión para acceder a los juegos</p>
        ) : activeGame ? (
          renderActiveGame()
        ) : (
          <div className="game-cards-container">
            <GameCard title="Tragamonedas" icon="🎰" onClick={() => handleSelectGame("slot")} />
            <GameCard title="Ruleta" icon="🎡" onClick={() => handleSelectGame("ruleta")} />
            <GameCard title="Blackjack" icon="🃏" onClick={() => handleSelectGame("blackjack")} />
            <GameCard title="Próximo juego" icon="❓" onClick={() => handleSelectGame("other")} />
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default App;
