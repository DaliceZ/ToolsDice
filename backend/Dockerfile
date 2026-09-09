FROM oven/bun:1.2.22-alpine AS install
WORKDIR /app
COPY package.json bun.lock ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN bun install --frozen-lockfile

FROM oven/bun:1.2.22-alpine
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY backend ./backend
WORKDIR /app/backend
ENV API_PORT=3000
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
