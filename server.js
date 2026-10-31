const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'education.db');
const MAX_BODY = 50 * 1024;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    percent INTEGER NOT NULL,
    duration_seconds INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    clarity INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertResult = db.prepare(`
  INSERT INTO quiz_results (name, score, total, percent, duration_seconds)
  VALUES (?, ?, ?, ?, ?)
`);
const insertFeedback = db.prepare(`
  INSERT INTO feedback (name, rating, clarity, comment)
  VALUES (?, ?, ?, ?)
`);
const selectStatsQuiz = db.prepare(`
  SELECT COUNT(*) AS attempts,
         ROUND(AVG(percent), 1) AS averagePercent,
         MAX(percent) AS bestPercent
  FROM quiz_results
`);
const selectStatsFeedback = db.prepare(`
  SELECT COUNT(*) AS responses,
         ROUND(AVG(rating), 1) AS averageRating,
         ROUND(AVG(clarity), 1) AS averageClarity
  FROM feedback
`);
const selectResults = db.prepare(`
  SELECT id, name, score, total, percent, duration_seconds, created_at
  FROM quiz_results
  ORDER BY id DESC
  LIMIT 100
`);
const selectFeedback = db.prepare(`
  SELECT id, name, rating, clarity, comment, created_at
  FROM feedback
  ORDER BY id DESC
  LIMIT 100
`);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function cleanText(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function validInt(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (size === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });

    req.on('error', reject);
  });
}

function serveStatic(pathname, res) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  let decoded;
  try {
    decoded = decodeURIComponent(requested);
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }

  const relativePath = decoded.replace(/^\/+/, '');
  const filePath = path.resolve(PUBLIC_DIR, relativePath);
  const relative = path.relative(PUBLIC_DIR, filePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Страница не найдена');
  }

  if (!stat.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Страница не найдена');
  }

  const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  fs.createReadStream(filePath).pipe(res);
}

function isLoopback(remoteAddress) {
  return remoteAddress === '127.0.0.1' || remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1';
}

async function handleApi(req, res, pathname) {
  // Для демонстрации статистику читают только с того ПК, на котором работает Node.js.
  // Для публичного размещения понадобится отдельная авторизация администратора.
  if (pathname.startsWith('/api/admin/') && !isLoopback(req.socket.remoteAddress)) {
    return sendJson(res, 403, { error: 'Статистика доступна только локально.' });
  }
  if (['POST', 'PUT', 'PATCH'].includes(req.method) &&
      req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return sendJson(res, 415, { error: 'Нужен Content-Type: application/json.' });
  }
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, database: 'sqlite', timestamp: new Date().toISOString() });
  }

  if (req.method === 'POST' && pathname === '/api/results') {
    const body = await readJson(req);
    const name = cleanText(body.name, 80) || 'Аноним';
    const score = Number(body.score);
    const total = Number(body.total);
    const durationSeconds = Number(body.durationSeconds);

    if (!validInt(score, 0, 100) || !validInt(total, 1, 100) || score > total) {
      return sendJson(res, 400, { error: 'Некорректный результат теста.' });
    }

    const percent = Math.round((score / total) * 100);
    const duration = Number.isFinite(durationSeconds)
      ? Math.max(0, Math.min(Math.round(durationSeconds), 86400))
      : null;

    const result = insertResult.run(name, score, total, percent, duration);
    return sendJson(res, 201, { id: Number(result.lastInsertRowid), score, total, percent });
  }

  if (req.method === 'POST' && pathname === '/api/feedback') {
    const body = await readJson(req);
    const name = cleanText(body.name, 80) || 'Аноним';
    const rating = Number(body.rating);
    const clarity = Number(body.clarity);
    const comment = cleanText(body.comment, 1000);

    if (!validInt(rating, 1, 5) || !validInt(clarity, 1, 5)) {
      return sendJson(res, 400, { error: 'Оценки должны быть от 1 до 5.' });
    }

    const result = insertFeedback.run(name, rating, clarity, comment);
    return sendJson(res, 201, { id: Number(result.lastInsertRowid), message: 'Спасибо за обратную связь!' });
  }

  if (req.method === 'GET' && pathname === '/api/admin/stats') {
    return sendJson(res, 200, {
      quiz: selectStatsQuiz.get(),
      feedback: selectStatsFeedback.get()
    });
  }

  if (req.method === 'GET' && pathname === '/api/admin/results') {
    return sendJson(res, 200, selectResults.all());
  }

  if (req.method === 'GET' && pathname === '/api/admin/feedback') {
    return sendJson(res, 200, selectFeedback.all());
  }

  return sendJson(res, 404, { error: 'API-маршрут не найден.' });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url.pathname);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }

    serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      sendJson(res, error.status || 500, { error: error.status ? error.message : 'Внутренняя ошибка сервера.' });
    } else {
      res.end();
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`РАЗРЯД запущен: http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
