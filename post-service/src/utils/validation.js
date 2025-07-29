const Joi = require('joi');


const validatePostObject = (data) => {
    const schema = Joi.object({
        content : Joi.string().min(3).max(5000).required(),
        mediaId : Joi.array()

    })

    return schema.validate(data)

}




module.exports = {validatePostObject};