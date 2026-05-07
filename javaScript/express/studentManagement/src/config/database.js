const mongoose = reqiure('mongoose');

const connectDB = async () =>{
    try{
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to MongoDB: ${connect.conection.host}`);
    }catch(err){
        console.error(`err: ${error.message}`);
        process.exit(1);
    }
};
module.exports = connectDB;