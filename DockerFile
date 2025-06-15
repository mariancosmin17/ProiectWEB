FROM node:18-alpine

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

WORKDIR /app

COPY server/package.json ./package.json

RUN npm install --production

COPY server/ ./
COPY client/ ./client/

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["npm", "start"]
