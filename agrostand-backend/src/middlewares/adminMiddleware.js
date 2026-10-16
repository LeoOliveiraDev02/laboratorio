/**
 * @file adminMiddleware.js
 * @description Restringe rotas ao administrador do marketplace. Usar depois
 * do authMiddleware. Administradores são os e-mails listados em ADMIN_EMAILS
 * (separados por vírgula) no .env.
 */

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdmin(user) {
  return !!user && adminEmails().includes(String(user.email).toLowerCase());
}

function adminMiddleware(req, res, next) {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ status: 'error', message: 'Acesso restrito à administração.' });
  }
  return next();
}

adminMiddleware.isAdmin = isAdmin;

module.exports = adminMiddleware;
