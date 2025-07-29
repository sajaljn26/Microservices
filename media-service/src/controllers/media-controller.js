const { uploadMediaToCloudinary } = require("../utils/cloudinary.js");
const logger = require("../utils/logger.js");
const Media = require("../models/media.js")
const uploadMedia = async(req,res)=>{
    logger.info("Starting media upload");
    try{

        if(!req.file){
            logger.error('No file found. Please add a file and try again')
            return res.status(400).json({
                success : false,
                message : "No file found Please add a file and try again!"
            })
        }

        const {originalname,mimeType,buffer} = req.file
        const userId = req.user.userId

        logger.info(`File details : name =${originalname},type = ${mimeType}`)
        logger.info('Uploading to cloudinary starting...')

        const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file)
        logger.info(`Cloudinary upload successful. Public id : -${cloudinaryUploadResult.public_id}`);

        const newlyCreatedMedia = new Media({
            publicId : cloudinaryUploadResult.public_id,
            originalName : originalname,
            mimeType,
            url : cloudinaryUploadResult.secure_url
        })

        await newlyCreatedMedia.save();

        res.status(201).json({
            success : true,
            mediaId : newlyCreatedMedia._id,
            url : newlyCreatedMedia.url,
            message : "Media upload is successful"
        })

    }catch(e){

        logger.error("error",error); // Changed message for clarity
        res.status(500).json({
            success : false,
            message : "Error fetching post by Id"
        });


    }
}

const getAllMedia = async(req,res)=>{
    try{

        const result = await Media.find();
        res.json({ result })

    }catch(e){
        
        logger.error("error",error); // Changed message for clarity
        res.status(500).json({
            success : false,
            message : "Error fetching post by Id"
        });

    }

}

module.exports = { uploadMedia,getAllMedia };

