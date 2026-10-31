'use strict';
// Конвертер целых неотрицательных чисел (BigInt, без потери точности).
const sourceBase = document.getElementById('source-base');
const targetBase = document.getElementById('target-base');
const convertInput = document.getElementById('convert-input');
const convertOutput = document.getElementById('convert-output');
const convertExplain = document.getElementById('convert-explain');
const radixSubs = { 2: '₂', 8: '₈', 10: '₁₀', 16: '₁₆' };
const radixChars = '0123456789ABCDEF';

function parseRadix(value, base) {
  if (!value || value.length > 24 || !/^[0-9A-F]+$/.test(value)) return null;
  let result = 0n;
  for (const char of value) {
    const digit = radixChars.indexOf(char);
    if (digit < 0 || digit >= base) return null;
    result = result * BigInt(base) + BigInt(digit);
  }
  return result;
}
function convertNumber() {
  const from = Number(sourceBase.value);
  const to = Number(targetBase.value);
  const value = convertInput.value.trim().toUpperCase();
  const parsed = parseRadix(value, from);
  if (parsed === null) {
    convertOutput.textContent = '—';
    convertExplain.textContent = `Допустимы только цифры системы с основанием ${from}, длина — до 24 знаков.`;
    convertExplain.classList.add('is-error');
    return;
  }
  convertOutput.textContent = parsed.toString(to).toUpperCase() + radixSubs[to];
  convertExplain.classList.remove('is-error');
  if (from === 10 && to === 2 && parsed <= 1023n) {
    const powers = [];
    let pos = 0;
    for (const bit of parsed.toString(2).split('').reverse()) {
      if (bit === '1') powers.push(String(2 ** pos));
      pos++;
    }
    convertExplain.textContent = `${value} = ${powers.reverse().join(' + ') || '0'}`;
  } else {
    convertExplain.textContent = `${value}${radixSubs[from]} = ${convertOutput.textContent} · десятичное значение: ${parsed.toString()}`;
  }
}
[sourceBase, targetBase, convertInput].forEach((item) => item.addEventListener('input', convertNumber));
document.getElementById('swap-base').addEventListener('click', () => {
  const oldBase = sourceBase.value;
  sourceBase.value = targetBase.value;
  targetBase.value = oldBase;
  const cleaned = convertInput.value.trim().toUpperCase();
  const parsed = parseRadix(cleaned, Number(oldBase));
  // При обмене системами оставляем то же количество, а не ту же строку.
  if (parsed !== null) convertInput.value = parsed.toString(Number(sourceBase.value)).toUpperCase();
  convertNumber();
});
document.querySelectorAll('[data-example]').forEach((button) => button.addEventListener('click', () => {
  sourceBase.value = button.dataset.source;
  targetBase.value = button.dataset.target;
  convertInput.value = button.dataset.example;
  convertNumber();
}));
convertNumber();

// Динамическая разрядная схема с восемью кнопками.
const bitsButtons = document.getElementById('bits-buttons');
const bitsPowers = document.getElementById('bits-powers');
let bits = Array.from('00101101', Number);
function renderBits() {
  bitsButtons.replaceChildren();
  bitsPowers.replaceChildren();
  bits.forEach((bit, index) => {
    const power = 7 - index;
    const powerLabel = document.createElement('span');
    powerLabel.textContent = `2^${power}`;
    bitsPowers.appendChild(powerLabel);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(bit);
    button.className = bit ? 'is-on' : '';
    button.setAttribute('aria-label', `Разряд 2 в степени ${power}, значение ${bit}. Изменить`);
    button.setAttribute('aria-pressed', String(Boolean(bit)));
    button.addEventListener('click', () => { bits[index] = 1 - bits[index]; renderBits(); });
    bitsButtons.appendChild(button);
  });
  const value = bits.reduce((sum, bit, index) => sum + bit * (2 ** (7 - index)), 0);
  document.getElementById('bits-binary').textContent = bits.join('');
  document.getElementById('bits-decimal').textContent = String(value);
  const values = bits.flatMap((bit, index) => bit ? [2 ** (7 - index)] : []);
  document.getElementById('bits-decomposition').textContent = `${values.join(' + ') || '0'} = ${value}`;
}
document.getElementById('bits-reset').addEventListener('click', () => { bits = Array.from('00101101', Number); renderBits(); });
renderBits();

// Проверка ответа с немедленной обратной связью.
const practiceForm = document.getElementById('practice-form');
const practiceAnswer = document.getElementById('practice-answer');
const practiceNumber = document.getElementById('practice-number');
const practiceMessage = document.getElementById('practice-message');
let practiceValue = 10;
let practiceCorrect = 0;
let alreadyCorrect = false;
function practiceBreakdown() {
  const parts = [...practiceValue.toString(2)].reverse().flatMap((bit, idx) => bit === '1' ? [2 ** idx] : []);
  return parts.reverse().join(' + ');
}
practiceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = practiceAnswer.value.trim();
  if (!/^\d+$/.test(text)) {
    practiceMessage.textContent = 'Введи целое неотрицательное число.';
    practiceMessage.className = 'inline-feedback is-error';
  } else if (Number(text) === practiceValue) {
    if (!alreadyCorrect) practiceCorrect++;
    alreadyCorrect = true;
    document.getElementById('practice-score').textContent = String(practiceCorrect);
    practiceMessage.textContent = `Верно! ${practiceNumber.textContent}₂ = ${practiceBreakdown()} = ${practiceValue}₁₀.`;
    practiceMessage.className = 'inline-feedback is-success';
  } else {
    practiceMessage.textContent = 'Пока неверно. Посмотри на разряды и попробуй ещё раз.';
    practiceMessage.className = 'inline-feedback is-error';
  }
});
document.getElementById('practice-hint').addEventListener('click', () => {
  practiceMessage.textContent = `Разложение: ${practiceBreakdown()} = ?`;
  practiceMessage.className = 'inline-feedback';
});
document.getElementById('practice-next').addEventListener('click', () => {
  let next = practiceValue;
  while (next === practiceValue) next = 8 + Math.floor(Math.random() * 120);
  practiceValue = next;
  alreadyCorrect = false;
  practiceNumber.textContent = next.toString(2);
  practiceAnswer.value = '';
  practiceMessage.className = 'inline-feedback';
  practiceMessage.textContent = 'Новое число готово. Сложи веса всех единичных разрядов.';
  practiceAnswer.focus();
});
