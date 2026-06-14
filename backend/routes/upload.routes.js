const router = require("express").Router();
const multer = require("multer");
const { uploadFile } = require("../controllers/upload.controller");


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    
    const allowed = [
      // Images
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      // Videos
      "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo",
      // Audio
      "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/aac", "audio/flac",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported: ${file.mimetype}`));
    }
  },
});

router.post("/", upload.single("file"), uploadFile);

module.exports = router;
