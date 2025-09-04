import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes"; // rutas de register/login

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());          // permite solicitudes desde cualquier origen
app.use(express.json());  // permite recibir JSON en el body

// Ruta raíz de prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

// Rutas de autenticación
app.use("/api/auth", authRoutes);

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
