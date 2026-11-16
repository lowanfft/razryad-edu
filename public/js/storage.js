
'use strict';
(function () {
  async function request(url,data){
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    let answer;
    try {answer=await response.json();} catch{throw new Error('Сервер не вернул JSON.');}
    if(!response.ok)throw new Error(answer.error||'Не удалось сохранить данные.');
    return answer;
  }
  async function saveResult({name,score,total,durationSeconds}) {return request('/api/results',{name,score,total,durationSeconds});}
  async function saveFeedback({name,rating,clarity,comment}) {return request('/api/feedback',{name,rating,clarity,comment});}
  async function dashboardData(){
    const response=await fetch('/api/dashboard');
    const answer=await response.json();
    if(!response.ok)throw new Error(answer.error||'Не удалось загрузить данные.');
    return answer;
  }
  window.RazryadStorage=Object.freeze({saveResult,saveFeedback,dashboardData});
})();
