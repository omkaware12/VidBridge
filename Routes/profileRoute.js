const express = require("express");
const router = express.Router();
const profileController = require("../Controllers/profileController");
const ensureAuthenticated = require("../middleware/isAuthenticated");


router.get("/getuserprofile" , ensureAuthenticated , profileController.getUserProfile);

router.put("/updateusername" , ensureAuthenticated , profileController.UpdateUsername);

router.put("/updateuseremail" , ensureAuthenticated , profileController.UpdateUseremail);

router.put("/updatepassword" , ensureAuthenticated , profileController.updatePassword);

module.exports = router;
