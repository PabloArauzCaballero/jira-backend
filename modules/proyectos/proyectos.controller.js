const ProyectosService = require("./proyectos.service");
const {
    proyectoCreationSchema,
    proyectoUpdateSchema,
    idProyectoSchema,
    miembroSchema,
} = require("./proyectos.schema");

async function createProyecto(req, res) {
    try {
        const validation = proyectoCreationSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos.",
                errors: validation.error.flatten(),
            });
        }

        const result = await ProyectosService.createProyecto(validation.data, req.user.id_usuario);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al crear el proyecto.",
        });
    }
}

async function listProyectos(req, res) {
    try {
        const result = await ProyectosService.listProyectosByUsuario(req.user.id_usuario);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al listar proyectos.",
        });
    }
}

async function getProyecto(req, res) {
    try {
        const validation = idProyectoSchema.safeParse(req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "ID inválido.",
                errors: validation.error.flatten(),
            });
        }

        const result = await ProyectosService.getProyectoById(validation.data.id_proyecto, req.user.id_usuario);
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al obtener el proyecto.",
        });
    }
}

async function updateProyecto(req, res) {
    try {
        const idValidation = idProyectoSchema.safeParse(req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: "ID inválido.",
                errors: idValidation.error.flatten(),
            });
        }

        const bodyValidation = proyectoUpdateSchema.safeParse(req.body);
        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos.",
                errors: bodyValidation.error.flatten(),
            });
        }

        const result = await ProyectosService.updateProyecto(
            idValidation.data.id_proyecto,
            bodyValidation.data,
            req.user.id_usuario
        );
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al actualizar el proyecto.",
        });
    }
}

async function addMiembro(req, res) {
    try {
        const idValidation = idProyectoSchema.safeParse(req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: "ID inválido.",
                errors: idValidation.error.flatten(),
            });
        }

        const bodyValidation = miembroSchema.safeParse(req.body);
        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                message: "Datos inválidos.",
                errors: bodyValidation.error.flatten(),
            });
        }

        const result = await ProyectosService.addMiembro(
            idValidation.data.id_proyecto,
            bodyValidation.data.id_usuario,
            req.user.id_usuario
        );
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al agregar miembro.",
        });
    }
}

async function removeMiembro(req, res) {
    try {
        const idValidation = idProyectoSchema.safeParse(req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: "ID inválido.",
                errors: idValidation.error.flatten(),
            });
        }

        const id_usuario = parseInt(req.params.id_usuario);
        if (!id_usuario || id_usuario <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de usuario inválido.",
            });
        }

        const result = await ProyectosService.removeMiembro(
            idValidation.data.id_proyecto,
            id_usuario,
            req.user.id_usuario
        );
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al remover miembro.",
        });
    }
}

async function deleteProyecto(req, res) {
    try {
        const validation = idProyectoSchema.safeParse(req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "ID inválido.",
                errors: validation.error.flatten(),
            });
        }

        const result = await ProyectosService.deleteProyecto(validation.data.id_proyecto, req.user.id_usuario);
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error interno al eliminar el proyecto.",
        });
    }
}

module.exports = {
    createProyecto,
    listProyectos,
    getProyecto,
    updateProyecto,
    addMiembro,
    removeMiembro,
    deleteProyecto,
};
