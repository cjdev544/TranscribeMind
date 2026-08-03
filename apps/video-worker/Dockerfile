FROM node:20-bullseye-slim AS base
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/logger/package.json packages/logger/package.json
COPY apps/video-worker/package.json apps/video-worker/package.json
RUN npm install

FROM deps AS build
COPY packages ./packages
COPY apps/video-worker ./apps/video-worker
RUN npm run build --workspace=@transcribemind/contracts
RUN npm run build --workspace=@transcribemind/database
RUN npm run build --workspace=@transcribemind/config
RUN npm run build --workspace=@transcribemind/logger
RUN npm run build --workspace=@transcribemind/video-worker

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
CMD ["node", "apps/video-worker/dist/main.js"]
