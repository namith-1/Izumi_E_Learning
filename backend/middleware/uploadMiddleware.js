const multer = require("multer");
const { profileStorage } = require("../config/cloudinary");

const upload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
