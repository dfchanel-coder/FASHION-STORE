const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const Orden = require('../models/Orden'); // Importamos el modelo de Ordenes
const multer = require('multer');
const path = require('path');

// 1. Configuración Multer (Imágenes)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
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

// 2. Middleware de Seguridad
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

// --- RUTAS DE ACCESO ---

router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === 'VikyBichinque2026!') {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'Contraseña incorrecta' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --- RUTAS PROTEGIDAS (PRODUCTOS) ---

// Dashboard principal (Lista productos)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const productos = await Producto.findAll({ order: [['createdAt', 'DESC']] });
        res.render('admin/dashboard', { productos });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error cargando panel');
    }
});

router.post('/crear', authMiddleware, async (req, res) => {
    try {
        await Producto.create(req.body);
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.send('Error al crear producto');
    }
});

router.post('/eliminar/:id', authMiddleware, async (req, res) => {
    try {
        await Producto.destroy({ where: { id: req.params.id } });
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.send('Error al eliminar producto');
    }
});

// --- RUTAS PROTEGIDAS (IMÁGENES) ---

router.post('/subir-logo', authMiddleware, upload.single('logo'), (req, res) => {
    res.redirect('/admin');
});

router.post('/subir-banner', authMiddleware, upload.single('banner'), (req, res) => {
    res.redirect('/admin');
});

// --- RUTAS PROTEGIDAS (ÓRDENES) ---

// Ver listado de órdenes
router.get('/ordenes', authMiddleware, async (req, res) => {
    try {
        const ordenes = await Orden.findAll({ order: [['createdAt', 'DESC']] });
        res.render('admin/ordenes', { ordenes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error cargando órdenes');
    }
});

// Cambiar estado de una orden
router.post('/ordenes/estado/:id', authMiddleware, async (req, res) => {
    try {
        const { nuevoEstado } = req.body;
        await Orden.update({ estado: nuevoEstado }, { where: { id: req.params.id } });
        res.redirect('/admin/ordenes');
    } catch (error) {
        console.error(error);
        res.send('Error actualizando estado');
    }
});

module.exports = router;