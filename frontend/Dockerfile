# Use Node.js 18 as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies with increased memory for Node.js
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set environment variables for better performance
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Expose the listening port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]