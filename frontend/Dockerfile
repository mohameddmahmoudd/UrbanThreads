# ---- Build ----
FROM node:22-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are baked into the bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_GAMEBALL_API_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_GAMEBALL_API_KEY=$NEXT_PUBLIC_GAMEBALL_API_KEY

# Copy workspace manifests so npm can resolve the full dependency graph
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./frontend/
RUN npm run build:frontend

# ---- Production ----
FROM node:22-alpine AS production
WORKDIR /app

# Preserve workspace layout so Node resolves modules from root node_modules
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/.next ./frontend/.next
# Copy public dir only if it exists (project currently has none)
# COPY --from=builder /app/frontend/public ./frontend/public

WORKDIR /app/frontend
ENV NODE_ENV=production
# Make workspace binaries (next) available on PATH
ENV PATH="/app/node_modules/.bin:$PATH"
EXPOSE 3000

CMD ["next", "start"]
