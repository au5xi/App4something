# ------------ Build stage ------------
FROM node:20-alpine AS build
WORKDIR /app

# Only package.json (no lock file in server/)
COPY package.json ./
RUN npm install

# Copy Prisma & source
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Generate prisma client and build
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# ------------ Runtime stage ------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only prod deps (no lock)
COPY package.json ./
RUN npm install --omit=dev

# Bring built app + prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000
CMD ["/bin/sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]
