const express = require("express");
const router = express.Router();
const projectController  = require("../Controllers/projectController");
const ensureAuthenticated = require("../middleware/isAuthenticated");
const isCreator = require("../middleware/iscreator");
const upload = require("../middleware/Upload");

router.post(
  "/createproject",
  ensureAuthenticated,
  isCreator,
  upload.single("rawFile"),
  projectController.createProject
);

router.get(
  "/get-creatorProjects",
  ensureAuthenticated,
  isCreator,
  projectController.getprojectsofcreator
);

router.delete("/:id", ensureAuthenticated, isCreator, projectController.DeleteProject);

router.put(
  "/:id",
  ensureAuthenticated,
  isCreator,
  upload.single("rawFile"),
  projectController.UpdateProject
);

router.get(
  "/editors",
  ensureAuthenticated,
  isCreator,
  projectController.getalleditors
);

router.get("/:id", ensureAuthenticated, isCreator, projectController.getprojectbyid);

module.exports = router;
