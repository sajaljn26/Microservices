require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger.js")
const express = require("express");
const helmet = require("helmet");
const app = express();
const cors = require("cors");
const {RateLimiterRedis} = require("rate-limiter-flexible");
const redis = require("ioredis")
const {rateLimit} = require("express-rate-limit")
const {RedisStore} = require("rate-limit-redis")
const routes = require("./routes/identity-service.js") 
const errorHandler = require("./middleware/errorHandler.js")
const PORT = process.env.PORT || 3001;

// connect to the mongodb
mongoose.connect(process.env.MONGODB_URI).then(()=>{
    logger.info('Connect to mongodb')
}).catch(e=>logger.error('Mongodb connection error',e));

const redisClient = new redis(process.env.REDIS_URL)
//middleware 
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req,res,next)=> {
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body,${req.body}`);
    next();
});


//Ddos protection and rate limiting 
const rateLimiter = new RateLimiterRedis({
    storeClient : redisClient,
    keyPrefix : 'middleware',
    points : 10,
    duration : 1
})

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip).then(()=>{
        next();
    }).catch(()=>{
        logger.warn(`Rate limit exceeded for IP : ${req.ip}`);
        res.status(429).json({success : false,message : "Too many request"})
    });
});

// ip based rate limiting for sensitive endpoints 
const sensitiveEndpointsLimiter = rateLimit({
    windowMs : 15 * 60 * 1000,
    max : 50,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req,res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP : ${req.ip}`);
        res.status(429).json({
            success : false,
            message : "Too many request"
        })
    },
    store : new RedisStore({
        sendCommand : (...args) => redisClient.call(...args),
    })
})


//apply sensitiveendpointlimiter to our routes

app.use('/api/auth/register',sensitiveEndpointsLimiter);

//routes
app.use('/api/auth',routes)

//error handler 
app.use(errorHandler);

app.listen(PORT,()=>{
    logger.info(`Identity service running on port ${PORT}`);
});

// unhandled promise rejection 

process.on('unhandledRejection',(reason,promise)=>{
    logger.info('Unhandled Rejection at',promise,"reason :", reason)
})