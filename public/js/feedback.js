'use strict';
const feedbackForm = document.getElementById('feedback-form');
const feedbackStatus = document.getElementById('feedback-status');
const submitButton = document.getElementById('submit-feedback');
const comment = document.getElementById('feedback-comment');
const commentCount = document.getElementById('comment-count');
comment.addEventListener('input', () => {
  commentCount.textContent = `${comment.value.length} / 1000`;
});
feedbackForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const rating = feedbackForm.querySelector('input[name="rating"]:checked');
  const clarity = feedbackForm.querySelector('input[name="clarity"]:checked');
  const consent = document.getElementById('feedback-consent');
  feedbackStatus.className = 'form-message';
  if (!rating || !clarity) {
    feedbackStatus.textContent = 'Пожалуйста, поставь обе оценки по шкале от 1 до 5.';
    feedbackStatus.classList.add('is-error');
    return;
  }
  if (!consent.checked) {
    feedbackStatus.textContent = 'Нужно согласие на сохранение анкеты в учебной базе.';
    feedbackStatus.classList.add('is-error');
    return;
  }
  submitButton.disabled = true;
  feedbackStatus.textContent = 'Отправляем анкету на сервер...';
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('feedback-name').value.trim() || 'Аноним',
        rating: Number(rating.value), clarity: Number(clarity.value), comment: comment.value.trim()
      })
    });
    if (!response.ok) throw new Error('Ошибка сервера');
    feedbackForm.reset();
    commentCount.textContent = '0 / 1000';
    feedbackStatus.textContent = '✓ Спасибо! Твой отзыв сохранён в SQLite.';
    feedbackStatus.className = 'form-message is-success';
  } catch {
    feedbackStatus.textContent = 'Не удалось сохранить отзыв. Проверь, что сайт открыт через http://localhost:3000 и сервер запущен.';
    feedbackStatus.className = 'form-message is-error';
  } finally {
    submitButton.disabled = false;
  }
});
