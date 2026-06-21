const multer = require("multer");
const { resumeStorage } = require("../config/cloudinary");

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for resumes
});

module.exports = uploadResume;
