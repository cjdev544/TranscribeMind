FROM node:20-bookworm-slim AS base
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/logger/package.json packages/logger/package.json
COPY apps/gateway-api/package.json apps/gateway-api/package.json
# youtube-dl-exec's preinstall script only wants python present to sanity-check
# a version; that check isn't needed here since we just want the binary download.
# Its own postinstall download (which hits api.github.com to resolve the
# latest release) is skipped too, in favor of download-yt-dlp.js below, which
# proved more reliable against GitHub's rate limiting during image builds.
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1
ENV YOUTUBE_DL_SKIP_DOWNLOAD=1
RUN npm install
COPY apps/gateway-api/scripts/download-yt-dlp.mjs scripts/download-yt-dlp.mjs
RUN node scripts/download-yt-dlp.mjs

FROM deps AS build
COPY packages ./packages
COPY apps/gateway-api ./apps/gateway-api
RUN npm run build --workspace=@transcribemind/contracts
RUN npm run build --workspace=@transcribemind/database
RUN npm run build --workspace=@transcribemind/config
RUN npm run build --workspace=@transcribemind/logger
RUN npm run build --workspace=@transcribemind/gateway-api

FROM node:20-bookworm-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
# yt-dlp's Linux release asset (downloaded by youtube-dl-exec's postinstall)
# is a Python zipapp, not a standalone binary like the Windows .exe — it
# still needs a real python3 on PATH to run. ffmpeg itself is supplied by
# @ffmpeg-installer/ffmpeg (a bundled static binary), so no apt ffmpeg needed.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /repo /repo
EXPOSE 3000
# Applies any pending Prisma migrations before the API starts — keeps
# `docker compose up` a true one-command bootstrap, no separate migrate step.
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma && node apps/gateway-api/dist/main.js"]
