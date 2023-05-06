import express from "express";
import userController from "./src/user/userController.js";

const app = express();

app.use(express.json());
app.use("/user", userController);

app.listen(5000, () => {
  console.log("server running on port 5000");
});
