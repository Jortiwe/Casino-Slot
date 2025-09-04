import { Router } from "express";
import { register, login, updateBalance } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/balance", updateBalance);

export default router;
