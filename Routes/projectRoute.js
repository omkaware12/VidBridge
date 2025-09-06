const express = require("express");
const router = express.Router();
const projectConroller  = require("../Controllers/projectController");
const ensureAuthenticated = require("../middleware/isAuthenticated");
const isCreator = require("../middleware/iscreator");
const upload = require("../middleware/Upload")

router.post("/createproject" , ensureAuthenticated , isCreator ,  upload.single("rawFile") ,  projectConroller.createProject);

router.get("/get-creatorProjects" , ensureAuthenticated  , isCreator , projectConroller.getprojectsofcreator);



module.exports = router;
