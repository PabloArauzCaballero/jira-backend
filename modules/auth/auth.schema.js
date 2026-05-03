const {z} = require("zod");

const loginSchema = z.object({
    email: z.string().email("Formato de correo electrónico inválido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.");
})

module.exports = loginSchema;