import { getConnection } from "../db_conn.js";
import Rabbitmq from "../rabbitmq/rabbitmqService.js"
const url = "amqp://guest:guest@localhost:5672"; //rabbitmq url
import Redis from "redis";
const redisClient = Redis.createClient(6379, "localhost");
await redisClient.connect();
import * as bs_controller from "./buysell/buysell_controller.js"

export async function getStreamStock(stockCode) {
  const data = await redisClient.hGetAll(stockCode);
  if (data) return data;
  else return -1;
}

export const getStock = async (req, res) => {
  console.log(req.method, req.path);

  getConnection((conn) => {
    const query = "select * from userStock";
    conn.query(query, function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      res.send(rows);
    });
    conn.release();
  });
};

export const getStockById = async (req, res) => {
  console.log(req.method, req.path);

  const { id } = req.body;
  getConnection((conn) => {
    const query = "select * from userStock where id=" + id;
    conn.query(query, function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      res.send(rows);
    });
    conn.release();
  });
};

//사용자별 보유주식
export const getUserStock = async (req, res) => {
  const { userId } = req.body;
  getConnection((conn) => {
    const query = "select * from userStock where userId=" + userId;
    conn.query(query, function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      res.send(rows);
    });
    conn.release();
  });
};

//사용자별 거래내역
export const getUserStockHistory = async (req, res) => {
  const { userId } = req.body;
  getConnection((conn) => {
    const query = "select * from history where userId=" + userId;
    conn.query(query, function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      res.send(rows);
    });
    conn.release();
  });
};

//매수
export const buyStock = async (req, res) => {

  const buysell = "buy";
  console.log(req.method, req.path);
  const { userId, stockId, count, status, stockPrice } =
    req.body;
  let resJson = {};

  getConnection((conn) => {
    // const query =
    //   "INSERT INTO userStock (userId, stockId, count, price) VALUES ('" +
    //   userId + "'," + stockId + "," + count + "," +  price +
    //   ") ON DUPLICATE KEY UPDATE stockId = ?, count = ?, price = ? ;";
    // conn.query(query, [stockId, count, price], function (err, rows, fields) {
    //   if (err) {
    //     console.log("error connecting: " + err);
    //     throw err;
    //   }
    //   resJson.userStockInfo = rows;

      // let totalPrice = count * price;
      // const query2 = `UPDATE account SET balance = balance - ? WHERE userId = ?`;
      // conn.query(query2, [totalPrice, userId], function (err, rows, fields) {
      //   if (err) {
      //     console.log("error connecting: " + err);
      //     throw err;
      //   }
      //   resJson.accountInfo = rows;

        //history insert
        const query3 =
          "INSERT INTO history (userId, stockId, count, status, buysell, stockPrice) VALUES ('" +
          userId +"'," +stockId +"," +count +",'" +status +"','" +buysell +"'," +stockPrice +");";
        conn.query(query3, async function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }
          resJson.historyInfo = rows;

          const buy_info = {id : rows.insertId, userId: userId, stockId: stockId, count:count, price: stockPrice, type: buysell}
        
          //redis 저장
          await bs_controller.addBuy(buy_info);

          // RabbitMQ 통신
          await bs_controller.purchaseBuy(stockId);

          res.json(resJson);
        });
        conn.release();
      });
    }


//매도
export const sellStock = async (req, res) => {
  console.log(req.method, req.path);

  const buysell = "sell";
  const { userId, stockId, count, status, stockPrice } =
    req.body;
  let resJson = {};

  getConnection((conn) => {
    // const query =
    //   "INSERT INTO userStock (userId, stockId, count, price) VALUES ('" +
    //   userId +
    //   "'," +
    //   stockId +
    //   "," +
    //   count +
    //   "," +
    //   price +
    //   ") ON DUPLICATE KEY UPDATE stockId = ?, count = ?, price = ? ;";
    // conn.query(query, [stockId, count, price], function (err, rows, fields) {
    //   if (err) {
    //     console.log("error connecting: " + err);
    //     throw err;
    //   }
    //   resJson.userStockInfo = rows;

    //   let totalPrice = count * price;
    //   const query2 = `UPDATE account SET balance = balance + ? WHERE userId = ?`;
    //   conn.query(query2, [totalPrice, userId], function (err, rows, fields) {
    //     if (err) {
    //       console.log("error connecting: " + err);
    //       throw err;
    //     }
    //     resJson.accountInfo = rows;

        //history insert
        const query3 =
          "INSERT INTO history (userId, stockId, count, status, buysell, stockPrice) VALUES ('" +
          userId + "'," + stockId +  "," + count + ",'" + status + "','" + buysell + "'," +  stockPrice + ");";
        conn.query(query3, async function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }
          resJson.historyInfo = rows;

          const sell_info = {id : rows.insertId, userId: userId, stockId: stockId, count:count, price: stockPrice, type: buysell}
        
          //redis 저장
          await bs_controller.addSell(sell_info);

          // RabbitMQ 통신
          await bs_controller.purchaseSell(stockId)
          res.json(resJson);

        });
    conn.release();
  });
};
