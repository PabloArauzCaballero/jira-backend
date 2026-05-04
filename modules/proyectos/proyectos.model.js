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
                type: DataTypes.STRING(255),
                allowNull: false,
                defaultValue: "",
            },
            descripcion: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            fecha_creacion: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            estado_registro: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: "ACTIVO",
            },
            actualizado_en: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            user_id_creacion: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            user_id_modificacion: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            version: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
        },
        {
            tableName: "proyecto",
            freezeTableName: true,
            timestamps: false,
        }
    );

    return Proyecto;
};
