import { createProxyMiddleware } from 'http-proxy-middleware';

const setupProxy = (app) => {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api',
      },
      onProxyReq: (proxyReq, _req, _res) => {
        // Add CORS headers
        proxyReq.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
        proxyReq.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      },
      onProxyRes: (proxyRes, _req, _res) => {
        // Ensure CORS headers are set in the response
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      },
    })
  );
};

export default setupProxy;
