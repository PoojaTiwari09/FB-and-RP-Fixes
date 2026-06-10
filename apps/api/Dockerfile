# Stage 1: Build the Monorepo Node App
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy entire workspace to ensure all hoisted dependencies are available
COPY . .

# Install dependencies and build the API
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter api build

# Stage 2: Production Execution
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /usr/src/app
RUN npm install -g pnpm

COPY --from=builder /usr/src/app /usr/src/app

EXPOSE 3001
CMD ["pnpm", "--filter", "api", "start:prod"]
