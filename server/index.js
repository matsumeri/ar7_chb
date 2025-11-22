const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const sampleFlow = require(path.join(process.cwd(), 'sample_flow.json'));

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

function extractTextAndSender(payload) {
  // Intentamos soportar varias formas de payload comunes.
  try {
    // Twilio-like
    if (payload.From && payload.Body) return { sender: payload.From, text: payload.Body };
    // Facebook/Meta / WhatsApp Cloud
    if (payload.entry && Array.isArray(payload.entry)) {
      const messaging = payload.entry[0];
      // Buscar mensajes
      const msg = (messaging.changes && messaging.changes[0] && messaging.changes[0].value && messaging.changes[0].value.messages && messaging.changes[0].value.messages[0]) || null;
      if (msg) return { sender: msg.from || msg.sender || messaging.id, text: (msg.text && msg.text.body) || msg.body || '' };
    }
    // Generic: messages array
    if (payload.messages && Array.isArray(payload.messages) && payload.messages[0]) {
      const m = payload.messages[0];
      return { sender: m.from || m.sender || payload.from, text: (m.text && m.text.body) || m.body || '' };
    }
    // Fallbacks
    return { sender: payload.from || payload.sender || 'unknown', text: payload.text || payload.body || '' };
  } catch (e) {
    return { sender: 'unknown', text: '' };
  }
}

app.prepare().then(() => {
  const server = express();
  server.use(bodyParser.json());

  // Webhook endpoint que maneja el flujo conversacional y guarda en SQLite
  const handlers = require('./handlers');
  server.post('/api/webhook', async (req, res) => {
    try {
      const result = await handlers.processIncoming(req.body || {});
      return res.json(result);
    } catch (err) {
      console.error('Error manejando webhook:', err);
      return res.status(500).json({ ok: false, error: 'error interno' });
    }
  });

  // Endpoint para listar leads desde SQLite
  server.get('/api/leads', async (req, res) => {
    try {
      const leads = await db.listLeads();
      res.json({ count: leads.length, leads });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'no se pudo leer leads' });
    }
  });

  // Manejar todo lo demás con Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
