const User = require("../models/UserSchema");
const Expresserror = require("../middleware/expressError");
const  bcrypt = require("bcrypt");

module.exports.getUserProfile = async (req , res , next)=>{
       try{
            const Userid = req.user._id;
            const user = await User.findById(Userid);
            if(!user){
                return res.status(404).json({
                     success: false,
                     message : "User not found"
                })
            }
            res.status(200).json({
                 success : true,
                 user
            })

       }catch(error){
           res.status(500).json({
              success: false ,
              message : "failed to fetch user Profile"
           })  
       }
}
module.exports.UpdateUsername = async(req , res )=>{
    
       try{
           const Userid  = req.user._id;
           const {name} = req.body;
           if(!name){
                return res.status(400).json({ success: false, message: "Name is required" });
           }
           const updatedUser = await User.findByIdAndUpdate(Userid , {name} , {new :true});
           res.status(200).json({ success: true, user: updatedUser });
       }catch(err){
         console.error("error updating username" , err);
         res.status(500).json({ success: false, message: "Failed to update username" });
       }
}


module.exports.UpdateUseremail = async(req, res)=>{
       try{
           const Userid = req.user._id;
           const email = req.body.email;
              if(!email){
                return res.status(400).json({ success: false, message: "Email is required" });
              }
           const UpadatedUser = await User.findByIdAndUpdate(Userid , {email} , {new: true});
           res.status(200).json({ success: true, user: UpadatedUser });
       }catch(err){
            console.error("error updating email" , err);        
            res.status(500).json({ success: false, message: "Failed to update email" });
       }
}

module.exports.updatePassword = async(req , res)=>{
       try{
           const Userid = req.user._id;
           const {newpassword , confirmpassword} = req.body;
           
           if(newpassword !== confirmpassword){
                return res.status(400).json({success: false , message: "passwords do not match"});
           }
           const hashedpassword = await bcrypt.hash(newpassword , 10);
           const updatedUser = await User.findByIdAndUpdate(Userid , {password : hashedpassword} , {new : true});
           res.status(200).json({ success: true, user: updatedUser });
       }catch(err){
         console.error("error updating password" , err);
            res.status(500).json({ success: false, message: "Failed to update password" });
       }
}