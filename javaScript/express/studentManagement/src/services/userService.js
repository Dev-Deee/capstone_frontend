const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');
const {body} = require("express/lib/request");

exports.registerUser = async (userData) => {
    const existingUser = await User.findOne({email: userData.email});
    if (existingUser) {
        throw new ErrorResponse('Email already in use', 400);
    }
    return await User.create(userData);
};

exports.loginUser = async (userData) => {
    const {email} = userData;
    const user = await User.findOne({email})
    if (!user) {
        throw new ErrorResponse('Invalid credentials', 401);
    }
    return user;
};

exports.updateUser = async (userData) => {
    const {name, email, password} = body;
    const user = await user.findOne({email})
    if (!user) {
        throw new ErrorResponse('Invalid credentials', 401);
    }
        if (user.name === name) user.name = name;
        if (user.password !== password) user.password = password;
        if (user.email !== email) user.email = email;
        return await user.save();
};

