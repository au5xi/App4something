# ------------ Build stage ------------
FROM node:20-alpine AS build
WORKDIR /app

# Copy manifests and install (devDeps included for TS compile)
COPY package.json package-lock.json ./
RUN npm ci

# Copy Prisma schema BEFORE generate; be explicit with --schema
COPY prisma ./prisma

# Copy TypeScript sources and tsconfig
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma client (needs node_modules + prisma/schema.prisma)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Compile TS to JS
RUN npm run build

# ------------ Runtime stage ------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built app and prisma folder (migrations, schema if needed)
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Safe to run generate again (keeps client in sync)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Port & startup
EXPOSE 3000
CMD ["/bin/sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]
