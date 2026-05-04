const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProyectoAsignacion = sequelize.define(
    "proyectoAsignacion",
    {
      id_asignacion: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      id_ticket: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "ticket",
          key: "id_ticket",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      id_proyecto: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "proyecto",
          key: "id_proyecto",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      id_usuario: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id_usuario",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      // Sin defaultValue: PostgreSQL aplica DEFAULT NOW().
      fecha_creacion: {
        type: DataTypes.DATE,
      },

      // Sin defaultValue: PostgreSQL aplica DEFAULT 'ACTIVO'.
      estado_registro: {
        type: DataTypes.STRING(20),
      },

      actualizado_en: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      user_id_creacion: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "usuarios",
          key: "id_usuario",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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

      // Sin defaultValue: PostgreSQL aplica DEFAULT 1.
      version: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: "proyecto_asignacion",
      freezeTableName: true,
      timestamps: false,
    }
  );

  ProyectoAsignacion.associate = (models) => {
    ProyectoAsignacion.belongsTo(models.Ticket, {
      foreignKey: "id_ticket",
      targetKey: "id_ticket",
      as: "ticket",
    });

    ProyectoAsignacion.belongsTo(models.Proyecto, {
      foreignKey: "id_proyecto",
      targetKey: "id_proyecto",
      as: "proyecto",
    });

    ProyectoAsignacion.belongsTo(models.Usuario, {
      foreignKey: "id_usuario",
      targetKey: "id_usuario",
      as: "usuarioAsignado",
    });

    ProyectoAsignacion.belongsTo(models.Usuario, {
      foreignKey: "user_id_creacion",
      targetKey: "id_usuario",
      as: "usuarioCreacion",
    });

    ProyectoAsignacion.belongsTo(models.Usuario, {
      foreignKey: "user_id_modificacion",
      targetKey: "id_usuario",
      as: "usuarioModificacion",
    });

    ProyectoAsignacion.hasMany(models.TicketUpdate, {
      foreignKey: "id_asignacion",
      sourceKey: "id_asignacion",
      as: "actualizaciones",
    });
  };

  return ProyectoAsignacion;
};
