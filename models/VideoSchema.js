const {mongoose, Schema} = require('mongoose');



const videoSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  editorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  
  // Edited video file
  videoFile: {
    filename: String,
    path: String,
    size: Number
  },
  
  // YouTube metadata
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tags: [String],
  
  
  thumbnail: {
    filename: String,
    path: String
  },
  
  // Status workflow
  status: {
    type: String,
    enum: ['uploaded', 'approved', 'rejected', 'published'],
    default: 'uploaded'
  },
  
  // Creator feedback
  feedback: String,
  
  // YouTube upload info
  youtubeVideoId: String,
  youtubeUrl: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Video', videoSchema);