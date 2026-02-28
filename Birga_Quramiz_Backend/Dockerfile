FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Re-install ONLY production dependencies so the image stays small
RUN npm install --omit=dev

# Generate the exact Prisma Client required by this specific alpine container architecture
RUN npx prisma generate

EXPOSE 10000

ENV PORT=10000

CMD ["npm", "run", "start:prod"]
