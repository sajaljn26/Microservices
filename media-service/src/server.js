require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./utils/logger.js");
const mediaRoutes = require("./routes/mediaRoutes.js");
const errorHandler = require("./middleware/errorHandler.js"); // Assuming you created this file
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq.js");
const { handlePostDeleted } = require("./eventHandlers/media-event-handlers.js");

const app = express();
const port = process.env.PORT || 3003;

// Connect to mongodb
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => logger.info("Connected to MongoDB"))
    .catch((e) => logger.error("Mongo connection error", e));

app.use(cors());
app.use(helmet());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        logger.info(`Request Body: ${JSON.stringify(req.body)}`);
    }
    next();
});

// Routes
app.use('/api/media', mediaRoutes);

// General error handler - must be the LAST middleware
app.use(errorHandler);

async function startserver(){
    try{
    
        await connectRabbitMQ();

        await consumeEvent('post.deleted',handlePostDeleted)

        app.listen(port, () => {
        logger.info(`Media service running on port ${port}`);
    });

    }catch(e){
        logger.error("Error starting server",e);
        process.exit(1);
    }
}

startserver();
// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at', promise, 'reason:', reason.stack || reason);
});