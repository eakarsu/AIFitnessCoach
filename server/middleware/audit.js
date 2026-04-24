const auditLog = (req, res, next) => {
  // Only audit write operations
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return next();

  next();

  // Log asynchronously after response
  const pool = req.app.locals.pool;
  if (!pool) return;

  const userId = req.user?.id || null;
  const action = { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' }[req.method];
  const pathParts = req.path.split('/').filter(Boolean);
  const resource = pathParts[1] || pathParts[0] || 'unknown';
  const resourceId = req.params.id ? parseInt(req.params.id) : null;
  const ip = req.ip || req.connection?.remoteAddress;

  pool.query(
    'INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, action, resource, resourceId, JSON.stringify({ body: req.body }), ip]
  ).catch(err => console.error('Audit log error:', err.message));
};

module.exports = auditLog;
