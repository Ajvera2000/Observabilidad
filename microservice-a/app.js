// IMPORTANTE: tracing.js se carga primero via --require en el CMD del Dockerfile
const express = require('express');
const winston = require('winston');
const client = require('prom-client');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

// ============================================================
// 1. LOGS - Winston en formato JSON (listo para ELK/Kibana)
// ============================================================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'microservice-a' },
  transports: [new winston.transports.Console()]
});

// ============================================================
// 2. MÉTRICAS - Prometheus
// ============================================================
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const httpRequestsCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de peticiones HTTP recibidas',
  labelNames: ['method', 'route', 'status']
});

const httpDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

// Middleware para registrar métricas en cada petición
app.use((req, res, next) => {
  const end = httpDurationHistogram.startTimer();
  res.on('finish', () => {
    httpRequestsCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
    end({ method: req.method, route: req.path, status: res.statusCode });
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

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'microservice-a' });
});

// Endpoint de métricas para Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Endpoint principal - llama al Servicio B (genera trazas distribuidas)
app.get('/api/data', async (req, res) => {
  logger.info({ message: 'Procesando petición en /api/data', requestId: req.headers['x-request-id'] });

  try {
    // Llamada al Servicio B - esto crea una traza distribuida visible en Jaeger
    const response = await fetch('http://microservice-b:3001/api/info');
    const dataFromB = await response.json();

    logger.info({ message: 'Respuesta recibida de microservice-b', data: dataFromB });
    res.json({
      status: 'OK',
      source: 'Microservicio A',
      dataFromServiceB: dataFromB,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ message: 'Error al llamar a microservice-b', error: error.message });
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// Endpoint que simula un error (para probar alertas)
app.get('/api/error', (req, res) => {
  logger.error({ message: 'Endpoint de error intencional invocado', level: 'error' });
  res.status(500).json({ status: 'ERROR', message: 'Error simulado para pruebas' });
});

app.listen(port, () => {
  logger.info({ message: `Microservicio A corriendo en puerto ${port}` });
});
