const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: [true,'Name is required'],
        trim:true
    },
    email:{
        type:String,
        required:[true,'Email is required'],
        unique:true,
        lowercase:true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    role:{
        type:String,
        required:[true,'Role is required'],
        enum:{
            values: [`STUDENT`, `FACILITATOR`],
            message: `{VALUE} is not a supported role`
        }
    }
}, {timestamps: true});
module.exports = mongoose.model('User', userSchema);