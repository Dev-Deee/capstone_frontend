const userService = require("../services/userService");

exports.CreateUser = async (req, res, next) => {
    try{
        const user = await userService.registerUser(req.body);
        res.status(201).json({success: true, message:"User registered successfully", data: user});
    }catch(err){
        next(err);
    }
};

exports.LoginUser = async (req, res, next) => {
    try{
        const user = await userService.loginUser(req.body);
        res.status(200).json({success: true, data: user});
    }catch(err){
        next(err);
    }
};

exports.UpdateUser = async (req, res, next) => {
    try{
        const user = await userService.updateUser(req.params.id, req.body);
        res.status(200).json({success: true, data: user});
    }catch(err){
        next(err);
    }
};