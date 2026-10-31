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
  feedbackStatus.className = 'form-message';
  if (!rating || !clarity) {
    feedbackStatus.textContent = 'Пожалуйста, поставь обе оценки по шкале от 1 до 5.';
    feedbackStatus.classList.add('is-error');
    return;
  }
  submitButton.disabled = true;
  feedbackStatus.textContent = 'Сохраняем анкету в этом браузере...';
  try {
    await window.RazryadStorage.saveFeedback({
      name: document.getElementById('feedback-name').value.trim().replace(/\s+/g, ' ').slice(0,80) || 'Аноним',
      rating: Number(rating.value), clarity: Number(clarity.value), comment: comment.value.trim()
    });
    feedbackForm.reset();
    commentCount.textContent = '0 / 1000';
    feedbackStatus.textContent = '✓ Спасибо! Отзыв сохранён в этом браузере.';
    feedbackStatus.className = 'form-message is-success';
  } catch (error) {
    feedbackStatus.textContent = `Не удалось сохранить отзыв. ${error.message}`;
    feedbackStatus.className = 'form-message is-error';
  } finally {
    submitButton.disabled = false;
  }
});
