const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Fix Host and X-Forwarded-Host headers for Caddy proxy
    const originalHost = req.headers.host || '';
    if (!originalHost.includes(':')) {
      req.headers.host = `${originalHost}:${port}`;
    }
    if (req.headers['x-forwarded-host'] && req.headers['x-forwarded-host'].includes(':81')) {
      req.headers['x-forwarded-host'] = req.headers['x-forwarded-host'].replace(':81', `:${port}`);
    }
    
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`> Server on :${port}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  server.timeout = 30000;
  server.keepAliveTimeout = 5000;
  server.headersTimeout = 35000;
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
