# ------------ Build stage ------------
FROM node:20-alpine AS build
WORKDIR /app

# Copy only package.json; no lock file in server workspace
COPY package.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# ------------ Runtime stage ------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
# No lock file -> use npm install with --omit=dev
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate

EXPOSE 3000
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
