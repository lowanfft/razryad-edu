'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { DatabaseSync } = require('node:sqlite');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}
async function waitForStartup(child, port) {
  const url = `http://127.0.0.1:${port}/api/health`;
  for (let i = 0; i < 70; i++) {
    if (child.exitCode !== null) throw new Error('Сервер завершился раньше времени');
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Сервер не запустился');
}
test('сайт, HTTP API и записи в реальную SQLite базу', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'razryad-test-'));
  const dbFile = path.join(temp, 'check.db');
  const port = await freePort();
  const server = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(port), DB_PATH: dbFile, HOST: '127.0.0.1' },
    stdio: 'pipe'
  });
  const base = `http://127.0.0.1:${port}`;
  try {
    await waitForStartup(server, port);
    for (const page of ['/', '/quiz.html', '/feedback.html', '/admin.html', '/style.css', '/js/lab.js']) {
      const response = await fetch(base + page);
      assert.equal(response.status, 200, `Страница ${page}`);
    }
    const wrong = await fetch(base + '/api/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'X', score: 11, total: 10 }) });
    assert.equal(wrong.status, 400);
    const badType = await fetch(base + '/api/feedback', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'hello' });
    assert.equal(badType.status, 415);
    const result = await fetch(base + '/api/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Тестовый ученик', score: 8, total: 10, durationSeconds: 95 }) });
    assert.equal(result.status, 201);
    const feedback = await fetch(base + '/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Тестовый ученик', rating: 5, clarity: 4, comment: 'Проверено' }) });
    assert.equal(feedback.status, 201);
    const summary = await (await fetch(base + '/api/admin/stats')).json();
    assert.equal(summary.quiz.attempts, 1);
    assert.equal(summary.quiz.averagePercent, 80);
    assert.equal(summary.feedback.responses, 1);
    const db = new DatabaseSync(dbFile);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM quiz_results').get().n, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM feedback').get().n, 1);
    db.close();
  } finally {
    server.kill();
    await new Promise((resolve) => server.once('close', resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
