// routes/index.js
const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const Orden = require('../models/Orden');
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
    res.redirect('/carrito'); // Ahora redirige al carrito para ver lo agregado
});

// Ver Carrito
router.get('/carrito', (req, res) => {
    res.render('carrito', { carrito: req.session.carrito });
});

// Ver Pagina de Checkout (Formulario)
router.get('/checkout', (req, res) => {
    if (!req.session.carrito || req.session.carrito.length === 0) {
        return res.redirect('/');
    }
    const total = req.session.carrito.reduce((sum, item) => sum + (item.unit_price * item.cantidad), 0);
    res.render('checkout', { carrito: req.session.carrito, total });
});

// PROCESAR ORDEN
router.post('/checkout/procesar', async (req, res) => {
    const { nombre, apellido, ciudad, direccion, telefono, email, metodoPago } = req.body;
    const carrito = req.session.carrito;
    const total = carrito.reduce((sum, item) => sum + (item.unit_price * item.cantidad), 0);

    // 1. Guardar la orden en Base de Datos
    const nuevaOrden = await Orden.create({
        nombre, apellido, ciudad, direccion, telefono, email,
        metodoPago,
        total,
        detalle: JSON.stringify(carrito) // Guardamos qué compró
    });

    // 2. Si es Mercado Pago
    if (metodoPago === 'mercadopago') {
        try {
            const items = carrito.map(item => ({
                title: item.title,
                unit_price: item.unit_price,
                quantity: item.cantidad,
                currency_id: 'UYU'
            }));

            const preference = new Preference(client);
            const result = await preference.create({
                body: {
                    items: items,
                    external_reference: nuevaOrden.id.toString(), // Para saber qué orden es
                    payer: {
                        name: nombre,
                        surname: apellido,
                        email: email
                    },
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
            return res.send('Error al conectar con Mercado Pago');
        }
    }

    // 3. Si es Transferencia
    if (metodoPago === 'transferencia') {
        // Limpiamos carrito y mandamos a pagina de exito con datos bancarios
        req.session.carrito = [];
        return res.redirect(`/confirmacion?orden=${nuevaOrden.id}&metodo=transferencia`);
    }
});

// Pagina de Confirmación / Exito
router.get('/confirmacion', async (req, res) => {
    const { orden, metodo, status } = req.query;
    const datosOrden = await Orden.findByPk(orden);
    
    // Si viene de Mercado Pago exitoso, actualizamos estado
    if (status === 'success' && datosOrden) {
        datosOrden.estado = 'completado';
        await datosOrden.save();
        req.session.carrito = []; // Limpiar carrito
    }

    res.render('success', { orden: datosOrden, metodo });
});

module.exports = router;