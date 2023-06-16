import Rabbitmq from "./rabbitmqService.js"
const url = "amqp://guest:guest@localhost:5672"; //rabbitmq url
const queue = "test"; //임시 queue이름이고 필요한 상황에 맞게 이름 따로 지정해줘야 한다.

export default class rabbitmqAPI {
    static send_message = async (req, res) => {
        try {
            let { msg } = req.body;
            const conn = new Rabbitmq(url, queue);

            await conn.send_message(msg);
            res.status(200).json({ result: true });
        } catch (error) {
            console.log(error);
        }
    }
};