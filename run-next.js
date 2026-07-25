process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[FATAL] Unhandled rejection:', err);
});

process.on('SIGTERM', (signal) => {
  console.log(`[SIGNAL] Received ${signal}`);
  process.exit(0);
});

process.on('SIGINT', (signal) => {
  console.log(`[SIGNAL] Received ${signal}`);
  process.exit(0);
});

process.on('exit', (code) => {
  console.log(`[EXIT] Process exiting with code ${code}`);
});

// Set the port before loading Next.js
process.env.PORT = '3001';

// Load the standalone server
require('./.next/standalone/server.js');
