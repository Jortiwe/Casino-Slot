// authController.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { pool } from "../db";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET!;

// 🔹 Función auxiliar para mostrar error en consola
function handleError(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

// ===================================
// 🔹 Multer para subir imágenes
// ===================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
export const upload = multer({ storage });

// ===================================
// 🔹 Tipado para JWT
// ===================================
interface JwtPayloadWithId extends JwtPayload {
  id: number;
}

// ===================================
// 🔹 Registro de usuario
// ===================================
export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, email, password, balance) VALUES ($1, $2, $3, $4) RETURNING id, username, email, balance, profile_pic",
      [username, email, hashedPassword, 100] // saldo inicial 100
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        profile_pic: user.profile_pic || null,
      },
    });
  } catch (err: unknown) {
    console.error("Error en register:", handleError(err));
    res.status(400).json({ error: "Usuario o email ya existe" });
  }
};

// ===================================
// 🔹 Login de usuario
// ===================================
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Faltan datos" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Usuario no encontrado" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        profile_pic: user.profile_pic || null,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ===================================
// 🔹 Actualizar saldo
// ===================================
export const updateBalance = async (req: Request, res: Response) => {
  const { userId, newBalance } = req.body;
  if (!userId || newBalance === undefined)
    return res.status(400).json({ error: "Faltan datos" });

  try {
    const result = await pool.query(
      "UPDATE users SET balance=$1 WHERE id=$2 RETURNING id, username, email, balance, profile_pic",
      [newBalance, userId]
    );
    res.json(result.rows[0]);
  } catch (err: unknown) {
    console.error("Error en updateBalance:", handleError(err));
    res.status(500).json({ error: "Error al actualizar saldo" });
  }
};

// ===================================
// 🔹 Cambiar contraseña
// ===================================
export const changePassword = async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword)
    return res.status(400).json({ error: "Faltan datos" });

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      "UPDATE users SET password=$1 WHERE id=$2 RETURNING id, username, email, balance, profile_pic",
      [hashedPassword, userId]
    );
    res.json(result.rows[0]);
  } catch (err: unknown) {
    console.error("Error en changePassword:", handleError(err));
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
};

// ===================================
// 🔹 Subir foto de perfil
// ===================================
export const uploadProfilePic = async (req: Request, res: Response) => {
  const file = req.file;
  const userId = req.body.userId;

  if (!file || !userId)
    return res.status(400).json({ error: "Faltan datos" });

  const profilePicPath = `/uploads/${file.filename}`;
  const result = await pool.query(
    "UPDATE users SET profile_pic=$1 WHERE id=$2 RETURNING id, username, email, balance, profile_pic",
    [profilePicPath, userId]
  );
  res.json(result.rows[0]); // Aquí viene la ruta actualizada // ruta relativa para express.static

  try {
    const result = await pool.query(
      "UPDATE users SET profile_pic=$1 WHERE id=$2 RETURNING id, username, email, balance, profile_pic",
      [profilePicPath, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en uploadProfilePic:", err);
    res.status(500).json({ error: "Error al subir foto" });
  }
};

// ===================================
// 🔹 Obtener usuario logueado (getMe)
// ===================================
export const getMe = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No autorizado" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadWithId;

    const result = await pool.query(
      "SELECT id, username, email, balance, profile_pic FROM users WHERE id=$1",
      [decoded.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en getMe:", err);
    res.status(401).json({ error: "Token inválido" });
  }
};
