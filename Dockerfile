# 1. Base image - Use a Node.js LTS version. Change if needed.
FROM node:20.12.2-alpine AS base

# Update OS packages to mitigate vulnerabilities
USER root
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# 2. Dependencies
FROM base AS deps
# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./
# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# 3. Build stage (for production, if you want a separate build image)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# 4. Runner stage (for development or production)
FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose the port Next.js runs on
EXPOSE 3000

# Default command to run the app in development mode
# For production, you might change this to 'pnpm start'
CMD ["pnpm", "dev"]
