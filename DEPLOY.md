Despliegue rápido — Render y Railway

Este documento explica pasos rápidos para desplegar el proyecto `ar7chatbot` en PaaS como Render o Railway.

Requisitos previos
- Tener cuenta en el servicio elegido (Render, Railway, etc.).
- Código en un repositorio Git accesible (por ejemplo GitHub). El servicio suele desplegar directamente desde el repo.
- Variables de entorno configuradas (ver sección "Variables de entorno necesarias").

Variables de entorno recomendadas
- PORT (opcional) — puerto que usará la app (por defecto 3000).
- WHATSAPP_API_URL — URL del proveedor para enviar mensajes (opcional, placeholder si no usas envío automático).
- WHATSAPP_API_TOKEN — token/API key del proveedor.
- DATABASE_FILE — ruta al fichero SQLite (por ejemplo `./data/leads.db`). Si no se proporciona, el proyecto usará un fallback JSON (`data/leads_fallback.json`).
- NODE_ENV=production

1) Desplegar en Render (sugerido)
- Crear un nuevo Web Service en Render.
- Conectar a tu repositorio GitHub/ GitLab.
- Build Command: npm install && npm run build
- Start Command: npm run start
- Runtime: Node 18+ (o dejar por defecto)
- Añadir las variables de entorno en el panel de Render (WHATSAPP_API_TOKEN, etc.).

Notas para Render:
- Render detecta automáticamente `package.json`. También puedes usar Dockerfile (ya incluido).
- Usa `DATABASE_FILE` apuntando a una ruta dentro del contenedor (si quieres persistencia considera un servicio de base de datos administrado — Render tiene add-ons para Postgres). Para producción, se recomienda migrar a Postgres o a un almacenamiento administrado.

2) Desplegar en Railway
- Crear nuevo proyecto en Railway y conectar el repo.
- Railway detecta `package.json` y puede ejecutar `npm start` por defecto.
- Configura variables de entorno en Railway (WHATSAPP_API_TOKEN, etc.).
- Si deseas usar SQLite en Railway ten en cuenta que el filesystem no es persistente; usa una base de datos gestionada (Postgres) para datos duraderos.

3) Usar Docker (opcional)
- Ya hay un `Dockerfile` incluido. Puedes construir y ejecutar localmente:

```powershell
# Construir imagen (desde el directorio del proyecto)
docker build -t ar7chatbot:latest .
# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env ar7chatbot:latest
```

4) Testing y webhook público
- Para pruebas con WhatsApp (o proveedor) necesitas una URL pública HTTPS. Usa `ngrok http 3000` en local o despliega en PaaS.
- Recuerda instalar tu `ngrok` authtoken localmente para poder usarlo.

5) Seguridad y recomendaciones de producción
- No dejar tokens o secretos en el repo. Usar variables de entorno.
- Revisar la política de consentimiento para venta de medicamentos (registro, logs, bloqueo de solicitudes con receta).
- Usar base de datos administrada (Postgres) en producción; SQLite es para desarrollo/demo.

Si quieres, puedo:
- Generar el `render.yaml` o los scripts específicos para Railway.
- Probar un despliegue automático de ejemplo (necesitaré acceso al repo o credenciales del servicio).
