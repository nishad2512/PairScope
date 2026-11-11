FROM node:22-alpine AS builder

WORKDIR /app

COPY service/session-service/package*.json ./
RUN npm ci

COPY service/session-service/. ./
COPY tsconfig.base.json /tsconfig.base.json

RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY service/session-service/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3002

CMD ["npm", "start"]
