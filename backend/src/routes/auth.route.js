import { Router } from "express";
import { handleLoginForm, handleLogin, handleLogout } from "../controllers/auth.controller.js";

const router = Router();

router.get("/login", handleLoginForm);
router.post("/login", handleLogin);
router.get("/logout", handleLogout);

export default router;