const express = require("express");
const router = express.Router();
const projectController  = require("../Controllers/projectController");
const ensureAuthenticated = require("../middleware/isAuthenticated");
const isCreator = require("../middleware/iscreator");
const upload = require("../middleware/Upload");
const { cloudinary, storage } = require("../Cloud");
const multer = require("multer");

router.post(
  "/createproject",
  ensureAuthenticated,
  isCreator,
   upload.fields([
    { name: "rawFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  projectController.createProject
);

router.get(
  "/get-creatorProjects",
  ensureAuthenticated,
  isCreator,
  projectController.getprojectsofcreator
);


router.get("/getallNotifications" , ensureAuthenticated , isCreator , projectController.getAllnotifications);


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


router.patch("/approve/:id", ensureAuthenticated, isCreator, projectController.approveNotification);


module.exports = router;
