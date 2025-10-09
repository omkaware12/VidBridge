const express = require('express');
const router = express.Router();
const editorController = require('../Controllers/editorController');
const ensureAuthenticated = require('../middleware/isAuthenticated');
const isEditor = require('../middleware/isEditor');
// const VideoUpload  = require("../middleware/VideoUpload")
const upload  = require("../middleware/Upload")

router.get("/editor/projects", ensureAuthenticated, editorController.getAssignedProjects);

router.patch("/editor/projects/:id/status", ensureAuthenticated, isEditor, editorController.updateProjectStatus);

router.post("/editor/projects/download" ,  ensureAuthenticated , isEditor , editorController.getdownloadUrl);

router.get("/editor/projects/completed" , ensureAuthenticated , isEditor , editorController.completedvideos);

router.post(
  "/editor/projects/upload/:taskId",
  ensureAuthenticated,
  isEditor,
  upload.single("video"),   // <-- multer handles file (stored in memory buffer)
  editorController.UploadVideo
);

module.exports = router;