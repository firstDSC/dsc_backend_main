import { getConnection } from "../db_conn.js";

export const getUsers = async (req, res) => {
  getConnection((conn) => {
    const query = "select * from users";
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

export const getUserById = async (req, res) => {
  const { id } = req.body;
  getConnection((conn) => {
    const query = "select * from users where id=" + id;
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

//회원가입
export const createUser = async (req, res) => {
  const { userId, userPW } = req.body;
  let resJson = {};

  const accountNumber = generateAccountNumber();

  getConnection((conn) => {
    const query =
      "INSERT IGNORE INTO `users` (`userId`,`userPW`) VALUES ('" +
      userId +
      "'," +
      userPW +
      ");";
    conn.query(query, function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      const { insertId } = rows;
      resJson.userInfo = rows;
      if (insertId == 0) {
        res.json({ 'msg': "이미 존재하는 사용자입니다" })
        return false;
      }
      const query2 =
        "INSERT INTO `account` (`accountNum`,`accountPw`,`balance`,`userId`) VALUES ('" +
        accountNumber +
        "'," +
        userPW +
        "," +
        5000000 +
        "," +
        userId +
        ")";
      conn.query(query2, function (err, rows, fields) {
        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }
        resJson.accountInfo = rows;
        res.json(resJson);
      });
    });
    conn.release();
  });
};

function generateAccountNumber() {
  let accountNumber = "";
  const digits = "0123456789";

  for (let i = 0; i < 10; i++) {
    accountNumber += digits[Math.floor(Math.random() * 10)];
  }

  return accountNumber;
}

//로그인
export const login = async (req, res) => {
  const { userId, userPW } = req.body;

  getConnection((conn) => {
    const query = "select * from users where userId =" + userId + "and userPW = " + userPW;
    conn.query(query, function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }

      if (rows.length === 0) {
        res.json({ msg: "Invalid username or password" });
      } else {
        res.json({ msg: "Login successful" });
      }

    });
    conn.release();
  });
};


//입금
export const deposit = async (req, res) => {
  const { userId, value } = req.body;
  let resJson = {};

  getConnection((conn) => {
    const query = "select * from account where userId=" + userId;
    conn.query(query, function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      const { balance } = rows[0];

      resJson.prevBalance = rows[0];
      const query2 =
        "update `account` set balance =" +
        (balance + value) +
        " where userId='" +
        userId +
        "'";
      conn.query(query2, function (err, rows, fields) {
        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }
        resJson.afterBalance = balance + value;
        res.json(resJson);
      });
    });
    conn.release();
  });
};

//출금
export const withdrawal = async (req, res) => {
  const { userId, value } = req.body;
  let resJson = {};

  getConnection((conn) => {
    const query = "select * from account where userId=" + userId;
    conn.query(query, function (err, rows, fields) {
      if (err) {
        console.log("error connecting: " + err);
        throw err;
      }
      const { balance } = rows[0];
      if (balance < value) {
        throw res.json({ msg: "insufficient balance error" });
      }
      resJson.prevBalance = rows[0];
      const query2 =
        "update `account` set balance =" +
        (balance - value) +
        " where userId=" +
        userId +
        "";
      conn.query(query2, function (err, rows, fields) {
        if (err) {
          console.log("error connecting: " + err);
          throw err;
        }
        resJson.afterBalance = balance + value;
        res.json(resJson);
      });
    });
    conn.release();
  });
};
