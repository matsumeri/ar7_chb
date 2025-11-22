const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_FILE = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'leads.db');
const FALLBACK_FILE = path.join(process.cwd(), 'data', 'leads_fallback.json');

function ensureDataDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FALLBACK_FILE)) fs.writeFileSync(FALLBACK_FILE, JSON.stringify({ leads: [], conversations: {} }));
}

ensureDataDir();

let usingSqlite = false;
let sqlite3;
let db;
try {
  // intentar cargar sqlite3 nativo
  sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(DB_FILE);
  usingSqlite = true;
} catch (e) {
  console.warn('sqlite3 no está disponible, usando fallback JSON. Error:', e && e.message);
}

function initSqlite() {
  const leadsSql = `
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT,
      name TEXT,
      phone TEXT,
      interest TEXT,
      consent INTEGER,
      raw TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `;

  const convSql = `
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT UNIQUE,
      state TEXT,
      data TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `;

  db.serialize(() => {
    db.run(leadsSql);
    db.run(convSql);
  });
}

function readFallback() {
  try {
    return JSON.parse(fs.readFileSync(FALLBACK_FILE));
  } catch (e) {
    return { leads: [], conversations: {} };
  }
}

function writeFallback(data) {
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2));
}

function init() {
  if (usingSqlite) initSqlite();
}

function getConversation(sender) {
  if (usingSqlite) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM conversations WHERE sender = ?', [sender], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        try { row.data = JSON.parse(row.data || '{}'); } catch (e) { row.data = {}; }
        resolve(row);
      });
    });
  }

  return new Promise((resolve) => {
    const data = readFallback();
    const conv = data.conversations[sender] || null;
    resolve(conv ? { sender, state: conv.state, data: conv.data } : null);
  });
}

function upsertConversation(sender, state, dataObj) {
  if (usingSqlite) {
    return new Promise((resolve, reject) => {
      const dataStr = JSON.stringify(dataObj || {});
      db.run(
        `INSERT INTO conversations (sender, state, data) VALUES (?, ?, ?)
         ON CONFLICT(sender) DO UPDATE SET state=excluded.state, data=excluded.data, updated_at=(datetime('now'))`,
        [sender, state, dataStr],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  return new Promise((resolve) => {
    const data = readFallback();
    data.conversations[sender] = { state, data: dataObj || {} };
    writeFallback(data);
    resolve(true);
  });
}

function deleteConversation(sender) {
  if (usingSqlite) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM conversations WHERE sender = ?', [sender], function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }

  return new Promise((resolve) => {
    const data = readFallback();
    delete data.conversations[sender];
    writeFallback(data);
    resolve(true);
  });
}

function createLead(lead) {
  if (usingSqlite) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO leads (sender, name, phone, interest, consent, raw) VALUES (?, ?, ?, ?, ?, ?)`,
        [lead.sender, lead.name, lead.phone, lead.interest, lead.consent ? 1 : 0, JSON.stringify(lead.raw || {})],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID });
        }
      );
    });
  }

  return new Promise((resolve) => {
    const data = readFallback();
    const id = (data.leads.length ? data.leads[data.leads.length - 1].id : 0) + 1;
    const entry = Object.assign({ id }, lead, { created_at: new Date().toISOString() });
    data.leads.push(entry);
    writeFallback(data);
    resolve({ id });
  });
}

function listLeads() {
  if (usingSqlite) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM leads ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  return new Promise((resolve) => {
    const data = readFallback();
    resolve(data.leads || []);
  });
}

init();

module.exports = {
  db,
  init,
  getConversation,
  upsertConversation,
  deleteConversation,
  createLead,
  listLeads,
};
    
