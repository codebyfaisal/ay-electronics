import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import financeRouter from "./routes/finance.route.js";
import customerRouter from "./routes/customer.route.js";
import productRouter from "./routes/product.route.js";
import saleRouter from "./routes/sale.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Test Routes
app.get("/api/test", (req, res) => {
  return res.send("OK")
});

// Api Routes
app.use("/api/finance", financeRouter);
app.use("/api/customers", customerRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", saleRouter);

app.use(errorMiddleware);

export default app;
