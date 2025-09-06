const express = require("express");
const googleController = require("../Controllers/google");
const ensureAuthenticated = require("../middleware/isAuthenticated");
const router = express.Router();

router.get("/login", googleController.googleLogin); // redirect to Google
router.get("/callback", googleController.googleCallback); // handle callback
router.get("/status" , ensureAuthenticated , googleController.googleStatus);
router.post("/disconnect" , ensureAuthenticated , googleController.googleDisconnect);
module.exports = router;
