import amqp from "amqplib";
const amqpURL = "amqp://guest:guest@localhost:5672";

exports.getChannel = async () => {
  const connection = await amqp.connect(amqpURL);
  const channel = await connection.createChannel();
  return channel;
};
