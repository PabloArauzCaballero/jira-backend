const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Ticket = sequelize.define(
        "ticket",
        {
            id_ticket: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            nombre: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            descripcion: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            prioridad: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: "MEDIA",
            },
            status: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: "PENDIENTE",
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
            id_proyecto: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            id_asignado: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
        },
        {
            tableName: "ticket",
            freezeTableName: true,
            timestamps: false,
        }
    );

    return Ticket;
};
