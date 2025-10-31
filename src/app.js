import express from "express";
import path from "path";
import { fileURLToPath } from "url";
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

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Get the directory of the current module (file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the frontend dist directory relative to current file location
const frontendDist = path.join(__dirname, "..", "ui", "dist");

console.log("Frontend dist directory:", frontendDist);

// Test Routes
app.get("/api/test", (req, res) => {
  return res.send("OK");
});

// Api Routes
app.use("/auth", authRouter);
app.use("/api/finance", financeRouter);
app.use("/api/customers", customerRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);
app.use("/api/settings", settingRouter);

// Frontend Routes
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.get(/^(?!\/api).*/, (req, res) =>
    res.sendFile(path.join(frontendDist, "index.html"))
  );
}

app.use(errorMiddleware);

export default app;
