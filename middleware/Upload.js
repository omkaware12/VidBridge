const multer = require("multer");

// Store files in memory (not in local disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
