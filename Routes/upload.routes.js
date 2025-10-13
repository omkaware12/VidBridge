const express = require("express");
const UploadVideo = require("../Controllers/Upload.controller");
const upload = require("../middleware/Upload");
const multer = require("multer");

const router = express.Router();

router.post("/", UploadVideo.handleUpload);

module.exports = router;
