/**
 * @file comunicacaoRoutes.js
 * @description Chat (/chats), reclamações (/claims) e administração (/admin).
 */

const express = require('express');
const C = require('../controllers/ComunicacaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const chats = express.Router();
chats.use(authMiddleware);
chats.get('/', C.conversas);
chats.get('/unread', C.naoLidas);
chats.post('/', C.iniciar);
chats.get('/:id/messages', C.mensagens);
chats.post('/:id/messages', C.enviar);

const claims = express.Router();
claims.use(authMiddleware);
claims.get('/', C.reclamacoes);
claims.post('/', C.abrir);
claims.get('/:id', C.reclamacao);
claims.post('/:id/reply', C.responder);
claims.post('/:id/close', C.encerrar);
claims.post('/:id/mediation', C.mediacao);

const admin = express.Router();
admin.use(authMiddleware, adminMiddleware);
admin.get('/verifications', C.adminVerificacoes);
admin.post('/verifications/:id/decision', C.adminDecidirVerificacao);
admin.get('/claims', C.adminReclamacoes);
admin.get('/claims/:id', C.adminReclamacao);
admin.post('/claims/:id/decision', C.adminDecidirReclamacao);

module.exports = { chats, claims, admin };
