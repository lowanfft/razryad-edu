'use strict';
/* Динамический рендеринг: материалы хранятся в массиве объектов,
   JavaScript создаёт элементы <article> и выполняет «живой» поиск. */
const lessons = [
  {
    id: 1, category: 'основы', categoryLabel: 'НАЧАЛО', title: 'Что такое система счисления?',
    summary: 'Поймём разницу между числом и его записью. Узнаем, что означают основание и цифры системы.',
    paragraphs: [
      'Система счисления — набор символов (цифр) и правил, по которым ими записывают числа. Число обозначает количество, а запись зависит от выбранной системы.',
      'Основание позиционной системы — число различных цифр, используемых в ней. Например, основание 10 означает десять цифр: от 0 до 9.',
      'Нижний индекс в записи 101₍₂₎ показывает основание. Это помогает не путать одинаковые наборы символов в разных системах.'
    ],
    example: '10₁₀ = 1010₂ = 12₈ = A₁₆',
    tip: 'Все четыре записи выше обозначают одно и то же количество — десять.'
  },
  {
    id: 2, category: 'основы', categoryLabel: 'ЛОГИКА РАЗРЯДОВ', title: 'Позиционная и непозиционная запись',
    summary: 'Почему цифра 3 в числе 352 «весит» три сотни, а древние египтяне считали иначе?',
    paragraphs: [
      'В позиционных системах значение цифры зависит от её места (разряда). Чем дальше разряд слева, тем более высокую степень основания он представляет.',
      'Непозиционная запись устроена иначе: каждый символ имеет собственное значение, которое не меняется из-за места символа в последовательности.',
      'Современные двоичная, восьмеричная, десятичная и шестнадцатеричная системы — позиционные. Древнеегипетская — пример непозиционной.'
    ],
    example: '352₁₀ = 3 × 10² + 5 × 10¹ + 2 × 10⁰',
    tip: 'Здесь 3 означает 300, 5 означает 50, а 2 означает 2.'
  },
  {
    id: 3, category: 'перевод', categoryLabel: 'ОСНОВА ИНФОРМАТИКИ', title: 'Как работает двоичная система',
    summary: 'Только нули и единицы: разберём разряды 2⁰, 2¹, 2² и переведём число по шагам.',
    paragraphs: [
      'Двоичная система использует только две цифры: 0 и 1. Каждый следующий разряд слева вдвое тяжелее предыдущего: 1, 2, 4, 8, 16, 32 и так далее.',
      'Чтобы перевести число в десятичную систему, умножь каждую цифру на соответствующую степень двойки и сложи результаты.',
      'Чтобы перевести десятичное целое число в двоичную запись, последовательно дели его на 2 с остатком, а остатки прочитай в обратном порядке.'
    ],
    example: '101101₂ = 32 + 8 + 4 + 1 = 45₁₀',
    tip: 'Для 13₁₀ остатки при делении на 2 дают 1101₂.'
  },
  {
    id: 4, category: 'перевод', categoryLabel: 'ОСНОВАНИЕ 8', title: 'Восьмеричная система',
    summary: 'У неё восемь цифр — от 0 до 7. Удобно группировать двоичные разряды по три.',
    paragraphs: [
      'Восьмеричная система имеет основание 8 и использует цифры 0, 1, 2, 3, 4, 5, 6, 7. Цифры 8 и 9 в ней запрещены.',
      'Для перевода восьмеричной записи в десятичную каждую цифру умножают на степень восьмёрки. Для перевода из двоичной в восьмеричную разбивают двоичную запись на тройки справа налево.',
      'Например, 101101₂ → 101 101 → 55₈. Каждая тройка двоичных цифр соответствует одной восьмеричной цифре.'
    ],
    example: '55₈ = 5 × 8¹ + 5 × 8⁰ = 45₁₀',
    tip: 'Число 78₈ записано неверно: цифры 8 в восьмеричной системе нет.'
  },
  {
    id: 5, category: 'перевод', categoryLabel: 'ОСНОВАНИЕ 16', title: 'Шестнадцатеричная система',
    summary: 'Зачем программисты используют A, B, C, D, E, F и как превратить FF₁₆ в 255₁₀.',
    paragraphs: [
      'Шестнадцатеричная система использует 16 цифр: 0–9 и буквы A, B, C, D, E, F, которые обозначают значения 10–15.',
      'Один шестнадцатеричный разряд соответствует четырём двоичным разрядам. Поэтому длинные двоичные числа можно записывать намного короче.',
      'В веб-разработке HEX-коды вроде #FFFFFF обозначают компоненты цвета. Шестнадцатеричная запись также встречается в адресах памяти.'
    ],
    example: '2D₁₆ = 2 × 16¹ + 13 × 16⁰ = 45₁₀',
    tip: 'FF₁₆ = 15 × 16 + 15 = 255₁₀.'
  },
  {
    id: 6, category: 'история', categoryLabel: 'НЕМНОГО ИСТОРИИ', title: 'Счёт в Древнем Египте',
    summary: 'Вместо разрядов — отдельные знаки для 1, 10, 100, 1000 и других степеней десяти.',
    paragraphs: [
      'Древнеегипетские числа записывали особыми знаками: отдельные символы существовали для единицы, десяти, сотни, тысячи и других степеней десяти.',
      'Нужное значение получали, повторяя символы соответствующее количество раз. При этом знак десятка всегда означал десять независимо от своей позиции.',
      'Это удобно для знакомства с историей математики, но очень длинные числа приходилось записывать большим количеством повторяющихся символов.'
    ],
    example: '45 = четыре знака «10» + пять знаков «1»',
    tip: 'Здесь показан принцип счёта; оригинальные иероглифы в записи специально заменены описаниями.'
  }
];

