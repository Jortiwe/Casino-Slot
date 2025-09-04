import React, { useState } from "react";
import "./Mi-Cuenta.css";

interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  profilePic?: string;
}

interface MiCuentaProps {
  user: User;
  setUser: (user: User) => void;
}

const MiCuenta: React.FC<MiCuentaProps> = ({ user, setUser }) => {
  const [newPassword, setNewPassword] = useState("");
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [profilePic, setProfilePic] = useState(user.profilePic || "");

  // 🔹 Cambiar contraseña (requiere endpoint en backend)
  const handlePasswordChange = async () => {
    if (!newPassword) return alert("Ingresa una nueva contraseña");

    try {
      const res = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      console.error("Error:", err);
      alert("Error de conexión con el servidor");
    }
  };

  // 🔹 Pedir préstamo
  const handleLoan = async () => {
    if (loanAmount <= 0) return alert("Ingresa un monto válido");

    const newBalance = user.balance + loanAmount;

    try {
      const res = await fetch("http://localhost:5000/api/auth/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newBalance }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setLoanAmount(0);
        alert("Préstamo acreditado ✅");
      } else {
        alert(data.error || "Error al pedir préstamo");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error de conexión con el servidor");
    }
  };

  // 🔹 Subir foto (solo local, falta guardar en backend)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mi-cuenta">
      <h2>👤 Mi Cuenta</h2>

      <div className="profile-section">
        <img
          src={profilePic || "/default-avatar.png"}
          alt="Perfil"
          className="profile-pic"
        />
        <input type="file" accept="image/*" onChange={handleImageUpload} />
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
