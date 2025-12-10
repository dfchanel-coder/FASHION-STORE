const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Configuración MP
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Inicio
router.get('/', async (req, res) => {
    const productos = await Producto.findAll();
    res.render('index', { title: 'Fashion Store', productos });
});

// Agregar al Carrito
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
    res.redirect('/');
});

// Ver Carrito
router.get('/carrito', (req, res) => {
    res.render('carrito', { carrito: req.session.carrito });
});

// Checkout Mercado Pago
router.post('/checkout', async (req, res) => {
    try {
        const items = req.session.carrito.map(item => ({
            title: item.title,
            unit_price: item.unit_price,
            quantity: item.cantidad,
            currency_id: 'UYU'
        }));

        const body = {
            items: items,
            back_urls: {
                success: 'https://tusitio.onrender.com/success',
                failure: 'https://tusitio.onrender.com/failure',
                pending: 'https://tusitio.onrender.com/pending'
            },
            auto_return: 'approved'
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });
        
        res.redirect(result.init_point); // Redirige a Mercado Pago

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al procesar el pago');
    }
});

module.exports = router;