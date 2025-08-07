const jwt = require("jsonwebtoken");
const ExpressError = require("./expressError")

const ensureAuthenticated = (req  , res, next)=>{
    const Auth = req.headers['authorization'];
    if(!Auth){
        return res.status(403).json({
            message:"jwt token is required"
        });
    }

    try{
        const decode = jwt.verify(Auth , process.env.JWT_SECRET);
        req.user = decode;
        next();
    }catch(err){
          throw new ExpressError(err , 500);
    }
};


module.exports = ensureAuthenticated;