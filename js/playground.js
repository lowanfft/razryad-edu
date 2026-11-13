'use strict';

// Двоичный художник: 8 строк по 8 бит. Цвет влияет только на отображение.
const artPresets = Object.freeze({
  heart: [
    '01100110', '11111111', '11111111', '11111111',
    '01111110', '00111100', '00011000', '00000000'
  ],
  smile: [
    '00111100', '01000010', '10100101', '10000001',
    '10100101', '10011001', '01000010', '00111100'
  ],
  alien: [
    '00100100', '00011000', '01111110', '11011011',
    '11111111', '10100101', '10100101', '00100100'
  ],
  arrow: [
    '00011000', '00111100', '01111110', '11111111',
    '00011000', '00011000', '00011000', '00011000'
  ]
});
const artStorageKey = 'razryad-pixel-art-v1';
const grid = document.getElementById('pixel-grid');
const rowsBox = document.getElementById('pixel-rows');
const countLabel = document.getElementById('pixel-count');
const importArea = document.getElementById('pixel-import');
const message = document.getElementById('pixel-message');
const pixelButtons = [];
let pixels = new Uint8Array(64);
let ink = 'violet';
let painting = false;
let paintValue = 1;

function rowsToPixels(rows) {
  return Uint8Array.from(rows.join(''), bit => Number(bit));
}
function pixelRows() {
  return Array.from({ length: 8 }, (_, row) =>
    Array.from(pixels.slice(row * 8, row * 8 + 8)).join('')
  );
}
function savePixels() {
  try { localStorage.setItem(artStorageKey, JSON.stringify({ bits: pixelRows(), ink })); } catch { /* localStorage необязателен */ }
}
function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('is-error', isError);
}
function selectPreset(name) {
  document.querySelectorAll('[data-preset]').forEach(button => {
    button.classList.toggle('is-picked', button.dataset.preset === name);
    button.setAttribute('aria-pressed', String(button.dataset.preset === name));
  });
}
function renderArt() {
  const rows = pixelRows();
  pixelButtons.forEach((button, i) => {
    const active = Boolean(pixels[i]);
    button.classList.toggle('is-on', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `Строка ${Math.floor(i / 8) + 1}, столбец ${i % 8 + 1}: ${active ? '1, включён' : '0, выключен'}`);
  });
  countLabel.textContent = `${pixels.reduce((sum, bit) => sum + bit, 0)} / 64 пикселей`;
  rowsBox.replaceChildren();
  rows.forEach((bits, row) => {
    const line = document.createElement('div');
    line.className = 'byte-row';
    const label = document.createElement('span');
    label.className = 'byte-index';
    label.textContent = String(row + 1).padStart(2, '0');
    const binary = document.createElement('strong');
    binary.textContent = bits;
    const hex = document.createElement('span');
    hex.className = 'byte-hex';
    hex.textContent = parseInt(bits, 2).toString(16).toUpperCase().padStart(2, '0');
    line.append(label, binary, hex);
    rowsBox.append(line);
  });
  if (document.activeElement !== importArea) importArea.value = rows.join('\n');
  savePixels();
}
function paintAt(index, value) {
  if (!Number.isInteger(index) || index < 0 || index >= 64 || pixels[index] === value) return;
  pixels[index] = value;
  selectPreset('');
  setMessage('');
  renderArt();
}
function setArt(rows, preset = '') {
  pixels = rowsToPixels(rows);
  selectPreset(preset);
  setMessage('');
  renderArt();
}

for (let i = 0; i < 64; i++) {
  const cell = document.createElement('button');
  cell.className = 'pixel-cell';
  cell.type = 'button';
  cell.dataset.index = String(i);
  // Событие click с detail=0 приходит от клавиатуры, поэтому мышь не переключит бит дважды.
  cell.addEventListener('click', event => {
    if (event.detail === 0) paintAt(i, pixels[i] ? 0 : 1);
  });
  pixelButtons.push(cell);
  grid.append(cell);
}

grid.addEventListener('pointerdown', event => {
  const cell = event.target.closest('.pixel-cell');
  if (!cell || event.button !== 0) return;
  event.preventDefault();
  const i = Number(cell.dataset.index);
  paintValue = pixels[i] ? 0 : 1;
  painting = true;
  grid.setPointerCapture?.(event.pointerId);
  paintAt(i, paintValue);
});
grid.addEventListener('pointermove', event => {
  if (!painting) return;
  const hovered = document.elementFromPoint(event.clientX, event.clientY);
  const cell = hovered?.closest('.pixel-cell');
  if (cell && grid.contains(cell)) paintAt(Number(cell.dataset.index), paintValue);
});
function stopPainting() { painting = false; }
grid.addEventListener('pointerup', stopPainting);
grid.addEventListener('pointercancel', stopPainting);
window.addEventListener('pointerup', stopPainting);

