const express = require("express");
const { createPost, getAllPost,getPost,DeletePost } = require('../controllers/post-controller.js');
const { authenticateRequest } = require("../middleware/authMiddleware.js");

// middleware -> if the user is an auth user or not 
const router = express.Router(); 

// Apply authentication to all routes in this router
router.use(authenticateRequest);

router.post('/create-post', createPost);
router.get('/all-posts',getAllPost)
router.get('/:id',getPost);
router.delete('/:id',DeletePost);
module.exports = router;
