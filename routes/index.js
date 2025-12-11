const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const Orden = require('../models/Orden');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// INICIO (Con Slider Random)
router.get('/', async (req, res) => {
    const productos = await Producto.findAll();
    
    // Mezclar productos y tomar 3 para el slider
    let novedades = [...productos].sort(() => 0.5 - Math.random()).slice(0, 3);

    res.render('index', { 
        title: 'Fashion Store', 
        productos: productos, 
        novedades: novedades 
    });
});

// AGREGAR AL CARRITO
router.post('/carrito/agregar', async (req, res) => {
    const { id } = req.body;
    const producto = await Producto.findByPk(id);
    if (producto) {
        const itemIndex = req.session.carrito.findIndex(p => p.id === producto.id);
        if (itemIndex > -1) {
            req.session.carrito[itemIndex].cantidad += 1;
        } else {
            req.session.carrito.push({
                id: producto.id,
                title: producto.modelo,
                unit_price: parseFloat(producto.precio),
                cantidad: 1,
                currency_id: 'UYU'
            });
        }
    }
    res.redirect('/carrito');
});

// RUTAS CARRITO Y CHECKOUT
router.get('/carrito', (req, res) => res.render('carrito', { carrito: req.session.carrito }));

router.get('/checkout', (req, res) => {
    if (!req.session.carrito || req.session.carrito.length === 0) return res.redirect('/');
    const total = req.session.carrito.reduce((sum, item) => sum + (item.unit_price * item.cantidad), 0);
    res.render('checkout', { carrito: req.session.carrito, total });
});

router.post('/checkout/procesar', async (req, res) => {
    const { nombre, apellido, ciudad, direccion, telefono, email, metodoPago } = req.body;
    const carrito = req.session.carrito;
    const total = carrito.reduce((sum, item) => sum + (item.unit_price * item.cantidad), 0);

    const nuevaOrden = await Orden.create({
        nombre, apellido, ciudad, direccion, telefono, email, metodoPago, total,
        detalle: JSON.stringify(carrito)
    });

    if (metodoPago === 'mercadopago') {
        try {
            const items = carrito.map(item => ({
                title: item.title, unit_price: item.unit_price, quantity: item.cantidad, currency_id: 'UYU'
            }));
            const preference = new Preference(client);
            const result = await preference.create({
                body: {
                    items: items,
                    external_reference: nuevaOrden.id.toString(),
                    back_urls: {
                        success: `https://${req.get('host')}/confirmacion?orden=${nuevaOrden.id}&status=success`,
                        failure: `https://${req.get('host')}/confirmacion?orden=${nuevaOrden.id}&status=failure`,
                        pending: `https://${req.get('host')}/confirmacion?orden=${nuevaOrden.id}&status=pending`
                    },
                    auto_return: 'approved'
                }
            });
            return res.redirect(result.init_point);
        } catch (error) {
            console.error(error);
            return res.send('Error MP');
        }
    }

    if (metodoPago === 'transferencia') {
        req.session.carrito = [];
        return res.redirect(`/confirmacion?orden=${nuevaOrden.id}&metodo=transferencia`);
    }
});

router.get('/confirmacion', async (req, res) => {
    const { orden, metodo, status } = req.query;
    const datosOrden = await Orden.findByPk(orden);
    if (status === 'success' && datosOrden) {
        datosOrden.estado = 'completado';
        await datosOrden.save();
        req.session.carrito = [];
    }
    res.render('success', { orden: datosOrden, metodo });
});

module.exports = router;