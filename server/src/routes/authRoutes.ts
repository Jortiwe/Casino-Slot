import { Router } from "express";
import { register, login, updateBalance, changePassword, uploadProfilePic, upload,getMe // 🔹 Asegúrate de importarlo
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/balance", updateBalance);
router.post("/change-password", changePassword);
router.post("/upload-profile-pic", upload.single("profilePic"), uploadProfilePic);
router.get("/me", getMe); // 🔹 Ahora sí funciona

export default router;
