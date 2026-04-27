import fs from 'node:fs';
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const defaultApiPort = 3940;
const repoRoot = path.resolve(__dirname, '../..');

const readAppVersion = (): string => {
  const packagePath = path.join(repoRoot, 'package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const parsedPackage = JSON.parse(packageContent) as { version?: unknown };

  return typeof parsedPackage.version === 'string' ? parsedPackage.version : '0.0.0';
};

const readApiPort = (rawPort: string | undefined): number => {
  if (rawPort == null || rawPort === '') {
    return defaultApiPort;
  }

  if (!/^\d+$/.test(rawPort)) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const parsedPort = Number(rawPort);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return parsedPort;
};

// Normalize a user-supplied base path so it always starts and ends with `/`.
// Vite's `base` config requires this shape; the matching dev-proxy entry is
// derived from it. Empty / unset / `/` all collapse to root (no prefix).
const readBasePath = (raw: string | undefined): string => {
  if (raw == null || raw === '' || raw === '/') {
    return '/';
  }
  let normalized = raw.trim();
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (!normalized.endsWith('/')) normalized = `${normalized}/`;
  return normalized;
};

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, repoRoot, '');
  const apiPort = readApiPort(environment.PORT);
  const basePath = readBasePath(environment.BASE_PATH);
  // Dev-server proxy key: `/api` when base is root, else `<base-without-trailing>/api`.
  const proxyApiPath = basePath === '/' ? '/api' : `${basePath.replace(/\/$/, '')}/api`;

  return {
    base: basePath,
    define: {
      'globalThis.__APP_VERSION__': JSON.stringify(readAppVersion())
    },
    envDir: repoRoot,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      proxy: {
        [proxyApiPath]: `http://127.0.0.1:${apiPort}`
      }
    }
  };
});
