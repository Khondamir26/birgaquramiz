# -----------------------------
# Stage 1 — Build application
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# Install dependencies first (better Docker caching)
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build NestJS app
RUN pnpm build


# -----------------------------
# Stage 2 — Production deps
# -----------------------------
FROM node:20-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile


# -----------------------------
# Stage 3 — Runtime container
# -----------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN corepack enable
RUN apk add --no-cache openssl

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Generate Prisma client for the production node_modules
RUN pnpm prisma generate

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

# Create uploads directory with correct ownership before switching user
RUN mkdir -p /app/uploads/products

# Create non-root user
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 5000

CMD ["./entrypoint.sh"]