
'use strict';
const {test,after,before}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const testDb=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'razryad-test-')),'test.db');
process.env.DB_PATH=testDb;
const {app,db,ready}=require('../server');
let server,base;
before(async()=>{await ready;await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve)});base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{await new Promise(resolve=>server.close(resolve));if(db)await new Promise(resolve=>db.close(resolve));fs.rmSync(path.dirname(testDb),{recursive:true,force:true});});
async function req(path,method='GET',data){let r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,body:await r.json()};}
test('GET returns startup notes',async()=>{const r=await req('/api/posts');assert.equal(r.status,200);assert.ok(Array.isArray(r.body));assert.ok(r.body.length>=2);});
test('POST, GET by ID, PATCH like and DELETE',async()=>{
  const post=await req('/api/posts','POST',{title:'Тестовый заголовок',text:'Подробное содержание о системах счисления',tags:'#test'});
  assert.equal(post.status,201);assert.ok(post.body.id>0);
  const id=post.body.id;
  const fetched=await req(`/api/posts/${id}`);assert.equal(fetched.body.title,'Тестовый заголовок');
  const liked=await req(`/api/posts/${id}/like`,'PATCH');assert.equal(liked.status,200);assert.equal(liked.body.likes,1);
  const removed=await req(`/api/posts/${id}`,'DELETE');assert.equal(removed.status,200);
  assert.equal((await req(`/api/posts/${id}`)).status,404);
});
test('invalid data gets 400 or 404',async()=>{
  assert.equal((await req('/api/posts','POST',{title:'ab',text:'short'})).status,400);
  assert.equal((await req('/api/posts/99999999')).status,404);
});

test('SQLite persists test results and feedback',async()=>{
 const r=await req('/api/results','POST',{name:'Ученик',score:8,total:10,durationSeconds:34});assert.equal(r.status,201);
 const f=await req('/api/feedback','POST',{name:'Аноним',rating:5,clarity:4,comment:'Понятная тема'});assert.equal(f.status,201);
 const dashboard=await req('/api/dashboard');assert.equal(dashboard.status,200);
 assert.equal(dashboard.body.summary.attempts,1);assert.equal(dashboard.body.summary.responses,1);
});
test('SQL injection-shaped input is treated as plain text',async()=>{
 const title="'); DROP TABLE posts; --";
 const result=await req('/api/posts','POST',{title,text:'Обычная строка для тестирования обработки'});
 assert.equal(result.status,201);
 assert.ok(Array.isArray((await req('/api/posts')).body));
});
