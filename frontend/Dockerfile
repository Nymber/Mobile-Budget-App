# Stage 1: Dependencies and build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Increase Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies with a more memory-efficient approach
RUN npm ci --no-audit --no-fund --prefer-offline || \
    npm install --no-audit --no-fund --prefer-offline

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Add a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package.json and required build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# Create public directory
RUN mkdir -p ./public
COPY --from=builder --chown=nextjs:nodejs /app/public/ ./public/

# Conditionally copy next.config.js or create a minimal one if it doesn't exist
RUN if [ -f /app/next.config.js ]; then \
    cp /app/next.config.js ./next.config.js; \
    else echo 'module.exports = {}' > ./next.config.js; \
fi

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]