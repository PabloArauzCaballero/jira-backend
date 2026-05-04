const {
  sequelize,
  proyectoModel,
  miembrosModel,
  usuarioModel,
} = require("../../core/db/models");

async function createProyecto(payload, options = {}) {
  return await proyectoModel.create(payload, options);
}

async function createProyectoWithOwner(proyectoPayload, ownerPayload) {
  return await sequelize.transaction(async (transaction) => {
    const proyecto = await proyectoModel.create(proyectoPayload, { transaction });

    const miembroOwner = await miembrosModel.create(
      {
        ...ownerPayload,
        id_proyecto: proyecto.id_proyecto,
      },
      { transaction }
    );

    return { proyecto, miembroOwner };
  });
}

async function getProyectoById(id_proyecto) {
  return await proyectoModel.findByPk(id_proyecto, {
    include: [
      {
        model: miembrosModel,
        as: "miembros",
        required: false,
        where: { estado_registro: "ACTIVO" },
        include: [
          {
            model: usuarioModel,
            as: "usuario",
            attributes: ["id_usuario", "nombre", "email", "posicion_principal"],
          },
        ],
      },
    ],
  });
}

async function listProyectosByUsuario(id_usuario) {
  const proyectosCreados = await proyectoModel.findAll({
    where: {
      user_id_creacion: id_usuario,
      estado_registro: "ACTIVO",
    },
  });

  const proyectosMiembro = await proyectoModel.findAll({
    include: [
      {
        model: miembrosModel,
        as: "miembros",
        where: {
          id_usuario,
          estado_registro: "ACTIVO",
        },
        required: true,
      },
    ],
    where: { estado_registro: "ACTIVO" },
  });

  const map = new Map();

  [...proyectosCreados, ...proyectosMiembro].forEach((proyecto) => {
    map.set(String(proyecto.id_proyecto), proyecto);
  });

  return Array.from(map.values());
}

async function updateProyecto(id_proyecto, payload) {
  const proyecto = await proyectoModel.findByPk(id_proyecto);

  if (!proyecto) {
    return null;
  }

  await proyecto.update(payload);

  return proyecto;
}

async function addMiembro(payload) {
  return await miembrosModel.create(payload);
}

async function getMiembro(id_proyecto, id_usuario) {
  return await miembrosModel.findOne({
    where: {
      id_proyecto,
      id_usuario,
    },
    include: [
      {
        model: usuarioModel,
        as: "usuario",
        attributes: ["id_usuario", "nombre", "email", "posicion_principal"],
      },
    ],
  });
}

async function updateMiembro(id_proyecto, id_usuario, payload) {
  const miembro = await miembrosModel.findOne({
    where: {
      id_proyecto,
      id_usuario,
    },
  });

  if (!miembro) {
    return null;
  }

  await miembro.update(payload);

  return miembro;
}

async function removeMiembro(id_proyecto, id_usuario) {
  const miembro = await miembrosModel.findOne({
    where: {
      id_proyecto,
      id_usuario,
    },
  });

  if (!miembro) {
    return null;
  }

  await miembro.destroy();

  return miembro;
}

async function listMiembros(id_proyecto) {
  return await miembrosModel.findAll({
    where: {
      id_proyecto,
      estado_registro: "ACTIVO",
    },
    include: [
      {
        model: usuarioModel,
        as: "usuario",
        attributes: ["id_usuario", "nombre", "email", "posicion_principal"],
      },
    ],
    order: [
      ["cargo", "ASC"],
      ["fecha_creacion", "ASC"],
    ],
  });
}

async function isMiembro(id_proyecto, id_usuario) {
  const miembro = await miembrosModel.findOne({
    where: {
      id_proyecto,
      id_usuario,
      estado_registro: "ACTIVO",
    },
  });

  return !!miembro;
}

async function getMembership(id_proyecto, id_usuario) {
  return await miembrosModel.findOne({
    where: {
      id_proyecto,
      id_usuario,
      estado_registro: "ACTIVO",
    },
  });
}

async function softDeleteProyecto(id_proyecto, userId) {
  const proyecto = await proyectoModel.findByPk(id_proyecto);

  if (!proyecto) {
    return null;
  }

  await proyecto.update({
    estado_registro: "ELIMINADO",
    actualizado_en: new Date(),
    user_id_modificacion: userId,
  });

  return proyecto;
}

module.exports = {
  createProyecto,
  createProyectoWithOwner,
  getProyectoById,
  listProyectosByUsuario,
  updateProyecto,
  addMiembro,
  getMiembro,
  updateMiembro,
  removeMiembro,
  listMiembros,
  getMiembros: listMiembros,
  isMiembro,
  getMembership,
  softDeleteProyecto,
};
