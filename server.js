const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/db');
require('dotenv').config();

const app = express();

// Configuración de Vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sesión para el Carrito
app.use(session({
    secret: 'secret_fashion_store_fb',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Poner en true si usas HTTPS en producción
}));

// Variable global para el carrito en las vistas
app.use((req, res, next) => {
    if (!req.session.carrito) req.session.carrito = [];
    res.locals.cartItemCount = req.session.carrito.reduce((total, item) => total + item.cantidad, 0);
    next();
});

// IMPORTAR MODELOS (CRUCIAL: Esto crea las tablas en la base de datos)
require('./models/Producto');
require('./models/Orden'); // <--- Agregamos esto para que se cree la tabla de pedidos

// Rutas
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));

// Iniciar Servidor
const PORT = process.env.PORT || 3000;
db.authenticate()
    .then(() => {
        console.log('DB Conectada');
        app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
    })
    .catch(err => console.error('Error DB:', err));