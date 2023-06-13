import client from "../../config/redis-config.js";

//연결
exports.rconnect = async () => {
  await client.connect();
};

// 1: 매수 2: 매도
exports.selectDB = async (num) => {
  await client.select(num, (err) => {
    if (err) {
      console.log("select err: ", err);
    }
  });
};

//최상위 주문 price 확인
exports.getPrice = async (db, key) => {
  await selectDB(db);

  result = await client.zRange(key, 0, 0);
  result = JSON.parse(result[0]);
  return result.price;
};

exports.enqueue = async (key, score, value) => {
  console.log("hello enq");
  await client.zAdd(key, [{ score: score, value: value }], (err) => {
    if (err) console.log("zAdd error : ", err);
  });

  for await (const memberWithScore of client.zScanIterator(key)) {
    console.log(memberWithScore);
  }
};

exports.dequeue = async (key) => {
  result = await client.zRange(key, 0, 0);
  await client.zRem(key, result);
  return result;
};
