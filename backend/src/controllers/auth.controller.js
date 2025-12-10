import path from "path";
import { deleteToken, saveToken } from "../store/session.store.js";
import { errorRes, successRes } from "../utils/response.util.js";
import crypto from "crypto";

export const handleLoginForm = (req, res) =>
    res.sendFile(path.join(process.cwd(), "ui", "assets", "login.html"));

export const handleLogin = (req, res) => {
    try {
        const password = req.body?.password;
        if (process.env.PASSWORD === password) {
            const token = crypto.randomBytes(32).toString("hex");
            saveToken(token);
            res.cookie("token", token);
            return successRes(res, 200, true, "Login successful");
        }

        return successRes(res, 401, false, "Invalid password");
    } catch (error) {
        return successRes(res, 500, false, "Internal server error");
    }
};

export const handleLogout = (req, res) => {
    try {
        const token = req?.cookies?.token;
        if (token && deleteToken(token)) {
            res.clearCookie("token");
            return successRes(res, 200, true, "Logout successful");
        }

        return errorRes(res, 401, false, "Invalid token or Logout failed");
    } catch (error) {
        return errorRes(res, 500, false, "Internal server error");
    }
};