const amqp = require("amqplib")
const logger = require("./logger")

let connection  = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events'

async function connectRabbitMQ(){
    try{
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME,'topic',{durable : false})
        logger.info("Connected to rabbitmq");
        return channel;

    }catch(e){
        logger.error('Error connecting to rabbit mq',e)
        throw e 
    }
}

async function PublishEvent(routingKey, message){
    if(!channel){
        await connectRabbitMQ();

    }
    channel.publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)))
    logger.info(`Event published successfully : ${routingKey}`)
}

connectRabbitMQ();

module.exports = {connectRabbitMQ , PublishEvent}