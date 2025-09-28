// middlewares/upload.js
const multer = require("multer");
const { default: VideoUpload } = require("../../Frontend/src/components/Dashbaord2/VideoUpload");

// Store files in memory (RAM)
const storage = multer.memoryStorage();

const VideoUpload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 500 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"), false);
    }
  },
});

module.exports = VideoUpload;
