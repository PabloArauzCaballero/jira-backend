const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Usuario = sequelize.define(
        "usuarios",
        {
            id_usuario: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            nombre: {
                type: DataTypes.STRING(120),
                allowNull: false,
            },

            email: {
                type: DataTypes.CITEXT,
                allowNull: false,
                unique: true,
            },

            telefono: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },

            timezone: {
                type: DataTypes.STRING(80),
                allowNull: false,
                defaultValue: "America/La_Paz",
            },

            posicion_principal: {
                type: DataTypes.STRING(120),
                allowNull: true,
            },

            password_hash: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

            is_two_factors: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            tableName: "usuarios",
            freezeTableName: true,
            timestamps: false,
            underscored: false,

            indexes: [
                {
                    name: "idx_usuarios_email",
                    unique: true,
                    fields: ["email"],
                },
                {
                    name: "idx_usuarios_estado_registro",
                    fields: ["estado_registro"],
                },
            ],
        }
    );

    return Usuario;
};