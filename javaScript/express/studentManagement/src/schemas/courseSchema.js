const {zod} = require('./zod')

const createCourseSchema = z.object({
    body: z.object({
        title: z.string().min(3, "Title must be at least 3 characters long"),
        description: z.string().min(10, "Description must be detailed (minimum 10 characters long)"),
        facilitator: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: "Invalid Facilitator ID format",
        }),
    }) 
});
module.exports = {createCourseSchema};