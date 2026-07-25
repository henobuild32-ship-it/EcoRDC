const { spawn } = require('child_process');
const http = require('http');

const NEXT_PORT = 3001;
const PROXY_PORT = 3000;
let nextProcess = null;
let restartCount = 0;
let isShuttingDown = false;

function startNext() {
  if (isShuttingDown) return;
  
  console.log(`[Supervisor] Starting Next.js on port ${NEXT_PORT}... (restart #${restartCount})`);
  
  const env = { 
    ...process.env, 
    PORT: String(NEXT_PORT), 
    KEEP_ALIVE_TIMEOUT: '5000',
    NODE_OPTIONS: '--max-old-space-size=256'
  };
  
  nextProcess = spawn('node', ['.next/standalone/server.js'], {
    cwd: __dirname,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  nextProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) console.log(`[Next.js] ${msg}`);
  });

  nextProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes('ExperimentalWarning')) console.error(`[Next.js ERR] ${msg}`);
  });

  nextProcess.on('exit', (code, signal) => {
    console.log(`[Supervisor] Next.js exited code=${code} signal=${signal}`);
    nextProcess = null;
    restartCount++;
    if (!isShuttingDown && restartCount < 50) {
      setTimeout(startNext, 2000);
    }
  });

  nextProcess.on('error', (err) => {
    console.error(`[Supervisor] Failed to start: ${err.message}`);
    nextProcess = null;
    if (!isShuttingDown) setTimeout(startNext, 3000);
  });
}

// Start Next.js
startNext();

// Wait for Next.js to be ready, then start proxy
setTimeout(() => {
  const proxy = http.createServer((clientReq, clientRes) => {
    // Fix headers for Caddy proxy
    const originalHost = clientReq.headers.host || '';
    let fixedHost = originalHost;
    if (!originalHost.includes(':')) {
      fixedHost = `${originalHost}:${NEXT_PORT}`;
    } else if (originalHost.endsWith(':81')) {
      fixedHost = originalHost.replace(':81', `:${NEXT_PORT}`);
    }
    
    let fixedFwdHost = clientReq.headers['x-forwarded-host'] || '';
    if (fixedFwdHost.includes(':81')) {
      fixedFwdHost = fixedFwdHost.replace(':81', `:${NEXT_PORT}`);
    }

    const headers = { 
      ...clientReq.headers, 
      host: fixedHost,
    };
    if (fixedFwdHost) {
      headers['x-forwarded-host'] = fixedFwdHost;
    }

    const options = {
      hostname: '127.0.0.1',
      port: NEXT_PORT,
      path: clientReq.url,
      method: clientReq.method,
      headers,
      timeout: 30000,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error(`[Proxy] ${err.message} for ${clientReq.method} ${clientReq.url}`);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
        clientRes.end('Server restarting...');
      }
    });

    proxyReq.on('timeout', () => {
      console.error(`[Proxy] Timeout for ${clientReq.url}`);
      proxyReq.destroy();
    });

    clientReq.on('error', (err) => {
      console.error(`[Proxy] Client error: ${err.message}`);
      proxyReq.destroy();
    });

    clientReq.pipe(proxyReq, { end: true });
  });

  proxy.listen(PROXY_PORT, '0.0.0.0', () => {
    console.log(`[Supervisor] Proxy :${PROXY_PORT} → :${NEXT_PORT}`);
  });

  proxy.on('error', (err) => {
    console.error(`[Proxy] Server error: ${err.message}`);
  });

  proxy.timeout = 30000;
  proxy.keepAliveTimeout = 5000;
  proxy.headersTimeout = 35000;
}, 5000);

process.on('SIGINT', () => { isShuttingDown = true; if (nextProcess) nextProcess.kill(); process.exit(0); });
process.on('SIGTERM', () => { isShuttingDown = true; if (nextProcess) nextProcess.kill(); process.exit(0); });
process.on('uncaughtException', (err) => console.error('[Supervisor] Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('[Supervisor] Unhandled:', err));
