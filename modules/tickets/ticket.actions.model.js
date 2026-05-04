const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TicketAction = sequelize.define(
    "ticketAction",
    {
      id_ticket: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "ticket",
          key: "id_ticket",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      accion_nombre: {
        type: DataTypes.STRING(150),
        primaryKey: true,
        allowNull: false,
      },
    },
    {
      tableName: "ticket_acciones",
      freezeTableName: true,
      timestamps: false,
    }
  );

  TicketAction.associate = (models) => {
    TicketAction.belongsTo(models.Ticket, {
      foreignKey: "id_ticket",
      targetKey: "id_ticket",
      as: "ticket",
    });
  };

  return TicketAction;
};
