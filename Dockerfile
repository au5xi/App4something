# ------------ Build stage ------------
FROM node:20-alpine AS build
WORKDIR /app

# Copy root manifests; use npm ci for reproducible installs
# (If you don't have a root package-lock.json, switch to npm install)
COPY package.json package-lock.json ./
RUN npm ci

# Copy workspace manifests (NO node_modules)
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

# Install workspace deps with npm workspaces (still no node_modules copied)
RUN npm ci --workspace server --workspace client

# Copy actual sources now
COPY server/tsconfig.json ./server/tsconfig.json
COPY server/src ./server/src
COPY server/prisma ./server/prisma

COPY client/tsconfig.json ./client/tsconfig.json
COPY client/src ./client/src
COPY client/index.html ./client/index.html
COPY client/public ./client/public

# Generate Prisma client and build server
WORKDIR /app/server
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Build client (Vite)
WORKDIR /app/client
RUN npm run build

# ------------ Runtime stage (API) ------------
FROM node:20-alpine AS api-runtime
WORKDIR /app/server
ENV NODE_ENV=production

# Copy root manifests (for workspace install)
COPY package.json package-lock.json /app/
WORKDIR /app/server
RUN npm ci --omit=dev --workspace server

# Copy compiled server and prisma
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/prisma ./prisma

# Generate Prisma client again in runtime image (safe)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Optionally serve client assets via API container (static folder)
# If you prefer separate hosting for client, skip this block.
WORKDIR /app
RUN mkdir -p /app/client-dist
COPY --from=build /app/client/dist /app/client-dist

# Expose API port & start (migrations on boot)
EXPOSE 3000
WORKDIR /app/server
CMD ["/bin/sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]
