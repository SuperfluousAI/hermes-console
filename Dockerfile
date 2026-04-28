# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# Hermes Console — container image for the SuperfluousAI bot platform.
#
# Multi-stage build:
#   1. `builder` — installs all deps with pnpm, runs the workspace build with
#      BASE_PATH baked into the Vite bundle, then prunes dev deps.
#   2. final stage — copies the pruned workspace and runs `pnpm start` as a
#      non-root user.
#
# BASE_PATH is a build-time arg (not just a runtime env): Vite emits asset
# URLs that include the prefix at compile time, so the value of BASE_PATH
# during `pnpm build` is what gets baked into the bundle. The runtime ENV
# value MUST match. Default `/console` matches the bot platform's wiring.
# ---------------------------------------------------------------------------

ARG NODE_IMAGE=node:20.19-alpine
ARG BASE_PATH=/console

# ─── Builder ───────────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS builder

RUN corepack enable
WORKDIR /app

# Copy lockfile + workspace metadata FIRST for better caching when only
# source changes. pnpm fetches all deps based on the lockfile alone.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Root tsconfigs are referenced via "extends": "../../tsconfig.base.json"
# from every package. If they're missing, tsc errors with TS5083 and falls
# back to default compiler options, which produces confusing downstream
# type errors (the real problem is the missing extends target).
COPY tsconfig.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages packages/

RUN pnpm install --frozen-lockfile

# Source comes after deps so changes to source don't bust the install layer.
COPY apps apps/

ARG BASE_PATH
ENV BASE_PATH=${BASE_PATH}

RUN pnpm build

# Strip dev deps so the runtime image carries only what's needed for `pnpm start`.
# CI=true so pnpm prune is non-interactive (otherwise:
# ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY).
RUN CI=true pnpm prune --prod

# ─── Runtime ───────────────────────────────────────────────────────────────
FROM ${NODE_IMAGE}

RUN corepack enable

# Match the bot platform's pod security model: non-root, fixed uid 10000
# (same as hermes-agent so shared volumes work via fsGroup=10000).
RUN addgroup -g 10000 hermes \
 && adduser -u 10000 -G hermes -s /sbin/nologin -D hermes

WORKDIR /app
COPY --from=builder --chown=10000:10000 /app /app

USER 10000:10000

ENV NODE_ENV=production
ENV PORT=3940
ENV HOST=0.0.0.0
ARG BASE_PATH
ENV BASE_PATH=${BASE_PATH}

EXPOSE 3940

CMD ["pnpm", "start"]
