import React from "react";
import "../styles/SaldoModal.css";

interface SaldoModalProps {
  email: string;
  onLogout: () => void;
  saldo: number;
}

const SaldoModal: React.FC<SaldoModalProps> = ({ email, onLogout, saldo }) => {
  if (saldo > 0) return null; // solo mostrar si saldo es 0

  return (
    <div className="saldo-modal-backdrop">
      <div className="saldo-modal">
        <h1>⚠️ Atención</h1>
        <p>Por favor pague su saldo prestado para poder ingresar a su sesión.</p>
        <p>Se enviará un correo a: <strong>{email}</strong></p>
        <button className="btn-logout" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default SaldoModal;
