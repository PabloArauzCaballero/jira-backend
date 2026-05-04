const { z } = require("zod");

const ticketCreationSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio."),
    descripcion: z.string().optional(),
    id_proyecto: z.coerce.number().int().positive("El id del proyecto es obligatorio."),
    id_asignado: z.coerce.number().int().positive().optional(),
    prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]).optional(),
});

const ticketUpdateSchema = z.object({
    nombre: z.string().min(1).optional(),
    descripcion: z.string().optional(),
    id_asignado: z.coerce.number().int().positive().optional(),
    prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]).optional(),
});

const ticketStatusSchema = z.object({
    status: z.enum(["PENDIENTE", "EN_PROGRESO", "COMPLETADO"]),
});

const idTicketSchema = z.object({
    id_ticket: z.coerce.number().int().positive("El id del ticket debe ser positivo."),
});

module.exports = {
    ticketCreationSchema,
    ticketUpdateSchema,
    ticketStatusSchema,
    idTicketSchema,
};
