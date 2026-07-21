const { ipKeyGenerator, rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./auth');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * AI rate limiter: 20 requests/hour, keyed by authenticated user id when present.
 * Falls back to client IP for unauthenticated requests so abusers can't bypass it
 * by simply omitting the Authorization header.
 *
 * The limiter is mounted before authenticateToken in some places, so we
 * inspect-and-decode the JWT here (without throwing) to recover user.id.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Too many AI requests. Please wait before retrying.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req /* , res */) => {
    if (req.user && req.user.id) return `user:${req.user.id}`;
    const auth = req.headers && req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        if (decoded && decoded.id) return `user:${decoded.id}`;
      } catch (_) { /* fall through to ip */ }
    }
    return ipKeyGenerator(req.ip);
  }
});

module.exports = { generalLimiter, authLimiter, aiLimiter };
