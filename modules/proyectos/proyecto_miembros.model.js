const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const ProyectoMiembros = sequelize.define(
        "proyecto_miembros",
        {
            id_proyecto: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            id_usuario: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                allowNull: false,
            },
            fecha_creacion: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "proyecto_miembros",
            freezeTableName: true,
            timestamps: false,
        }
    );

    return ProyectoMiembros;
};
