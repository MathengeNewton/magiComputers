#!/bin/sh
cd /app
# Skip install if node_modules already populated (image or previous run) - speeds restarts
if [ ! -d node_modules/.pnpm ] || [ -z "$(ls -A node_modules/.pnpm 2>/dev/null)" ]; then
  pnpm install --no-frozen-lockfile
  pnpm rebuild bcrypt 2>/dev/null || true
fi

# Ensure API runtime deps are resolvable even when prior installs were partial.
if ! pnpm --filter api exec node -e "require.resolve('ts-node/dist/bin.js')" >/dev/null 2>&1; then
  pnpm install --no-frozen-lockfile
  pnpm rebuild bcrypt 2>/dev/null || true
fi

# Create symlink for zod in shared package node_modules so it can be resolved
mkdir -p /app/packages/shared/node_modules
ZOD_PATH=$(find /app/node_modules/.pnpm -name 'zod@*' -type d 2>/dev/null | head -1)
if [ -n "$ZOD_PATH" ] && [ ! -e /app/packages/shared/node_modules/zod ]; then
  ln -sf "${ZOD_PATH}/node_modules/zod" /app/packages/shared/node_modules/zod
fi

pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy
cd /app/services/api
TS_NODE_REGISTER=$(node -e "console.log(require.resolve('ts-node/register/transpile-only'))")
TSCONFIG_PATHS_REGISTER=$(node -e "console.log(require.resolve('tsconfig-paths/register'))")
exec node -r "$TS_NODE_REGISTER" -r "$TSCONFIG_PATHS_REGISTER" src/main.ts
