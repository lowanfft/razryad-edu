'use strict';
const stats = {
  attempts: document.getElementById('stat-attempts'),
  average: document.getElementById('stat-average'),
  responses: document.getElementById('stat-responses'),
  rating: document.getElementById('stat-rating')
};
const resultsBody = document.getElementById('results-body');
const feedbackBody = document.getElementById('feedback-body');
const adminStatus = document.getElementById('admin-status');
const refreshButton = document.getElementById('refresh-data');
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
function formatDuration(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.floor(value / 60)} мин ${value % 60} с`;
}
function cell(text, className = '') {
  const td = document.createElement('td');
  td.textContent = text;
  if (className) td.className = className;
  return td;
}
function renderTable(tbody, rows, formatter, emptyLabel) {
  tbody.replaceChildren();
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = cell(emptyLabel);
    td.colSpan = 5;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  const fragment = document.createDocumentFragment();
  rows.forEach((item) => {
    const tr = document.createElement('tr');
    formatter(item).forEach(([value, className]) => tr.appendChild(cell(value, className)));
    fragment.appendChild(tr);
  });
  tbody.appendChild(fragment);
}
async function loadDashboard() {
  refreshButton.disabled = true;
  adminStatus.textContent = 'Загружаем данные с сервера...';
  adminStatus.className = 'form-message';
  try {
    const responses = await Promise.all(['/api/admin/stats', '/api/admin/results', '/api/admin/feedback'].map((url) => fetch(url, { cache: 'no-store' })));
    if (!responses.every((response) => response.ok)) throw new Error('API недоступен');
    const [summary, results, feedback] = await Promise.all(responses.map((response) => response.json()));
    stats.attempts.textContent = summary.quiz.attempts ?? 0;
    stats.average.textContent = summary.quiz.averagePercent == null ? '—' : `${summary.quiz.averagePercent}%`;
    stats.responses.textContent = summary.feedback.responses ?? 0;
    stats.rating.textContent = summary.feedback.averageRating == null ? '—' : `${summary.feedback.averageRating}/5`;
    renderTable(resultsBody, results, (item) => [
      [item.name], [`${item.score}/${item.total}`], [`${item.percent}%`], [formatDuration(item.duration_seconds)], [formatDate(item.created_at)]
    ], 'Пока никто не проходил тест.');
    renderTable(feedbackBody, feedback, (item) => [
      [item.name], [`${item.rating}/5`], [`${item.clarity}/5`], [item.comment || '—', 'comment-cell'], [formatDate(item.created_at)]
    ], 'Пока нет отзывов.');
    adminStatus.textContent = '✓ Данные актуальны.';
    adminStatus.className = 'form-message is-success';
  } catch {
    adminStatus.textContent = 'Данные недоступны. Запусти сайт локально через npm.cmd start. Просмотр статистики разрешён только с компьютера сервера.';
    adminStatus.className = 'form-message is-error';
  } finally { refreshButton.disabled = false; }
}
refreshButton.addEventListener('click', loadDashboard);
loadDashboard();
