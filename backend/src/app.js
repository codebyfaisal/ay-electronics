import express from "express";
import path from "path";
import authenticate from "./middlewares/authenticate.middleware.js";
import authRouter from "./routes/auth.route.js";
import financeRouter from "./routes/finance.route.js";
import customerRouter from "./routes/customer.route.js";
import productRouter from "./routes/product.route.js";
import saleRouter from "./routes/sale.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import cors from "cors";
import fs from "fs";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const frontendDist = path.join(process.cwd(), "frontend", "dist");
// const frontendDist = path.join(process.cwd(), "../frontend", "dist");
process.env.DATABASE_URL = `file:${path.join(process.cwd(), "dev.db")}`;
const devConfigFile = path.join(process.cwd(), "dev.json");
if (fs.existsSync(devConfigFile)) {
  const devConfig = JSON.parse(fs.readFileSync(devConfigFile, "utf-8"));
  process.env.PASSWORD = devConfig.PASSWORD;

  if (devConfig?.BACKUP_DRIVE) {
    const backupFolderPath = path.join(process.env.BACKUP_DRIVE, "ayApp", "backup");
    if (fs.existsSync(backupFolderPath)) {
      fs.rmSync(backupFolderPath, { recursive: true, force: true });
    }
    const backupDbPath = path.join(process.env.BACKUP_DRIVE, "ayApp", "backup", `${Date.now()}`, "dev.db");
    fs.copyFileSync(path.join(process.cwd(), "dev.db"), backupDbPath);
  }
}

// Test Routes
app.get("/api/test", (req, res) => res.send("OK"));

// Authentication Middleware 
app.use(authenticate);

// Api Routes
app.use("/auth", authRouter);
app.use("/api/finance", financeRouter);
app.use("/api/customers", customerRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);

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
