
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

const seed = [{"title": "Почему 101101₂ равно 45₁₀?", "date": "1 ноября 2026", "isoDate": "2026-11-01", "text": "Каждая двоичная цифра умножается на степень двойки, соответствующую её позиции. Для числа 101101₂: 32 + 8 + 4 + 1 = 45₁₀.", "tags": "#двоичная #разряды #перевод"}, {"title": "Зачем нужна шестнадцатеричная система", "date": "2 ноября 2026", "isoDate": "2026-11-02", "text": "Шестнадцатеричная запись компактно представляет двоичные данные. Например, 1111 1111₂ = FF₁₆. Поэтому HEX применяют в цветовых кодах HTML и CSS.", "tags": "#hex #css #информатика"}];
let articles=seed.map((post,index)=>({id:index+1,...post,likes:0}));
let nextId=articles.length+1;
app.get('/api/posts',(req,res)=>res.json([...articles].sort((a,b)=>b.id-a.id)));
app.get('/api/posts/:id',(req,res)=>{
  const id=validId(req.params.id);
  const found=articles.find(post=>post.id===id);
  if(!found)return res.status(404).json({error:'Запись не найдена.'});
  res.json(found);
});
app.post('/api/posts',(req,res)=>{
  const data=checkNote(req.body);
  if(!data)return res.status(400).json({error:'Заголовок должен содержать 5–120 символов, а текст 10–3000.'});
  const created={id:nextId++,...data,likes:0};
  articles.unshift(created);
  res.status(201).json(created);
});
app.patch('/api/posts/:id/like',(req,res)=>{
  const id=validId(req.params.id),item=articles.find(post=>post.id===id);
  if(!item)return res.status(404).json({error:'Запись не найдена.'});
  item.likes++;
  res.json({id:item.id,likes:item.likes});
});
app.delete('/api/posts/:id',(req,res)=>{
  const id=validId(req.params.id),before=articles.length;
  articles=articles.filter(post=>post.id!==id);
  if(before===articles.length)return res.status(404).json({error:'Запись не найдена.'});
  res.json({message:'Запись удалена.',changes:1});
});
const quizResults=[];
const reviews=[];
app.post('/api/results',(req,res)=>{
  const {name,score,total,durationSeconds}=req.body||{};
  const student=validText(name,80),seconds=Number(durationSeconds);
  if(!student||!Number.isInteger(score)||!Number.isInteger(total)||total<=0||total>100||score<0||score>total||!Number.isFinite(seconds)||seconds<0||seconds>86400){return res.status(400).json({error:'Некорректный результат.'});}
  const record={id:quizResults.length+1,name:student,score,total,percent:Math.round(score/total*100),duration_seconds:Math.floor(seconds),created_at:new Date().toISOString()};
  quizResults.unshift(record);res.status(201).json(record);
});
app.post('/api/feedback',(req,res)=>{
  const {name,rating,clarity,comment}=req.body||{};
  if(![rating,clarity].every(v=>Number.isInteger(v)&&v>=1&&v<=5)||typeof comment!=='string'||comment.length>1000){return res.status(400).json({error:'Некорректная анкета.'});}
  const record={id:reviews.length+1,name:validText(name,80)||'Аноним',rating,clarity,comment:validText(comment,1000),created_at:new Date().toISOString()};
  reviews.unshift(record);res.status(201).json(record);
});
app.get('/api/dashboard',(req,res)=>{
  const mean=(list,field)=>list.length?Math.round(list.reduce((sum,r)=>sum+r[field],0)/list.length*100)/100:null;
  res.json({summary:{attempts:quizResults.length,average_percent:mean(quizResults,'percent'),responses:reviews.length,average_rating:mean(reviews,'rating')},results:quizResults,feedback:reviews});
});
app.use(express.static(path.join(__dirname,'public'),{index:'index.html',dotfiles:'ignore'}));
app.use((req,res)=>res.status(404).json({error:'Адрес не найден.'}));
function start(port=PORT){return app.listen(port,HOST,()=>console.log(`РАЗРЯД: http://localhost:${port}`));}
if(require.main===module) start();
module.exports={app,start};
