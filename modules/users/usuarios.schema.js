const {z} = require("zod");

const usuariosCreationSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    email : z.string().email("Formato de correo electrónico inválido."),
    telefono: z.string().min(7, "El teléfono debe tener al menos 7 caracteres."),
    timezone: z.string().min(3, "La zona horaria debe tener al menos 3 caracteres."),
    posicion_principal: z.string(),
    password_hash: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "La contraseña debe ser alfanumérica e incluir algún carater especial."),
    is_two_factors: z.boolean().default(false), 
});

const usuariosUpdateSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").optional(),
    email : z.string().email("Formato de correo electrónico inválido.").optional(),
    telefono: z.string().min(7, "El teléfono debe tener al menos 7 caracteres.").optional(),
    timezone: z.string().min(3, "La zona horaria debe tener al menos 3 caracteres.").optional(),
    posicion_principal: z.string().optional(),
    is_two_factors: z.boolean().default(false).optional(), 
});

const idUsuarioSchema = z.object({
  id_usuario: z.coerce
    .number()
    .int("El id_usuario debe ser un número entero")
    .positive("El id_usuario debe ser positivo"),
});

const listUsuariosSchema = z.object({
    offset: z.coerce
        .number()
        .int("El id_usuario debe ser un número entero")
        .positive("El id_usuario debe ser positivo")
        .default(0),
    
    limit: z.coerce
        .number()
        .int("El id_usuario debe ser un número entero")
        .positive("El id_usuario debe ser positivo")
        .default(50),
});


module.exports = {
    usuariosCreationSchema,
    usuariosUpdateSchema,
    idUsuarioSchema,
    listUsuariosSchema,
};