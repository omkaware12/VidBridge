const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['video_uploaded', 'video_approved', 'video_rejected'],
  },
  message: String,
  seen: {
    type: Boolean,
    default: false,
  },
  relatedVideo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoDraft',
  },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
