const http = require('http');

const NEXT_PORT = 3001;
const PROXY_PORT = 3000;

const server = http.createServer((clientReq, clientRes) => {
  // Fix the Host header to include the port
  const originalHost = clientReq.headers.host || '';
  let fixedHost = originalHost;
  
  // If host doesn't include a port, add the Next.js port
  if (!originalHost.includes(':')) {
    fixedHost = `${originalHost}:${NEXT_PORT}`;
  } else if (originalHost.endsWith(':81')) {
    fixedHost = originalHost.replace(':81', `:${NEXT_PORT}`);
  }
  
  const options = {
    hostname: '127.0.0.1',
    port: NEXT_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: fixedHost,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end('Bad Gateway');
    }
  });

  clientReq.pipe(proxyReq, { end: true });
});

// Handle WebSocket upgrades for HMR
server.on('upgrade', (req, socket, head) => {
  const originalHost = req.headers.host || '';
  let fixedHost = originalHost;
  if (!originalHost.includes(':')) {
    fixedHost = `${originalHost}:${NEXT_PORT}`;
  }
  
  const options = {
    hostname: '127.0.0.1',
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: fixedHost,
    },
  };

  const proxyReq = http.request(options);
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    proxySocket.on('error', (err) => {
      console.error('Proxy socket error:', err.message);
      socket.end();
    });
    socket.on('error', (err) => {
      console.error('Client socket error:', err.message);
      proxySocket.end();
    });
    socket.write('HTTP/1.1 101 Switching Protocols\r\n');
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      socket.write(`${key}: ${value}\r\n`);
    }
    socket.write('\r\n');
    proxySocket.write(proxyHead);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on('error', (err) => {
    console.error('WebSocket proxy error:', err.message);
    socket.end();
  });
  proxyReq.end();
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Host-fix proxy on :${PROXY_PORT} → :${NEXT_PORT}`);
});
