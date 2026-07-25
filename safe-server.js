const { spawn } = require('child_process');
const http = require('http');

const NEXT_PORT = 3001;
const PROXY_PORT = 3000;

function startNextServer() {
  const env = { ...process.env, PORT: String(NEXT_PORT) };
  const child = spawn('node', ['.next/standalone/server.js'], {
    cwd: __dirname,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[Next.js] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[Next.js ERR] ${data}`);
  });

  child.on('exit', (code, signal) => {
    console.log(`[Next.js] Process exited with code ${code}, signal ${signal}`);
    console.log('[Next.js] Restarting in 3 seconds...');
    setTimeout(startNextServer, 3000);
  });

  child.on('error', (err) => {
    console.error(`[Next.js] Failed to start: ${err.message}`);
  });

  return child;
}

const nextProcess = startNextServer();

// Wait for Next.js to be ready before starting proxy
setTimeout(() => {
  const proxy = http.createServer((clientReq, clientRes) => {
    const originalHost = clientReq.headers.host || '';
    let fixedHost = originalHost;
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
      headers: { ...clientReq.headers, host: fixedHost },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error(`[Proxy] Error: ${err.message}`);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
        clientRes.end('Bad Gateway - Server restarting...');
      }
    });

    clientReq.pipe(proxyReq, { end: true });
  });

  proxy.listen(PROXY_PORT, '0.0.0.0', () => {
    console.log(`[Proxy] Host-fix proxy on :${PROXY_PORT} → :${NEXT_PORT}`);
  });

  proxy.on('error', (err) => {
    console.error(`[Proxy] Server error: ${err.message}`);
  });
}, 5000);

process.on('SIGINT', () => {
  nextProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextProcess.kill();
  process.exit(0);
});
