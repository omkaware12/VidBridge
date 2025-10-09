const multer = require("multer");

// Store in memory, not disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
