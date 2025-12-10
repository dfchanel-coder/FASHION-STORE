const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('Producto', {
    modelo: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    tamaño: { type: DataTypes.STRING },
    categoria: { 
        type: DataTypes.ENUM('juguete', 'ropa', 'electrodomesticos', 'otros'),
        allowNull: false 
    },
    imagenUrl: { type: DataTypes.STRING }
});

// Sincronización automática para deploy rápido
Producto.sync({ alter: true });

module.exports = Producto;