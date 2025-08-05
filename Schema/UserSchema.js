const mongoose = require("mongoose");
const {Schema} = mongoose;


const userSchema = new Schema({
  role: {
    type: String,
    enum: ['creator', 'editor'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: String, 
  google: {
    id: String,
    accessToken: String,
    refreshToken: String,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // If editor, link to creator
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
