'use strict';

const stats = {
  attempts: document.getElementById('stat-attempts'),
  average: document.getElementById('stat-average'),
  responses: document.getElementById('stat-responses'),
  rating: document.getElementById('stat-rating')
};
const resultsBody = document.getElementById('results-body');
const feedbackBody = document.getElementById('feedback-body');
const status = document.getElementById('admin-status');
const refreshButton = document.getElementById('refresh-data');
const clearButton = document.getElementById('clear-local-data');

function formatDate(value) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime())
    ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(d)
    : '—';
}
function formatDuration(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)} мин ${seconds % 60} с`;
}
function cell(value, className = '') {
  const td = document.createElement('td');
  td.textContent = String(value ?? '—');
  if (className) td.className = className;
  return td;
}
function renderTable(tbody, items, format, placeholder) {
  tbody.replaceChildren();
  if (!items.length) {
    const tr = document.createElement('tr');
    const td = cell(placeholder);
    td.colSpan = 5;
    tr.append(td);
    tbody.append(tr);
    return;
  }
  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const tr = document.createElement('tr');
    format(item).forEach(([value, className]) => tr.append(cell(value, className)));
    frag.append(tr);
  });
  tbody.append(frag);
}
async function loadDashboard() {
  let summary,results,feedback;
  try {({summary,results,feedback}=await window.RazryadStorage.dashboardData());}
  catch(error){status.textContent=`Не удалось загрузить данные: ${error.message}`;status.className='form-message is-error';return;}
  stats.attempts.textContent = String(summary.attempts);
  stats.average.textContent = summary.average_percent == null ? '—' : `${summary.average_percent}%`;
  stats.responses.textContent = String(summary.responses);
  stats.rating.textContent = summary.average_rating == null ? '—' : `${summary.average_rating}/5`;
  renderTable(resultsBody, results, item => [
    [item.name], [`${item.score}/${item.total}`], [`${item.percent}%`],
    [formatDuration(item.duration_seconds)], [formatDate(item.created_at)]
  ], 'В этом браузере ещё нет результатов тестов.');
  renderTable(feedbackBody, feedback, item => [
    [item.name], [`${item.rating}/5`], [`${item.clarity}/5`],
    [item.comment || '—', 'comment-cell'], [formatDate(item.created_at)]
  ], 'В этом браузере ещё нет отзывов.');
  status.textContent = 'Показаны записи SQLite на этом компьютере.';
  status.className = 'form-message';
}
refreshButton.addEventListener('click', loadDashboard);
clearButton.hidden = true;

loadDashboard();
