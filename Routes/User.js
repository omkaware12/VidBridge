const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/User");

router.post("/signup", UserController.createUser);

module.exports = router;