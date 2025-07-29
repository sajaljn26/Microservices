const Media = require("../models/media");
const logger = require("../utils/logger");

const handlePostDeleted = async(event)=>{
    console.log(event,"eventeventevent");
    const {postId,mediaIds} = event;
    try{
        const mediaToDelete = await Media.find({_id : {$in : mediaIds} })

        for(const media of mediaToDelete){
            await deleteMediaFromCloudinary(media.publicId);
            await Media.findByIdAndDelete(media._id);

            logger.info(`Deleted media ${media._id} associated with the delted post ${postId}`)

        }

        logger.info(`Process deletion of media for postId ${postId}`);

    }catch(e){
        logger.error(e,'Error occured while media deletion')
    }
}

module.exports = {handlePostDeleted}