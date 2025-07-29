const logger = require("../utils/logger.js");
const Post = require("../models/Post.js")
const { validatePostObject } = require("../utils/validation.js");
const { PublishEvent } = require("../utils/rabbitmq.js");

async function invalidatePostCache(req,input){

    const cachedKey = `post:${input}`;
    await req.redisClient.del(cachedKey);

    const keys = await req.redisClient.keys("posts:*");
    if(keys.length > 0){
        await req.redisClient.del(keys)
    }
}

const createPost = async(req,res)=>{
    try{

        const {error} = validatePostObject(req.body)
        if(error){
            logger.warn('Validation error',error.details[0].message)
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            })

        }

        const {content , mediaIds } = req.body;
        const newlyCreatedPost = new Post({
            user : req.user.userId,
            content,
            mediaIds : mediaIds || []
        })

        await newlyCreatedPost.save();

        await PublishEvent('post.created',{
            postId : newlyCreatedPost._id.toString(),
            userId : newlyCreatedPost.user.toString(),
            content : newlyCreatedPost.content,
            createdAt : newlyCreatedPost.createdAt
            
        })

        await invalidatePostCache(req,newlyCreatedPost._id.toString());
        logger.info("Post created successfully");
        res.status(201).json({
            success : true,
            message : "Post created successfully"
        })

    }catch(error){
        logger.error("error creating post",error);
        res.status(500).json({
            success : false,
            message : "Error creating post" // Changed message for clarity
        });
    }
}

const getAllPost = async(req,res)=>{
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1)*limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);

        if(cachedPosts){
            return res.json(JSON.parse(cachedPosts))
        }

        const posts = await Post.find({}).sort({createdAt: -1}).skip(startIndex).limit(limit)

        const totalNoOfPosts = await Post.countDocuments();
        const result = {
            posts,
            currentPage : page,
            totalPages : Math.ceil(totalNoOfPosts/limit),
            totalPosts : totalNoOfPosts
        }

        //save your posts in redis client
        await req.redisClient.setex(cacheKey,300,JSON.stringify(result))

        res.json(result)

    }catch(error){
        logger.error("error getting all posts",error); // Changed message for clarity
        res.status(500).json({
            success : false,
            message : "Error fetching all posts" // Changed message for clarity
        });
    }
}

const getPost = async(req,res)=>{
    try{
        const postId = req.params.id;
        const cacheKey = `post:${postId}`; // Corrected to 'cacheKey'
        const cachedPost = await req.redisClient.get(cacheKey); // Renamed to 'cachedPost' for clarity

        if(cachedPost){ // Use 'cachedPost' here
            return res.json(JSON.parse(cachedPost))
        }

        const SinglePostDetailsById  = await Post.findById(postId);
        if(!SinglePostDetailsById){
            return res.status(404).json({
                message : "Post Not Found",
                success : false
            })
        }

        // Use cacheKey as the key for setex, and SinglePostDetailsById as the value
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(SinglePostDetailsById))

        res.json(SinglePostDetailsById);


    }catch(error){
        logger.error("error getting post by ID",error); // Changed message for clarity
        res.status(500).json({
            success : false,
            message : "Error fetching post by Id"
        });
    }
}

const DeletePost = async (req,res)=>{ // Made it async as it likely involves DB operations
    try{
        const postId = req.params.id;
        const deletedPost = await Post.findOneAndDelete({
            _id : req.params.id,
            user : req.user.userId
        })

        if(!deletedPost){
            return res.status(404).json({
                success : false,
                message : "Post not found"
            });
        }


        //publish post delete method
        await PublishEvent('post.delete',{
            postId : post._id.toString(),
            userId : req.user.userId,
            mediaIds : post.mediaIds
        })

        await invalidatePostCache(req,req.params.id); // Invalidate cache after deletion
        logger.info("Post deleted successfully");
        res.status(200).json({
            success : true,
            message : "Post deleted successfully"
        });

    }catch(error){
        logger.error("error deleting post",error);
        res.status(500).json({
            success : false,
            message : "Error deleting post" // Changed message for clarity
        });
    }
}


module.exports = {DeletePost,createPost,getAllPost,getPost}