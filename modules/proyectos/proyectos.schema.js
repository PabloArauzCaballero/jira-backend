const { z } = require("zod");

const proyectoCreationSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio."),
    descripcion: z.string().min(1, "La descripción es obligatoria."),
});

const proyectoUpdateSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio.").optional(),
    descripcion: z.string().min(1, "La descripción es obligatoria.").optional(),
});

const idProyectoSchema = z.object({
    id_proyecto: z.coerce.number().int().positive("El id del proyecto debe ser positivo."),
});

const miembroSchema = z.object({
    id_usuario: z.coerce.number().int().positive("El id del usuario debe ser positivo."),
});

module.exports = {
    proyectoCreationSchema,
    proyectoUpdateSchema,
    idProyectoSchema,
    miembroSchema,
};
