import client from "../../config/redis-config.js";

//연결
export const rconnect = async () => {
  await client.connect();
};

// 1: 매수 2: 매도
export const selectDB = async (num) => {
  await client.select(num, (err) => {
    if (err) {
      console.log("select err: ", err);
    }
  });
};

export const count = async(db, stockId) => {
  await selectDB(db);
  return await client.zCard(stockId)
} 

//실시간 시세 
export const getStreamPrice = async (stockId) => {
  await selectDB(0);

  const result = await client.hGet(stockId, "price")
  return parseInt(result, 10)
}

//최상위 주문 price 확인
export const getPrice = async (db, value) => {
  await selectDB(db);
  
  value = JSON.parse(value);
  return parseInt(value.price, 10);
};

export const getAll = async (db, key) => {
  await selectDB(db);
  return await client.zRange(key, 0, -1);
}

export const enqueue = async (key, score, value) => {
  console.log("hello enq");
  await client.zAdd(key, [{ score: score, value: value }], (err) => {
    if (err) console.log("zAdd error : ", err);
  });

  // for await (const memberWithScore of client.zScanIterator(key)) {
  //   console.log(memberWithScore);
  // }
};

export const dequeue = async (key) => {
  const result = await client.zRange(key, 0, 0);
  await client.zRem(key, result);
  return result;
};
