const {mongoose, Schema} = require('mongoose');
const {schema} = mongoose;

const VideoSchmea = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    tags:[String],
    Videourl: {
         type:String,
         required: true,
    },
    thumbnail: String,
    
       status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },


    creator:{
       type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },

    editor:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    rejectionReason:String,
    reviewAt: Date,

}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchmea);