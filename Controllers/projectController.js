const Project = require("../models/ProjectSchema")
const channel = require("../models/Channel")
const User = require("../models/UserSchema")
const {minioClient , BUCKET_NAME} = require("../config/minIO")


exports.createProject = async (req, res) => {
  try {
    const { title, description, deadline , priority , assignedEditor } = req.body;
      const creatorId = req.user._id; 

      const Channel = await channel.findOne({userId: creatorId});
      if(!Channel){
        return res.status(400).json({success: false , message: "Please connect your YouTube channel first"})
      }

    let rawFileData = null;

    
    if (req.file) {
      const fileName = Date.now() + "_" + req.file.originalname;

      await minioClient.putObject(
        BUCKET_NAME,
        fileName,
        req.file.buffer,
        req.file.size
      );

      rawFileData = {
        filename: fileName,
        size: req.file.size,
        path: `${BUCKET_NAME}/${fileName}`
      };
    }

    const project = await Project.create({
      title,
      description,
      creatorId,
      editorId: assignedEditor || null,
      channelId:Channel._id,
      deadline,
      priority,
      rawFiles: rawFileData ? [rawFileData] : []
    });
   await project.populate("editorId" , "name email");
    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error(" Error creating project:", error);
    res.status(500).json({ success: false, message: "Project creation failed" });
  }
};


exports.getprojectsofcreator = async (req , res)=>{
      try{
             const creatorid = req.user._id;
             const dbprojects = await Project.find({creatorId: creatorid}).populate('channelId', 'channelName').sort({ createdAt: -1 });
          
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
            }));
            res.status(200).json({success: true , projects});
      }
      catch(err){
        console.error("Error fetching projects:", err);
        res.status(500).json({ success: false, message: "Failed to fetch projects" });
      }
}

exports.DeleteProject = async(req , res)=>{
       try{
             const projectId = req.params.id;
             const project = await Project.findById(projectId);
             if(!project){
                return res.status(404).json({success: false , message : "Project NOt found" });
             }
             await Project.deleteOne({_id: projectId});
             res.status(200).json({success: true , message: "project deleted Successfully "});
       }catch(err){
         console.error("error  detedcting in project " , err);
         res.status(500).json({success: false , message : "Failed to delete project" });
       }
}

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
      
      if (project.rawFiles.length > 0) {
        const oldFilePath = project.rawFiles[0].path;
        const oldFileName = oldFilePath.split("/")[1];
        try {
          await minioClient.removeObject(BUCKET_NAME, oldFileName);
        } catch (err) {
          console.error("Failed to delete old video from MinIO:", err);
        }
      }

      
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


exports.getprojectbyid = async(req , res)=>{
     try{
          const ProjectId = req.params.id;
            const project = await Project.findById(ProjectId);
            if(!project){
                 return res.status(404).json({success: false , message: "project not found"});
            }
            res.status(200).json({success: true , project});

     }catch(err){
         console.error("error fetching project by id" , err);
         res.status(500).json({ success: false, message: "Failed to fetch project" });
     }
}

exports.getalleditors = async(req , res)=>{
    try{
       const editors = await User.find({ role: "editor" });
       res.status(200).json({ success: true, editors }); 

    }catch(err){
      console.log("error fetching editors" , err);
      res.status(500).json({ success: false, message: "Failed to fetch editors" });
    }
}