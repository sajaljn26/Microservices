require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/Post-routes.js");
const errorHandler = require("./middleware/errorHandler.js");
const logger = require("./utils/logger.js");
const { connectRabbitMQ } = require("./utils/rabbitmq.js");

const app = express();
const PORT = process.env.PORT || 3002;

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

// Routes
app.use('/api/posts', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, postRoutes);

app.use(errorHandler);

async function startServer(){
   try {
      await connectRabbitMQ();
      app.listen(PORT, () => {
      logger.info(`Post service running on port ${PORT}`); 
   });

   } catch (error) {
     logger.error("Failed to connect to server",error)
     process.exit(1);
   }
    
}



// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at', promise, 'reason:', reason.stack || reason);
});

