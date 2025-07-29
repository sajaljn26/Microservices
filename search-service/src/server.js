require("dotenv").config()
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler.js");
const logger = require("./utils/logger.js")
const {connectRabbitMQ,consumeEvent} = require("./utils/rabbitmq.js")
const searchRoutes = require("./routes/search-Routes.js")
const {handlePostCreated,handlePostDeleted} = require("./eventHandler/search-event-handler.js")

const app = express();
const Port = process.env.PORT || 3004;

//connect to mongodb
mongoose.connect(process.env.MONGODB_URI).then(() => {
    logger.info('Connected to MongoDB');
}).catch(e => logger.error('MongoDB connection error', e));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});
  

app.use("/api/search",searchRoutes);

app.use(errorHandler)
async function startServer(){
    try {
        
        await connectRabbitMQ();
        //consume to the events 
        await consumeEvent('post.created',handlePostCreated);
        await consumeEvent('post.deleted',handlePostCreated);
        
        app.listen(Port,() => {
            logger.info("search service is running on port 3004")
        })
    } catch (error) {
        logger.error("Failed to connect to server",error)
        process.exit(1);
    
    }
}

startServer();

