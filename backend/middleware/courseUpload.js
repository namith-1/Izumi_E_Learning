const multer = require("multer");
const { courseStorage } = require("../config/cloudinary");

const upload = multer({
  storage: courseStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
