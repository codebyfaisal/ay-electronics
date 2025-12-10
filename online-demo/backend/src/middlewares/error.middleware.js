import { Prisma } from "@prisma/client";
import { errorRes } from "../utils/response.util.js";

const errorMiddleware = (err, req, res, next) => {
    let status = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err instanceof Prisma.PrismaClientInitializationError || err.code === "P2001" || err.code === "P2021") {
        status = 503;
        message = "Database connection failed. Please try again or Run the database or Restart the application. If the problem persists, Contact Developer.";
    };

    console.log(err);
    
    return errorRes(res, status, message);
};

export default errorMiddleware;