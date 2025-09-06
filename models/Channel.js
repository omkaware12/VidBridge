 const mongoose = require('mongoose');


const channelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  channelId: {
    type: String,
    required: true,
    unique: true
  },
  channelName: {
    type: String,
    required: true
  },
  subscribeCount: {
    type: Number,
    default: 0
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Channel', channelSchema);