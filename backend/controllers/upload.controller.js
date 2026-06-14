const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const getResourceType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "video";
  
  if (mimetype === "application/pdf") return "image";
  return "raw";
};

const getFileType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
};

const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};


const buildDeliveryUrl = (secure_url, mimetype, originalname) => {
  if (mimetype === "application/pdf") {
    
    return secure_url.replace("/image/upload/", "/image/upload/fl_attachment/");
  }
  if (getResourceType(mimetype) === "raw") {
    
    return secure_url.replace("/raw/upload/", "/raw/upload/fl_attachment/");
  }
  return secure_url;
};

const uploadFile = async (req, res) => {
  try {
    const { originalname, mimetype, buffer } = req.file;
    const resourceType = getResourceType(mimetype);
    const fileType = getFileType(mimetype);

    const options = {
      resource_type: resourceType,
      
      ...(resourceType === "raw" && {
        public_id: `prism_docs/${Date.now()}_${originalname.replace(/\s+/g, "_")}`,
        use_filename: true,
        unique_filename: false,
      }),
      
      ...(mimetype === "application/pdf" && {
        public_id: `prism_docs/${Date.now()}_${originalname.replace(/\s+/g, "_")}`,
        format: "pdf",
      }),
      
      ...(resourceType === "video" && {
        eager: [{ quality: "auto" }],
        eager_async: true,
      }),
    };

    const result = await uploadToCloudinary(buffer, options);
    const deliveryUrl = buildDeliveryUrl(result.secure_url, mimetype, originalname);

    res.json({
      secure_url: deliveryUrl,
      fileType,
      fileName: originalname,
    });
  } catch (err) {
    console.error("Upload error:", err);

    const message =
      err.http_code === 400 ? "File type not supported by Cloudinary." :
      err.http_code === 413 ? "File too large (max 100MB)." :
      err.http_code === 420 ? "Cloudinary rate limit hit. Try again shortly." :
      `Upload failed: ${err.message || "Unknown error"}`;

    res.status(500).json({ error: message });
  }
};

module.exports = { uploadFile };
