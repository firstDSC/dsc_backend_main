import express from "express";
import userController from "./src/user/userController.js";
import stockController from "./src/stocks/stockController.js";
import socketIo from "socket.io";
import cors from "cors";
import { getStreamStock } from "./src/stocks/stockService.js";
import swaggerUi from "swagger-ui-express";
import swaggerFile from "./src/swagger/swagger-output.json" assert { type: "json" };

import rabbitmqAPI from "./src/rabbitmq/rabbitmqAPI.js";
import * as client from "./src/stocks/buysell/redis_model.js"
import { getStockList } from "./src/stocks/stockService.js";
const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

app.use(express.json());
app.use("/user", userController);
app.use("/stock", stockController);
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerFile, { explorer: true })
);

app.post("/send_msg", rabbitmqAPI.send_message);

async function test(){
  let stockCodes= ["005930", "373220", "000660", "207940", "051910"]

  for (let index in stockCodes) {
    const stockCode = stockCodes[index];
    await getStreamStock(stockCode, index);
  }

}

const server = app.listen(5000, async() => {
  console.log("server running on port 5000");
  await client.rconnect();
  //test();
});

const io = socketIo(server, {
  transport: ["websocket"],
  allowEIO3: true,
});

io.on("connect", (socket) => {
  console.log(`클라이언트 연결 성공 - 소켓ID: ${socket.id}`);

  socket.on("stream", async ({ stockCodes }) => {
    let stockInfo = [];
    for (let index in stockCodes) {
      const stockCode = stockCodes[index];
      const { price: stockPrice, priceChange: stockStatus } =
        await getStreamStock(stockCode, index);
      stockInfo.push({
        stockCode: stockCode,
        stockPrice,
        stockStatus,
      });
    }
    // console.log(stockInfo);
    socket.emit("stream", { stockInfo });
  });
});
