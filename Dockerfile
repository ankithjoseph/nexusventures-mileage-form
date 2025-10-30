# ================================
# Production-Ready Multi-Stage Build
# ================================

# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci --frozen-lockfile && npm cache clean --force

# Copy source code
COPY . .

# Build application with optimizations
ENV NODE_ENV=production
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# ================================
# Production Runtime Stage
# ================================

FROM node:20-alpine AS runtime

# Install security updates and required packages
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy API server files
COPY api ./api

# Copy health check script
COPY --chmod=755 <<EOF /app/healthcheck.sh
#!/bin/sh
# Check if server is responding
curl -f http://localhost:3001/health || exit 1
EOF

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /app/healthcheck.sh

# Expose port
EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "api/server.js"]