const lessonContainer = document.getElementById('lessons-container');
const searchInput = document.getElementById('lesson-search');
const lessonCount = document.getElementById('lesson-count');
const filterButtons = document.querySelectorAll('.filter-btn');
let activeFilter = 'all';
let liked = [];
try {
  const saved = JSON.parse(localStorage.getItem('razryad-liked') || '[]');
  if (Array.isArray(saved)) liked = saved.filter((id) => Number.isInteger(id));
} catch {}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderLessons(items) {
  lessonContainer.replaceChildren();
  lessonCount.textContent = `${items.length} ${items.length === 1 ? 'материал' : items.length >= 2 && items.length <= 4 ? 'материала' : 'материалов'}`;
  if (!items.length) {
    lessonContainer.appendChild(createElement('p', 'no-results', 'Ничего не найдено. Попробуй другое слово или выбери «Все темы».'));
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const lesson of items) {
    const article = createElement('article', 'topic-card');
    const head = createElement('div', 'topic-header');
    head.appendChild(createElement('span', 'topic-num', String(lesson.id).padStart(2, '0')));
    const heading = createElement('div', 'topic-heading');
    heading.appendChild(createElement('span', 'topic-label', lesson.categoryLabel));
    heading.appendChild(createElement('h3', '', lesson.title));
    heading.appendChild(createElement('p', 'topic-summary', lesson.summary));
    head.appendChild(heading);
    article.appendChild(head);

    const actions = createElement('div', 'topic-actions');
    const expand = createElement('button', 'expand-btn', 'Раскрыть тему ＋');
    expand.type = 'button';
    expand.setAttribute('aria-expanded', 'false');
    expand.setAttribute('aria-controls', `lesson-details-${lesson.id}`);
    const like = createElement('button', `like-btn${liked.includes(lesson.id) ? ' is-liked' : ''}`, liked.includes(lesson.id) ? '♥ Полезно · 1' : '♡ Полезно · 0');
    like.type = 'button';
    like.setAttribute('aria-pressed', String(liked.includes(lesson.id)));
    actions.append(expand, like);
    article.appendChild(actions);

    const details = createElement('div', 'topic-details');
    details.id = `lesson-details-${lesson.id}`;
    details.hidden = true;
    for (const paragraph of lesson.paragraphs) details.appendChild(createElement('p', '', paragraph));
    details.appendChild(createElement('div', 'topic-example', lesson.example));
    details.appendChild(createElement('p', 'topic-tip', lesson.tip));
    article.appendChild(details);
    expand.addEventListener('click', () => {
      details.hidden = !details.hidden;
      expand.setAttribute('aria-expanded', String(!details.hidden));
      expand.textContent = details.hidden ? 'Раскрыть тему ＋' : 'Свернуть тему −';
    });
    like.addEventListener('click', () => {
      const isLiked = liked.includes(lesson.id);
      liked = isLiked ? liked.filter((id) => id !== lesson.id) : [...liked, lesson.id];
      like.textContent = isLiked ? '♡ Полезно · 0' : '♥ Полезно · 1';
      like.classList.toggle('is-liked', !isLiked);
      like.setAttribute('aria-pressed', String(!isLiked));
      try { localStorage.setItem('razryad-liked', JSON.stringify(liked)); } catch {}
    });
    fragment.appendChild(article);
  }
  lessonContainer.appendChild(fragment);
}

function filterLessons() {
  const search = searchInput.value.trim().toLocaleLowerCase('ru-RU');
  const filtered = lessons.filter((item) =>
    (activeFilter === 'all' || item.category === activeFilter) &&
    [item.title, item.summary, item.categoryLabel, item.example, item.tip, ...item.paragraphs]
      .join(' ').toLocaleLowerCase('ru-RU').includes(search)
  );
  renderLessons(filtered);
}
searchInput.addEventListener('input', filterLessons);
filterButtons.forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach((item) => {
    const selected = item === button;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  filterLessons();
}));
renderLessons(lessons);
