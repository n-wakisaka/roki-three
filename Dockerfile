FROM node:18-slim
RUN npm install --global http-server

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

CMD http-server
