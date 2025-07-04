FROM node:20-alpine AS builder

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile || pnpm fetch
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --offline || pnpm install

COPY . .
RUN pnpm run build

FROM node:20-alpine

RUN corepack enable pnpm && \
    apk add --no-cache tini

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --prod --frozen-lockfile || pnpm fetch --prod
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --prod --frozen-lockfile --offline || pnpm install --prod

COPY --from=builder /app/dist ./dist

# Create data directory for database
RUN mkdir -p /app/data && chown node:node /app/data

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

USER node

ENTRYPOINT ["/sbin/tini", "--"]

# Make sure to start the MCP server in HTTP mode
CMD ["node", "dist/main.js", "-t", "http"]