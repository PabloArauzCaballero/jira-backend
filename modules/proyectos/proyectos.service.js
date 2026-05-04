const ProyectosRepository = require("./proyectos.repository");
const UsuariosRepository = require("../users/usuarios.repository");

async function createProyecto(payload, userId) {
    const proyectoData = {
        ...payload,
        user_id_creacion: userId,
        user_id_modificacion: userId,
        estado_registro: "ACTIVO",
        version: 1,
    };

    const proyecto = await ProyectosRepository.createProyecto(proyectoData);

    // Auto-agregar creador como miembro
    await ProyectosRepository.addMiembro(proyecto.id_proyecto, userId);

    return {
        success: true,
        data: proyecto,
    };
}

async function getProyectoById(id_proyecto, userId) {
    const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

    if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
        return { success: false, statusCode: 404, message: "Proyecto no encontrado." };
    }

    const esMiembro = proyecto.user_id_creacion === userId ||
        await ProyectosRepository.isMiembro(id_proyecto, userId);

    if (!esMiembro) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este proyecto." };
    }

    return { success: true, data: proyecto };
}

async function listProyectosByUsuario(userId) {
    const proyectos = await ProyectosRepository.listProyectosByUsuario(userId);
    return { success: true, data: proyectos };
}

async function updateProyecto(id_proyecto, payload, userId) {
    const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

    if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
        return { success: false, statusCode: 404, message: "Proyecto no encontrado." };
    }

    const esMiembro = proyecto.user_id_creacion === userId ||
        await ProyectosRepository.isMiembro(id_proyecto, userId);

    if (!esMiembro) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este proyecto." };
    }

    const updated = await ProyectosRepository.updateProyecto(id_proyecto, {
        ...payload,
        user_id_modificacion: userId,
        actualizado_en: new Date(),
    });

    return { success: true, data: updated };
}

async function addMiembro(id_proyecto, id_usuario, userId) {
    const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

    if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
        return { success: false, statusCode: 404, message: "Proyecto no encontrado." };
    }

    const esMiembro = proyecto.user_id_creacion === userId ||
        await ProyectosRepository.isMiembro(id_proyecto, userId);

    if (!esMiembro) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este proyecto." };
    }

    const usuario = await UsuariosRepository.getUserById(id_usuario);

    if (!usuario) {
        return { success: false, statusCode: 404, message: "El usuario no existe." };
    }

    await ProyectosRepository.addMiembro(id_proyecto, id_usuario);

    return { success: true, message: "Miembro agregado correctamente." };
}

async function removeMiembro(id_proyecto, id_usuario, userId) {
    const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

    if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
        return { success: false, statusCode: 404, message: "Proyecto no encontrado." };
    }

    const esMiembro = proyecto.user_id_creacion === userId ||
        await ProyectosRepository.isMiembro(id_proyecto, userId);

    if (!esMiembro) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este proyecto." };
    }

    await ProyectosRepository.removeMiembro(id_proyecto, id_usuario);

    return { success: true, message: "Miembro removido correctamente." };
}

async function deleteProyecto(id_proyecto, userId) {
    const proyecto = await ProyectosRepository.getProyectoById(id_proyecto);

    if (!proyecto || proyecto.estado_registro === "ELIMINADO") {
        return { success: false, statusCode: 404, message: "Proyecto no encontrado." };
    }

    const esMiembro = proyecto.user_id_creacion === userId ||
        await ProyectosRepository.isMiembro(id_proyecto, userId);

    if (!esMiembro) {
        return { success: false, statusCode: 403, message: "No tenés acceso a este proyecto." };
    }

    await ProyectosRepository.softDeleteProyecto(id_proyecto);

    return { success: true, message: "Proyecto eliminado correctamente." };
}

module.exports = {
    createProyecto,
    getProyectoById,
    listProyectosByUsuario,
    updateProyecto,
    addMiembro,
    removeMiembro,
    deleteProyecto,
};
