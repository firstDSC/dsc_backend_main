import { getConnection } from "../db_conn.js";
import Rabbitmq from "../rabbitmq/rabbitmqService.js"
const url = "amqp://guest:guest@localhost:5672"; //rabbitmq url
import Redis from "redis";
const redisClient = Redis.createClient(6379, "localhost");
await redisClient.connect();
import * as bs_controller from "./buysell/buysell_controller.js"

export async function getStreamStock(stockCode) {
  const data = await redisClient.hGetAll(stockCode);
  if (data) {
    // 이전 데이터와 현재 데이터를 비교하여 시세 변동 체크
    const previousPrice = parseFloat(data.price); // 이전 가격
    const currentPrice = await getCurrentPrice(stockCode); // Redis에서 현재 가격을 가져옴

    if (previousPrice < currentPrice) {
      console.log("시세 상승");
    } else if (previousPrice > currentPrice) {
      console.log("시세 하락");
    } else {
      console.log("시세 변동 없음");
    }

    // 데이터 업데이트
    data.price = currentPrice.toString();
    await redisClient.hmset(stockCode, data);

    //변동 있으면 purchaseBuy, purchaseSell 호출
    if (previousPrice != currentPrice) {
      bs_controller.purchaseBuy(stockCode);
      bs_controller.purchaseSell(stockCode);
    }

    return data;
  } else {
    return -1;
  }
}

async function getCurrentPrice(stockCode) {
  return new Promise((resolve, reject) => {
    redisClient.hget(stockCode, "price", (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(parseFloat(result));
      }
    });
  });
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

    //잔액 확인
    const query1 =
      "select balance from account where userId = ?";
    conn.query(query1, [userId], function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }

      const accountBalance = rows[0].balance;
      const totalPrice = count * stockPrice;

      if (totalPrice > accountBalance) {
        resJson.error = "계좌 잔액 부족";
        res.json(resJson);
        return;
      }

      //history insert
      const query3 =
        "INSERT INTO history (userId, stockId, count, status, buysell, stockPrice) VALUES ('" +
        userId + "'," + stockId + "," + count + ",'" + status + "','" + buysell + "'," + stockPrice + ");";
      conn.query(query3, async function (err, rows, fields) {
        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }
        resJson.historyInfo = rows;

        const buy_info = { id: rows.insertId, userId: userId, stockId: stockId, count: count, price: stockPrice, type: buysell }

        //redis 저장
        await bs_controller.addBuy(buy_info);

        // RabbitMQ 통신
        await bs_controller.purchaseBuy(stockId);

        res.json(resJson);
      });
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
    //count 확인
    const query1 =
      "select count from userStock where userId = ? and stockId = ?";
    conn.query(query1, [userId, stockId], function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }

      const availableStocks = rows[0].count;

      if (count > availableStocks) {
        resJson.error = "매도 가능 주식 부족";
        res.json(resJson);
        return;
      }

      //history insert
      const query3 =
        "INSERT INTO history (userId, stockId, count, status, buysell, stockPrice) VALUES ('" +
        userId + "'," + stockId + "," + count + ",'" + status + "','" + buysell + "'," + stockPrice + ");";
      conn.query(query3, async function (err, rows, fields) {
        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }
        resJson.historyInfo = rows;

        const sell_info = { id: rows.insertId, userId: userId, stockId: stockId, count: count, price: stockPrice, type: buysell }

        //redis 저장
        await bs_controller.addSell(sell_info);

        // RabbitMQ 통신
        await bs_controller.purchaseSell(stockId)
        res.json(resJson);

      });
    });
    conn.release();
  });

};