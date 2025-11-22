# ar7chatbot

Chatbot para captura de clientes y ventas (integración WhatsApp Business) — scaffold inicial.

Advertencia legal: este proyecto es un scaffold. La venta de medicamentos está regulada localmente. No automatice prescripciones ni ofrezca asesoría médica. Consulte la normativa de su país y añada verificaciones legales y consentimiento explícito antes de procesar pedidos.

Contenido creado:
- Backend: Express + manejo de webhook en `server/index.js`.
- Frontend: Next.js minimal con páginas en `pages/`.
- Ejemplo de flujo conversacional: `sample_flow.json`.
- Almacenamiento simple: SQLite (`data/leads.db`) o archivo JSON de ejemplo.

Instalación rápida (Windows PowerShell):

```powershell
npm install
# Copie .env.example a .env y complete valores
copy .env.example .env
npm run dev
```

Conexión WhatsApp Business:
- Use la API oficial de WhatsApp Business o un proveedor (Twilio, 360dialog, etc.).
- Configure el webhook para apuntar a `https://<su-dominio>/api/webhook`.

Cumplimiento y venta de medicamentos
-----------------------------------

Este proyecto es un scaffold y NO está listo para vender medicamentos sin adaptaciones legales y de proceso.

Recomendaciones mínimas antes de ofrecer o procesar ventas de medicamentos:

- Añadir consentimiento explícito y registrarlo (texto de consentimiento se incluye en el flujo).
- Bloquear automáticamente cualquier solicitud que incluya palabras que sugieran receta o atención médica (el servidor ya realiza una detección básica). Estas solicitudes deben pasar a revisión humana.
- No automatizar prescripciones ni dar asesoría médica por chat. Siempre enrutar a un profesional o a un canal humano.
- Mantener registros (quién, cuándo, consentimiento) y cumplir la normativa local de protección de datos (por ejemplo, GDPR, LGPD, LFPDPPP según corresponda).
- Consultar con un abogado o responsable de cumplimiento para adaptar los mensajes legales y el proceso de venta.

Ejemplo de flujo de bloqueo (implementado en este scaffold):

1. El usuario indica interés por un producto.
2. El servidor analiza el texto en busca de palabras como "receta", "prescripción", "doctor", etc.
3. Si se detecta, el sistema guarda el lead con `consent = false` y responde con un mensaje que indica que la venta no puede ser procesada automáticamente y que un asesor humano contactará al usuario.

Personalice y amplíe estas reglas según su catálogo de productos y la regulación aplicable.

Siguientes pasos recomendados:
1. Configurar base de datos (migraciones/validaciones).
2. Implementar manejo de consentimiento y mensajes legales en el flujo.
3. Añadir autenticación para la página admin.
4. Revisar y adaptar mensajes para cumplimiento sanitario y farmacéutico.

Despliegue
--------

Hay instrucciones rápidas en `DEPLOY.md` para desplegar en servicios como Render o Railway. El proyecto incluye un `Dockerfile`, un `Procfile` y un `.dockerignore` para facilitar despliegues. Para pruebas locales con un webhook público recomendamos usar `ngrok`.

License: sin licencia establecida (revisar antes de producción).
