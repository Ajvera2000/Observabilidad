const express = require('express');
const winston = require('winston');
const client = require('prom-client');

const app = express();
const port = 3001;

// ============================================================
// 1. LOGS
// ============================================================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'microservice-b' },
  transports: [new winston.transports.Console()]
});

// ============================================================
// 2. MÉTRICAS
// ============================================================
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const httpRequestsCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de peticiones HTTP recibidas',
  labelNames: ['method', 'route', 'status']
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
    logger.info({
      message: 'Petición procesada',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    });
  });
  next();
});

// ============================================================
// ENDPOINTS
// ============================================================

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'microservice-b' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Endpoint principal de Servicio B
app.get('/api/info', (req, res) => {
  // Simula algo de procesamiento con latencia aleatoria
  const delay = Math.floor(Math.random() * 100);
  setTimeout(() => {
    logger.info({ message: 'Respondiendo petición en /api/info', processingTimeMs: delay });
    res.json({
      status: 'OK',
      source: 'Microservicio B',
      processingTimeMs: delay,
      timestamp: new Date().toISOString(),
      data: {
        items: ['item-1', 'item-2', 'item-3'],
        total: 3
      }
    });
  }, delay);
});

app.listen(port, () => {
  logger.info({ message: `Microservicio B corriendo en puerto ${port}` });
});
