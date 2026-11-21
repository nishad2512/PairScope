FROM node:22-alpine AS builder
WORKDIR /app
COPY service/realtime/package*.json ./
RUN npm ci
COPY service/realtime/src ./src
COPY service/realtime/tsconfig.json ./tsconfig.json
COPY tsconfig.base.json /tsconfig.base.json
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY service/realtime/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3004
CMD ["npm", "start"]
