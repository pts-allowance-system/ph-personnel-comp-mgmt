# 1. Base Image
FROM node:20.12.2-alpine AS base

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm && \
    apk update && apk upgrade && rm -rf /var/cache/apk/*

# 2. Dependency Installation
FROM base AS deps

COPY package.json pnpm-lock.yaml* ./

# Avoid running postinstall scripts during dependency install
RUN pnpm install --frozen-lockfile --ignore-scripts

# 3. Build App (production only)
FROM base AS builder

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# 4. Runtime Image (lighter)
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
