const Project = require("../models/ProjectSchema");
const channel = require("../models/Channel");
const User = require("../models/UserSchema");
const { minioClient, BUCKET_NAME } = require("../config/minIO");
const { cloudinary } = require("../Cloud");
const streamifier = require("streamifier");
const notifications = require("../models/Notification");
const fs = require("fs");
const { google } = require("googleapis");
const { Readable } = require("stream");
const path = require("path");

exports.createProject = async (req, res) => {
  try {
    const { title, description, deadline, priority, assignedEditor } = req.body;
    const creatorId = req.user._id;

    const Channel = await channel.findOne({ userId: creatorId });
    if (!Channel) {
      return res.status(400).json({
        success: false,
        message: "Please connect your YouTube channel first",
      });
    }

    let rawFileData = null;
    let thumbnailUrl = null;

    // ✅ Handle raw file upload to MinIO
    if (req.files?.rawFile?.[0]) {
      const rawFile = req.files.rawFile[0];
      const fileName = Date.now() + "_" + rawFile.originalname;

      await minioClient.putObject(
        BUCKET_NAME,
        fileName,
        rawFile.buffer,
        rawFile.size
      );

      rawFileData = {
        filename: fileName,
        size: rawFile.size,
        path: `${BUCKET_NAME}/${fileName}`,
      };
    }

    // ✅ Handle thumbnail upload to Cloudinary
    if (req.files?.thumbnail?.[0]) {
      const thumbFile = req.files.thumbnail[0];

      const uploadToCloudinary = () =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "thumbnails",
              resource_type: "image",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          streamifier.createReadStream(thumbFile.buffer).pipe(uploadStream);
        });

      const result = await uploadToCloudinary();
      thumbnailUrl = result.secure_url;
    }

    // ✅ Create the project
    const project = await Project.create({
      title,
      description,
      creatorId,
      editorId: assignedEditor || null,
      channelId: Channel._id,
      deadline,
      priority,
      rawFiles: rawFileData ? [rawFileData] : [],
      thumbnail: thumbnailUrl,
    });

    await project.populate("editorId", "name email");
    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ success: false, message: "Project creation failed" });
  }
};

exports.getprojectsofcreator = async (req, res) => {
  try {
    const creatorid = req.user._id;
    const dbprojects = await Project.find({ creatorId: creatorid })
      .populate("channelId", "channelName")
      .sort({ createdAt: -1 });

    const projects = dbprojects.map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      priority: p.priority,
      priorityColor:
        p.priority === "High"
          ? "bg-red-500"
          : p.priority === "Medium"
          ? "bg-yellow-500"
          : "bg-green-500",
      type: "Video Production",
      startDate: new Date(p.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      channelName: p.channelId?.channelName || "N/A",
      rawFiles: p.rawFiles,
      thumbnail: p.thumbnail,
    }));
    res.status(200).json({ success: true, projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ success: false, message: "Failed to fetch projects" });
  }
};

exports.DeleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project Not found" });
    }
    await Project.deleteOne({ _id: projectId });
    res.status(200).json({ success: true, message: "project deleted Successfully " });
  } catch (err) {
    console.error("error detecting in project ", err);
    res.status(500).json({ success: false, message: "Failed to delete project" });
  }
};

exports.UpdateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description, deadline, priority, editor } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.deadline = deadline || project.deadline;
    project.priority = priority || project.priority;

    if (editor) {
      project.editorId = editor;
    }

    if (req.file) {
      // Delete old file from MinIO
      if (project.rawFiles.length > 0) {
        const oldFilePath = project.rawFiles[0].path;
        const oldFileName = oldFilePath.split("/")[1];
        try {
          await minioClient.removeObject(BUCKET_NAME, oldFileName);
        } catch (err) {
          console.error("Failed to delete old video from MinIO:", err);
        }
      }

      // Upload new file
      const fileName = Date.now() + "_" + req.file.originalname;
      await minioClient.putObject(
        BUCKET_NAME,
        fileName,
        req.file.buffer,
        req.file.size
      );

      project.rawFiles = [
        {
          filename: fileName,
          path: `${BUCKET_NAME}/${fileName}`,
          size: req.file.size,
        },
      ];
    }

    await project.save();

    res.status(200).json({
      success: true,
      project,
      message: "Project updated successfully",
    });
  } catch (err) {
    console.error("Error updating Project", err);
    res.status(500).json({ success: false, message: "Failed to update project" });
  }
};

exports.getprojectbyid = async (req, res) => {
  try {
    const ProjectId = req.params.id;
    const project = await Project.findById(ProjectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "project not found" });
    }
    res.status(200).json({ success: true, project });
  } catch (err) {
    console.error("error fetching project by id", err);
    res.status(500).json({ success: false, message: "Failed to fetch project" });
  }
};

exports.getalleditors = async (req, res) => {
  try {
    const editors = await User.find({ role: "editor" });
    res.status(200).json({ success: true, editors });
  } catch (err) {
    console.log("error fetching editors", err);
    res.status(500).json({ success: false, message: "Failed to fetch editors" });
  }
};

// ✅ FIXED: Changed variable name from Notification to notifications
exports.getAllnotifications = async (req, res) => {
  try {
    const creatorid = req.user._id;
    const notificationsList = await notifications.find({ userId: creatorid }).sort({ createdAt: -1 });
    
    console.log("Notifications found:", notificationsList);
    
    res.status(200).json({
      success: true,
      notifications: notificationsList, // ✅ Fixed: consistent naming
    });
  } catch (err) {
    console.log("error fetching notifications", err);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

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

  await oauth2Client.getAccessToken();
  return oauth2Client;
}

// ✅ FIXED: Approve notification & upload video
exports.approveNotification = async (req, res) => {
  try {
    const { id: notificationId } = req.params;

    // 1️⃣ Find notification
    const notification = await notifications.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    // 2️⃣ Find project
    const project = await Project.findById(notification.relatedProject).populate("channelId");
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const channelDoc = project.channelId;
    if (!channelDoc) {
      return res.status(400).json({ success: false, error: "No linked YouTube channel" });
    }

    // 3️⃣ Get first video file
    const videoFile = project.rawFiles?.[0];
    if (!videoFile || !videoFile.path) {
      return res.status(400).json({ success: false, error: "No video file found" });
    }

    // ✅ FIXED: Extract filename correctly from path
    const fileName = videoFile.path.includes("/") 
      ? videoFile.path.split("/").pop() 
      : videoFile.filename;

    console.log("Fetching video from MinIO:", fileName);

    // 4️⃣ Fetch video stream from MinIO
    const videoStream = await minioClient.getObject(BUCKET_NAME, fileName);

    // 5️⃣ Setup YouTube client
    const oauth2Client = await getOAuthClient(channelDoc);
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // 6️⃣ Upload video to YouTube
    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { 
          title: project.title, 
          description: project.description || "",
          // ✅ Optional: Add thumbnail if available
          // thumbnails: project.thumbnail ? { default: { url: project.thumbnail } } : undefined
        },
        status: { privacyStatus: "private" },
      },
      media: { body: videoStream },
    });

    // 7️⃣ Update project
    project.status = "Completed";
    project.isApproved = true;
    project.uploadedVideoId = response.data.id;
    await project.save();

    // 8️⃣ Mark notification as read
    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Video uploaded successfully",
      youtubeVideoId: response.data.id,
      videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`,
    });
    } catch (err) {
      console.error("❌ Error in approveNotification:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message || "Failed to approve and upload video" 
      });
    }
  };