const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TicketAcceptanceCriteria = sequelize.define(
    "ticketAcceptanceCriteria",
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

      criterios_aceptacion: {
        type: DataTypes.TEXT,
        primaryKey: true,
        allowNull: false,
      },
    },
    {
      tableName: "ticket_criterios_aceptacion",
      freezeTableName: true,
      timestamps: false,
    }
  );

  TicketAcceptanceCriteria.associate = (models) => {
    TicketAcceptanceCriteria.belongsTo(models.Ticket, {
      foreignKey: "id_ticket",
      targetKey: "id_ticket",
      as: "ticket",
    });
  };

  return TicketAcceptanceCriteria;
};
