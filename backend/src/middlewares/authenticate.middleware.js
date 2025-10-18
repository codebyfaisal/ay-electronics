import { getToken } from "../store/session.store.js";
import { errorRes } from "../utils/response.util.js";

const authenticate = (req, res, next) => {
    if (!req.headers.authorization.startsWith("Bearer"))
        return errorRes(res, 401, "Unauthorized");

    const token = req.headers.authorization.split(" ")[1];

    // if (!getToken(token))
    //     return errorRes(res, 401, "Unauthorized");

    next();
}

export default authenticate