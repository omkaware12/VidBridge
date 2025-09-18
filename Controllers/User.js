const User = require("../models/UserSchema");
const Expresserror = require("../middleware/expressError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { expression } = require("joi");
const sendEmail = require("../middleware/email");



module.exports.createUser = async (req, res ) => {
    try{
  const { name, email, password, role   } = req.body;
   const avatar = req.file?.path;


 const ExistingUser =  await User.findOne({
    $or : [{email} , {name}]
  })

   if(ExistingUser){
    return next(new Expresserror("User already exists. Please sign in.", 409));
   }

   if(!avatar){
      return res.status(400).json({
        success: false,
        message: "Please upload an avatar."
      });
   }

     const NewUser = new User({
        name,
        email,
        password,
        role,
        avatar
     })

     NewUser.password = await bcrypt.hash(NewUser.password, 10);
      await NewUser.save();
       return res.status(200).json({
        message: "signup successfully enjoy now"
       });
     
    } catch (error) {
      console.error("Error creating user:", error);
        next(new Expresserror(error.message, 500)); 
    }
};


module.exports.loginUser = async(req , res , next) => {
     try{
          const {email , password} = req.body;
          console.log(email);
          const ExistingUser = await User.findOne({email});
          if(!ExistingUser){
               return next(new Expresserror("User not found please sign up.", 409));
          }

          const ispassequal = await bcrypt.compare(password , ExistingUser.password);
          if(!ispassequal){
               return next(new Expresserror("password is incorrect " , 401))  
          }

          const genrateOtp = Math.floor(100000 + Math.random() * 900000).toString();
          ExistingUser.otp  = genrateOtp;
          ExistingUser.otpExpirey = Date.now() + 5 * 60 * 1000;
          await ExistingUser.save();
          await sendEmail(email , genrateOtp);

          

           return res.status(200).json({
                 success: true,
                 message: "OTP sent to your email. Please verify.",
                 email
                }); 
        
     }catch(err){
        console.error("Error creating user:", err);
      throw new Expresserror(err.message, 500);  
     }
};


module.exports.verifyotp = async(req , res , next)=>{
    try{
        const {email , otp}  = req.body;
        const ExistingUser = await User.findOne({email});
         if(!ExistingUser){
            return next(new Expresserror("User not found.", 404));
         }

  if (ExistingUser.otp !== otp || ExistingUser.otpExpirey < Date.now()){
      return next(new Expresserror("Invalid or expired OTP.", 401));
    }

    ExistingUser.otp = undefined;
    ExistingUser.otpExpirey = undefined;
    await ExistingUser.save();


    const jwttoken = jwt.sign(
      {
        _id: ExistingUser._id,
        name: ExistingUser.name,
        email: ExistingUser.email,
        role: ExistingUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "4d" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You are logged in.",
      token: jwttoken,
      email: ExistingUser.email,
      name: ExistingUser.name,
      role: ExistingUser.role,
      id: ExistingUser._id
    });
    } catch(err){
        console.error("Error verifying OTP:", err);
    return next(new Expresserror(err.message, 500));
    }
}