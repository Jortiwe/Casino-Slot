import React from "react";
import "../styles/gamecard.css";

// ESTE "INTERFACE" DEFINE LA FORMA DE LOS DATOS (PROPS) QUE RECIBE EL COMPONENTE
interface GameCardProps {
  title: string;       // EL TÍTULO DEL JUEGO (TEXTO)
  icon: string;        // EL ICONO DEL JUEGO (PUEDE SER UN EMOJI O TEXTO)
  onClick?: () => void; // FUNCIÓN OPCIONAL QUE SE EJECUTA CUANDO SE HACE CLICK
}

// ESTE CONST DEFINE EL COMPONENTE FUNCIONAL "GAMECARD" QUE RECIBE PROPS SEGÚN EL INTERFACE
const GameCard: React.FC<GameCardProps> = ({ title, icon, onClick }) => {
  return (
    <div className="game-card" onClick={onClick}>
      <span className="game-icon">{icon}</span>
      <h2>{title}</h2>
      <button>Jugar</button>
    </div>
  );
};

// ESTO EXPORTA EL COMPONENTE PARA USARLO EN OTROS ARCHIVOS
export default GameCard;
