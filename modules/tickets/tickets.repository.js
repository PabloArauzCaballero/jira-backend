const { Op } = require("sequelize");
const models = require("../../core/db/models");

function pickModel(...names) {
  for (const name of names) {
    if (models[name]) return models[name];
  }

  throw new Error(
    `No se encontró el modelo esperado. Revisar exports en core/db/models. Nombres probados: ${names.join(", ")}`
  );
}

const ticketModel = pickModel("ticketModel", "Ticket", "ticket");
const proyectoAsignacionModel = pickModel(
  "proyectoAsignacionModel",
  "ProyectoAsignacion",
  "proyectoAsignacion"
);
const ticketUpdateModel = pickModel("ticketUpdateModel", "TicketUpdate", "ticketUpdate");
const ticketActionModel = pickModel("ticketActionModel", "TicketAction", "ticketAction");
const ticketAcceptanceCriteriaModel = pickModel(
  "ticketAcceptanceCriteriaModel",
  "TicketAcceptanceCriteria",
  "ticketAcceptanceCriteria",
  "ticketCriterionModel",
  "TicketCriterion",
  "ticketCriterion"
);

function toPlain(instance) {
  if (!instance) return null;
  if (typeof instance.toJSON === "function") return instance.toJSON();
  return instance;
}

function removeUndefined(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .filter((item) => item !== null && item !== undefined)
    .map((item) => String(item).trim())
    .filter(Boolean);

  return [...new Set(normalized)];
}

function groupRowsByTicketId(rows, fieldName) {
  const grouped = new Map();

  for (const row of rows.map(toPlain)) {
    const key = String(row.id_ticket);

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(row[fieldName]);
  }

  return grouped;
}

async function createTicketActions(id_ticket, tasks = [], transaction) {
  const normalizedTasks = normalizeStringList(tasks);

  if (normalizedTasks.length === 0) return [];

  await ticketActionModel.bulkCreate(
    normalizedTasks.map((accion_nombre) => ({
      id_ticket,
      accion_nombre,
    })),
    { transaction }
  );

  return normalizedTasks;
}

async function createTicketAcceptanceCriteria(id_ticket, acceptanceCriteria = [], transaction) {
  const normalizedCriteria = normalizeStringList(acceptanceCriteria);

  if (normalizedCriteria.length === 0) return [];

  await ticketAcceptanceCriteriaModel.bulkCreate(
    normalizedCriteria.map((criterios_aceptacion) => ({
      id_ticket,
      criterios_aceptacion,
    })),
    { transaction }
  );

  return normalizedCriteria;
}

async function replaceTicketActions(id_ticket, tasks = []) {
  const sequelize = ticketModel.sequelize;
  const normalizedTasks = normalizeStringList(tasks);

  return await sequelize.transaction(async (transaction) => {
    await ticketActionModel.destroy({
      where: { id_ticket },
      transaction,
    });

    await createTicketActions(id_ticket, normalizedTasks, transaction);
    return normalizedTasks;
  });
}

async function replaceTicketAcceptanceCriteria(id_ticket, acceptanceCriteria = []) {
  const sequelize = ticketModel.sequelize;
  const normalizedCriteria = normalizeStringList(acceptanceCriteria);

  return await sequelize.transaction(async (transaction) => {
    await ticketAcceptanceCriteriaModel.destroy({
      where: { id_ticket },
      transaction,
    });

    await createTicketAcceptanceCriteria(id_ticket, normalizedCriteria, transaction);
    return normalizedCriteria;
  });
}

async function listTicketActionsByTicket(id_ticket) {
  const rows = await ticketActionModel.findAll({
    where: { id_ticket },
    order: [["accion_nombre", "ASC"]],
  });

  return rows.map((row) => toPlain(row).accion_nombre);
}

async function listTicketAcceptanceCriteriaByTicket(id_ticket) {
  const rows = await ticketAcceptanceCriteriaModel.findAll({
    where: { id_ticket },
    order: [["criterios_aceptacion", "ASC"]],
  });

  return rows.map((row) => toPlain(row).criterios_aceptacion);
}

async function listTicketActionsByTicketIds(ticketIds) {
  if (!ticketIds.length) return new Map();

  const rows = await ticketActionModel.findAll({
    where: {
      id_ticket: { [Op.in]: ticketIds },
    },
    order: [["accion_nombre", "ASC"]],
  });

  return groupRowsByTicketId(rows, "accion_nombre");
}

