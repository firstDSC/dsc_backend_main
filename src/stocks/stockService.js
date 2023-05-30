import { getConnection } from "../db_conn.js";
import Redis from "redis";

export async function getStreamStock(stockCode) {
  const redisClient = Redis.createClient(6379, "localhost");
  await redisClient.connect();
  const data = await redisClient.hGetAll(stockCode);
  if (data) return data;
  else return -1;
}

export const getStock = async (req, res) => {
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

//보유주식
export const getStockById = async (req, res) => {
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

//거래내역
export const getStockHistoryById = async (req, res) => {
  const { id } = req.body;
  getConnection((conn) => {
    const query = "select * from history where id=" + id;
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
  const { userId, stockId, count, price, status, buysell, stockPrice } =
    req.body;
  let resJson = {};

  getConnection((conn) => {
    const query =
      "INSERT INTO userStock (userId, stockId, count, price) VALUES ('" +
      userId +
      "'," +
      stockId +
      "," +
      count +
      "," +
      price +
      ") ON DUPLICATE KEY UPDATE stockId = ?, count = ?, price = ? ;";
    conn.query(query, [stockId, count, price], function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      resJson.userStockInfo = rows;

      let totalPrice = count * price;
      const query2 = `UPDATE account SET balance = balance - ? WHERE userId = ?`;
      conn.query(query2, [totalPrice, userId], function (err, rows, fields) {
        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }
        resJson.accountInfo = rows;

        //history insert
        const query3 =
          "INSERT INTO history (userId, stockId, count, status, buysell, stockPrice) VALUES ('" +
          userId +
          "'," +
          stockId +
          "," +
          count +
          ",'" +
          status +
          "','" +
          buysell +
          "'," +
          stockPrice +
          ");";
        conn.query(query3, function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }
          resJson.historyInfo = rows;
          res.json(resJson);
        });
      });
    });
    conn.release();
  });
};

//매도
export const sellStock = async (req, res) => {
  const { userId, stockId, count, price, status, buysell, stockPrice } =
    req.body;
  let resJson = {};

  getConnection((conn) => {
    const query =
      "INSERT INTO userStock (userId, stockId, count, price) VALUES ('" +
      userId +
      "'," +
      stockId +
      "," +
      count +
      "," +
      price +
      ") ON DUPLICATE KEY UPDATE stockId = ?, count = ?, price = ? ;";
    conn.query(query, [stockId, count, price], function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      resJson.userStockInfo = rows;

      let totalPrice = count * price;
      const query2 = `UPDATE account SET balance = balance + ? WHERE userId = ?`;
      conn.query(query2, [totalPrice, userId], function (err, rows, fields) {
        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }
        resJson.accountInfo = rows;

        //history insert
        const query3 =
          "INSERT INTO history (userId, stockId, count, status, buysell, stockPrice) VALUES ('" +
          userId +
          "'," +
          stockId +
          "," +
          count +
          ",'" +
          status +
          "','" +
          buysell +
          "'," +
          stockPrice +
          ");";
        conn.query(query3, function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }
          resJson.historyInfo = rows;
          res.json(resJson);
        });
      });
    });
    conn.release();
  });
};
