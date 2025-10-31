import { getToken } from "../store/session.store.js";
import { errorRes } from "../utils/response.util.js";

const authenticate = (req, res, next) => {
    const token = req?.cookies?.token;
    const verifyToken = getToken(token)

    if (req.url === "/auth/login") {
        if (req.method === "GET")
            if (verifyToken) return res.redirect("/");
            else return next()

        if (req.method === "POST")
            return next()
    }

    if ((req.url === "/login" && req.method === "GET") || !verifyToken)
        return res.redirect("/auth/login");
    
    if (verifyToken) return next();

    return errorRes(res, 401, false, "Unauthorized");
}

export default authenticate