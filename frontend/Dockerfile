# Stage 1: Dependencies and build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Increase Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies with a more memory-efficient approach
# Using npm ci --no-audit --no-fund to reduce memory usage
RUN npm ci --no-audit --no-fund --prefer-offline || \
    # Fallback to regular npm install if npm ci fails
    npm install --no-audit --no-fund --prefer-offline

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Add a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Create a health check endpoint
RUN echo '{"status":"ok"}' > ./public/api/health.json

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]