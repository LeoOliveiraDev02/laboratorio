/**
 * @file NotificacaoService.js
 * @description Notificações do site (sininho) + e-mail opcional.
 *
 * `notificar()` é chamado pelos outros services quando algo acontece com um
 * usuário (pedido novo, status, mensagem, pergunta...). Grava como sistema
 * (o autor do evento é outra pessoa) e, com `NOTIFY_EMAIL=on`, envia e-mail
 * em segundo plano — falha de e-mail nunca derruba a operação principal.
 */

const NotificacaoDAO = require('../dao/NotificacaoDAO');
const UsuarioDAO = require('../dao/UsuarioDAO');
const { runAsSystem } = require('../db/context');
const { sendNotificationEmail } = require('../utils/email');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors/AppError');

function emailAtivo() {
  return (process.env.NOTIFY_EMAIL || 'off').toLowerCase() === 'on';
}

class NotificacaoService {
  /**
   * @param {number} usuarioId - destinatário
   * @param {{tipo: string, titulo: string, mensagem?: string, link?: string}} dados
   */
  static async notificar(usuarioId, dados) {
    try {
      await runAsSystem(() => NotificacaoDAO.create({ usuarioId, ...dados }));
    } catch (err) {
      logger.error('Falha ao registrar notificação', { usuarioId, tipo: dados.tipo, erro: err.message });
      return;
    }
    if (!emailAtivo()) return;
    runAsSystem(() => UsuarioDAO.findById(usuarioId))
      .then((u) => (u ? sendNotificationEmail(u.email, dados) : null))
      .catch((err) => logger.warn('Falha ao enviar e-mail de notificação', { usuarioId, erro: err.message }));
  }

  static async listar({ usuarioId }) {
    const [notificacoes, nao_lidas] = await Promise.all([
      NotificacaoDAO.listByUsuario(usuarioId),
      NotificacaoDAO.countNaoLidas(usuarioId),
    ]);
    return { notificacoes, nao_lidas };
  }

  static async marcarLida({ usuarioId, id }) {
    const ok = await NotificacaoDAO.marcarLida(id, usuarioId);
    if (!ok) throw new NotFoundError('Notificação não encontrada.');
  }

  static async marcarTodasLidas({ usuarioId }) {
    await NotificacaoDAO.marcarTodasLidas(usuarioId);
  }
}

module.exports = NotificacaoService;
