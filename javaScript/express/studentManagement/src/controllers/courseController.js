const courseService = require('./services/coursService');

exports.createCourse = async (req, res, next) => {
    try {
        const course = await courseService.createCourse(req.body);
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    }catch(err){
        next(err);
    }
};

