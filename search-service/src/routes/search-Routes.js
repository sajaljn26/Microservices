// src/routes/searchRoute.js
const express = require("express");
const { searchPostController } = require("../controller/searchController.js");
const { authenticateRequest } = require("../middleware/authMiddleware.js"); // ✅ MUST match the export

const router = express.Router();

router.use(authenticateRequest); 
router.get("/", searchPostController);

module.exports = router;
