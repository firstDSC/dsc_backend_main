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

  export const buyStock = async (req, res) => {
    const { userId, stockId, count, status, buysell, stockPrice } = req.body;

    getConnection((conn) => {
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

        const totalPrice = count * stockPrice;
        const query2 =
        `UPDATE account SET balance = balance - ? WHERE userId = ?`;
        conn.query(query2, [totalPrice, userId], function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }

          const query3 =
          `UPDATE userStock SET count = count + ?, status = ?, buysell = ?, stockPrice = ?
                        WHERE userId = ? AND stockId = ?`;
          conn.query(query3, [count, status, buysell, stockPrice, userId, stockId], function (err, rows, fields) {
          if (err) {
            console.log("error connecting: " + err);
            throw err;
          }

          //const query4 ?? history update ?? 


          res.json(resJson);
          });
        });
      });
      conn.release();
    });
  };

  export const sellStock = async (req, res) => {

  };