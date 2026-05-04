const { proyectoModel, miembrosModel, usuarioModel } = require("../../core/db/models");

async function createProyecto(payload) {
    return await proyectoModel.create(payload);
}

async function getProyectoById(id_proyecto) {
    return await proyectoModel.findByPk(id_proyecto, {
        include: [
            {
                model: miembrosModel,
                as: "miembros",
                include: [{ model: usuarioModel, as: "usuario", attributes: ["id_usuario", "nombre", "email"] }],
            },
        ],
    });
}

async function listProyectosByUsuario(id_usuario) {
    const proyectosCreados = await proyectoModel.findAll({
        where: { user_id_creacion: id_usuario, estado_registro: "ACTIVO" },
    });

    const proyectosMiembro = await proyectoModel.findAll({
        include: [
            {
                model: miembrosModel,
                as: "miembros",
                where: { id_usuario },
                required: true,
            },
        ],
        where: { estado_registro: "ACTIVO" },
    });

    const map = new Map();
    [...proyectosCreados, ...proyectosMiembro].forEach((p) => map.set(p.id_proyecto, p));
    return Array.from(map.values());
}

async function updateProyecto(id_proyecto, payload) {
    const proyecto = await proyectoModel.findByPk(id_proyecto);
    if (!proyecto) return null;
    await proyecto.update(payload);
    return proyecto;
}

async function addMiembro(id_proyecto, id_usuario) {
    return await miembrosModel.create({ id_proyecto, id_usuario });
}

async function removeMiembro(id_proyecto, id_usuario) {
    const miembro = await miembrosModel.findOne({
        where: { id_proyecto, id_usuario },
    });
    if (!miembro) return null;
    await miembro.destroy();
    return miembro;
}

async function getMiembros(id_proyecto) {
    return await miembrosModel.findAll({
        where: { id_proyecto },
        include: [{ model: usuarioModel, as: "usuario", attributes: ["id_usuario", "nombre", "email"] }],
    });
}

async function isMiembro(id_proyecto, id_usuario) {
    const miembro = await miembrosModel.findOne({
        where: { id_proyecto, id_usuario },
    });
    return !!miembro;
}

async function softDeleteProyecto(id_proyecto) {
    const proyecto = await proyectoModel.findByPk(id_proyecto);
    if (!proyecto) return null;
    await proyecto.update({ estado_registro: "ELIMINADO" });
    return proyecto;
}

module.exports = {
    createProyecto,
    getProyectoById,
    listProyectosByUsuario,
    updateProyecto,
    addMiembro,
    removeMiembro,
    getMiembros,
    isMiembro,
    softDeleteProyecto,
};
