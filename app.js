import express from "express";
import userController from "./src/user/userController.js";
import stockController from "./src/stocks/stockController.js";

const app = express();

app.use(express.json());
app.use("/user", userController);
app.use("/stock", stockController);

app.listen(8080, () => {
  console.log("server running on port 5000");
});

// http://localhost:8080/stock/buyStock