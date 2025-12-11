const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const Orden = require('../models/Orden');
const multer = require('multer');
const path = require('path');

// Configuración Multer
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

// Middleware Seguridad
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

// Rutas Acceso
router.get('/login', (req, res) => { res.render('admin/login', { error: null }); });
router.post('/login', (req, res) => {
    if (req.body.password === 'VikyBichinque2026!') {
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

// --- GESTIÓN DE PRODUCTOS ---

// Dashboard (Listado)
router.get('/', authMiddleware, async (req, res) => {
    const productos = await Producto.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/dashboard', { productos });
});

// Crear
router.post('/crear', authMiddleware, async (req, res) => {
    await Producto.create(req.body);
    res.redirect('/admin');
});

// NUEVO: Formulario de Edición
router.get('/editar/:id', authMiddleware, async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.redirect('/admin');
        res.render('admin/editar', { producto });
    } catch (error) {
        console.error(error);
        res.redirect('/admin');
    }
});

// NUEVO: Procesar Edición
router.post('/editar/:id', authMiddleware, async (req, res) => {
    try {
        const { modelo, descripcion, precio, stock, tamaño, categoria, imagenUrl } = req.body;
        await Producto.update(
            { modelo, descripcion, precio, stock, tamaño, categoria, imagenUrl },
            { where: { id: req.params.id } }
        );
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.send('Error al actualizar');
    }
});

// Eliminar
router.post('/eliminar/:id', authMiddleware, async (req, res) => {
    await Producto.destroy({ where: { id: req.params.id } });
    res.redirect('/admin');
});

// --- GESTIÓN DE IMÁGENES ---
router.post('/subir-logo', authMiddleware, upload.single('logo'), (req, res) => res.redirect('/admin'));
router.post('/subir-banner', authMiddleware, upload.single('banner'), (req, res) => res.redirect('/admin'));

// --- GESTIÓN DE ÓRDENES ---
router.get('/ordenes', authMiddleware, async (req, res) => {
    const ordenes = await Orden.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/ordenes', { ordenes });
});

router.get('/ordenes/:id', authMiddleware, async (req, res) => {
    try {
        const orden = await Orden.findByPk(req.params.id);
        if (!orden) return res.redirect('/admin/ordenes');
        
        let detalleProductos = [];
        try {
            detalleProductos = typeof orden.detalle === 'string' ? JSON.parse(orden.detalle) : orden.detalle;
        } catch (e) {
            console.error("Error parseando detalle", e);
        }
        res.render('admin/orden_detalle', { orden, detalleProductos });
    } catch (error) {
        console.error(error);
        res.send('Error cargando detalle');
    }
});

router.post('/ordenes/estado/:id', authMiddleware, async (req, res) => {
    await Orden.update({ estado: req.body.nuevoEstado }, { where: { id: req.params.id } });
    const referer = req.get('Referer');
    if (referer && referer.includes('/ordenes/')) {
        res.redirect(`/admin/ordenes/${req.params.id}`);
    } else {
        res.redirect('/admin/ordenes');
    }
});

module.exports = router;