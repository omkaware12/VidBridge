const User = require("../models/UserSchema");
const Expresserror = require("../middleware/expressError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports.createUser = async (req, res) => {
    try{
  const { name, email, password, role } = req.body;
  // const avatar = req.file?.path;

 const ExistingUser =  await User.findOne({
    $or : [{email} , {name}]
  })

   if(ExistingUser){
       return res.status(409).json({
        success: false,
        message: "User already exists, please sign in."
      });
   }

//    if(!avatar){
//       return res.status(400).json({
//         success: false,
//         message: "Please upload an avatar."
//       });
//    }

     const NewUser = new User({
        name,
        email,
        password,
        role,
      //  avatar
     })

     NewUser.password = await bcrypt.hash(NewUser.password, 10);
      await NewUser.save();
     console.log("user created success fully");
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Expresserror(error.message, 500);
    }
};


module.exports.loginUser = async(req , res) => {
     try{
          const {email , password} = req.body;
          console.log(email);
          const ExistingUser = await User.findOne({email});
          if(!ExistingUser){
                return res.status(403).json({
                 success: false,
                 message: "email or password is wrong"
                });
          }

          const ispassequal = await bcrypt.compare(password , ExistingUser.password);
          if(!ispassequal){
               return res.status(403).json({
                 success: false,
                 message: "email or password is wrong"
                });  
          }

          const jwttoken = jwt.sign({
             name: ExistingUser.name,
              email: ExistingUser.email,
              role: ExistingUser.role,
               },
            process.env.JWT_SECRET,
          {expiresIn : "4d"}
        );


           return res.status(200).json({
                 success: true,
                 message: "you are successfully logged in",
                 jwttoken,
                 email,
                 name:ExistingUser.name
                }); 
        
     }catch(err){
        console.error("Error creating user:", err);
      throw new Expresserror(err.message, 500);  
     }
};


module.exports.displayUser = async(req, res)=>{
      console.log(req.user);

      return res.status(200).json(req.user);
}