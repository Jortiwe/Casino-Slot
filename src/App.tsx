import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "./components/Header";
import GameCard from "./components/GameCard";
import Footer from "./components/Footer";
import { SlotMachine } from "./components/Juego-1/SlotMachine";
import Ruleta from "./components/Juego-2/Ruleta";
import Blackjack from "./components/Juego-3/Blackjack";
import MiCuenta from "./components/Mi-cuenta/Mi-cuenta";
import SaldoModal from "./components/SaldoModal";

import "./App.css";

interface UserData {
  id: number;
  username: string;
  email: string;
  balance: number;
}

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("Usuario");
  const [email, setEmail] = useState<string>(localStorage.getItem("email") || "");
  const [balance, setBalance] = useState<number>(
    Number(localStorage.getItem("balance")) || 0
  );
  const [userId, setUserId] = useState<number>(
    Number(localStorage.getItem("userId")) || 0
  );
  const [activeGame, setActiveGame] = useState<null | "slot" | "ruleta" | "blackjack" | "other">(null);
  const [activePage, setActivePage] = useState<"home" | "games" | "account">("home");

  const heroRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);

  // 🔹 Restaurar sesión desde localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedBalance = localStorage.getItem("balance");
    const storedUserId = localStorage.getItem("userId");
    const storedPage = localStorage.getItem("activePage") as "home" | "games" | "account" | null;
    const storedGame = localStorage.getItem("activeGame") as "slot" | "ruleta" | "blackjack" | "other" | null;

    if (token && storedUsername && storedBalance && storedUserId) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      setBalance(Number(storedBalance));
      setUserId(Number(storedUserId));
      setEmail(localStorage.getItem("email") || "");
    }

    if (storedPage) setActivePage(storedPage);
    if (storedGame) setActiveGame(storedGame);
  }, []);

  // 🔹 Guardar página activa y juego
  useEffect(() => {
    localStorage.setItem("activePage", activePage);
  }, [activePage]);

  useEffect(() => {
    if (activeGame) {
      localStorage.setItem("activeGame", activeGame);
    } else {
      localStorage.removeItem("activeGame");
    }
  }, [activeGame]);

  // 🔹 Traer saldo actualizado desde servidor y sincronizar con estado y localStorage
  useEffect(() => {
    if (!userId) return;

    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get<UserData>(`http://localhost:5000/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const balanceFromServer = res.data.balance;
        const emailFromServer = res.data.email;

        // Actualizar estado
        setBalance(balanceFromServer);
        setEmail(emailFromServer);

        // Actualizar localStorage
        localStorage.setItem("balance", balanceFromServer.toString());
        localStorage.setItem("email", emailFromServer);
      } catch (err) {
        console.error("Error trayendo saldo:", err);
      }
    };

    fetchBalance();
  }, [userId]);

  const scrollToHero = () => {
    setActivePage("home");
    setActiveGame(null); // ❌ Cierra cualquier juego activo
  };
  
  const scrollToGames = () => setActivePage("games");

  const handleSelectGame = (game: "slot" | "ruleta" | "blackjack" | "other") => {
    if (!isLoggedIn) {
      alert("Debe iniciar sesión para jugar");
      return;
    }
    setActiveGame(game);
  };

  const handleBackToGames = () => {
    setActiveGame(null);
    setActivePage("games");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveGame(null);
    setUsername("");
    setBalance(0);     
    setUserId(0);
    setEmail("");       
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("balance");
    localStorage.removeItem("email");
    localStorage.removeItem("activePage");
    localStorage.removeItem("activeGame");
    setActivePage("home");
  };

  const renderActiveGame = () => {
    if (!activeGame) return null;

    let GameComponent: React.ReactNode = null;

    switch (activeGame) {
      case "slot":
        GameComponent = (
          <SlotMachine balance={balance} setBalance={setBalance} userId={userId} />
        );
        break;
      case "ruleta":
        GameComponent = (
          <Ruleta balance={balance} setBalance={setBalance} userId={userId} />
        );
        break;
      case "blackjack":
        GameComponent = (
          <Blackjack balance={balance} setBalance={setBalance} userId={userId} />
        );
        break;
      case "other":
        GameComponent = <p>Juego en desarrollo...</p>;
        break;
    }

    return (
      <div className="game-wrapper">
        <button className="back-btn" onClick={handleBackToGames}>
          ← Volver a juegos
        </button>
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
        setEmail={setEmail}  
        scrollToGames={scrollToGames}
        scrollToHero={scrollToHero}
        onLogout={handleLogout}
        onMyAccount={() => setActivePage("account")}
      />

      {/* 🔹 HOME */}
      {activePage === "home" && !activeGame && (
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
              <button className="main-btn" onClick={scrollToGames}>
                JUGAR AHORA
              </button>
            </>
          )}
        </section>
      )}

      {/* 🔹 GAMES */}
      {activePage === "games" && (
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
      )}

      {/* 🔹 MI CUENTA */}
      {activePage === "account" && isLoggedIn && (
        <section className="account">
          <MiCuenta
            user={{ id: userId, username, email, balance }}
            setUser={(updatedUser) => {
              setUsername(updatedUser.username);
              setBalance(updatedUser.balance);
              setEmail(updatedUser.email);
              localStorage.setItem("balance", updatedUser.balance.toString());
              localStorage.setItem("email", updatedUser.email);
            }}
          />
        </section>
      )}

      <Footer />

      {/* Modal saldo cero */}
      {isLoggedIn && !activeGame && balance === 0 && (
        <SaldoModal saldo={balance} email={email} onLogout={handleLogout} />
      )}

    </div>
  );
};

export default App;
