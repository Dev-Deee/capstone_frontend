
const mongoose = require('mongoose')
const courseSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true,'Course title is required'],
        unique:true,
        trim:true,
    },
    description:{
        type:String,
        required:[true,'Course description is required'],
    },
    facilitator:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:[true, 'Course facilitator is required'],
    }
}, { timestamps: true });
module.exports = mongoose.model('Course', mongoose);