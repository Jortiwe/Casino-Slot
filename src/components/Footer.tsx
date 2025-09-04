import React from "react";
import "../styles/footer.css";

// ESTE CONST DEFINE UN COMPONENTE FUNCIONAL LLAMADO "FOOTER" QUE DEVUELVE EL CÓDIGO DEL PIE DE PÁGINA
const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="links">
        <a href="/terminos.html">Términos</a>
        <a href="/ayuda.html">Ayuda</a>
        <a href="/contacto.html">Contacto</a>
      </div>
      <p>© 2025 Casino Prototipo</p>
    </footer>
  );
};

// ESTO EXPORTA EL COMPONENTE PARA QUE PUEDA SER IMPORTADO Y USADO EN OTROS ARCHIVOS
export default Footer;
