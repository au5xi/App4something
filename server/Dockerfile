# ------------ Build stage ------------
FROM node:20-alpine AS build
WORKDIR /app

# If you do NOT have server/package-lock.json, copy only package.json and use npm install
# (If you DO have server/package-lock.json, change to `COPY package.json package-lock.json ./` and `npm ci`)
COPY package.json ./
RUN npm install

# Copy everything else from server/ (source, prisma, tsconfig, etc.)
# Make sure your .dockerignore in server/ is not excluding 'prisma' or 'src'
COPY . .

# If your Prisma schema exists at /app/prisma/schema.prisma, generate client
# Use --schema to be explicit and avoid path ambiguity
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build TypeScript -> JavaScript (expects tsconfig.json and sources present)
RUN npm run build

# ------------ Runtime stage ------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package.json ./
RUN npm install --omit=dev

# Copy compiled app and prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Generate Prisma client in runtime image (safe to run again)
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000
CMD ["/bin/sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]
