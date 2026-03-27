FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y \
  ffmpeg \
  chromium \
  fonts-noto-color-emoji \
  fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8080

CMD ["npx", "tsx", "render-service/index.ts"]
