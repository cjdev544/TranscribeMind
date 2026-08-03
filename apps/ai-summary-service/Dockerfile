FROM node:20-bullseye-slim AS base
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/logger/package.json packages/logger/package.json
COPY apps/ai-summary-service/package.json apps/ai-summary-service/package.json
RUN npm install

FROM deps AS build
COPY packages ./packages
COPY apps/ai-summary-service ./apps/ai-summary-service
RUN npm run build --workspace=@transcribemind/contracts
RUN npm run build --workspace=@transcribemind/database
RUN npm run build --workspace=@transcribemind/config
RUN npm run build --workspace=@transcribemind/logger
RUN npm run build --workspace=@transcribemind/ai-summary-service

FROM node:20-bullseye-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo /repo
CMD ["node", "apps/ai-summary-service/dist/main.js"]
