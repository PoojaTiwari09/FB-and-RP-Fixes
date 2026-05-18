FROM node:20-slim AS base
RUN npm install -g pnpm@10.14.0

WORKDIR /app
COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter database exec prisma generate

EXPOSE 3001
CMD ["pnpm", "--filter", "api", "dev"]
