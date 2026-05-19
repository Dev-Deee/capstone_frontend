const {zod} = require('zod')

const createUserSchema = z.object({
    body:z.object({
        name: z.string().min(2, "Name is required"),
        email: z.string().email("invalid email"),
        role: z.enum(['STUDENT', 'FACILITATOR']),
    })
});
module.exports = {createUserSchema};