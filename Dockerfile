# ------------ Build stage ------------
FROM node:20-alpine AS build
WORKDIR /app

# Copy and install SERVER deps (no root lockfile required)
COPY server/package.json ./server/package.json
RUN npm install --prefix ./server

# Copy SERVER sources (ts, prisma, etc.)
COPY server ./server

# Generate Prisma client and build server
WORKDIR /app/server
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Copy and install CLIENT deps
WORKDIR /app
COPY client/package.json ./client/package.json
RUN npm install --prefix ./client

# Copy CLIENT sources and build
COPY client ./client
WORKDIR /app/client
RUN npm run build

# ------------ Runtime stage (API only) ------------
FROM node:20-alpine AS api-runtime
WORKDIR /app/server
ENV NODE_ENV=production


# Install only production deps for the server
COPY server/package.json ./package.json
RUN npm install --omit=dev

# Bring compiled server and prisma
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/prisma ./prisma

# Generate Prisma client in runtime image (safe to run again)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Optionally serve built client from the API container
WORKDIR /app
RUN mkdir -p /app/client-dist
COPY --from=build /app/client/dist /app/client-dist

# Expose API port & start (apply migrations first)
EXPOSE 3000
WORKDIR /app/server
CMD ["/bin/sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]
CMD ["/bin/sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma && node dist/index.js"]
