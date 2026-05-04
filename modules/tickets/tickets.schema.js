const { z } = require("zod");

const PRIORIDADES = ["BAJA", "MEDIA", "ALTA", "CRITICA"];

const ESTADOS_TICKET = [
  "PENDIENTE",
  "EN_PROGRESO",
  "EN_REVISION",
  "FINALIZADO",
  "CANCELADO",
];

const ESTADOS_REGISTRO = ["ACTIVO", "INACTIVO", "ELIMINADO"];

const uniqueStringArray = (fieldName, maxItemLength) =>
  z
    .array(
      z
        .string({
          invalid_type_error: `${fieldName} debe contener solo textos.`,
        })
        .trim()
        .min(1, `${fieldName} no puede contener elementos vacíos.`)
        .max(maxItemLength, `${fieldName} tiene un elemento demasiado largo.`)
    )
    .refine((items) => new Set(items).size === items.length, {
      message: `${fieldName} no puede contener valores repetidos.`,
    });

const tasksSchema = uniqueStringArray("tasks", 150);
const acceptanceCriteriaSchema = uniqueStringArray("acceptanceCriteria", 5000);


const positiveIntId = (fieldName = "id") =>
  z.coerce
    .number({
      invalid_type_error: `${fieldName} debe ser numérico.`,
    })
    .int(`${fieldName} debe ser un número entero.`)
    .positive(`${fieldName} debe ser positivo.`);

const optionalPositiveIntId = (fieldName = "id") =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    },
    positiveIntId(fieldName).optional()
  );

const optionalText = (fieldName = "El texto", max = 5000) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === undefined) {
        return undefined;
      }
      return value;
    },
    z
      .string({
        invalid_type_error: `${fieldName} debe ser texto.`,
      })
      .trim()
      .max(max, `${fieldName} no debe superar los ${max} caracteres.`)
      .nullable()
      .optional()
  );

const nombreTicketSchema = z
  .string({
    required_error: "El nombre es obligatorio.",
    invalid_type_error: "El nombre debe ser texto.",
  })
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(150, "El nombre no debe superar los 150 caracteres.");

const prioridadSchema = z.enum(PRIORIDADES, {
  errorMap: () => ({
    message: "La prioridad debe ser BAJA, MEDIA, ALTA o CRITICA.",
  }),
});

const statusSchema = z.enum(ESTADOS_TICKET, {
  errorMap: () => ({
    message:
      "El status debe ser PENDIENTE, EN_PROGRESO, EN_REVISION, FINALIZADO o CANCELADO.",
  }),
});

const estadoRegistroSchema = z.enum(ESTADOS_REGISTRO, {
  errorMap: () => ({
    message: "El estado debe ser ACTIVO, INACTIVO o ELIMINADO.",
  }),
});

/**
 * Crea el ticket y su primera asignación.
 * En la base, ticket NO tiene id_proyecto ni id_asignado.
 * La relación vive en proyecto_asignacion usando id_proyecto e id_usuario.
 */
const ticketCreationSchema = z
  .object({
    nombre: nombreTicketSchema,
    descripcion: optionalText("La descripción"),
    prioridad: prioridadSchema.optional(),

    id_proyecto: positiveIntId("El id del proyecto"),
    id_usuario: positiveIntId("El id del usuario asignado"),

    tasks: tasksSchema.optional(),
    acceptanceCriteria: acceptanceCriteriaSchema.optional(),
  })
  .strict();

const ticketUpdateSchema = z
  .object({
    nombre: nombreTicketSchema.optional(),
    descripcion: optionalText("La descripción"),
    prioridad: prioridadSchema.optional(),
    tasks: tasksSchema.optional(),
    acceptanceCriteria: acceptanceCriteriaSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar el ticket.",
  });

const ticketStatusSchema = z
  .object({
    status: statusSchema,
  })
  .strict();

const ticketEstadoRegistroSchema = z
  .object({
    estado_registro: estadoRegistroSchema,
  })
  .strict();

const idTicketSchema = z
  .object({
    id_ticket: positiveIntId("El id del ticket"),
  })
  .strict();

const ticketUpdateIdSchema = z
  .object({
    id_ticket: positiveIntId("El id del ticket para actualizar"),
  })
  .strict();

const listTicketsByProyectoQuerySchema = z
  .object({
    proyecto_id: positiveIntId("El parámetro proyecto_id"),
  })
  .strict();

const idProyectoSchema = z
  .object({
    id_proyecto: positiveIntId("El id del proyecto"),
  })
  .strict();

const proyectoAsignacionCreationSchema = z
  .object({
    id_ticket: positiveIntId("El id del ticket"),
    id_proyecto: positiveIntId("El id del proyecto"),
    id_usuario: positiveIntId("El id del usuario asignado"),

    tasks: tasksSchema.optional(),
    acceptanceCriteria: acceptanceCriteriaSchema.optional(),
  })
  .strict();

const proyectoAsignacionUpdateSchema = z
  .object({
    id_proyecto: optionalPositiveIntId("El id del proyecto"),
    id_usuario: optionalPositiveIntId("El id del usuario asignado"),
    estado_registro: estadoRegistroSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar la asignación.",
  });

const idProyectoAsignacionSchema = z
  .object({
    id_asignacion: positiveIntId("El id de la asignación"),
  })
  .strict();

const ticketUpdateCreationSchema = z
  .object({
    actualizacion: z
      .string({
        required_error: "La actualización es obligatoria.",
        invalid_type_error: "La actualización debe ser texto.",
      })
      .trim()
      .min(1, "La actualización es obligatoria.")
      .max(5000, "La actualización no debe superar los 5000 caracteres."),
  })
  .strict();

const ticketUpdateBodySchema = z
  .object({
    actualizacion: z
      .string({
        invalid_type_error: "La actualización debe ser texto.",
      })
      .trim()
      .min(1, "La actualización no puede estar vacía.")
      .max(5000, "La actualización no debe superar los 5000 caracteres.")
      .optional(),
    estado_registro: estadoRegistroSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar el comentario.",
  });

const idTicketUpdateSchema = z
  .object({
    id_actualizacion: positiveIntId("El id de la actualización"),
  })
  .strict();

const ticketTasksSchema = z
  .object({
    tasks: tasksSchema,
  })
  .strict();

const ticketAcceptanceCriteriaSchema = z
  .object({
    acceptanceCriteria: acceptanceCriteriaSchema,
  })
  .strict();


module.exports = {
  PRIORIDADES,
  ESTADOS_TICKET,
  ESTADOS_REGISTRO,

  ticketCreationSchema,
  ticketUpdateSchema,
  ticketStatusSchema,
  ticketEstadoRegistroSchema,
  idTicketSchema,
  ticketUpdateIdSchema,
  listTicketsByProyectoQuerySchema,
  idProyectoSchema,

  proyectoAsignacionCreationSchema,
  proyectoAsignacionUpdateSchema,
  idProyectoAsignacionSchema,

  ticketUpdateCreationSchema,
  ticketUpdateBodySchema,
  idTicketUpdateSchema,
  ticketTasksSchema,
  ticketAcceptanceCriteriaSchema,
};
