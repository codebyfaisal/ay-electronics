import express from "express";
import path from "path";
import authenticate from "./middlewares/authenticate.middleware.js";
import authRouter from "./routes/auth.route.js";
import financeRouter from "./routes/finance.route.js";
import customerRouter from "./routes/customer.route.js";
import productRouter from "./routes/product.route.js";
import saleRouter from "./routes/sale.route.js";
import settingRouter from "./routes/setting.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import cors from "cors";
import fs from "fs";
import cookieParser from "cookie-parser";
import watcher from "./middlewares/watcher.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const frontendDist = path.join(process.cwd(), "ui", "dist");
// const frontendDist = path.join(process.cwd(), "frontend", "dist");
// process.env.DATABASE_URL = `file:${path.join(process.cwd(), "db", "app.db")}`;

// Test Routes
app.get("/api/test", (req, res) => {
  return res.send("OK")
});

// Authentication Middleware 
// app.use(authenticate);

// Api Routes
app.use("/auth", authRouter);
app.use(watcher)
app.use("/api/finance", financeRouter);
app.use("/api/customers", customerRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);
app.use("/api/settings", settingRouter);

// Frontend Routes
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.get(/^(?!\/api).*/,
    (req, res) =>
      res.sendFile(path.join(frontendDist, "index.html"))
  )
}

app.use(errorMiddleware);

export default app;
