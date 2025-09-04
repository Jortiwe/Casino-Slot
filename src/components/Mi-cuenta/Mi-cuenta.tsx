import React, { useState, useEffect } from "react";
import "./Mi-Cuenta.css";

interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  profile_pic?: string;
}

interface MiCuentaProps {
  user: User;
  setUser: (user: User) => void;
}

const MiCuenta: React.FC<MiCuentaProps> = ({ user, setUser }) => {
  const [newPassword, setNewPassword] = useState("");
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [profilePic, setProfilePic] = useState("");

  // 🔹 Mantener profilePic actualizado si cambia user desde afuera
  useEffect(() => {
    setProfilePic(user.profile_pic ? `http://localhost:5000${user.profile_pic}` : "/default-profile.png");
  }, [user.profile_pic]);

  // 🔹 Cambiar contraseña
  const handlePasswordChange = async () => {
    if (!newPassword) return alert("Ingresa una nueva contraseña");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Contraseña actualizada correctamente ✅");
        setNewPassword("");
      } else {
        alert(data.error || "Error al actualizar contraseña");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  };

  // 🔹 Pedir préstamo
  const handleLoan = async () => {
    if (loanAmount <= 0) return alert("Ingresa un monto válido");

    const newBalance = Number(user.balance) + loanAmount;

    try {
      const res = await fetch("http://localhost:5000/api/auth/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newBalance }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data); // actualiza usuario global
        setLoanAmount(0);
        alert("Préstamo acreditado ✅");
      } else {
        alert(data.error || "Error al pedir préstamo");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  };

  // 🔹 Subir foto de perfil
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);
    formData.append("userId", String(user.id));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/upload-profile-pic", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "", // agrega token si existe
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        // Construye URL completa si el backend devuelve ruta relativa
        const fullUrl = `http://localhost:5000${data.profile_pic}`;
          setProfilePic(fullUrl);


        setProfilePic(fullUrl); // actualiza la imagen en pantalla
        setUser({
          ...user,
          profile_pic: fullUrl,
          username: data.username,
          balance: data.balance,
        });

        // Actualiza localStorage para mantener sesión tras refresco
        localStorage.setItem("username", data.username);
        localStorage.setItem("balance", String(data.balance));
        localStorage.setItem("userId", String(data.id));

        alert("Foto de perfil actualizada ✅");
      } else {
        alert(data.error || "Error al subir foto");
      }
    } catch (err) {
      console.error("Error al subir imagen:", err);
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <div className="mi-cuenta">
      <h2>👤 Mi Cuenta</h2>

      <div className="profile-section">
        {profilePic && !profilePic.includes("default-profile.png") ? (
          <img src={profilePic} alt="Perfil" className="profile-pic" />
        ) : (
          <div className="empty-profile"></div>
        )}

        {/* Input oculto */}
        <input 
          type="file" 
          accept="image/*" 
          id="fileInput" 
          onChange={handleImageUpload} 
          style={{ display: "none" }}
        />

  {/* Botón estilizado */}
  <label htmlFor="fileInput" className="upload-btn">
    📸 Subir foto
  </label>
</div>


      <div className="info">
        <p><strong>Usuario:</strong> {user.username}</p>
        <p><strong>Correo:</strong> {user.email}</p>
        <p><strong>Saldo:</strong> ${user.balance}</p>
      </div>

      <div className="change-password">
        <h3>🔑 Cambiar contraseña</h3>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handlePasswordChange}>Actualizar</button>
      </div>

      <div className="loan-section">
        <h3>💰 Pedir préstamo</h3>
        <input
          type="number"
          placeholder="Monto"
          value={loanAmount}
          onChange={(e) => setLoanAmount(Number(e.target.value))}
        />
        <button onClick={handleLoan}>Solicitar</button>
      </div>
    </div>
  );
};

export default MiCuenta;
