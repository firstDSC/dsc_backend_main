import express from "express";
import * as userService from "./userService.js";

const userController = express.Router();

userController.get("/getUsers", userService.getUsers);
userController.get("/getUserById", userService.getUserById);
userController.post("/createUser", userService.createUser);
userController.post("/login", userService.login);

userController.post("/deposit", userService.deposit);
userController.post("/withdrawal", userService.withdrawal);

export default userController;
