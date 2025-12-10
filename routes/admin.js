// routes/admin.js
const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Configuración para subir imágenes (Multer)
// Guardará los archivos en 'public/images' con nombre fijo
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        // Si el campo es 'logo', el archivo se llamará logo.png
        if (file.fieldname === 'logo') {
            cb(null, 'logo.png');
        } else if (file.fieldname === 'banner') {
            cb(null, 'banner.png');
        } else {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    }
});
const upload = multer({ storage: storage });

// 2. Middleware de Seguridad (Bloqueo)
// Si no puso la contraseña, lo manda al login
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

// --- RUTAS PÚBLICAS DEL ADMIN (LOGIN) ---

// GET Login
router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

// POST Login (Verificar contraseña)
router.post('/login', (req, res) => {
    const { password } = req.body;
    // Contraseña solicitada
    if (password === 'VikyBichinque2026!') {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'Contraseña incorrecta' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --- RUTAS PROTEGIDAS (DASHBOARD) ---

// Dashboard Principal
router.get('/', authMiddleware, async (req, res) => {
    const productos = await Producto.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/dashboard', { productos });
});

// Crear Producto
router.post('/crear', authMiddleware, async (req, res) => {
    await Producto.create(req.body);
    res.redirect('/admin');
});

// Eliminar Producto
router.post('/eliminar/:id', authMiddleware, async (req, res) => {
    await Producto.destroy({ where: { id: req.params.id } });
    res.redirect('/admin');
});

// --- RUTAS PARA SUBIR LOGO Y BANNER ---

router.post('/subir-logo', authMiddleware, upload.single('logo'), (req, res) => {
    res.redirect('/admin');
});

router.post('/subir-banner', authMiddleware, upload.single('banner'), (req, res) => {
    res.redirect('/admin');
});

module.exports = router;