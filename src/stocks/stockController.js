import express from "express";
import * as stockService from "./stockService.js";

const stockController = express.Router();

stockController.get("/getStock", stockService.getStock);
stockController.get("/getStockById", stockService.getStockById);
stockController.get("/getStockList", stockService.getStockList);
stockController.get("/getOutStanding", stockService.getOustanding); 
stockController.get("/getStockInfo", stockService.getStockInfo);

stockController.get("/getUserStock", stockService.getUserStock);
stockController.get("/getUserStockHistory", stockService.getUserStockHistory);

stockController.post("/buyStock", stockService.buyStock);
stockController.post("/sellStock", stockService.sellStock);

export default stockController;