const Project = require("../models/ProjectSchema")
const channel = require("../models/Channel")
const {minioClient , BUCKET_NAME} = require("../config/minIO")


exports.createProject = async (req, res) => {
  try {
    const { title, description, deadline , priority } = req.body;
      const creatorId = req.user._id; 

      const Channel = await channel.findOne({userId: creatorId});
      if(!Channel){
        return res.status(400).json({success: false , message: "Please connect your YouTube channel first"})
      }

    let rawFileData = null;

    // If file attached, upload to MinIO
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
      channelId:Channel._id,
      deadline,
      priority,
      rawFiles: rawFileData ? [rawFileData] : []
    });

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
                id: p._id,
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