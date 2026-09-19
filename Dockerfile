FROM node:22-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_FIRESTORE_DATABASE_ID
ENV VITE_FIRESTORE_DATABASE_ID=$VITE_FIRESTORE_DATABASE_ID
RUN pnpm build
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "node_modules/tsx/dist/cli.mjs", "server.ts"]
