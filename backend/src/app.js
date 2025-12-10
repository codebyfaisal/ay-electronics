import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import authenticate from "./middlewares/authenticate.middleware.js";
import watcher from "./middlewares/watcher.middleware.js";
import authRouter from "./routes/auth.route.js";
import financeRouter from "./routes/finance.route.js";
import customerRouter from "./routes/customer.route.js";
import productRouter from "./routes/product.route.js";
import saleRouter from "./routes/sale.route.js";
import settingRouter from "./routes/setting.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// const uiDist = path.join(process.cwd(), "../frontend", "dist");
const uiDist = path.join(process.cwd(), "ui" );
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
if (fs.existsSync(uiDist)) {
  app.use(express.static(uiDist));

  app.get(/^(?!\/api).*/,
    (req, res) =>
      res.sendFile(path.join(uiDist, "index.html"))
  )
}

app.use(errorMiddleware);

export default app;
