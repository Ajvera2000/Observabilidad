FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
# --require tracing.js carga OpenTelemetry ANTES que el resto de la app
CMD ["node", "--require", "./tracing.js", "app.js"]
