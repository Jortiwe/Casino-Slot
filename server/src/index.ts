import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/authRoutes"; 
const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());          
app.use(express.json());  
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

app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));