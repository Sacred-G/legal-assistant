# Build stage for client
FROM node:18-alpine as client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage for server
FROM node:18-alpine as server-builder
WORKDIR /app
COPY package*.json ./
# Install only production dependencies and skip scripts
RUN npm ci --only=production --ignore-scripts
COPY . .

# Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy built assets and dependencies
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package*.json ./
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/routes ./routes
COPY --from=server-builder /app/services ./services
COPY --from=server-builder /app/server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
