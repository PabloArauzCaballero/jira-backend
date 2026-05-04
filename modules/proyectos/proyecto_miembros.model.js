const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProyectoMiembros = sequelize.define(
    "proyecto_miembros",
    {
      id_proyecto: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "proyecto",
          key: "id_proyecto",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      id_usuario: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id_usuario",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      cargo: {
        type: DataTypes.STRING(50),
      },

      fecha_creacion: {
        type: DataTypes.DATE,
      },

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

      version: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: "proyecto_miembros",
      freezeTableName: true,
      timestamps: false,
    }
  );

  ProyectoMiembros.associate = (models) => {
    ProyectoMiembros.belongsTo(models.Proyecto, {
      foreignKey: "id_proyecto",
      targetKey: "id_proyecto",
      as: "proyecto",
    });

    ProyectoMiembros.belongsTo(models.Usuario, {
      foreignKey: "id_usuario",
      targetKey: "id_usuario",
      as: "usuario",
    });

    ProyectoMiembros.belongsTo(models.Usuario, {
      foreignKey: "user_id_creacion",
      targetKey: "id_usuario",
      as: "usuarioCreacion",
    });

    ProyectoMiembros.belongsTo(models.Usuario, {
      foreignKey: "user_id_modificacion",
      targetKey: "id_usuario",
      as: "usuarioModificacion",
    });
  };

  return ProyectoMiembros;
};
