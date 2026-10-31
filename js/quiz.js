'use strict';
const questions = [
  { text: 'Что называют системой счисления?',
    options: ['Любую математическую формулу', 'Набор символов и правил для записи чисел', 'Способ кодирования картинок', 'Только десятичные цифры'],
    answer: 1, explanation: 'Система счисления задаёт, какие символы используются для записи числа и по каким правилам.' },
  { text: 'Что отличает позиционную систему счисления?',
    options: ['Значение цифры зависит от её позиции', 'Все символы имеют одно неизменное значение', 'Цифры всегда пишутся в столбик', 'В ней обязательно десять цифр'],
    answer: 0, explanation: 'В числе 352 цифра 3 означает три сотни, а цифра 5 — пять десятков. Значение зависит от разряда.' },
  { text: 'Какое основание у двоичной системы?',
    options: ['8', '10', '2', '16'],
    answer: 2, explanation: 'В двоичной записи используются две цифры — 0 и 1. Поэтому основание равно 2.' },
  { text: 'Какое десятичное число обозначает 101101₂?',
    options: ['43', '41', '45', '53'],
    answer: 2, explanation: '101101₂ = 32 + 8 + 4 + 1 = 45₁₀.' },
  { text: 'Как записать 13₁₀ в двоичной системе?',
    options: ['1011₂', '1101₂', '1110₂', '1001₂'],
    answer: 1, explanation: '13 = 8 + 4 + 1, поэтому единицы стоят в разрядах 2³, 2² и 2⁰: 1101₂.' },
  { text: 'Чему равно число 55₈ в десятичной системе?',
    options: ['55', '48', '45', '35'],
    answer: 2, explanation: '55₈ = 5 × 8 + 5 × 1 = 45₁₀.' },
  { text: 'Переведи число 2D₁₆ в десятичную систему.',
    options: ['213', '32', '45', '42'],
    answer: 2, explanation: 'Буква D означает 13: 2 × 16 + 13 = 45₁₀.' },
  { text: 'Какие цифры допустимы в шестнадцатеричной системе?',
    options: ['Только 0 и 1', '0–9 и A–F', '0–7 и X–Y', 'Только 0–9'],
    answer: 1, explanation: 'Всего 16 символов: десять обычных цифр и шесть букв A, B, C, D, E, F.' },
  { text: 'Какая из систем является непозиционной?',
    options: ['Двоичная', 'Восьмеричная', 'Шестнадцатеричная', 'Древнеегипетская'],
    answer: 3, explanation: 'В древнеегипетской системе символы 1, 10, 100 и других значений повторялись; позиция не меняла их величину.' },
  { text: 'Что такое 1111₂ в десятичной записи?',
    options: ['16', '14', '15', '11'],
    answer: 2, explanation: '1111₂ = 8 + 4 + 2 + 1 = 15₁₀.' }
];
const intro = document.getElementById('quiz-intro');
const quizArea = document.getElementById('quiz-area');
const resultArea = document.getElementById('quiz-result');
const startForm = document.getElementById('quiz-start-form');
const nameInput = document.getElementById('student-name');
const startError = document.getElementById('start-error');
const questionCard = document.getElementById('question-card');
const questionResponse = document.getElementById('question-response');
const counter = document.getElementById('question-counter');
const progress = document.getElementById('quiz-progress');
const progressWrapper = document.getElementById('progress-wrap');
const progressText = document.getElementById('quiz-progress-text');
const nextButton = document.getElementById('next-question');
const restartButton = document.getElementById('restart-quiz');
const resultPercent = document.getElementById('result-percent');
const resultTitle = document.getElementById('result-title');
const resultText = document.getElementById('result-text');
const saveStatus = document.getElementById('save-status');
const answerReview = document.getElementById('answer-review');
let current = 0;
let score = 0;
let selected = null;
let stage = 'select';
let studentName = '';
let startedAt = 0;
let answers = [];

