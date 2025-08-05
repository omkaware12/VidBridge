const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  accessToken: String,
  refreshToken: String,
  scope: String,
  expiryDate: Date,
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);

