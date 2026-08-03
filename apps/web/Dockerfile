FROM node:20-bullseye-slim AS base
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

FROM deps AS build
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web
RUN npm run build --workspace=@transcribemind/contracts

# Vite inlines VITE_* variables into the bundle at build time, so they must
# be supplied as build args here rather than as runtime container env vars.
ARG VITE_API_URL=http://localhost:3000
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build --workspace=@transcribemind/web

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
