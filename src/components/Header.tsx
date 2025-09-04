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

  // Errores en tiempo real
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState("");

  // Regex para validar
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/;

  // 🔹 Validación en tiempo real
  const validateRealtime = (field: string, value: string) => {
    let message = "";

    if (field === "username") {
      if (!value.trim()) message = "El usuario es obligatorio";
      else if (value.length > 50) message = "Máx. 50 caracteres";
    }

    if (field === "email") {
      if (!value.trim()) message = "El correo es obligatorio";
      else if (!emailRegex.test(value)) message = "Correo inválido (ej: usuario@mail.com)";
    }

    if (field === "password") {
      if (!value.trim()) message = "La contraseña es obligatoria";
      else if (!passwordRegex.test(value)) {
        message = "Debe tener mínimo 8 caracteres, 1 mayúscula, 1 número";
      }
    }

    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  // 🔹 Registro
  const handleRegister = async () => {
    if (Object.values(errors).some((msg) => msg)) return;

    try {
      const response = await axios.post<AuthResponse>(
        "http://localhost:5000/api/auth/register",
        { username: usernameInput, email: emailInput, password: passwordInput }
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

      setShowRegister(false);
      setUsernameInput("");
      setEmailInput("");
      setPasswordInput("");
      setErrors({});
      setServerError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setServerError(err.response?.data?.error || "Error al registrarse");
      }
    }
  };

  // 🔹 Login
  const handleLogin = async () => {
    if (Object.values(errors).some((msg) => msg)) return;

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
      setErrors({});
      setServerError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setServerError(err.response?.data?.error || "Error al iniciar sesión");
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
      <h1 className="logo" onClick={scrollToHero} style={{ cursor: "pointer" }}>
        CASINO
      </h1>

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
              placeholder="Ej: Usuario123"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                validateRealtime("username", e.target.value);
              }}
              style={{ borderColor: errors.username ? "red" : undefined }}
            />
            {errors.username && <p className="error-text">{errors.username}</p>}

            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                validateRealtime("email", e.target.value);
              }}
              style={{ borderColor: errors.email ? "red" : undefined }}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}

            <input
              type="password"
              placeholder="Min. 8 caracteres, 1 mayúscula, 1 número"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                validateRealtime("password", e.target.value);
              }}
              style={{ borderColor: errors.password ? "red" : undefined }}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}

            {serverError && <p className="error-text">{serverError}</p>}

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
              placeholder="ejemplo@correo.com"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                validateRealtime("email", e.target.value);
              }}
              style={{ borderColor: errors.email ? "red" : undefined }}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}

            <input
              type="password"
              placeholder="Tu contraseña"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                validateRealtime("password", e.target.value);
              }}
              style={{ borderColor: errors.password ? "red" : undefined }}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}

            {serverError && <p className="error-text">{serverError}</p>}

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
