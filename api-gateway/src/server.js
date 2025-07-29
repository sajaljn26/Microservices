require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const logger = require("../../identity-service/src/utils/logger");
const proxy = require("express-http-proxy");
const { validateToken } = require("./middleware/authMiddleware");

const PORT = process.env.PORT || 3000;

// Create the Redis client instance
const redisClient = new Redis(process.env.REDIS_URL, {
    // Add a connection timeout to prevent hanging
    connectTimeout: 10000,
    // Automatically resubscribe on reconnect
    autoResubscribe: true,
});

// --- Redis Event Listeners ---

// Log when the client successfully connects
redisClient.on('ready', () => {
    logger.info('Successfully connected to Redis.');
    // Start the Express server ONLY after Redis is ready
    startServer();
});

// Handle connection errors
redisClient.on('error', (err) => {
    logger.error('Could not connect to Redis.', err);
    // Exit the process if Redis is essential for the app to run
    process.exit(1);
});


// --- Express Server Setup ---

// We wrap the server setup in a function to be called later
const startServer = () => {
    const app = express();

    // Security & middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    // Rate Limiting - Now guaranteed to have a connected Redis client
    const rateLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({
                success: false,
                message: "Too many requests, please try again later."
            });
        },
        // FIX: Reverted to using `redisClient.call`. The `ioredis` library's `.call()` method
        // is designed to handle raw commands in the format that `rate-limit-redis` sends them,
        // avoiding the internal 'isPipeline' error.
        store: new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
        })
    });
    app.use(rateLimiter);

    // Request Logger
    app.use((req, res, next) => {
        logger.info(`Received ${req.method} request to ${req.url}`);
        if (req.body && Object.keys(req.body).length > 0) {
            logger.info(`Request body: ${JSON.stringify(req.body)}`);
        }
        next();
    });

    // Proxy Options
    const proxyOptions = {
        proxyReqPathResolver: (req) => {
            return req.originalUrl.replace(/^\/v1/, "/api");
        },
        proxyErrorHandler: (err, res, next) => {
            logger.error(`Proxy error: ${err.message || 'No error message provided'}`);
            if (!res.headersSent) {
                res.status(500).json({
                    message: "Internal server error in proxy",
                    error: err.message || 'Unknown error'
                });
            }
        }
    };

    // Proxy to Identity Service
    app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers = proxyReqOpts.headers || {};
            proxyReqOpts.headers["Content-Type"] = "application/json";
            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(`Response received from the identity service: ${proxyRes.statusCode}`);
            return proxyResData;
        }
    }));

    // Proxy to Post Service
    app.use('/v1/posts', validateToken, proxy(process.env.POST_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers = proxyReqOpts.headers || {};
            proxyReqOpts.headers['Content-Type'] = "application/json";
            if (srcReq.user && srcReq.user.userId) {
                proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
            }
            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(`Response received from the post service: ${proxyRes.statusCode}`);
            return proxyResData;
        }
    }));

    app.use('/v1/media',validateToken,proxy(process.env.MEDIA_SERVICE_URL,{
        ...proxyOptions,
         proxyReqOptDecorator: (proxyReqOpts, srcReq) =>{
            if (srcReq.user && srcReq.user.userId) {
                proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
            }
            if(!srcReq.headers['content-type'].startsWith('multipart/form-data')){
                 proxyReqOpts.headers['Content-Type'] = "application/json";
            }

            return proxyReqOpts;

         },
         userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(`Response received from the media service: ${proxyRes.statusCode}`);
            return proxyResData;
        },parseReqBody : false

    }))


    app.use('/v1/search', validateToken, proxy(process.env.SEARCH_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers = proxyReqOpts.headers || {};
            proxyReqOpts.headers['Content-Type'] = "application/json";
            if (srcReq.user && srcReq.user.userId) {
                proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
            }
            return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(`Response received from the post service: ${proxyRes.statusCode}`);
            return proxyResData;
        }
    }));

    // Global Error Handler
    app.use((err, req, res, next) => {
        logger.error(`Unhandled error: ${err.stack || err}`);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "An unexpected error occurred.",
                error: err.message
            });
        }
    });

    // Start Server
    app.listen(PORT, () => {
        logger.info(`API Gateway is running on port ${PORT}`);
        
    });
};
