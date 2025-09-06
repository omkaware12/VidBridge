const Minio = require("minio");

const minioClient = new Minio.Client({
  endPoint: "127.0.0.1",   // MinIO running locally
  port: 9000,              // API port
  useSSL: false,           // http not https
  accessKey: "minioadmin", // default, change in prod
  secretKey: "minioadmin", // default, change in prod
});

const BUCKET_NAME = "vidbridge-videos";

// Ensure bucket exists
(async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`✅ Bucket "${BUCKET_NAME}" created`);
    }
  } catch (err) {
    console.error("❌ Error checking/creating bucket:", err);
  }
})();

module.exports = { minioClient, BUCKET_NAME };
