const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/User");
const {signupValidation , loginValidation} = require("../middleware/AuthenValidation");
const isAuthenticate = require("../middleware/isAuthenticated");
const multer = require("multer");
const { cloudinary, storage } = require("../Cloud");
const upload = multer({ storage })
router.post(
  "/signup",
//  upload.single("avatar"),
  signupValidation,
  UserController.createUser
);

router.post("/login" ,loginValidation,  UserController.loginUser)

router.post("/verifyotp" , UserController.verifyotp);


module.exports = router;