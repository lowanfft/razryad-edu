'use strict';
// DOM + события: внешний JavaScript-файл управляет поведением, CSS — видом.
const themeButton = document.querySelector('.theme-toggle');
const themeSymbol = document.querySelector('.theme-symbol');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

function applyTheme(dark) {
  document.body.classList.toggle('dark-theme', dark);
  themeSymbol.textContent = dark ? '☀' : '☾';
  themeButton.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
  themeButton.title = dark ? 'Светлая тема' : 'Тёмная тема';
}
try { applyTheme(localStorage.getItem('razryad-theme') === 'dark'); }
catch { applyTheme(false); }

themeButton.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark-theme');
  applyTheme(isDark);
  try { localStorage.setItem('razryad-theme', isDark ? 'dark' : 'light'); } catch {}
});

function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
}
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});
