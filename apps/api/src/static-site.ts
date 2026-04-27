import fs from 'node:fs';
import path from 'node:path';

import type { Context, Hono } from 'hono';

export const isPathInsideDirectory = ({ rootPath, targetPath }: { rootPath: string; targetPath: string }) => {
  const relativePath = path.relative(rootPath, targetPath);

  return relativePath.length > 0 && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
};

export const isAssetLikeRequestPath = (requestPath: string) => path.extname(requestPath) !== '';

type StaticFileReadResult =
  | {
      status: 'ready';
      content: Buffer;
      contentType: string;
    }
  | {
      status: 'missing';
    }
  | {
      status: 'invalid_path';
    }
  | {
      status: 'unreadable';
    };

const readStaticFile = ({
  relativePath,
  webDistDir
}: {
  relativePath: string;
  webDistDir: string;
}): StaticFileReadResult => {
  const normalizedWebDistDir = path.resolve(webDistDir);
  const resolvedPath = path.resolve(normalizedWebDistDir, `.${relativePath}`);

  if (
    !isPathInsideDirectory({
      rootPath: normalizedWebDistDir,
      targetPath: resolvedPath
    })
  ) {
    return {
      status: 'invalid_path'
    };
  }

  try {
    if (!fs.existsSync(resolvedPath)) {
      return {
        status: 'missing'
      };
    }

    if (!fs.statSync(resolvedPath).isFile()) {
      return {
        status: 'missing'
      };
    }
  } catch {
    return {
      status: 'unreadable'
    };
  }

  const extension = path.extname(resolvedPath);
  const contentType =
    extension === '.js'
      ? 'text/javascript; charset=utf-8'
      : extension === '.css'
        ? 'text/css; charset=utf-8'
        : extension === '.svg'
          ? 'image/svg+xml'
          : extension === '.png'
            ? 'image/png'
            : extension === '.ico'
              ? 'image/x-icon'
              : extension === '.html'
                ? 'text/html; charset=utf-8'
                : 'application/octet-stream';

  try {
    return {
      status: 'ready',
      content: fs.readFileSync(resolvedPath),
      contentType
    };
  } catch {
    return {
      status: 'unreadable'
    };
  }
};

const serveIndex = ({ context, webDistDir }: { context: Context; webDistDir: string }) => {
  const indexPath = path.join(webDistDir, 'index.html');

  try {
    if (!fs.existsSync(indexPath)) {
      return context.text('Hermes Console web assets are missing. Run `pnpm build` before `pnpm start`.', 503);
    }

    if (!fs.statSync(indexPath).isFile()) {
      return context.text('Hermes Console web assets could not be read.', 500);
    }

    return context.html(fs.readFileSync(indexPath, 'utf8'));
  } catch {
    return context.text('Hermes Console web assets could not be read.', 500);
  }
};

// Strip the configured base path off the front of the request URL so the
// rest of this handler can resolve files relative to webDistDir as if the
// app were mounted at root. Hono's `app.route(basePath, inner)` routes the
// request to the inner app but `c.req.path` still reports the full URL,
// so we have to do this manually.
const stripBasePath = ({ requestPath, basePath }: { requestPath: string; basePath: string }): string => {
  if (basePath === '' || basePath === '/') return requestPath;
  if (requestPath === basePath) return '/';
  if (requestPath.startsWith(`${basePath}/`)) {
    return requestPath.slice(basePath.length);
  }
  return requestPath;
};

export const registerStaticSite = ({
  app,
  webDistDir,
  basePath = ''
}: {
  app: Hono;
  webDistDir: string;
  basePath?: string;
}) => {
  app.get('*', (context) => {
    const requestPath = stripBasePath({ requestPath: context.req.path, basePath });

    if (requestPath.startsWith('/api')) {
      return context.notFound();
    }

    const relativePath = requestPath === '/' ? '/index.html' : requestPath;
    const staticFile = readStaticFile({
      relativePath,
      webDistDir
    });

    if (staticFile.status === 'ready') {
      return new Response(new Uint8Array(staticFile.content), {
        headers: {
          'Content-Type': staticFile.contentType
        }
      });
    }

    if (staticFile.status === 'unreadable') {
      return context.text('Hermes Console web assets could not be read.', 500);
    }

    if (staticFile.status === 'invalid_path' || isAssetLikeRequestPath(requestPath)) {
      return context.notFound();
    }

    return serveIndex({
      context,
      webDistDir
    });
  });
};
