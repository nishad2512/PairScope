FROM node:22-alpine AS builder

WORKDIR /app

COPY service/auth-service/package*.json ./
RUN npm ci

COPY service/auth-service/. ./
COPY tsconfig.base.json /tsconfig.base.json

COPY proto ./proto

RUN npm run build


FROM node:22-alpine

WORKDIR /app

COPY service/auth-service/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

EXPOSE 3001
EXPOSE 50051

CMD ["npm", "start"]