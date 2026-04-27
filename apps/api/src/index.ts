import type { AddressInfo } from 'node:net';

import { serve } from '@hono/node-server';

import { createApp } from '@/app';
import { readServerConfig } from '@/config';

const config = readServerConfig();
const hostname = config.host;

const app = createApp({
  config
});

if (hostname !== '127.0.0.1') {
  console.warn(
    `[api] HOST=${hostname} — binding on a non-loopback interface. Hermes Console is local-first by design; only set this when running behind a reverse proxy you trust to gate access.`
  );
}

const server = serve(
  {
    fetch: app.fetch,
    hostname,
    port: config.port
  },
  (info) => {
    if (info == null || typeof info === 'string') {
      console.log(`[api] listening on http://${hostname}:${config.port}`);
      return;
    }

    const address = info as AddressInfo;
    console.log(`[api] listening on http://${address.address}:${address.port}`);
  }
);

const shutdown = (signal: NodeJS.Signals) => {
  server.close(() => {
    console.log(`[api] stopped after ${signal}`);
    process.exit(0);
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

server.once('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `[api] port ${config.port} is already in use on ${hostname}. Stop the other process or set PORT to a different value.`
    );
    process.exit(1);
  }
});

export { app };
