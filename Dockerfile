# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy only what the server needs
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server.js ./
COPY api/ ./api/
COPY --from=builder /app/dist ./dist

EXPOSE 8080
USER node
CMD ["node", "server.js"]
