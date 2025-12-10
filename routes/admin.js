const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');

router.get('/', async (req, res) => {
    const productos = await Producto.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/dashboard', { productos });
});

router.post('/crear', async (req, res) => {
    await Producto.create(req.body);
    res.redirect('/admin');
});

router.post('/eliminar/:id', async (req, res) => {
    await Producto.destroy({ where: { id: req.params.id } });
    res.redirect('/admin');
});

module.exports = router;