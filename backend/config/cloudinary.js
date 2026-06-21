const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'izumi/profiles',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const courseStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'izumi/courses',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 800, height: 450, crop: 'limit' }],
  },
});

const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'izumi/resumes',
    allowed_formats: ['pdf', 'docx', 'doc', 'jpg', 'png', 'jpeg'],
    resource_type: 'auto',
  },
});

module.exports = {
  cloudinary,
  profileStorage,
  courseStorage,
  resumeStorage,
};
