const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.REACT_APP_API_PROXY;
  if (!target) throw new Error('REACT_APP_API_PROXY is required for the development proxy');
  app.use('/api', createProxyMiddleware({ target, changeOrigin: true }));
};
