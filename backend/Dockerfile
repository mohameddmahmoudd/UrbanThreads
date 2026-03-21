# ---- Build ----
FROM node:22-alpine AS builder
WORKDIR /app

# Copy workspace manifests so npm can resolve the full dependency graph
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci

# Copy backend source and build
COPY backend/ ./backend/
RUN npm run prisma:generate --workspace=backend
RUN npm run build:backend

# ---- Production ----
FROM node:22-alpine AS production
WORKDIR /app

# Preserve workspace layout so Node resolves modules from root node_modules
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 4000

# Run migrations then start the server
CMD ["sh", "-c", "../node_modules/.bin/prisma migrate deploy && node dist/main"]
