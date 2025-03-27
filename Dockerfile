# Development stage (now explicitly named)
FROM node:20.11.1 AS development

WORKDIR /usr/src/app

# Install build tools including python and g++
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Rebuild bcrypt specifically for the container architecture
RUN npm install --legacy-peer-deps && \
    npx prisma generate && \
    npm rebuild bcrypt --build-from-source


COPY . .

CMD ["npm", "run", "start:dev"]

# Stage 2: Production image
FROM node:20.11.1-slim

WORKDIR /usr/src/app

# Copy only production node_modules
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/prisma ./prisma

EXPOSE 8002

CMD ["node", "dist/main.js"]