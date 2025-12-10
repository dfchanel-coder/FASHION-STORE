const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('Producto', {
    modelo: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    descripcion: { 
        type: DataTypes.TEXT 
    },
    precio: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
    },
    stock: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    },
    tamaño: { 
        type: DataTypes.STRING 
    },
    categoria: { 
        type: DataTypes.ENUM('juguete', 'ropa', 'electrodomesticos', 'otros'),
        allowNull: false 
    },
    imagenUrl: { 
        type: DataTypes.STRING 
    }
}, {
    // ESTO ES LO IMPORTANTE: Cambiamos el nombre de la tabla
    // para que no choque con la de tu otro proyecto.
    tableName: 'fashion_productos',
    timestamps: true
});

// Sincronización automática (creará la tabla fashion_productos)
Producto.sync({ alter: true })
    .then(() => console.log("Tabla 'fashion_productos' sincronizada correctamente"))
    .catch(err => console.error("Error sincronizando tabla:", err));

module.exports = Producto;