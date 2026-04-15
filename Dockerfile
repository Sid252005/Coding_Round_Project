# ─── Stage 1: Build Frontend ─────────────────────────────────
FROM node:20-bullseye AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

# Build with empty API URL (hits same server via relative paths)
RUN VITE_API_URL="" VITE_SOCKET_URL="" npm run build

# ─── Stage 2: Production Server ──────────────────────────────
FROM node:20-bullseye

# Install code execution tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    g++ \
    gcc \
    default-jdk \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend
COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/ ./

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/server.js"]
