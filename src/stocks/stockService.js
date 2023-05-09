import { getConnection } from "../db_conn.js";

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

  //사용자 중복 체크
  function checkDuplication(){
    getConnection((conn) => {
      const query = "select * from userStock where id=" + id;
      conn.query(query, function (err, rows, fields) {

        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }

        //새로운 사용자
        if(rows == undefined||null) return false;
        //기존 사용자
        else return true;

      });
      conn.release();
    });
    
  }

  //매수
  export const buyStock = async (req, res) => {
    const { userId, stockId, count, status, buysell, stockPrice } = req.body;

    const checkId = checkDuplication();

    getConnection((conn) => {
    
      //함수반환 true(중복)면 update. 아니면 insert
      if(checkId==true){
        const query =
        `UPDATE userStock SET count = ?, status = ?, buysell = ?, stockPrice = ?
        WHERE userId = ? AND stockId = ?`;
        conn.query(query, [count, status, buysell, stockPrice, userId, stockId], function (err, rows, fields) {
        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }
      })
    }

      else{
        const query =
          "INSERT INTO 'userStock' ('userId', 'stockId', 'count', 'status', 'buysell', 'stockPrice') VALUES ('" + 
          userId +
          "'," +
          stockId +
          "'," +
          count +
          "'," +
          status +
          "'," +
          buysell +
          "'," +
          stockPrice
          ");";
        conn.query(query, function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }
        })  
      }
  
        const totalPrice = count * stockPrice;
        const query2 =
        `UPDATE account SET balance = balance - ? WHERE userId = ?`;
        conn.query(query2, [totalPrice, userId], function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }

          //userStock update
          const query3 =
          `UPDATE userStock SET count = count + ?, price = ?
                        WHERE userId = ? AND stockId = ?`;
          conn.query(query3, [count, price, userId, stockId], function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }

          //history update
          const query4 =
          `UPDATE history SET count = count + ?, status = ?, buysell = ?, stockPrice = ?
                        WHERE userId = ? AND stockId = ?`;
          conn.query(query4, [count, status, buysell, stockPrice, userId, stockId], function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }

          res.json(resJson);
          });
          });
        });
      });
      conn.release();
  };

  //매도
  export const sellStock = async (req, res) => {
    const { userId, stockId, count, status, buysell, stockPrice } = req.body;

    const checkId = checkDuplication();

    getConnection((conn) => {
    
      //함수반환 true(중복)면 update. 아니면 insert
      if(checkId==true){
        const query =
        `UPDATE userStock SET count = ?, status = ?, buysell = ?, stockPrice = ?
        WHERE userId = ? AND stockId = ?`;
        conn.query(query, [count, status, buysell, stockPrice, userId, stockId], function (err, rows, fields) {
        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }
      })
    }

      else{
        const query =
          "INSERT INTO 'userStock' ('userId', 'stockId', 'count', 'status', 'buysell', 'stockPrice') VALUES ('" + 
          userId +
          "'," +
          stockId +
          "'," +
          count +
          "'," +
          status +
          "'," +
          buysell +
          "'," +
          stockPrice
          ");";
        conn.query(query, function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }
        })  
      }
  
        const totalPrice = count * stockPrice;
        const query2 =
        `UPDATE account SET balance = balance + ? WHERE userId = ?`;
        conn.query(query2, [totalPrice, userId], function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }

          //userStock update
          const query3 =
          `UPDATE userStock SET count = count - ?, price = ?
                        WHERE userId = ? AND stockId = ?`;
          conn.query(query3, [count, price, userId, stockId], function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }

          //history update
          const query4 =
          `UPDATE history SET count = count - ?, status = ?, buysell = ?, stockPrice = ?
                        WHERE userId = ? AND stockId = ?`;
          conn.query(query4, [count, status, buysell, stockPrice, userId, stockId], function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }

          res.json(resJson);
          });
          });
        });
      });
      conn.release();
  };