# Use Node 20 instead of 18
FROM node:20.11.1-slim AS development

WORKDIR /usr/src/app

# Install build tools
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Install dependencies with clean slate
RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:20.11.1-slim AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/prisma ./prisma

EXPOSE 8002

CMD ["node", "dist/main.js"]