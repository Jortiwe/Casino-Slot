import { Router } from "express";
import { register, login, updateBalance, changePassword } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/balance", updateBalance);
router.post("/change-password", changePassword);

export default router;
