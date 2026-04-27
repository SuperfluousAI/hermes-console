import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';
import { z } from 'zod';

const serverEnvSchema = z.object({
  PORT: z.string().optional(),
  HOST: z.string().optional(),
  BASE_PATH: z.string().optional()
});

export type ServerConfig = {
  port: number;
  /**
   * Hostname / interface the API binds to. Defaults to `127.0.0.1` (the
   * historical local-only default). Set HOST=0.0.0.0 to expose on all
   * interfaces (e.g. when running inside a container behind a reverse
   * proxy that lives in the same network namespace).
   */
  host: string;
  /**
   * URL path prefix the app is mounted under. Defaults to `/` (root). Set
   * BASE_PATH=/console (or any other prefix) to serve everything — both
   * the API routes (`/console/api/*`) and the static SPA (`/console/...`)
   * — under the prefix. The Vite frontend bakes this prefix into asset
   * URLs at build time, so the value must match between the build env
   * and the runtime env. Always normalized to start with `/` and have NO
   * trailing slash internally; consumers can append `/api` etc.
   */
  basePath: string;
  repoRoot: string;
  webDistDir: string;
};

const findRepoRoot = (startPath: string): string => {
  let currentPath = path.resolve(startPath);

  while (true) {
    if (fs.existsSync(path.join(currentPath, 'pnpm-workspace.yaml'))) {
      return currentPath;
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      return path.resolve(startPath);
    }

    currentPath = parentPath;
  }
};

const loadEnvironment = (repoRoot: string): void => {
  const environmentFiles = ['.env.local', '.env'];

  environmentFiles.forEach((fileName) => {
    const filePath = path.join(repoRoot, fileName);

    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false, quiet: true });
    }
  });
};

const parsePort = (value: string | undefined): number => {
  if (value == null) {
    return 3940;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return parsed;
};

const parseHost = (value: string | undefined): string => {
  if (value == null || value === '') {
    return '127.0.0.1';
  }
  return value.trim();
};

// Returns a base path that always starts with `/` and has NO trailing slash
// (e.g. `/console`, or `''` for the root). The "no trailing slash" form is
// what Hono's app.basePath() expects and what makes string concatenation
// like `${basePath}/api/foo` produce the right URL in either mode.
const parseBasePath = (value: string | undefined): string => {
  if (value == null || value === '' || value === '/') {
    return '';
  }
  let normalized = value.trim();
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (normalized.endsWith('/')) normalized = normalized.replace(/\/+$/, '');
  return normalized;
};

export const readServerConfig = (): ServerConfig => {
  const repoRoot = findRepoRoot(process.cwd());
  loadEnvironment(repoRoot);

  const env = serverEnvSchema.parse(process.env);

  return {
    port: parsePort(env.PORT),
    host: parseHost(env.HOST),
    basePath: parseBasePath(env.BASE_PATH),
    repoRoot,
    webDistDir: path.join(repoRoot, 'apps', 'web', 'dist')
  };
};
