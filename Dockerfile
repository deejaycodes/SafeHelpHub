# Stage 1: Development
FROM node:20 AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
CMD ["npm", "run", "start:dev"]

# Stage 2: Production
FROM node:20 AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
CMD ["npm", "run", "start:prod"]
