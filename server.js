
'use strict';
const express = require('express');
const path = require('path');
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1';
app.disable('x-powered-by');
app.use(express.json({limit:'24kb'}));
function validId(value){const id=Number(value);return Number.isSafeInteger(id)&&id>0?id:null;}
function validText(value,max){return typeof value==='string'?value.trim().slice(0,max):'';}
function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}
function checkNote(input){
  if (!input || typeof input!=='object' || Array.isArray(input)) return null;
  const title=validText(input.title,120),text=validText(input.text,3000);
  if(title.length<5||text.length<10)return null;
  const now=new Date();
  const isoDate=validDate(input.isoDate)?input.isoDate:[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  return {title,text,isoDate,date:validText(input.date,80)||new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(now),tags:validText(input.tags,120)||'#системы_счисления'};
}

const sqlite3=require('sqlite3').verbose();
const dbPath=process.env.DB_PATH||path.join(__dirname,'blog.db');
const db=new sqlite3.Database(dbPath);
const ready=new Promise((resolve,reject)=>{
  db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    isoDate TEXT NOT NULL,
    text TEXT NOT NULL,
    tags TEXT DEFAULT '#системы_счисления',
    likes INTEGER NOT NULL DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    percent INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    clarity INTEGER NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.get('SELECT COUNT(*) AS count FROM posts',[],(err,row)=>{
    if(err){reject(err);return;}
    if(row.count>0){resolve();return;}
    const seed=[{"title": "Почему 101101₂ равно 45₁₀?", "date": "1 ноября 2026", "isoDate": "2026-11-01", "text": "Каждая двоичная цифра умножается на степень двойки, соответствующую её позиции. Для числа 101101₂: 32 + 8 + 4 + 1 = 45₁₀.", "tags": "#двоичная #разряды #перевод"}, {"title": "Зачем нужна шестнадцатеричная система", "date": "2 ноября 2026", "isoDate": "2026-11-02", "text": "Шестнадцатеричная запись компактно представляет двоичные данные. Например, 1111 1111₂ = FF₁₆. Поэтому HEX применяют в цветовых кодах HTML и CSS.", "tags": "#hex #css #информатика"}];
    const insert='INSERT INTO posts (title,date,isoDate,text,tags) VALUES (?,?,?,?,?)';
    const statement=db.prepare(insert);
    seed.forEach(item=>statement.run([item.title,item.date,item.isoDate,item.text,item.tags]));
    statement.finalize(error=>error?reject(error):resolve());
  });
  });
});
app.use((req,res,next)=>{
  ready.then(()=>next()).catch(error=>{
    console.error('Не удалось открыть базу данных:',error.message);
    res.status(503).json({error:'База данных недоступна.'});
  });
});
function sqliteError(res,err){console.error('Ошибка БД:',err.message);res.status(500).json({error:'Ошибка базы данных.'});}
app.get('/api/posts',(req,res)=>{
  db.all('SELECT id,title,date,isoDate,text,tags,likes FROM posts ORDER BY id DESC',[],(err,rows)=>err?sqliteError(res,err):res.json(rows));
});
app.get('/api/posts/:id',(req,res)=>{
  const id=validId(req.params.id);
  if(!id)return res.status(404).json({error:'Запись не найдена.'});
  db.get('SELECT * FROM posts WHERE id=?',[id],(err,row)=>{
    if(err)return sqliteError(res,err);
    if(!row)return res.status(404).json({error:'Запись не найдена.'});
    res.json(row);
  });
});
app.post('/api/posts',(req,res)=>{
  const data=checkNote(req.body);
  if(!data)return res.status(400).json({error:'Заголовок должен содержать 5–120 символов, а текст 10–3000.'});
  db.run('INSERT INTO posts (title,date,isoDate,text,tags) VALUES (?,?,?,?,?)',[data.title,data.date,data.isoDate,data.text,data.tags],function(err){
    if(err)return sqliteError(res,err);
    res.status(201).json({id:this.lastID,...data,likes:0});
  });
});
app.patch('/api/posts/:id/like',(req,res)=>{
  const id=validId(req.params.id);
  if(!id)return res.status(404).json({error:'Запись не найдена.'});
  const delta=req.body?.delta===undefined?1:req.body.delta;
  if(delta!==1&&delta!==-1)return res.status(400).json({error:'Некорректное изменение лайка.'});
  db.run('UPDATE posts SET likes=likes+? WHERE id=? AND (likes>0 OR ?=1)',[delta,id,delta],function(err){
    if(err)return sqliteError(res,err);
    db.get('SELECT likes FROM posts WHERE id=?',[id],(readErr,row)=>{
      if(readErr)return sqliteError(res,readErr);
      if(!row)return res.status(404).json({error:'Запись не найдена.'});
      if(!this.changes)return res.status(409).json({error:'Лайк уже снят.'});
      res.json({id,likes:row.likes});
    });
  });
});
app.delete('/api/posts/:id',(req,res)=>{
  const id=validId(req.params.id);
  if(!id)return res.status(404).json({error:'Запись не найдена.'});
  db.run('DELETE FROM posts WHERE id=?',[id],function(err){
    if(err)return sqliteError(res,err);
    if(!this.changes)return res.status(404).json({error:'Запись не найдена.'});
    res.json({message:'Запись удалена.',changes:this.changes});
  });
});
app.post('/api/results',(req,res)=>{
  const {name,score,total,durationSeconds}=req.body||{};
  const student=validText(name,80),seconds=Number(durationSeconds);
  if(!student||!Number.isInteger(score)||!Number.isInteger(total)||total<=0||total>100||score<0||score>total||!Number.isFinite(seconds)||seconds<0||seconds>86400){return res.status(400).json({error:'Некорректные данные тестирования.'});}
  const duration=Math.floor(seconds),percent=Math.round(100*score/total);
  db.run('INSERT INTO quiz_results (name,score,total,percent,duration_seconds) VALUES (?,?,?,?,?)',[student,score,total,percent,duration],function(err){
    if(err)return sqliteError(res,err);
    res.status(201).json({id:this.lastID,name:student,score,total,percent,duration_seconds:duration});
  });
});
app.post('/api/feedback',(req,res)=>{
  const {name,rating,clarity,comment}=req.body||{};
  if(![rating,clarity].every(v=>Number.isInteger(v)&&v>=1&&v<=5)||typeof comment!=='string'||comment.length>1000){return res.status(400).json({error:'Некорректные данные анкеты.'});}
  const user=validText(name,80)||'Аноним';
  db.run('INSERT INTO feedback (name,rating,clarity,comment) VALUES (?,?,?,?)',[user,rating,clarity,validText(comment,1000)],function(err){
    if(err)return sqliteError(res,err);
    res.status(201).json({id:this.lastID,name:user,rating,clarity});
  });
});
app.get('/api/dashboard',(req,res)=>{
  db.all('SELECT id,name,score,total,percent,duration_seconds,created_at FROM quiz_results ORDER BY id DESC LIMIT 100',[],(e,results)=>{
    if(e)return sqliteError(res,e);
    db.all('SELECT id,name,rating,clarity,comment,created_at FROM feedback ORDER BY id DESC LIMIT 100',[],(err,feedback)=>{
      if(err)return sqliteError(res,err);
      db.get('SELECT COUNT(*) AS attempts,ROUND(AVG(percent),2) AS average_percent FROM quiz_results',[],(a,s1)=>{
        if(a)return sqliteError(res,a);
        db.get('SELECT COUNT(*) AS responses,ROUND(AVG(rating),2) AS average_rating FROM feedback',[],(b,s2)=>{
          if(b)return sqliteError(res,b);
          res.json({summary:{...s1,...s2},results,feedback});
        });
      });
    });
  });
});
app.use(express.static(path.join(__dirname,'public'),{index:'index.html',dotfiles:'ignore'}));
app.use((req,res)=>res.status(404).json({error:'Адрес не найден.'}));
function start(port=PORT){return app.listen(port,HOST,()=>console.log(`РАЗРЯД с SQLite: http://localhost:${port}`));}
if(require.main===module)start();
module.exports={app,start,db,ready};
