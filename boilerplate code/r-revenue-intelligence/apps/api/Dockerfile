# Stage 1: Build the Monorepo Node App
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy root monorepo configuration files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy all packages, modules, and apps needed for the build
COPY packages ./packages
COPY modules ./modules
COPY apps/api ./apps/api

# Install dependencies and build the API
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build

# Stage 2: Production Execution
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
RUN npm install -g pnpm

COPY --from=builder /usr/src/app /usr/src/app

EXPOSE 3001
CMD ["pnpm", "--filter", "api", "start:prod"]
