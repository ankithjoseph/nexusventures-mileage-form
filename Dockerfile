# ================================
# Frontend Build Stage
# ================================
FROM node:20-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy server files
COPY server.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["node", "server.js"]