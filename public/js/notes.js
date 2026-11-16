
'use strict';
const notesContainer = document.getElementById('postsContainer');
const notesStatus = document.getElementById('notes-status');
const notesSearch = document.getElementById('notes-search');
const notesCount = document.getElementById('notes-count');
const notesRefresh = document.getElementById('refresh-notes');
const noteForm = document.getElementById('add-note-form');
const noteSubmit = document.getElementById('note-submit');
const noteSubmitStatus = document.getElementById('note-submit-status');
let allArticles = [];

async function apiRequest(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  let payload;
  try { payload = await response.json(); } catch { throw new Error('Сервер вернул некорректный ответ.'); }
  if (!response.ok) throw new Error(payload.error || `Ошибка HTTP ${response.status}`);
  return payload;
}
function formatNoteDate(iso) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
function element(tag, className, content) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (content !== undefined) e.textContent = content;
  return e;
}
function makeCard(article) {
  const card = element('article','note-card');
  const top = element('div','note-card-top');
  top.append(element('span','',`ЗАПИСЬ #${article.id}`),element('span','',formatNoteDate(article.isoDate)));
  const title=element('h3','',article.title);
  const body=element('p','',article.text);
  const tags=element('div','note-card-tags',article.tags || '#системы_счисления');
  const actions=element('div','note-card-actions');
  const like=element('button','note-like',`♡ ${article.likes} · Нравится`); like.type='button';
  like.addEventListener('click',async () => {
    like.disabled=true;
    try {
      const result=await apiRequest(`/api/posts/${article.id}/like`,{method:'PATCH'});
      article.likes=result.likes;
      like.textContent=`♥ ${article.likes} · Нравится`;
    } catch(err){setStatus(err.message,true);} finally {like.disabled=false;}
  });
  const del=element('button','note-delete','Удалить'); del.type='button';
  del.addEventListener('click', async () => {
    if (!window.confirm(`Удалить заметку «${article.title}»?`)) return;
    del.disabled=true;
    try {await apiRequest(`/api/posts/${article.id}`,{method:'DELETE'}); allArticles=allArticles.filter(item => item.id!==article.id); renderArticles(filterArticles());setStatus('Заметка удалена.');}
    catch(err){setStatus(err.message,true);del.disabled=false;}
  });
  actions.append(like,del);
  card.append(top,title,body,tags,actions);
  return card;
}
function filterArticles() {
  const query=notesSearch.value.trim().toLocaleLowerCase('ru');
  if (!query) return allArticles;
  return allArticles.filter(note=>[note.title,note.text,note.tags].some(val=>String(val||'').toLocaleLowerCase('ru').includes(query)));
}
function renderArticles(articles) {
  notesContainer.replaceChildren();
  notesCount.textContent=`Найдено: ${articles.length}`;
  if (!articles.length){notesContainer.append(element('p','notes-empty',allArticles.length?'Ничего не найдено. Измени запрос поиска.':'В базе пока нет записей.'));return;}
  const fragment=document.createDocumentFragment();
  articles.forEach(article=>fragment.append(makeCard(article)));
  notesContainer.append(fragment);
}
function setStatus(text,isError=false){notesStatus.textContent=text;notesStatus.dataset.kind=isError?'error':'ok';}
async function loadArticlesFromServer() {
  notesRefresh.disabled=true;
  setStatus('Загружаем записи с сервера…');
  try {
    allArticles=await apiRequest('/api/posts');
    renderArticles(filterArticles());
    setStatus(`Загружено записей: ${allArticles.length}.`);
  } catch(error){setStatus('Ошибка соединения с сервером. '+error.message,true);}
  finally{notesRefresh.disabled=false;}
}
notesSearch.addEventListener('input',()=>renderArticles(filterArticles()));
notesRefresh.addEventListener('click',loadArticlesFromServer);
noteForm.addEventListener('submit',async(event)=>{
  event.preventDefault();
  const title=document.getElementById('note-title').value.trim();
  const text=document.getElementById('note-text').value.trim();
  const tags=document.getElementById('note-tags').value.trim()||'#системы_счисления';
  if(title.length<5||text.length<10){noteSubmitStatus.textContent='Заголовок — от 5 символов, текст — от 10.';noteSubmitStatus.dataset.kind='error';return;}
  const now=new Date();
  const newNote={title,text,tags,date:now.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}),isoDate:[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-')};
  noteSubmit.disabled=true;noteSubmitStatus.textContent='Сохраняем запись…';noteSubmitStatus.dataset.kind='ok';
  try {
    const created=await apiRequest('/api/posts',{method:'POST',body:JSON.stringify(newNote)});
    allArticles.unshift(created);
    renderArticles(filterArticles());
    noteForm.reset();
    noteSubmitStatus.textContent='✓ Заметка добавлена на сервер.';
    setStatus('Запись сохранена на сервере.');
  }catch(error){noteSubmitStatus.textContent=error.message;noteSubmitStatus.dataset.kind='error';}
  finally{noteSubmit.disabled=false;}
});
loadArticlesFromServer();
