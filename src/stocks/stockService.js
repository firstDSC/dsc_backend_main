import { getConnection } from "../db_conn.js";
import Rabbitmq from "../rabbitmq/rabbitmqService.js"
const url = "amqp://guest:guest@localhost:5672"; //rabbitmq url
import * as redis from "./buysell/redis_model.js"
import * as bs_controller from "./buysell/buysell_controller.js"
import { resolve } from "path";
let data = new Array(15).fill(0); // data를 15개의 배열로 초기화

export async function getStreamStock(stockCode, index) {
  const res_data = await redis.getStreamAll(stockCode);
  const new_price = parseInt(res_data.price);
  if (res_data) {
    //const index = data.findIndex((item) => item.stockCode === stockCode);

    //if (index !== -1) {
      if (data[index] != new_price) {
        data[index] = new_price;
        await bs_controller.purchaseBuy(stockCode);
        //bs_controller.purchaseSell(stockCode);

        console.log(stockCode, "시세 변동");
      } else {
        console.log("시세 변동 없음");
      }
    //}

    return res_data;
  } else {
    return -1;
  }
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

export const getStockList = async (req, res) => {
  getConnection((conn)=>{
    const query = "select stockCode from stocks where id < 16"
    conn.query(query, function (err, rows, fields){
      if(err) {
        console.log("error connecting: " + err);
        throw err;
      }
      res.send(rows); 
    })
    conn.release();
  })
}

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

async function getHistory(historyId)  {
  getConnection(async (conn) => {
    const query = "select * from history where id=" + historyId;
    conn.query(query, function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      return rows;
    });
    conn.release();
  });
};

export const getOustanding = async (req, res) => {
  const { userId } = req.query;
  const historyIdList = await redis.getOustanding(userId);

  let historyIds = ""
  for (let index in historyIdList) {
    const historyId = historyIdList[index];
    historyIds += "id="+historyId+" or "
  }
  historyIds += "id=0"

  let historyInfo = [];
  getConnection(async (conn) => {
    const query = "select * from history where " + historyIds;
        conn.query(query, function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }

          for(let index in rows){
          const { id : id, userId: userId, stockId: stockId, count:count, stockPrice: stockPrice, buysell:type } = rows[index]
          historyInfo.push({
            id : id, userId: userId, stockId: stockId, count:count, stockPrice: stockPrice, type: type
          });
        }
          console.log(historyInfo);
          res.send(historyInfo)
        });
    conn.release();
    });


}

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

      if(rows.length > 0){
        const accountBalance = rows[0].balance;
        const totalPrice = count * stockPrice;

        if (totalPrice > accountBalance) {
          resJson.error = "계좌 잔액 부족";
          res.json(resJson);
          return;
      }}else {
        resJson.error = "사용자 정보 없음";
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

        const buy_info = {id : rows.insertId, userId: userId, stockId: stockId, count:count, price: stockPrice, type: buysell}

        //redis 저장
        await bs_controller.addBuy(buy_info);
        await redis.addOutstanding(userId, rows.insertId);

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
      
      if(rows.length > 0){
        const availableStocks = rows[0].count;

        if (count > availableStocks) {
          resJson.error = "매도 가능 주식 부족";
          res.json(resJson);
          return;
        }
      }else {
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

        const sell_info = {id : rows.insertId, userId: userId, stockId: stockId, count:count, price: stockPrice, type: buysell}

          //redis 저장
          await bs_controller.addSell(sell_info);
          await redis.addOutstanding(userId, rows.insertId);

          // RabbitMQ 통신
          await bs_controller.purchaseSell(stockId)
      });
    });
    conn.release();
  });
};

export const getStockInfo = async (req, res) => {
  const {stockId} = req.query;

  getConnection((conn)=>{
    const query = "select * from stockinfo where stockCode="+stockId;
    conn.query(query, function (err, rows, fields){
      if(err) {
        console.log("error connecting: " + err);
        throw err;
      }
      res.send(rows); 
    })
    conn.release();
  })
}