const http = require('http');
const net = require('net');

const TARGET_PORT = 3001;
const LISTEN_PORT = 3000;

const server = http.createServer((req, res) => {
  // Fix Host header for Next.js
  const headers = { ...req.headers, host: `localhost:${TARGET_PORT}` };
  
  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end('Bad Gateway');
    }
  });

  req.pipe(proxyReq, { end: true });
});

// Handle CONNECT method for HTTPS (HMR websocket)
server.on('upgrade', (req, socket, head) => {
  const headers = { ...req.headers, host: `localhost:${TARGET_PORT}` };
  
  const connectOptions = {
    port: TARGET_PORT,
    host: '127.0.0.1',
  };

  const proxySocket = net.connect(connectOptions, () => {
    proxySocket.write(head);
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxySocket.on('error', (err) => {
    console.error('WebSocket proxy error:', err.message);
    socket.end();
  });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`Host proxy listening on port ${LISTEN_PORT}, forwarding to port ${TARGET_PORT}`);
});
