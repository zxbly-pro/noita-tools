# Stage 1: Build frontend
FROM node:22.16.0-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Production server (standalone, no external deps)
FROM node:22.16.0-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY server/standalone.mjs ./server/standalone.mjs
COPY server/io/compute.mjs ./server/io/compute.mjs
COPY server/logger.mjs ./server/logger.mjs
COPY --from=builder /app/build ./build/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--experimental-modules", "./server/standalone.mjs"]
