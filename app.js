import express from "express";
import userController from "./src/user/userController.js";
import stockController from "./src/stocks/stockController.js";
import socketIo from "socket.io";
import cors from "cors";
import { getStreamStock } from "./src/stocks/stockService.js";
import rabbitmqAPI from "./src/rabbitmq/rabbitmqAPI.js"
const app = express();

app.use(cors());
app.use(express.json());
app.use("/user", userController);
app.use("/stock", stockController);

app.post("/send_msg", rabbitmqAPI.send_message);


const server = app.listen(8080, () => {
  console.log("server running on port 5000");
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
      const stockPrice = await getStreamStock(stockCode);
      stockInfo.push({ stockCode: stockCode, stockPrice: stockPrice });
    }
    socket.emit("stream", { stockInfo });
  });
});



