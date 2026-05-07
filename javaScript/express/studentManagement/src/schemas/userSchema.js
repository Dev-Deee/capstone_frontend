const {zod} = require('zod')

const createUserSchema = z.object({
    body:zod.object({
        name: zod.string().min(2, "Name is required"),
        email: zod.string().email("invalid email"),
        role: zod.enum(['STUDENT', 'FACILITATOR']),
    })
});
module.exports = {createUserSchema};