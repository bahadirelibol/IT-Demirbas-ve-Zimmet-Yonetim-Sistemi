FROM node:22-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@12.10.1 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter web... --frozen-lockfile
COPY apps/web apps/web
WORKDIR /app/apps/web
ENV VITE_API_URL=
RUN pnpm build

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
