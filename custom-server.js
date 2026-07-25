const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = false; // Use production mode
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    // Fix Host header - replace the port in Host header
    const originalHost = req.headers.host || '';
    if (originalHost.includes(':81')) {
      req.headers.host = originalHost.replace(':81', ':3000');
    }
    
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, '0.0.0.0', () => {
    console.log(`> Custom server listening on port ${port}`);
  });
});
