const Course = require('../models/course');
const User = require('../models/user');
const ErrorResponse = require('../models/errorResponse');

exports.createCourse = async (courseData) => {
    const user = await User.findById(courseData.facilitator);
    if (!user) {
        throw new ErrorResponse('User not found', 404);
    }
    if(user.role !== 'FACILITATOR') {
        throw new ErrorResponse('Unauthorized: Only facilitators can create courses', 403);
    }
    return await Course.create(courseData)
};