async function listTicketAcceptanceCriteriaByTicketIds(ticketIds) {
  if (!ticketIds.length) return new Map();

  const rows = await ticketAcceptanceCriteriaModel.findAll({
    where: {
      id_ticket: { [Op.in]: ticketIds },
    },
    order: [["criterios_aceptacion", "ASC"]],
  });

  return groupRowsByTicketId(rows, "criterios_aceptacion");
}

async function createTicketWithAssignment({
  ticketData,
  assignmentData,
  tasks = [],
  acceptanceCriteria = [],
}) {
  const sequelize = ticketModel.sequelize;

  return await sequelize.transaction(async (transaction) => {
    const ticket = await ticketModel.create(removeUndefined(ticketData), { transaction });
    const id_ticket = ticket.id_ticket;

    const asignacion = await proyectoAsignacionModel.create(
      removeUndefined({
        ...assignmentData,
        id_ticket,
      }),
      { transaction }
    );

    const createdTasks = await createTicketActions(id_ticket, tasks, transaction);
    const createdAcceptanceCriteria = await createTicketAcceptanceCriteria(
      id_ticket,
      acceptanceCriteria,
      transaction
    );

    return {
      ticket: toPlain(ticket),
      asignacion: toPlain(asignacion),
      tasks: createdTasks,
      acceptanceCriteria: createdAcceptanceCriteria,
    };
  });
}

async function createTicket(payload) {
  const ticket = await ticketModel.create(removeUndefined(payload));
  return toPlain(ticket);
}

async function getTicketById(id_ticket) {
  const ticket = await ticketModel.findByPk(id_ticket);
  return toPlain(ticket);
}

async function getTicketDetailById(id_ticket) {
  const ticket = await getTicketById(id_ticket);
  if (!ticket) return null;

  const [tasks, acceptanceCriteria] = await Promise.all([
    listTicketActionsByTicket(id_ticket),
    listTicketAcceptanceCriteriaByTicket(id_ticket),
  ]);

  return {
    ...ticket,
    tasks,
    acceptanceCriteria,
  };
}

async function listTicketsByProyecto(id_proyecto) {
  const asignaciones = await proyectoAsignacionModel.findAll({
    where: {
      id_proyecto,
      estado_registro: "ACTIVO",
    },
    order: [["fecha_creacion", "DESC"]],
  });

  const asignacionesPlain = asignaciones.map(toPlain);
  const ticketIds = [...new Set(asignacionesPlain.map((item) => item.id_ticket))];

  if (ticketIds.length === 0) return [];

  const [tickets, actionsByTicket, criteriaByTicket] = await Promise.all([
    ticketModel.findAll({
      where: {
        id_ticket: { [Op.in]: ticketIds },
        estado_registro: "ACTIVO",
      },
      order: [["fecha_creacion", "DESC"]],
    }),
    listTicketActionsByTicketIds(ticketIds),
    listTicketAcceptanceCriteriaByTicketIds(ticketIds),
  ]);

  return tickets.map((ticket) => {
    const plainTicket = toPlain(ticket);
    const idKey = String(plainTicket.id_ticket);

    return {
      ...plainTicket,
      asignaciones: asignacionesPlain.filter(
        (asignacion) => String(asignacion.id_ticket) === idKey
      ),
      tasks: actionsByTicket.get(idKey) || [],
      acceptanceCriteria: criteriaByTicket.get(idKey) || [],
    };
  });
}

async function updateTicket(id_ticket, payload) {
  const ticket = await ticketModel.findByPk(id_ticket);
  if (!ticket) return null;

  await ticket.update(removeUndefined(payload));
  return toPlain(ticket);
}

async function softDeleteTicket(id_ticket, userId) {
  const sequelize = ticketModel.sequelize;

  return await sequelize.transaction(async (transaction) => {
    const ticket = await ticketModel.findByPk(id_ticket, { transaction });
    if (!ticket) return null;

    await ticket.update(
      {
        estado_registro: "ELIMINADO",
        user_id_modificacion: userId,
        actualizado_en: new Date(),
      },
      { transaction }
    );

    await proyectoAsignacionModel.update(
      {
        estado_registro: "ELIMINADO",
        user_id_modificacion: userId,
        actualizado_en: new Date(),
      },
      {
        where: { id_ticket },
        transaction,
      }
    );

    return toPlain(ticket);
  });
}

