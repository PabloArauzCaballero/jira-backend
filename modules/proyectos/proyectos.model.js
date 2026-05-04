const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Proyecto = sequelize.define(
    "proyecto",
    {
      id_proyecto: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
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
      tableName: "proyecto",
      freezeTableName: true,
      timestamps: false,
    }
  );

  Proyecto.associate = (models) => {
    Proyecto.belongsTo(models.Usuario, {
      foreignKey: "user_id_creacion",
      targetKey: "id_usuario",
      as: "usuarioCreacion",
    });

    Proyecto.belongsTo(models.Usuario, {
      foreignKey: "user_id_modificacion",
      targetKey: "id_usuario",
      as: "usuarioModificacion",
    });

    Proyecto.hasMany(models.ProyectoMiembros, {
      foreignKey: "id_proyecto",
      sourceKey: "id_proyecto",
      as: "miembros",
    });
  };

  return Proyecto;
};