function renderQuestion() {
  const question = questions[current];
  selected = null;
  stage = 'select';
  nextButton.disabled = true;
  nextButton.textContent = 'Проверить ответ →';
  questionResponse.replaceChildren();
  questionResponse.classList.remove('is-correct', 'is-wrong');
  const percentage = Math.round((current / questions.length) * 100);
  progress.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}%`;
  progressWrapper.setAttribute('aria-valuenow', String(percentage));
  counter.textContent = `ВОПРОС ${String(current + 1).padStart(2, '0')} / ${questions.length}`;
  questionCard.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = question.text;
  questionCard.appendChild(title);
  const group = document.createElement('div');
  group.className = 'quiz-options';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Варианты ответа');
  question.options.forEach((text, i) => {
    const label = document.createElement('label');
    label.className = 'quiz-option';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'quiz-choice';
    radio.value = String(i);
    radio.addEventListener('change', () => { selected = i; nextButton.disabled = false; });
    const span = document.createElement('span');
    span.textContent = text;
    label.append(radio, span);
    group.appendChild(label);
  });
  questionCard.appendChild(group);
}
function reviewAnswer() {
  const question = questions[current];
  const correct = selected === question.answer;
  if (correct) score++;
  answers.push({ question, selected, correct });
  stage = 'review';
  const options = questionCard.querySelectorAll('.quiz-option');
  options.forEach((node, i) => {
    node.querySelector('input').disabled = true;
    if (i === question.answer) node.classList.add('is-correct');
    else if (i === selected) node.classList.add('is-wrong');
  });
  const label = document.createElement('strong');
  label.textContent = correct ? '✓ Верно!' : '↗ Разберём правильный ответ';
  questionResponse.classList.toggle('is-correct', correct);
  questionResponse.classList.toggle('is-wrong', !correct);
  const explanation = document.createElement('span');
  explanation.textContent = question.explanation;
  questionResponse.replaceChildren(label, explanation);
  nextButton.textContent = current === questions.length - 1 ? 'Завершить тест →' : 'Следующий вопрос →';
}

async function saveResult() {
  saveStatus.textContent = 'Сохраняем результат в этом браузере...';
  saveStatus.className = 'save-status';
  try {
    await window.RazryadStorage.saveResult({
      name: studentName, score, total: questions.length,
      durationSeconds: Math.round((Date.now() - startedAt) / 1000)
    });
    saveStatus.textContent = '✓ Результат сохранён в этом браузере. Посмотреть его можно в разделе «Мои результаты».';
    saveStatus.className = 'save-status is-success';
  } catch (error) {
    saveStatus.textContent = `Тест пройден, но результат не удалось сохранить локально. ${error.message}`;
    saveStatus.className = 'save-status form-message is-error';
  }
}

function showResult() {
  quizArea.hidden = true;
  resultArea.hidden = false;
  const percent = Math.round((score / questions.length) * 100);
  progressWrapper.setAttribute('aria-valuenow', '100');
  resultPercent.textContent = `${percent}%`;
  resultTitle.textContent = percent >= 90 ? 'Отлично разобрался!' : percent >= 70 ? 'Хорошая работа!' : percent >= 50 ? 'Основа уже есть.' : 'Вернись к теории.';
  resultText.textContent = `${studentName}, правильных ответов: ${score} из ${questions.length}.`;
  answerReview.replaceChildren();
  answers.forEach((entry, i) => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = `${i + 1}. ${entry.correct ? '✓' : '✕'} ${entry.question.text}`;
    const note = document.createElement('p');
    note.textContent = `Правильный ответ: ${entry.question.options[entry.question.answer]}. ${entry.question.explanation}`;
    details.append(summary, note);
    answerReview.appendChild(details);
  });
  try { localStorage.setItem('razryad-last-result', String(percent)); } catch {}
  window.scrollTo({ top: 0, behavior: 'smooth' });
  saveResult();
}
startForm.addEventListener('submit', (event) => {
  event.preventDefault();
  studentName = nameInput.value.trim().replace(/\s+/g, ' ').slice(0,80);
  if (!studentName) { startError.textContent = 'Укажи имя или псевдоним.'; nameInput.focus(); return; }
  startError.textContent = '';
  current = 0; score = 0; answers = []; startedAt = Date.now();
  intro.hidden = true; quizArea.hidden = false; resultArea.hidden = true;
  renderQuestion();
});
nextButton.addEventListener('click', () => {
  if (stage === 'select') {
    if (selected === null) return;
    reviewAnswer();
  } else if (current < questions.length - 1) {
    current++;
    renderQuestion();
    quizArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    showResult();
  }
});
restartButton.addEventListener('click', () => {
  resultArea.hidden = true;
  intro.hidden = false;
  saveStatus.textContent = '';
  nameInput.focus();
});
