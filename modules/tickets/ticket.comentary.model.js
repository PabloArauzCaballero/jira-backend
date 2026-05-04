const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TicketUpdate = sequelize.define(
    "ticketUpdate",
    {
      id_actualizacion: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      id_asignacion: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "proyecto_asignacion",
          key: "id_asignacion",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      actualizacion: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      // Sin defaultValue: PostgreSQL aplica DEFAULT NOW() si existe en el DDL.
      fecha_creacion: {
        type: DataTypes.DATE,
      },

      // Sin defaultValue: PostgreSQL aplica DEFAULT 'ACTIVO' si existe en el DDL.
      estado_registro: {
        type: DataTypes.STRING(20),
      },

      actualizado_en: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      user_id_creacion: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id_usuario",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      user_id_modificacion: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "usuarios",
          key: "id_usuario",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      // Sin defaultValue: PostgreSQL aplica DEFAULT 1 si existe en el DDL.
      version: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: "ticket_actualizacion",
      freezeTableName: true,
      timestamps: false,
    }
  );

  TicketUpdate.associate = (models) => {
    TicketUpdate.belongsTo(models.ProyectoAsignacion, {
      foreignKey: "id_asignacion",
      targetKey: "id_asignacion",
      as: "asignacion",
    });

    TicketUpdate.belongsTo(models.Usuario, {
      foreignKey: "user_id_creacion",
      targetKey: "id_usuario",
      as: "usuarioCreacion",
    });

    TicketUpdate.belongsTo(models.Usuario, {
      foreignKey: "user_id_modificacion",
      targetKey: "id_usuario",
      as: "usuarioModificacion",
    });
  };

  return TicketUpdate;
};
