import React, { useState } from "react";
import "../styles/header.css";
import axios from "axios";

interface User {
  id: number;
  username: string;
  balance: number;
  email: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface HeaderProps {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  setUserId: React.Dispatch<React.SetStateAction<number>>;
  scrollToGames: () => void;
  scrollToHero: () => void;
  onLogout: () => void;
  onMyAccount: () => void; 
}

const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  setIsLoggedIn,
  setUsername,
  setBalance,
  setUserId,
  scrollToGames,
  scrollToHero,
  onLogout,
  onMyAccount,
}) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [errorFields, setErrorFields] = useState<{[key: string]: boolean}>({});

  // 🔹 Validación simple de inputs vacíos
  const validateInputs = (fields: {[key: string]: string}) => {
    const errors: {[key: string]: boolean} = {};
    Object.keys(fields).forEach(key => {
      errors[key] = !fields[key].trim();
    });
    setErrorFields(errors);
    return !Object.values(errors).some(Boolean);
  };

  // 🔹 Registro con inicio automático de sesión
  const handleRegister = async () => {
    if (!validateInputs({ username: usernameInput, email: emailInput, password: passwordInput })) return;

    try {
      const response = await axios.post<AuthResponse>(
        "http://localhost:5000/api/auth/register",
        { username: usernameInput, email: emailInput, password: passwordInput }
      );

      const { user, token } = response.data;

      // Actualizar estado global y localStorage
      setUsername(user.username);
      setBalance(user.balance); // 100 inicial
      setUserId(user.id);
      setIsLoggedIn(true);

      localStorage.setItem("token", token);
      localStorage.setItem("balance", String(user.balance));
      localStorage.setItem("userId", String(user.id));
      localStorage.setItem("username", user.username);

      setShowRegister(false);
      setUsernameInput("");
      setEmailInput("");
      setPasswordInput("");
      setErrorFields({});

      alert(`¡Registro exitoso! Se te ha asignado ${user.balance}$ de saldo inicial.`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || "Error al registrarse");
      } else {
        alert("Error inesperado al registrarse");
      }
    }
  };

  // 🔹 Login
  const handleLogin = async () => {
    if (!validateInputs({ email: emailInput, password: passwordInput })) return;

    try {
      const response = await axios.post<AuthResponse>(
        "http://localhost:5000/api/auth/login",
        { email: emailInput, password: passwordInput }
      );

      const { user, token } = response.data;

      setUsername(user.username);
      setBalance(user.balance);
      setUserId(user.id);
      setIsLoggedIn(true);

      localStorage.setItem("token", token);
      localStorage.setItem("balance", String(user.balance));
      localStorage.setItem("userId", String(user.id));
      localStorage.setItem("username", user.username);

      setShowLogin(false);
      setEmailInput("");
      setPasswordInput("");
      setErrorFields({});
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || "Error al iniciar sesión");
      } else {
        alert("Error inesperado al iniciar sesión");
      }
    }
  };

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("balance");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    onLogout();
  };

  return (
    <header className="header">
      <h1 
        className="logo" 
        onClick={scrollToHero} 
        style={{ cursor: "pointer" }}
        >CASINO</h1>


      <nav className="nav">
        <a href="#" onClick={(e) => { e.preventDefault(); scrollToHero(); }}>Inicio</a>
        <a href="#" onClick={(e) => { e.preventDefault(); scrollToGames(); }}>Juegos</a>
        {isLoggedIn && (
          <a href="#" onClick={(e) => { e.preventDefault(); onMyAccount(); }}>Mi Cuenta</a>
        )}
      </nav>


      <div className="auth-buttons">
        {!isLoggedIn ? (
          <>
            <button className="register-btn" onClick={() => setShowRegister(true)}>Registrarse</button>
            <button className="login-btn" onClick={() => setShowLogin(true)}>Iniciar Sesión</button>
          </>
        ) : (
          <div className="user-info">
            
            <button className="logout-btn" onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO */}
      {showRegister && (
        <div className="modal" onClick={() => setShowRegister(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Registrarse</h2>
            <input
              type="text"
              placeholder="Usuario"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={{ borderColor: errorFields.username ? 'red' : undefined }}
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{ borderColor: errorFields.email ? 'red' : undefined }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ borderColor: errorFields.password ? 'red' : undefined }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="modal-btn" onClick={handleRegister}>Registrarse</button>
              <button className="close-btn" onClick={() => setShowRegister(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LOGIN */}
      {showLogin && (
        <div className="modal" onClick={() => setShowLogin(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Iniciar Sesión</h2>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{ borderColor: errorFields.email ? 'red' : undefined }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ borderColor: errorFields.password ? 'red' : undefined }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="modal-btn" onClick={handleLogin}>Iniciar Sesión</button>
              <button className="close-btn" onClick={() => setShowLogin(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
