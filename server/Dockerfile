FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; if (typeof DatabaseSync !== 'function') process.exit(1)"

COPY src ./src

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/data/recycler.db

CMD ["npm", "start"]