async function createAssignment(payload) {
  const asignacion = await proyectoAsignacionModel.create(removeUndefined(payload));
  return toPlain(asignacion);
}

async function getAssignmentById(id_asignacion) {
  const asignacion = await proyectoAsignacionModel.findByPk(id_asignacion);
  return toPlain(asignacion);
}

async function listAssignmentsByTicket(id_ticket, options = {}) {
  const where = { id_ticket };

  if (options.activeOnly) {
    where.estado_registro = "ACTIVO";
  }

  const asignaciones = await proyectoAsignacionModel.findAll({
    where,
    order: [["fecha_creacion", "DESC"]],
  });

  return asignaciones.map(toPlain);
}

async function listAssignmentsByProyecto(id_proyecto, options = {}) {
  const where = { id_proyecto };

  if (options.activeOnly) {
    where.estado_registro = "ACTIVO";
  }

  const asignaciones = await proyectoAsignacionModel.findAll({
    where,
    order: [["fecha_creacion", "DESC"]],
  });

  return asignaciones.map(toPlain);
}

async function updateAssignment(id_asignacion, payload) {
  const asignacion = await proyectoAsignacionModel.findByPk(id_asignacion);
  if (!asignacion) return null;

  await asignacion.update(removeUndefined(payload));
  return toPlain(asignacion);
}

async function softDeleteAssignment(id_asignacion, userId) {
  const asignacion = await proyectoAsignacionModel.findByPk(id_asignacion);
  if (!asignacion) return null;

  await asignacion.update({
    estado_registro: "ELIMINADO",
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  return toPlain(asignacion);
}

async function createTicketUpdate(payload) {
  const actualizacion = await ticketUpdateModel.create(removeUndefined(payload));
  return toPlain(actualizacion);
}

async function getTicketUpdateById(id_actualizacion) {
  const actualizacion = await ticketUpdateModel.findByPk(id_actualizacion);
  return toPlain(actualizacion);
}

async function listTicketUpdatesByAssignment(id_asignacion, options = {}) {
  const where = { id_asignacion };

  if (options.activeOnly) {
    where.estado_registro = "ACTIVO";
  }

  const actualizaciones = await ticketUpdateModel.findAll({
    where,
    order: [["fecha_creacion", "DESC"]],
  });

  return actualizaciones.map(toPlain);
}

async function listTicketUpdatesByTicket(id_ticket, options = {}) {
  const asignaciones = await listAssignmentsByTicket(id_ticket, options);
  const assignmentIds = asignaciones.map((item) => item.id_asignacion);

  if (assignmentIds.length === 0) return [];

  const where = {
    id_asignacion: { [Op.in]: assignmentIds },
  };

  if (options.activeOnly) {
    where.estado_registro = "ACTIVO";
  }

  const actualizaciones = await ticketUpdateModel.findAll({
    where,
    order: [["fecha_creacion", "DESC"]],
  });

  return actualizaciones.map(toPlain);
}

async function updateTicketUpdate(id_actualizacion, payload) {
  const actualizacion = await ticketUpdateModel.findByPk(id_actualizacion);
  if (!actualizacion) return null;

  await actualizacion.update(removeUndefined(payload));
  return toPlain(actualizacion);
}

async function softDeleteTicketUpdate(id_actualizacion, userId) {
  const actualizacion = await ticketUpdateModel.findByPk(id_actualizacion);
  if (!actualizacion) return null;

  await actualizacion.update({
    estado_registro: "ELIMINADO",
    user_id_modificacion: userId,
    actualizado_en: new Date(),
  });

  return toPlain(actualizacion);
}

module.exports = {
  createTicketWithAssignment,
  createTicket,
  getTicketById,
  getTicketDetailById,
  listTicketsByProyecto,
  updateTicket,
  softDeleteTicket,

  createAssignment,
  getAssignmentById,
  listAssignmentsByTicket,
  listAssignmentsByProyecto,
  updateAssignment,
  softDeleteAssignment,

  createTicketUpdate,
  getTicketUpdateById,
  listTicketUpdatesByAssignment,
  listTicketUpdatesByTicket,
  updateTicketUpdate,
  softDeleteTicketUpdate,

  listTicketActionsByTicket,
  replaceTicketActions,
  listTicketAcceptanceCriteriaByTicket,
  replaceTicketAcceptanceCriteria,
};
