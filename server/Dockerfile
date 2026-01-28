# ------------ Build stage: install deps & compile TypeScript ------------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (including devDeps for TypeScript compilation)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
# Generate Prisma client before build (so TS types exist)
RUN npx prisma generate
# Compile TS to JS
RUN npm run build

# ------------ Runtime stage: production deps only ------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy manifests and install prod deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled app and Prisma files
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Prisma client is already generated in build stage, but safe to run again
RUN npx prisma generate

# The app will listen on PORT (default 3000)
EXPOSE 3000

# On container start, apply migrations, then start the API
# 'migrate deploy' applies existing migrations without prompts
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
