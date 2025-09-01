const { number, date, boolean } = require("joi");
const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['creator', 'editor'],
    required: true
  },
  otp:{
    type: String
  },
  otpExpirey:{
    type: Date
  },
  avatar: String,
  isverified:{
    type:Boolean,
    default:false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('User', userSchema);

