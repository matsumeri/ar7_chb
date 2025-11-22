const path = require('path');
const db = require('./db');
const sampleFlow = require(path.join(process.cwd(), 'sample_flow.json'));

function extractTextAndSender(payload) {
  try {
    if (payload.From && payload.Body) return { sender: payload.From, text: payload.Body };
    if (payload.entry && Array.isArray(payload.entry)) {
      const messaging = payload.entry[0];
      const msg = (messaging.changes && messaging.changes[0] && messaging.changes[0].value && messaging.changes[0].value.messages && messaging.changes[0].value.messages[0]) || null;
      if (msg) return { sender: msg.from || msg.sender || messaging.id, text: (msg.text && msg.text.body) || msg.body || '' };
    }
    if (payload.messages && Array.isArray(payload.messages) && payload.messages[0]) {
      const m = payload.messages[0];
      return { sender: m.from || m.sender || payload.from, text: (m.text && m.text.body) || m.body || '' };
    }
    return { sender: payload.from || payload.sender || 'unknown', text: payload.text || payload.body || '' };
  } catch (e) {
    return { sender: 'unknown', text: '' };
  }
}

async function processIncoming(payload) {
  const { sender, text } = extractTextAndSender(payload || {});

  // Obtener conversación
  const conv = await db.getConversation(sender);

  if (!conv) {
    const step = sampleFlow.steps[0];
    await db.upsertConversation(sender, 'awaiting_interest', { stepId: step.id });
    return { ok: true, reply: step.text };
  }

  const state = conv.state || 'awaiting_interest';
  const data = conv.data || {};

  if (state === 'awaiting_interest') {
    data.interest = text || '';

    const prescRegex = /recet|prescrip|prescripción|prescripcion|receta|médic|medico|doctor|consulta/i;
    if (prescRegex.test(data.interest)) {
      const lead = {
        sender,
        name: data.name || null,
        phone: data.phone || null,
        interest: data.interest || null,
        consent: false,
        raw: payload
      };
      const created = await db.createLead(lead);
      await db.deleteConversation(sender);
      const blockMsg = 'Atención: el producto o solicitud indicada parece requerir receta o atención médica. No podemos procesar ventas de medicamentos con receta automáticamente. Un asesor humano te contactará para evaluar tu caso. Si necesitas asistencia urgente, consulta a un profesional de la salud.';
      return { ok: true, reply: blockMsg, leadId: created.id };
    }

    const nextStep = sampleFlow.steps.find(s => s.id === 'ask_name');
    await db.upsertConversation(sender, 'awaiting_name', data);
    return { ok: true, reply: nextStep.text };
  }

  if (state === 'awaiting_name') {
    data.name = text || '';
    const nextStep = sampleFlow.steps.find(s => s.id === 'ask_phone');
    await db.upsertConversation(sender, 'awaiting_phone', data);
    return { ok: true, reply: nextStep.text };
  }

  if (state === 'awaiting_phone') {
    data.phone = text || '';
    const nextStep = sampleFlow.steps.find(s => s.id === 'consent');
    await db.upsertConversation(sender, 'awaiting_consent', data);
    return { ok: true, reply: nextStep.text };
  }

  if (state === 'awaiting_consent') {
    const normalized = (text || '').trim().toLowerCase();
    const accepted = normalized === 'sí' || normalized === 'si' || normalized === 's' || normalized === 'yes' || normalized === 'y';
    data.consent = accepted;

    if (accepted) {
      const lead = {
        sender,
        name: data.name || null,
        phone: data.phone || null,
        interest: data.interest || null,
        consent: true,
        raw: payload
      };
      const created = await db.createLead(lead);
      await db.deleteConversation(sender);
      const endStep = sampleFlow.steps.find(s => s.id === 'end');
      return { ok: true, reply: endStep.text, leadId: created.id };
    } else {
      const lead = {
        sender,
        name: data.name || null,
        phone: data.phone || null,
        interest: data.interest || null,
        consent: false,
        raw: payload
      };
      const created = await db.createLead(lead);
      await db.deleteConversation(sender);
      return { ok: true, reply: 'No se recibió el consentimiento. No podremos continuar. Un asesor puede contactarte si lo autorizas.', leadId: created.id };
    }
  }

  // Estado desconocido: reiniciar
  await db.upsertConversation(sender, 'awaiting_interest', {});
  const step = sampleFlow.steps[0];
  return { ok: true, reply: step.text };
}

module.exports = { processIncoming, extractTextAndSender };
