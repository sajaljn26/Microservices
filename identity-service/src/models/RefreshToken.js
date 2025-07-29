const mongoose = require("mongoose");
const User = require("./User");

const refreshTokenSchema = new mongoose.Schema({
    token : {
        type : String,
        required : true,
        unique : true
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    }

},
{
    timestamps : true
})

refreshTokenSchema.index({expiresAt : 1},{expiresAfterSeconds : 0})

const RefreshToken = mongoose.model('RefreshToken',refreshTokenSchema);
module.exports = RefreshToken;