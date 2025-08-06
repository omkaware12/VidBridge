  const User = require('../models/UserSchema');
module.exports.createUser = async(req , res)=>{
      
         const { name, email, password, role } = req.body;
  console.log("User Signup Data:", { name, email, password, role });
}

