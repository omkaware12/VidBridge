const Project = require("../models/ProjectSchema");
const User = require("../models/UserSchema");
const { minioClient, BUCKET_NAME } = require("../config/minIO");
const { google } = require("googleapis");
const Channel = require("../models/Channel");
const { Readable } = require("stream");

// ======================== GET ASSIGNED PROJECTS ========================
module.exports.getAssignedProjects = async (req, res) => {
  try {
    const EditorId = req.user._id;
    const Projects = await Project.find({ editorId: EditorId })
      .populate("creatorId", "name email")
      .populate("channelId", "channelName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, projects: Projects });
  } catch (err) {
    console.error("Error fetching assigned projects", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch assigned projects" });
  }
};

// ======================== UPDATE PROJECT STATUS ========================
module.exports.updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Assigned",
      "In Progress",
      "Completed",
      "Cancelled",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const project = await Project.findOne({ _id: id, editorId: req.user._id });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found or not assigned to you" });
    }

    project.status = status;
    await project.save();

    res.status(200).json({ success: true, message: "Status updated", project });
  } catch (err) {
    console.error("Error updating project status", err);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

// ======================== GET DOWNLOAD URL ========================
module.exports.getdownloadUrl = async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, message: "Project Id is missing" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const filePath = project.rawFiles[0]?.path;
    if (!filePath) {
      return res.status(400).json({ error: "No file available for download" });
    }

    const objectName = filePath.startsWith(`${BUCKET_NAME}/`)
      ? filePath.replace(`${BUCKET_NAME}/`, "")
      : filePath;

    const url = await minioClient.presignedUrl(
      "GET",
      BUCKET_NAME,
      objectName,
      3600
    );

    res.json({ url });
  } catch (err) {
    console.error("MinIO download error:", err);
    res.status(500).json({ error: "Failed to generate download link" });
  }
};

// ======================== COMPLETED VIDEOS ========================
module.exports.completedvideos = async (req, res) => {
  try {
    const projects = await Project.find({
      editorId: req.user._id,
      status: "Completed",
    })
      .populate("creatorId", "name email")
      .populate("channelId", "channelName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.log("Error occurred", error);
    res.status(500).json({ error: "internal server error" });
  }
};

// ======================== OAUTH CLIENT HELPER ========================
// editorController.js

async function getOAuthClient(channel) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: channel.accessToken,
    refresh_token: channel.refreshToken,
  });

  // 🔑 ensures fresh token if old one expired
  await oauth2Client.getAccessToken();

  return oauth2Client;
}

module.exports.UploadVideo = async (req, res) => {
  try {
    console.log("📥 FILE:", {
      name: req.file?.originalname,
      type: req.file?.mimetype,
      size: req.file?.size,
    });
    console.log("📥 BODY:", req.body);
    console.log("📥 PARAMS:", req.params);

    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    // 1️⃣ Find project
    const project = await Project.findById(req.params.taskId).populate(
      "channelId"
    );
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 2️⃣ Get linked channel
    const channel = project.channelId;
    if (!channel) {
      return res.status(400).json({ error: "No channel linked to this project" });
    }

    // 3️⃣ Setup YouTube API client
    const oauth2Client = await getOAuthClient(channel);
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // 4️⃣ Convert file buffer → stream
    const bufferStream = Readable.from(req.file.buffer);

    // 5️⃣ Upload video
    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: req.body.title || project.title,
          description: req.body.description || project.description,
        },
        status: { privacyStatus: "private" },
      },
      media: { body: bufferStream },
    });

    console.log("✅ YouTube upload response:", response.data);

    // 6️⃣ Update project
    project.status = "Completed";
    await project.save();

    res.status(200).json({
      message: "Video uploaded successfully",
      videoId: response.data.id,
    });
  } catch (error) {
    console.error("❌ Upload error:", JSON.stringify(error, null, 2));
    res.status(500).json({
      error: error.message,
      details: error.errors || null,
    });
  }
};
