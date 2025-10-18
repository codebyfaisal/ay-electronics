import { saveToken } from "../store/session.store.js";
import { successRes } from "../utils/response.util.js";
import crypto from "crypto";

const handleLogin = (req, res) => {
    try {
        const password = req.body?.password;

        if (process.env.PASSWORD === password) {
            const token = crypto.randomBytes(32).toString("hex");
            saveToken(token);
            return successRes(res, 200, true, "Login successful", { token });
        }

        return successRes(res, 401, false, "Invalid password");
    } catch (error) {
        console.log(error);
        return successRes(res, 500, false, "Internal server error");
    }
};

export default handleLogin 