document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
  setArt(artPresets[button.dataset.preset], button.dataset.preset);
}));
document.querySelectorAll('.ink-option[data-ink]').forEach(button => button.addEventListener('click', () => {
  ink = button.dataset.ink;
  grid.dataset.ink = ink;
  document.querySelectorAll('.ink-option[data-ink]').forEach(el => {
    const active = el.dataset.ink === ink;
    el.classList.toggle('is-picked', active);
    el.setAttribute('aria-pressed', String(active));
  });
  savePixels();
}));
document.getElementById('pixel-clear').addEventListener('click', () => setArt(Array(8).fill('00000000')));
document.getElementById('pixel-invert').addEventListener('click', () => {
  setArt(pixelRows().map(row => [...row].map(bit => bit === '1' ? '0' : '1').join('')));
});

document.getElementById('pixel-restore').addEventListener('click', () => {
  const rows = importArea.value.trim().split(/\s+/);
  if (rows.length !== 8 || !rows.every(row => /^[01]{8}$/.test(row))) {
    setMessage('Нужно ровно 8 строк по 8 цифр 0 и 1 в каждой.', true);
    importArea.focus();
    return;
  }
  setArt(rows);
  setMessage('✓ Рисунок восстановлен из 64 бит.');
});

document.getElementById('pixel-copy').addEventListener('click', async () => {
  const code = pixelRows().join('\n');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API недоступен');
    await navigator.clipboard.writeText(code);
    setMessage('✓ Восемь строк двоичного кода скопированы.');
  } catch {
    importArea.value = code;
    importArea.focus();
    importArea.select();
    setMessage('Выделил код в поле ниже — нажми Ctrl+C, чтобы скопировать.');
  }
});

document.getElementById('pixel-png').addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext('2d');
  const palette = { violet: '#7459f1', lime: '#c5f067', pink: '#fc7fa9' };
  context.fillStyle = '#17182b';
  context.fillRect(0, 0, 512, 512);
  context.fillStyle = palette[ink] || palette.violet;
  pixels.forEach((bit, index) => {
    if (bit) context.fillRect((index % 8) * 64, Math.floor(index / 8) * 64, 64, 64);
  });
  const link = document.createElement('a');
  link.download = 'razryad-pixel-art.png';
  link.href = canvas.toDataURL('image/png');
  document.body.append(link);
  link.click();
  link.remove();
  setMessage('✓ PNG создан: 512 × 512 пикселей.');
});

// Главный экран: декоративный кодовый рисунок без внешних изображений.
const heroPreview = document.getElementById('hero-pixels');
artPresets.alien.join('').split('').forEach(bit => {
  const pixel = document.createElement('i');
  if (bit === '1') pixel.className = 'is-on';
  heroPreview.append(pixel);
});

try {
  const stored = JSON.parse(localStorage.getItem(artStorageKey) || 'null');
  if (stored && Array.isArray(stored.bits) && stored.bits.length === 8 &&
      stored.bits.every(row => typeof row === 'string' && /^[01]{8}$/.test(row))) {
    ink = ['violet', 'lime', 'pink'].includes(stored.ink) ? stored.ink : 'violet';
    grid.dataset.ink = ink;
    document.querySelectorAll('.ink-option[data-ink]').forEach(el => {
      el.classList.toggle('is-picked', el.dataset.ink === ink);
      el.setAttribute('aria-pressed', String(el.dataset.ink === ink));
    });
    setArt(stored.bits);
  } else setArt(artPresets.heart, 'heart');
} catch { setArt(artPresets.heart, 'heart'); }

// Квест: последовательные задачи, обратная связь, подсказки и локальный рекорд.
const questLevels = [
  {
    label: 'УРОВЕНЬ 01 · ДВОИЧНЫЙ КЛЮЧ',
    title: 'Первый замок: двоичный код',
    description: 'Терминал принимает только десятичные числа. Переведи показанный двоичный код в десятичную систему.',
    cipher: '01000001₂', answer: '65', placeholder: 'Например, 42',
    hint: 'Сложи степени двойки там, где стоит 1: 64 + 1.',
    success: 'Верно: 01000001₂ = 64 + 1 = 65₁₀.'
  },
  {
    label: 'УРОВЕНЬ 02 · ОШИБКА В ПОТОКЕ',
    title: 'Найди чужой символ',
    description: 'В двоичный поток попала недопустимая цифра. Введи её, чтобы очистить сигнал.',
    cipher: '110210₂', answer: '2', placeholder: 'Одна цифра',
    hint: 'У двоичной системы всего две разрешённые цифры: 0 и 1.',
    success: 'Точно: цифра 2 недопустима в двоичной записи.'
  },
  {
    label: 'УРОВЕНЬ 03 · ШЕСТНАДЦАТЕРИЧНЫЙ КОД',
    title: 'Вскрой второй шифр',
    description: 'Переведи шестнадцатеричное число в десятичное, чтобы открыть следующий замок.',
    cipher: '2A₁₆ = ?₁₀', answer: '42', placeholder: 'Десятичное число',
    hint: 'В HEX буква A означает 10. Вычисли 2 × 16 + 10.',
    success: 'Правильно: 2A₁₆ = 2 × 16 + 10 = 42₁₀.'
  },
  {
    label: 'УРОВЕНЬ 04 · ФИНАЛЬНЫЙ КЛЮЧ',
    title: 'Собери пароль',
    description: 'Сложи два двоичных числа и запиши сумму в шестнадцатеричной системе (без префикса 0x).',
    cipher: '00101100₂ + 00000110₂ = ?₁₆', answer: '32', placeholder: 'Например, 2A',
    hint: '44 + 6 = 50 в десятичной системе. Сколько это в шестнадцатеричной?',
    success: 'Готово: 44 + 6 = 50₁₀ = 32₁₆.'
  }
];
const bestTimeKey = 'razryad-quest-best-v1';
const questProgress = document.getElementById('quest-progress');
const questForm = document.getElementById('quest-form');
const questInput = document.getElementById('quest-answer');
const questSubmit = document.getElementById('quest-submit');
const questFeedback = document.getElementById('quest-feedback');
const questHint = document.getElementById('quest-hint');
const questHintToggle = document.getElementById('quest-hint-toggle');
let levelIndex = 0;
let errors = 0;
let passed = false;
let startedAt = Date.now();

