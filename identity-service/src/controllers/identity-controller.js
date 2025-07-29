const {validateRegistration, validateLogin} = require("../utils/validation.js");
const {generateToken} = require("../utils/generateToken.js")
const logger = require("../utils/logger.js");
const User = require("../models/User.js");
const RefreshToken = require("../models/RefreshToken.js");
//const { error } = require("winston");
// user registration 
const registerUser = async(req,res) => {
    logger.info("Registration endpoint hit")
    try{
        // validate the schema 
        const {error} = validateRegistration(req.body)
        if(error){
            logger.warn('Validation error',error.details[0].message)
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            })

        }

        const {email,username,password} = req.body;
        let user = await User.findOne({$or : [{email},{username}]});
        if(user){
            logger.warn("User already exists");
             return res.status(400).json({
                success : false,
                message : "User already exists"
            })
        }
        user = new User({username,email,password})
        await user.save();
        logger.warn("User saved successfully",user._id);

        const {accessToken,refreshToken} = await generateToken(user);

        res.status(201).json({
            success : true,
            message : "User registered successfully",
            accessToken,
            refreshToken
        })

    }catch(e){
      logger.error("Registration error occured")
      res.status(500).json({
        success : false,
        message : "Problem in registrating the user",
        error : e.message
      })
    }
}

// user login 
const loginUser = async(req,res)=>{
    logger.info("Logging endpoint hit");
    try{
        const {error} = validateLogin(req.body)
         if(error){
            logger.warn('Validation error',error.details[0].message)
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            })

        }
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            logger.warn("Invalid user");
            return res.status(400).json({
                success : false,
                message : "Invalid credentials"
            })
        }
        // valid password or not
        const isvalidPassword = await user.comparePassword(password); 
        if(!isvalidPassword){
            return res.status(400).json({
                success : false,
                message : "Invalid Credentials"
            })
        }

        const {accessToken,refreshToken} = await generateToken(user)
        res.json({
            accessToken,
            refreshToken,
            userId : user._id
        })
    }catch(e){
      logger.error("Login error occured")
      res.status(500).json({
        success : false,
        message : "Internal server error",
      
      })
    }
}


// refresh token 
const refreshTokenUser = async(req,res)=>{
     logger.info("Refresh token endpoint hit");
     try{
        const {refreshToken} = req.body
        if(!refreshToken){
            logger.warn("Refresh Token Missing");
            return res.status(400).json({
                success : false,
                message : "Refresh token missing"
            });
        }
        const storedToken = await RefreshToken.findOne({token : refreshToken})

        if(!storedToken || storedToken.expiresAt < new Date()){
            logger.warn("Invalid or expired refresh Token");
            return res.status(401).json({
                success : false,
                message : `Invalid or expired refresh Token`
            })
        }
        const user = await User.findById(storedToken.user);
        if(!user){
            return res.status(401).json({
                success : false,
                message : `User not found`
            })
        }
        const {accessToken : newAccessToken ,refreshToken : newRefreshToken} = await generateToken(user) 

        await RefreshToken.deleteOne({_id : storedToken._id});

        res.json({
            accessToken : newAccessToken,
            refreshToken : newRefreshToken
        })

     }catch(e){
        logger.error("Refresh Token error occured",e);
        res.status(500).json({
            success : false,
            message : "Internal server error"
        })
     }
}

// logout ->

const logoutUser = async(req,res) => {
    logger.info("Logout endpoint hhit...");
    try{

        const {refreshToken} = req.body;
         if(!refreshToken){
            logger.warn("Refresh Token Missing");
            return res.status(400).json({
                success : false,
                message : "Refresh token missing"
            });
        }

        await RefreshToken.deleteOne({token : refreshToken});
        logger.info("Refresh token deleted for logout ")
        res.json({
            success : true,
            message  : "logout successful"
        })

    }catch(e){
        logger.info("Error while logging out",e);
        res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }
}

module.exports = {registerUser,loginUser,refreshTokenUser,logoutUser}