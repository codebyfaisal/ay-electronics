// import express from "express";
// import authenticate from "./middlewares/authenticate.middleware.js";
// import authRouter from "./routes/auth.route.js";
// import financeRouter from "./routes/finance.route.js";
// import customerRouter from "./routes/customer.route.js";
// import productRouter from "./routes/product.route.js";
// import saleRouter from "./routes/sale.route.js";
// import errorMiddleware from "./middlewares/error.middleware.js";
// import cors from "cors";

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Test Routes
// app.get("/api/test", (req, res) => res.send("OK"));

// // Auth Routes
// app.use("/api/auth", authRouter);

// // Authentication Middleware
// // app.use(authenticate);

// // API Routes
// app.use("/api/finance", financeRouter);
// app.use("/api/customers", customerRouter);
// app.use("/api/products", productRouter);
// app.use("/api/sales", saleRouter);

// app.use(errorMiddleware);

// export default app;

// src/app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import authenticate from "./middlewares/authenticate.middleware.js";
import authRouter from "./routes/auth.route.js";
import financeRouter from "./routes/finance.route.js";
import customerRouter from "./routes/customer.route.js";
import productRouter from "./routes/product.route.js";
import saleRouter from "./routes/sale.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import cors from "cors";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Routes
app.get("/api/test", (req, res) => res.send("OK"));

// Auth Routes
app.use("/api/auth", authRouter);

// Authentication Middleware (if you want it on all APIs)
// app.use(authenticate);

// API Routes
app.use("/api/finance", financeRouter);
app.use("/api/customers", customerRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);

// --- Serve Frontend Static Files (Vite build) ---
// Assumes frontend build output is at project_root/frontend/dist
const frontendDist = path.join(__dirname, "../../frontend/dist");

// Only if dist exists, serve it. This avoids crash in dev if not built.
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  // Catch-all: for any non-API route return index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Error handler
app.use(errorMiddleware);

export default app;
