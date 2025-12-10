const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
    // Si existe la URL (Producción / Render)
    console.log('✅ Conectando a Base de Datos PostgreSQL (Render)...');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });
} else {
    // Si NO existe la URL (Modo Local en tu PC)
    console.log('⚠️ No se detectó DATABASE_URL. Usando Base de Datos LOCAL (SQLite) para pruebas.');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite', // Crea un archivo en tu carpeta
        logging: false
    });
}

module.exports = sequelize;