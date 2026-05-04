const { sequelize } = require("./config");

const usuarioModel = require("../../modules/users/usuarios.model")(sequelize);
const proyectoModel = require("../../modules/proyectos/proyectos.model")(sequelize);
const ticketModel = require("../../modules/tickets/tickets.model")(sequelize);
const miembrosModel = require("../../modules/proyectos/proyecto_miembros.model")(sequelize);

function setupAssociations() {
    // Proyecto -> Miembros
    proyectoModel.hasMany(miembrosModel, { as: "miembros", foreignKey: "id_proyecto" });
    miembrosModel.belongsTo(proyectoModel, { as: "proyecto", foreignKey: "id_proyecto" });

    // Miembro -> Usuario
    miembrosModel.belongsTo(usuarioModel, { as: "usuario", foreignKey: "id_usuario" });

    // Ticket -> Proyecto
    ticketModel.belongsTo(proyectoModel, { as: "proyecto", foreignKey: "id_proyecto" });

    // Ticket -> Usuario (asignado)
    ticketModel.belongsTo(usuarioModel, { as: "asignado", foreignKey: "id_asignado" });
}

module.exports = { setupAssociations };
