# Multi-stage Dockerfile for Node.js application

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm run prisma:gen

# Set OpenAPI path for generation
ENV OPEN_API_PATH='./docs/'

# Build the application
RUN pnpm run build

# Generate OpenAPI docs
RUN pnpm run api:gen

# Production stage
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Install PM2 globally
RUN npm install -g pm2

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and generated client (including engine)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

# Copy docs if needed
COPY --from=builder /app/docs ./docs

# Copy PM2 config
COPY --from=builder /app/ecosystem.config.cjs ./ecosystem.config.cjs

# Expose port
EXPOSE 3000

# Set environment to production
# ENV NODE_ENV=production
ENV NODE_ENV=development

# Start the application
CMD ["pm2-runtime", "ecosystem.config.cjs"]