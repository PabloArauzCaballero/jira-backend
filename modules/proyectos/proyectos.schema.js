const { z } = require("zod");

const CARGOS_PROYECTO = ["OWNER", "ADMIN", "MIEMBRO", "LECTOR"];
const ESTADOS_REGISTRO = ["ACTIVO", "INACTIVO", "ELIMINADO"];

const positiveIntId = (fieldName = "id") =>
  z.coerce
    .number({ invalid_type_error: `${fieldName} debe ser numérico.` })
    .int(`${fieldName} debe ser un número entero.`)
    .positive(`${fieldName} debe ser positivo.`);

const optionalPositiveIntId = (fieldName = "id") =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return value;
    },
    positiveIntId(fieldName).optional()
  );

const proyectoCreationSchema = z
  .object({
    nombre: z
      .string({
        required_error: "El nombre es obligatorio.",
        invalid_type_error: "El nombre debe ser texto.",
      })
      .trim()
      .min(1, "El nombre es obligatorio.")
      .max(150, "El nombre no debe superar los 150 caracteres."),

    descripcion: z
      .string({
        required_error: "La descripción es obligatoria.",
        invalid_type_error: "La descripción debe ser texto.",
      })
      .trim()
      .min(1, "La descripción es obligatoria."),
      
      user_id_creacion: positiveIntId("El id del usuario creador"),
      
  })

const proyectoUpdateSchema = z
  .object({
    nombre: z
      .string({ invalid_type_error: "El nombre debe ser texto." })
      .trim()
      .min(1, "El nombre no puede estar vacío.")
      .max(150, "El nombre no debe superar los 150 caracteres.")
      .optional(),

    descripcion: z
      .string({ invalid_type_error: "La descripción debe ser texto." })
      .trim()
      .min(1, "La descripción no puede estar vacía.")
      .optional(),

    user_id_modificacion: optionalPositiveIntId("El id del usuario modificador").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar el proyecto.",
  });

const idProyectoSchema = z.object({
    id_proyecto: positiveIntId("El id del proyecto"),
  });

const idUsuarioParamSchema = z.object({
    id_usuario: positiveIntId("El id del usuario"),
  });

const miembroCreationSchema = z
  .object({
    id_usuario: positiveIntId("El id del usuario"),

    cargo: z
      .enum(CARGOS_PROYECTO, {
        errorMap: () => ({
          message: "El cargo debe ser OWNER, ADMIN, MIEMBRO o LECTOR.",
        }),
      })
      .optional(),
  });

const miembroUpdateSchema = z
  .object({
    cargo: z
      .enum(CARGOS_PROYECTO, {
        errorMap: () => ({
          message: "El cargo debe ser OWNER, ADMIN, MIEMBRO o LECTOR.",
        }),
      })
      .optional(),

    estado_registro: z
      .enum(ESTADOS_REGISTRO, {
        errorMap: () => ({
          message: "El estado debe ser ACTIVO, INACTIVO o ELIMINADO.",
        }),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar el miembro.",
  });

module.exports = {
  CARGOS_PROYECTO,
  ESTADOS_REGISTRO,
  proyectoCreationSchema,
  proyectoUpdateSchema,
  idProyectoSchema,
  idUsuarioParamSchema,
  miembroSchema: miembroCreationSchema,
  miembroCreationSchema,
  miembroUpdateSchema,
};
