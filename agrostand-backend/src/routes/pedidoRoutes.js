/**
 * @file pedidoRoutes.js
 * @description Rotas de pedidos. A cotação de frete é pública (carrinho de
 * visitante); o resto exige JWT.
 */

const express = require('express');
const PedidoController = require('../controllers/PedidoController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');

const router = express.Router();

// Frete estimado e totais por produtor (antes do login também)
router.post('/quote', optionalAuthMiddleware, PedidoController.cotar);

router.use(authMiddleware);

router.post('/checkout', PedidoController.checkout);
router.get('/', PedidoController.compras);
router.get('/sales', PedidoController.vendas);
router.get('/:id', PedidoController.detalhe);
router.patch('/:id/status', PedidoController.alterarStatus);

module.exports = router;
