// models/Orden.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Orden = sequelize.define('Orden', {
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    ciudad: { type: DataTypes.STRING, allowNull: false },
    direccion: { type: DataTypes.STRING, allowNull: false },
    telefono: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    metodoPago: { 
        type: DataTypes.ENUM('mercadopago', 'transferencia'),
        allowNull: false
    },
    estado: { 
        type: DataTypes.ENUM('pendiente', 'completado', 'cancelado'),
        defaultValue: 'pendiente'
    },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    detalle: { type: DataTypes.TEXT } // Guardaremos el carrito como texto/JSON
}, {
    tableName: 'fashion_ordenes', // Tabla separada para seguridad
    timestamps: true
});

Orden.sync({ alter: true });

module.exports = Orden;