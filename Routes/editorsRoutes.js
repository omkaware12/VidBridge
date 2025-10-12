const express = require('express');
const router = express.Router();
const editorController = require('../Controllers/editorController');
const ensureAuthenticated = require('../middleware/isAuthenticated');
const isEditor = require('../middleware/isEditor');
// const VideoUpload  = require("../middleware/VideoUpload")
const upload  = require("../middleware/Upload")

router.get("/projects", ensureAuthenticated, editorController.getAssignedProjects);

router.patch("/projects/:id/status", ensureAuthenticated, isEditor, editorController.updateProjectStatus);

router.post("/projects/download" ,  ensureAuthenticated , isEditor , editorController.getdownloadUrl);

router.get("/projects/completed" , ensureAuthenticated , isEditor , editorController.completedvideos);

router.post(
  "/projects/upload/:taskId",
  ensureAuthenticated,
  isEditor,
  upload.single("video"),
  editorController.UploadVideo
);

router.put("/projects/:id/ask-approval",ensureAuthenticated , isEditor ,  editorController.askForApproval);

module.exports = router;