import * as redis from "./redis_model.js"
import Rabbitmq from "../../rabbitmq/rabbitmqService.js"
import client from "../../config/redis-config.js";
const url = "amqp://guest:guest@localhost:5672"; //rabbitmq url

//redis에 매수 저장 
export const addBuy = async (buy_info) => { 

    //buy_info 정보 : id 주문번호, userId 사용자 id, stockCode 주식 code, count 주식 매수 수량, price 주식 가격  
    await redis.selectDB(1);

    const key = buy_info.stockId;
    const score = buy_info.price;
    const value = JSON.stringify(buy_info); 
    

    await redis.enqueue(key, -score, value);
}

//redis에 매도 저장 
export const addSell = async (sell_info) => {
    //sell_info 정보 : id 주문번호, userId 사용자 id, stockCode 주식 code, count 주식 매도 수량, price 주식 가격  
    await redis.selectDB(2);

    const key = sell_info.stockId;
    const score = sell_info.price;
    const value = JSON.stringify(sell_info);

    await redis.enqueue(key, score, value);
}

// 체결 가능한 요청 mq로 전송 - 매수

export const purchaseBuy = async (stockId) => { 
    var flag = 0; 
    const stream_price = await redis.getStreamPrice(stockId);
    console.log("purchase buy ", stockId, " ", stream_price);

    const queue = "buyStockQueue"+stockId;
    const rabbitMqConn = new Rabbitmq(url, queue);

    const n = await redis.count(1, stockId);
    const outstanding = await redis.getAll(1, stockId);
    for(var i=0;i<n;i++){
        const current_price = await redis.getPrice(1, outstanding[i]);

        if(!(current_price < stream_price)){ // 체결 가능 
            if(flag == 0) await rabbitMqConn.deleteQueue();
            flag = 1
            console.log("buy msg : ", outstanding[i]);
            //rabbimq로 전송 
            await rabbitMqConn.send_message(outstanding[i]);

        }
        else break;
    }

    if(flag==1){
        const updateConn = new Rabbitmq(url, "updateStockQueue");
        updateConn.send_update(JSON.stringify({type : "buy", stockId : stockId}));
    }
}



// 체결 가능한 요청 mq로 전송 - 매도 
export const purchaseSell = async (stockId) => { // 실시간 시세
    var flag = 0; 
    const stream_price = await redis.getStreamPrice(stockId);
    console.log("purchase sell ", stockId, " ", stream_price);

    const queue = "sellStockQueue"+stockId;
    const rabbitMqConn = new Rabbitmq(url, queue);

    const n = await redis.count(2, stockId);
    const outstanding = await redis.getAll(2, stockId);
    for(var i=0;i<n;i++){
        const current_price = await redis.getPrice(2, outstanding[i]);

        if(!(current_price > stream_price)){ // 체결 가능 
            if(flag == 0) rabbitMqConn.deleteQueue();
            flag = 1
            console.log("sell msg : ", outstanding[i]);
            //rabbimq로 전송 
            rabbitMqConn.send_message(outstanding[i]);
        }
        else break;
    }

    if(flag==1){
        const updateConn = new Rabbitmq(url, "updateStockQueue");
        updateConn.send_update(JSON.stringify({type : "sell", stockId : stockId}));

    }
}