function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
function updateBestLabel() {
  try {
    const ms = Number(localStorage.getItem(bestTimeKey));
    document.getElementById('quest-best').textContent = ms > 0 ? formatTime(ms) : '—';
  } catch { document.getElementById('quest-best').textContent = '—'; }
}
function renderLevel() {
  const level = questLevels[levelIndex];
  document.getElementById('quest-level-count').textContent = `УРОВЕНЬ ${String(levelIndex + 1).padStart(2, '0')} / 04`;
  document.getElementById('quest-command').textContent = `request_access --level=${levelIndex + 1}`;
  document.getElementById('quest-label').textContent = level.label;
  document.getElementById('quest-title').textContent = level.title;
  document.getElementById('quest-description').textContent = level.description;
  document.getElementById('quest-cipher').textContent = level.cipher;
  questProgress.replaceChildren();
  questLevels.forEach((_, i) => {
    const item = document.createElement('div');
    item.className = 'quest-step' + (i < levelIndex ? ' is-done' : '') + (i === levelIndex ? ' is-current' : '');
    item.textContent = i < levelIndex ? '✓' : String(i + 1).padStart(2, '0');
    item.setAttribute('aria-label', `Испытание ${i + 1}: ${i < levelIndex ? 'пройдено' : i === levelIndex ? 'текущее' : 'впереди'}`);
    questProgress.append(item);
  });
  questInput.value = '';
  questInput.placeholder = level.placeholder;
  questInput.disabled = false;
  questSubmit.textContent = 'Проверить ↗';
  questFeedback.textContent = '';
  questFeedback.className = 'quest-feedback';
  questHint.textContent = level.hint;
  questHint.hidden = true;
  questHintToggle.textContent = '✳ Показать подсказку';
  questHintToggle.setAttribute('aria-expanded', 'false');
  passed = false;
}
function finishQuest() {
  document.getElementById('quest-in-progress').hidden = true;
  document.getElementById('quest-finished').hidden = false;
  const ms = Date.now() - startedAt;
  document.getElementById('quest-time').textContent = formatTime(ms);
  document.getElementById('quest-errors').textContent = String(errors);
  try {
    const previous = Number(localStorage.getItem(bestTimeKey));
    if (!previous || ms < previous) localStorage.setItem(bestTimeKey, String(ms));
  } catch { /* необязательно */ }
  updateBestLabel();
}
questForm.addEventListener('submit', event => {
  event.preventDefault();
  if (passed) {
    levelIndex++;
    if (levelIndex >= questLevels.length) finishQuest();
    else { renderLevel(); questInput.focus(); }
    return;
  }
  const answer = questInput.value.trim().replace(/\s+/g, '').toUpperCase();
  if (!answer) {
    questFeedback.textContent = 'Сначала введи ответ.';
    questFeedback.className = 'quest-feedback is-wrong';
    return;
  }
  if (answer === questLevels[levelIndex].answer) {
    passed = true;
    questInput.disabled = true;
    questFeedback.textContent = '✓ ' + questLevels[levelIndex].success;
    questFeedback.className = 'quest-feedback is-correct';
    questSubmit.textContent = levelIndex === 3 ? 'Открыть архив ↗' : 'Следующий уровень ↗';
  } else {
    errors++;
    questFeedback.textContent = 'Пока не совпадает. Проверь систему счисления или открой подсказку.';
    questFeedback.className = 'quest-feedback is-wrong';
    questInput.select();
  }
});
questHintToggle.addEventListener('click', () => {
  questHint.hidden = !questHint.hidden;
  questHintToggle.setAttribute('aria-expanded', String(!questHint.hidden));
  questHintToggle.textContent = questHint.hidden ? '✳ Показать подсказку' : '✳ Скрыть подсказку';
});
document.getElementById('quest-restart').addEventListener('click', () => {
  levelIndex = 0; errors = 0; startedAt = Date.now();
  document.getElementById('quest-in-progress').hidden = false;
  document.getElementById('quest-finished').hidden = true;
  renderLevel();
  questInput.focus();
});
updateBestLabel();
renderLevel();
