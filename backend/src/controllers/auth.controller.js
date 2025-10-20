import { deleteToken, saveToken } from "../store/session.store.js";
import { errorRes, successRes } from "../utils/response.util.js";
import loginHtml from "../views/login.html" with { type: "text" };
import crypto from "crypto";
import path from "path";
import fs from "fs";

export const handleLoginForm = (req, res) => res.send(loginHtml);

export const handleLogin = (req, res) => {
    try {
        const password = req.body?.password;
        // const ADMIN_PASSWORD_FILE = path.join(process.cwd(), "password.txt");
        // const ADMIN_PASSWORD = fs.readFileSync(ADMIN_PASSWORD_FILE, "utf-8")

        if (process.env.PASSWORD === password) {
            // if (ADMIN_PASSWORD === password) {
            const token = crypto.randomBytes(32).toString("hex");
            saveToken(token);
            res.cookie("token", token);
            return successRes(res, 200, true, "Login successful");
        }

        return successRes(res, 401, false, "Invalid password");
    } catch (error) {
        console.log(error);
        return successRes(res, 500, false, "Internal server error");
    }
};

export const handleLogout = (req, res) => {
    try {
        console.log("request for logout");
        const token = req?.cookies?.token;
        if (token && deleteToken(token)) {
            res.clearCookie("token");
            return successRes(res, 200, true, "Logout successful");
        }

        return errorRes(res, 401, false, "Invalid token or Logout failed");
    } catch (error) {
        console.log(error);
        return errorRes(res, 500, false, "Internal server error");
    }
};