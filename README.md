# 🔭 Práctica de Observabilidad en Microservicios

## 📌 Descripción
Proyecto de práctica que implementa los **3 pilares de la Observabilidad** en una arquitectura de microservicios:
- 📝 **Logs** → Winston (JSON) + Fluent Bit → Elasticsearch → Kibana
- 📊 **Métricas** → prom-client → Prometheus → Grafana
- 🔍 **Trazas** → OpenTelemetry SDK → Jaeger

---

## 🛠️ Tecnologías
| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 18 + Express |
| Logs | Winston + Fluent Bit + Elasticsearch + Kibana |
| Métricas | prom-client + Prometheus + Grafana |
| Trazas | OpenTelemetry + Jaeger |
| Infraestructura | Docker + Docker Compose |

---

## 🚀 Instrucciones de Ejecución

### Prerrequisitos
- Docker Desktop instalado y corriendo
- Docker Compose v2+
- Al menos **6 GB de RAM** disponibles para Docker

### Paso 1: Levantar todo el entorno
```bash
docker compose up --build
```
> La primera vez tarda ~5 minutos en descargar las imágenes.
> Usa `docker compose up --build -d` para correr en background.

### Paso 2: Esperar que todo esté listo
Espera hasta ver en los logs mensajes como:
- `Microservicio A corriendo en puerto 3000`
- `Microservicio B corriendo en puerto 3001`
- Kibana: `Kibana is now available`

### Paso 3: Generar tráfico
```bash
# Petición normal (llama a Servicio A que llama a Servicio B)
curl http://localhost:3000/api/data

# Generar múltiples peticiones
for i in {1..20}; do curl -s http://localhost:3000/api/data > /dev/null; done

# Generar un error
curl http://localhost:3000/api/error
```

---

## 📊 Mapa de Servicios y Puertos

| Servicio | URL | Usuario/Contraseña |
|----------|-----|-------------------|
| **Microservicio A** | http://localhost:3000/api/data | - |
| **Microservicio B** | http://localhost:3001/api/info | - |
| **Kibana (Logs)** | http://localhost:5601 | - |
| **Prometheus (Métricas raw)** | http://localhost:9090 | - |
| **Grafana (Dashboards)** | http://localhost:3002 | admin / admin123 |
| **Jaeger (Trazas)** | http://localhost:16686 | - |

---

## 🧪 Guía de Verificación por Pilar

### 📊 Métricas con Prometheus
1. Abre http://localhost:9090
2. En el campo de búsqueda, escribe: `http_requests_total`
3. Haz clic en **Execute**
4. Verás el conteo de peticiones por servicio, ruta y código de respuesta

### 📊 Dashboards con Grafana
1. Abre http://localhost:3002 → login: `admin` / `admin123`
2. Ve a **Explore** (ícono de brújula)
3. Selecciona **Prometheus** como datasource
4. Prueba estas queries:
   - `rate(http_requests_total[1m])` → tasa de peticiones por segundo
   - `http_request_duration_seconds_bucket` → histograma de latencia

### 🔍 Trazas con Jaeger
1. Abre http://localhost:16686
2. En **Service**, selecciona `microservice-a`
3. Haz clic en **Find Traces**
4. Abre cualquier traza para ver el flujo completo A → B

### 📝 Logs con Kibana
1. Abre http://localhost:5601
2. Ve a **Management → Stack Management → Index Patterns**
3. Crea un Index Pattern con el patrón: `docker-logs-*`
4. Ve a **Discover** para explorar los logs en tiempo real
5. Filtra por `service: microservice-a` o `level: error`

---

## 🛑 Detener el entorno
```bash
docker compose down
```

Para eliminar también los volúmenes (borra datos de Grafana):
```bash
docker compose down -v
```
