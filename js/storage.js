'use strict';
// Учебная версия для GitHub Pages: данные НЕ уходят в общую БД.
// localStorage хранит данные только для текущего origin + профиля браузера.
(function () {
  const resultKey = 'razryad-static-results-v1';
  const feedbackKey = 'razryad-static-feedback-v1';
  const maxEntries = 100;

  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value.slice(0, maxEntries) : [];
    } catch { return []; }
  }

  function append(key, record) {
    // Запись может завершиться ошибкой в приватном режиме/при запрете хранилища.
    const list = read(key);
    list.unshift({ ...record, created_at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list.slice(0, maxEntries)));
  }

  function saveResult({ name, score, total, durationSeconds }) {
    if (!Number.isInteger(score) || !Number.isInteger(total) || total <= 0 || score < 0 || score > total) {
      throw new Error('Некорректный результат теста.');
    }
    append(resultKey, {
      name: String(name || 'Ученик').slice(0, 80),
      score, total,
      percent: Math.round(100 * score / total),
      duration_seconds: Math.max(0, Math.floor(Number(durationSeconds) || 0))
    });
  }

  function saveFeedback({ name, rating, clarity, comment }) {
    if (![rating, clarity].every(n => Number.isInteger(n) && n >= 1 && n <= 5)) {
      throw new Error('Выбери оценки от 1 до 5.');
    }
    append(feedbackKey, {
      name: String(name || 'Аноним').slice(0, 80), rating, clarity,
      comment: String(comment || '').slice(0, 1000)
    });
  }

  function dashboardData() {
    const results = read(resultKey);
    const feedback = read(feedbackKey);
    const avg = list => list.length ? Math.round(100 * list.reduce((a, x) => a + x, 0) / list.length) / 100 : null;
    const meanPercent = avg(results.map(r => Number(r.percent) || 0));
    const meanRating = avg(feedback.map(f => Number(f.rating) || 0));
    return {
      summary: {
        attempts: results.length,
        average_percent: meanPercent,
        responses: feedback.length,
        average_rating: meanRating
      },
      results,
      feedback
    };
  }

  function clearData() {
    localStorage.removeItem(resultKey);
    localStorage.removeItem(feedbackKey);
    localStorage.removeItem('razryad-last-result');
  }

  window.RazryadStorage = Object.freeze({ saveResult, saveFeedback, dashboardData, clearData });
})();
