// ─── backend/routes/courses/uploadVideo.js ───────────────────────────────────
//
// 1. Install deps:
//    npm install cloudinary multer multer-storage-cloudinary
//
// 2. Add to your .env:
//    CLOUDINARY_CLOUD_NAME=your_cloud_name
//    CLOUDINARY_API_KEY=your_api_key
//    CLOUDINARY_API_SECRET=your_api_secret
//
// 3. Mount this router in your main courses router:
//    const uploadVideoRouter = require('./uploadVideo');
//    router.use('/', uploadVideoRouter);
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

/**
 * @swagger
 * /api/courses/upload-video:
 *   post:
 *     summary: Upload course video to Cloudinary
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (mp4, mov, avi, mkv, webm)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Video uploaded successfully."
 *                 videoUrl:
 *                   type: string
 *                   example: "https://res.cloudinary.com/.../course_videos/video.mp4"
 *                 publicId:
 *                   type: string
 *                   example: "course_videos/video"
 *       400:
 *         description: No video file received or unsupported file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No video file received."
 *       413:
 *         description: File exceeds size limit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File exceeds the 500 MB limit."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// ── Cloudinary config (reads from .env automatically) ────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Cloudinary config (reads from .env automatically) ────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer-Cloudinary storage — streams directly, no local temp file ──────────
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:         "course_videos",          // Cloudinary folder name
    resource_type:  "video",                  // required for non-image assets
    allowed_formats: ["mp4", "mov", "avi", "mkv", "webm"],
    // Cloudinary will transcode to mp4 + generate a thumbnail automatically.
    // Remove the next line if you want the original format preserved:
    format: "mp4",
    // Optional: cap upload size on Cloudinary side too (in bytes)
    // transformation: [{ quality: "auto" }],
  }),
});

// ── File-size limit (500 MB) enforced by multer ───────────────────────────────
const MAX_SIZE_BYTES = 500 * 1024 * 1024;

const upload = multer({
  storage: videoStorage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported video type: ${file.mimetype}`), false);
    }
  },
});

// ── POST /api/courses/upload-video ────────────────────────────────────────────
// Protected: attach your isAuthenticated + isInstructor middleware as needed.
router.post(
  "/upload-video",
  // isAuthenticated,   // ← uncomment your auth middleware
  // isInstructor,      // ← uncomment your role check
  (req, res, next) => {
    upload.single("video")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ message: "File exceeds the 500 MB limit." });
        }
        return res.status(400).json({ message: err.message });
      }
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No video file received." });
    }

    // multer-storage-cloudinary puts the Cloudinary URL in req.file.path
    const videoUrl = req.file.path;

    return res.status(200).json({
      message: "Video uploaded successfully.",
      videoUrl,                          // ← this is what VideoUploader stores as videoLink
      publicId: req.file.filename,       // store if you want to delete later
    });
  }
);

module.exports = router;


// ─── OPTIONAL: delete a video from Cloudinary ─────────────────────────────────
// Call this when an instructor replaces or deletes a video module.
//
// router.delete("/upload-video/:publicId", isAuthenticated, isInstructor, async (req, res) => {
//   try {
//     const result = await cloudinary.uploader.destroy(req.params.publicId, {
//       resource_type: "video",
//     });
//     res.json({ result });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });