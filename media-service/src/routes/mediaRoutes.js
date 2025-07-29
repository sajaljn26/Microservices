const express = require("express");
const multer = require("multer");
const { uploadMedia, getAllMedia } = require("../controllers/media-controller.js");
const { authenticateRequest } = require("../middleware/authMiddleware.js");
const logger = require("../utils/logger.js");

const router = express.Router();

// Configure multer for upload 
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    },
}).single('file');

// Define the route with the middleware chain.
// 1. Authenticate, 2. Upload, 3. Process the file
router.post('/upload', authenticateRequest, upload, uploadMedia);

// This middleware will catch errors specifically from Multer on this router
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        logger.error(`Multer error: ${err.message}`);
        return res.status(400).json({
            errorType: 'File Upload Error',
            errorMessage: err.message,
        });
    } else if (err) {
        logger.error(`Unknown error during upload: ${err.message}`);
        // Pass to the general error handler in server.js
        next(err); 
    }
});

router.get('/get',authenticateRequest,getAllMedia);

module.exports = router;