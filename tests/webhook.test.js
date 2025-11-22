const fs = require('fs');
const path = require('path');

// Ensure test DB is isolated
process.env.DATABASE_FILE = path.join(process.cwd(), 'data', 'test_leads.db');

// Remove existing test DB
try { fs.unlinkSync(process.env.DATABASE_FILE); } catch (e) { /* ignore */ }

const handlers = require('../server/handlers');
const db = require('../server/db');

beforeAll(async () => {
  // DB init already runs at require-time; ensure tables exist
  await db.init();
});

afterAll(() => {
  // cleanup test DB file
  try { fs.unlinkSync(process.env.DATABASE_FILE); } catch (e) { /* ignore */ }
});

test('flujo happy path crea lead con consentimiento', async () => {
  const sender = 'test:+10000000001';

  // Primer mensaje inicia flujo
  let res = await handlers.processIncoming({ from: sender, text: 'Quiero información sobre producto A' });
  expect(res.ok).toBe(true);
  expect(res.reply).toMatch(/Hola|asistente|producto/i);

  // Enviar nombre
  res = await handlers.processIncoming({ from: sender, text: 'Juan Pérez' });
  expect(res.ok).toBe(true);
  expect(res.reply).toMatch(/número|teléfono|contactarte/i);

  // Enviar teléfono
  res = await handlers.processIncoming({ from: sender, text: '+521234567890' });
  expect(res.ok).toBe(true);
  expect(res.reply).toMatch(/consent|consentimiento|aceptas|acepto|sí|si/i);

  // Enviar consentimiento
  res = await handlers.processIncoming({ from: sender, text: 'Sí' });
  expect(res.ok).toBe(true);
  expect(res.leadId).toBeDefined();

  const leads = await db.listLeads();
  const lead = leads.find(l => l.id === res.leadId);
  expect(lead).toBeDefined();
  expect(lead.consent).toBe(1);
  expect(lead.sender).toBe(sender);
});

test('bloqueo por receta crea lead sin consentimiento y responde bloqueo', async () => {
  const sender = 'test:+10000000002';
  const res = await handlers.processIncoming({ from: sender, text: 'Necesito una receta para medicamento X' });
  expect(res.ok).toBe(true);
  expect(res.reply).toMatch(/receta|requiere|no podemos procesar/i);
  expect(res.leadId).toBeDefined();

  const leads = await db.listLeads();
  const lead = leads.find(l => l.id === res.leadId);
  expect(lead).toBeDefined();
  expect(lead.consent).toBe(0);
  expect(lead.sender).toBe(sender);
});
