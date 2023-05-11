import express from "express";
import userController from "./src/user/userController.js";
import stockController from "./src/stocks/stockController.js";
import socketIo from "socket.io";
const app = express();

app.use(express.json());
app.use("/user", userController);
app.use("/stock", stockController);

const server = app.listen(5000, () => {
  console.log("server running on port 5000");
});

const io = socketIo(server, {
  transport: ["websocket"],
  allowEIO3: true,
});

io.on("connect", (socket) => {
  console.log(`클라이언트 연결 성공 - 소켓ID: ${socket.id}`);

  socket.on("message", (data) => {
    console.log(socket.id + "  " + data);
    socket.emit("message ", { msg: "received" });
  });
});
