import {streamClient} from "../../config/redis-config.js";
import {buyClient} from "../../config/redis-config.js"
import {sellClient} from "../../config/redis-config.js"

// export const selectDB = async (num) => {
//   await client.select(num, (err) => {
//     if (err) {
//       console.log("select err: ", err);
//     }
//   });
// };

//연결
export const rconnect = async () => {
  await streamClient.connect();
  await streamClient.select(0);
  await buyClient.connect();
  await buyClient.select(1);
  await sellClient.connect();
  await sellClient.select(2);
};



export const buyCount = async(stockId) => {
  const result = await buyClient.zCard(stockId);
  return result
} 

export const sellCount = async(stockId) => {
  const result = await sellClient.zCard(stockId);
  return result
} 

//실시간 시세 
export const getStreamAll= async (stockId) => {
  const result = await streamClient.hGetAll(stockId)
  return result
}

//실시간 시세 
export const getStreamPrice = async (stockId) => {
  const result = await streamClient.hGet(stockId, "price")
  return parseInt(result, 10)
}

//최상위 주문 price 확인
export const getPrice = async (value) => {
  value = JSON.parse(value);
  return parseInt(value.price, 10);
};

export const getBuyAll = async (key) => {
  return await buyClient.zRange(key, 0, -1);
}

export const getSellAll = async (key) => {
  return await sellClient.zRange(key, 0, -1);
}

export const buyEnqueue = async (key, score, value) => {
  console.log("hello enq");
  await buyClient.zAdd(key, [{ score: score, value: value }], (err) => {
    if (err) console.log("zAdd error : ", err);
  });

  // for await (const memberWithScore of client.zScanIterator(key)) {
  //   console.log(memberWithScore);
  // }
};

export const sellEnqueue = async (key, score, value) => {
  console.log("hello enq");
  await sellClient.zAdd(key, [{ score: score, value: value }], (err) => {
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
