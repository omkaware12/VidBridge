const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
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
    required: false
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  thumbnail: {
    type: String,
    default: null,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  rawFiles: [
    {
      filename: String,
      path: String,
      size: Number
    }
  ],
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["Assigned", "In Progress", "Completed", "Cancelled"],
    default: "Assigned",
  },

  // ✅ New Field for Approval Status
  isApproved: {
    type: Boolean,
    default: false, // false until the creator approves the project
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
