const { sequelize } = require("./config");

const usuarioModel = require("../../modules/users/usuarios.model")(sequelize);
const proyectoModel = require("../../modules/proyectos/proyectos.model")(sequelize);
const ticketModel = require("../../modules/tickets/tickets.model")(sequelize);
const miembrosModel = require("../../modules/proyectos/proyecto_miembros.model")(sequelize);

const proyectoAsignacionModel = require("../../modules/tickets/ticket.assigment.model")(sequelize);
const ticketUpdateModel = require("../../modules/tickets/ticket.comentary.model")(sequelize);
const ticketActionModel = require("../../modules/tickets/ticket.actions.model")(sequelize);
const ticketAcceptanceCriteriaModel = require("../../modules/tickets/ticket.acceptance.criteria.model")(sequelize);

const models = {
  Usuario: usuarioModel,
  Proyecto: proyectoModel,
  Ticket: ticketModel,
  Miembros: miembrosModel,
  ProyectoAsignacion: proyectoAsignacionModel,
  TicketUpdate: ticketUpdateModel,
  TicketAction: ticketActionModel,
  TicketAcceptanceCriteria: ticketAcceptanceCriteriaModel,
};

// ==========================
// ASOCIACIONES PROYECTOS
// ==========================

proyectoModel.hasMany(miembrosModel, {
  as: "miembros",
  foreignKey: "id_proyecto",
});

miembrosModel.belongsTo(proyectoModel, {
  as: "proyecto",
  foreignKey: "id_proyecto",
});

miembrosModel.belongsTo(usuarioModel, {
  as: "usuario",
  foreignKey: "id_usuario",
});

// ==========================
// ASOCIACIONES TICKET
// ==========================

// Ticket -> usuarios de auditoría
ticketModel.belongsTo(usuarioModel, {
  as: "usuarioCreacion",
  foreignKey: "user_id_creacion",
  targetKey: "id_usuario",
});

ticketModel.belongsTo(usuarioModel, {
  as: "usuarioModificacion",
  foreignKey: "user_id_modificacion",
  targetKey: "id_usuario",
});

// Ticket -> asignaciones
ticketModel.hasMany(proyectoAsignacionModel, {
  as: "asignaciones",
  foreignKey: "id_ticket",
  sourceKey: "id_ticket",
});

// Ticket -> acciones
ticketModel.hasMany(ticketActionModel, {
  as: "tasks",
  foreignKey: "id_ticket",
  sourceKey: "id_ticket",
});

// Ticket -> criterios de aceptación
ticketModel.hasMany(ticketAcceptanceCriteriaModel, {
  as: "acceptanceCriteria",
  foreignKey: "id_ticket",
  sourceKey: "id_ticket",
});

// ==========================
// ASOCIACIONES PROYECTO_ASIGNACION
// ==========================

proyectoAsignacionModel.belongsTo(ticketModel, {
  as: "ticket",
  foreignKey: "id_ticket",
  targetKey: "id_ticket",
});

proyectoAsignacionModel.belongsTo(proyectoModel, {
  as: "proyecto",
  foreignKey: "id_proyecto",
  targetKey: "id_proyecto",
});

proyectoAsignacionModel.belongsTo(usuarioModel, {
  as: "usuarioAsignado",
  foreignKey: "id_usuario",
  targetKey: "id_usuario",
});

proyectoAsignacionModel.belongsTo(usuarioModel, {
  as: "usuarioCreacion",
  foreignKey: "user_id_creacion",
  targetKey: "id_usuario",
});

proyectoAsignacionModel.belongsTo(usuarioModel, {
  as: "usuarioModificacion",
  foreignKey: "user_id_modificacion",
  targetKey: "id_usuario",
});

// Proyecto -> asignaciones
proyectoModel.hasMany(proyectoAsignacionModel, {
  as: "asignaciones",
  foreignKey: "id_proyecto",
  sourceKey: "id_proyecto",
});

// Usuario -> asignaciones recibidas
usuarioModel.hasMany(proyectoAsignacionModel, {
  as: "ticketsAsignados",
  foreignKey: "id_usuario",
  sourceKey: "id_usuario",
});

// ==========================
// ASOCIACIONES TICKET_ACTUALIZACION
// ==========================

ticketUpdateModel.belongsTo(proyectoAsignacionModel, {
  as: "asignacion",
  foreignKey: "id_asignacion",
  targetKey: "id_asignacion",
});

proyectoAsignacionModel.hasMany(ticketUpdateModel, {
  as: "actualizaciones",
  foreignKey: "id_asignacion",
  sourceKey: "id_asignacion",
});

ticketUpdateModel.belongsTo(usuarioModel, {
  as: "usuarioCreacion",
  foreignKey: "user_id_creacion",
  targetKey: "id_usuario",
});

ticketUpdateModel.belongsTo(usuarioModel, {
  as: "usuarioModificacion",
  foreignKey: "user_id_modificacion",
  targetKey: "id_usuario",
});

// ==========================
// ASOCIACIONES TICKET_ACCIONES
// ==========================

ticketActionModel.belongsTo(ticketModel, {
  as: "ticket",
  foreignKey: "id_ticket",
  targetKey: "id_ticket",
});

// ==========================
// ASOCIACIONES TICKET_CRITERIOS_ACEPTACION
// ==========================

ticketAcceptanceCriteriaModel.belongsTo(ticketModel, {
  as: "ticket",
  foreignKey: "id_ticket",
  targetKey: "id_ticket",
});

module.exports = {
  sequelize,

  // nombres originales, para no romper imports existentes
  usuarioModel,
  proyectoModel,
  ticketModel,
  miembrosModel,
  proyectoAsignacionModel,
  ticketUpdateModel,
  ticketActionModel,
  ticketAcceptanceCriteriaModel,

  // nombres limpios para usar en asociaciones/includes
  Usuario: usuarioModel,
  Proyecto: proyectoModel,
  Ticket: ticketModel,
  Miembros: miembrosModel,
  ProyectoAsignacion: proyectoAsignacionModel,
  TicketUpdate: ticketUpdateModel,
  TicketAction: ticketActionModel,
  TicketAcceptanceCriteria: ticketAcceptanceCriteriaModel,
};