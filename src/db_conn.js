import mysql from "mysql2";
import conn from "./config/db-config.js";

const pool = mysql.createPool(conn);

export function getConnection(callback) {
  pool.getConnection(function (err, conn) {
    if(err){
      console.log(err);
      throw err;
    }
      callback(conn);
  });
}

export function connectTest(connection) {
  var testQuery =
    "INSERT INTO `users` (`userId`,`userPW`) VALUES ('test',1234);";

  connection.query(testQuery, function (err, results, fields) {
    // testQuery 실행
    if (err) {
      console.log(err);
    }
    console.log(results);
  });

  testQuery = "SELECT * FROM users";

  connection.query(testQuery, function (err, results, fields) {
    // testQuery 실행
    if (err) {
      console.log(err);
    }
    console.log(results);
  });
}
