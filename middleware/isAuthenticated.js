const jwt = require("jsonwebtoken");
const ExpressError = require("./expressError")

const ensureAuthenticated = (req  , res, next)=>{
    const Auth = req.headers['authorization'];
    if(!Auth){
        return next(new ExpressError("jwt token rewuired" , 401));
    }

    try{
        const decode = jwt.verify(Auth , process.env.JWT_SECRET);
        req.user = decode;
        next();
    }catch(err){
          throw next(new ExpressError(err , 500));
    }
};


module.exports = ensureAuthenticated;

