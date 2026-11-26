FROM node:22-alpine AS builder
WORKDIR /app
COPY service/notification-service/package*.json ./
RUN npm ci
COPY tsconfig.base.json /tsconfig.base.json
COPY service/notification-service/tsconfig.json ./
COPY service/notification-service/src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY service/notification-service/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY service/notification-service/migrations ./migrations
USER node
CMD ["npm", "start"]
