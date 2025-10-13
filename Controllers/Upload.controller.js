const fs = require("fs");
const path = require("path");
const { extractAudio } = require("../Utils/ffmpegUtils");
const { transcribeAudio } = require("../services/transcription.service");
const { generateThumbnail } = require("../services/thumbnail.service");

// Helper function to safely delete files
const safeDeleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      // Add a small delay to ensure file handles are released
      await new Promise(resolve => setTimeout(resolve, 100));
      await fs.promises.unlink(filePath);
      console.log(`Deleted: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to delete ${filePath}:`, error.message);
  }
};

module.exports.handleUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const inputPath = req.file.path;
  const outputPath = path.join("uploads", `${req.file.filename}-audio.wav`);

  try {
    await extractAudio(inputPath, outputPath);

    const transcript = await transcribeAudio(outputPath);
    const { thumbnailBase64, thumbnailJSON, llmPrompt, finalTitle, finalDescription, finalTags } = await generateThumbnail(transcript);

    // Send response first
    res.json({
      transcript,
      llmPrompt,
      thumbnail: `data:image/png;base64,${thumbnailBase64}`,
      thumbnailJSON,
      finalTitle,
      finalDescription,
      finalTags,
    });

    // console.log("transcript : ", transcript);
    // console.log("\n");
    // console.log("llmPrompt : ", llmPrompt);
    // console.log("\n");
    // console.log("thumbnailJSON : ", thumbnailJSON);
    // console.log("\n");
    // console.log("finalTitle : ", finalTitle);
    // console.log("\n");
    // console.log("finalDescription : ", finalDescription);
    // console.log("\n");
    // console.log("finalTags : ", finalTags);

    // Clean up files after response is sent
    await safeDeleteFile(inputPath);
    await safeDeleteFile(outputPath);

  } catch (err) {
    console.error(err);
    
    // Clean up on error (also use safe delete)
    await safeDeleteFile(inputPath);
    await safeDeleteFile(outputPath);
    
    res.status(500).json({ error: err.message });
  }
};