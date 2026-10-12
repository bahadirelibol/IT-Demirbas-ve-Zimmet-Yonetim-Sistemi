FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@12.10.1 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --filter api... --frozen-lockfile
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN pnpm exec prisma generate && pnpm build
EXPOSE 3000
CMD ["sh", "docker-entrypoint.sh"]
