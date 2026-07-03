// ╔════════════════════════════════════════════════════════════════╗
// ║  app.js v7 — CONFIG, AUTH, NAV, VIZIT OQIMI BOSHQARUVI         ║
// ║  Tuzatishlar:                                                   ║
// ║  - vizit oqimi: vfShowStep step3 da jadval/forma yuklanadi      ║
// ║  - login: "Bekor" tugmasi aniq ko'rinadigan                     ║
// ╚════════════════════════════════════════════════════════════════╝

// ★ Apps Script Web App URL — deploy qilgandan keyin shu yerga qo'ying
const CFG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwQmrdnDNJNaxiTX4iZ2qpReeuWC6dYvlr_uRzeHY9LCZ9AD26dl3uxoNW9DD_e9fcb9w/exec',
};

// 25 ta preparat (Apps Script dagi PREPS bilan AYNAN bir xil tartibda bo'lishi shart)
const PREPS = [
  'ФДП - Ментор 5гр №1','ФДП - Ментор 10гр №1','Фдп-Sinopharm 10г (флаконы)',
  'Ментофер 100мг/5мл №5','Л-ЦИНАТ 5мг №10','БЕРРИМУН Сироп 100мл №1',
  'ГРОВЭЛЛ Сироп 120мл №1','КАЛМИСОН Сироп 150мл №1','КАРВИЛИКС Сироп 120мл №1',
  'СОЛАРВИТ Капли 10мл №1','СОНВИЛ Капли 50мл №1','ФРУТАВИЛ Капли 50мл №1',
  'ДОЛАТИХИН Капсула №60','ЗЕРАПРОСТ Капсула №30','НИТИРОЛ Таблетка №30',
  'НЕФИТОР Таблетка №30','ПОГЕНИЛ Таблетка №30','ТИРОФОРТ Таблетка №30',
  'ОЯВИС Капсулы №60','МЕНАПОЛ Капсулы №60','ИММУНОФОР Капсулы №20',
  'BioAmicus REUTERI 10мл','BioAmicus COMPLETE 10мл','BioAmicus VITAMIN D3 10мл',
  'BioAmicus OMEGA-3 30мл',
];

// Narxlar — PREPS bilan bir xil tartibda
const PRICES = {};
[168038.06,235828.91,238663.53,250196.48,175125.36,145600,123200,145600,162400,112000,
 123200,134400,364000,160160,129920,135520,135520,147840,160160,246400,147840,168000,
 168000,145600,140000].forEach((p,i)=>PRICES[PREPS[i]]=p);

const MIN_VISIT_SEC=300; // 5 daqiqa

// ── GLOBAL HOLAT ─────────────────────────────────────────────────
let ST = {
  user:null, doctors:[], pharmacies:[], plans:[], promoQueue:[], todayVisits:[],
  mgrBalance:{jami:0,sarflangan:0,qolgan:0},
  visit:{type:null,target:null,gpsStart:null,gpsEnd:null,timerStart:null,timerRef:null,
         vals:{},products:[],fotoData:null,newObjData:null},
  mgrPay:{type:null,target:null,mpForPromo:null,gps:null,timerStart:null,timerRef:null},
};

// ── OFLAYN NAVBAT ─────────────────────────────────────────────────
function queueSave(d){const q=JSON.parse(localStorage.getItem('ff_q')||'[]');q.push({...d,_t:Date.now()});localStorage.setItem('ff_q',JSON.stringify(q));}
async function flushQueue(){
  if(!navigator.onLine||!CFG.SCRIPT_URL) return;
  const q=JSON.parse(localStorage.getItem('ff_q')||'[]');if(!q.length) return;
  const failed=[];
  for(const item of q){try{await apiPost(item);}catch(e){failed.push(item);}}
  localStorage.setItem('ff_q',JSON.stringify(failed));
}
window.addEventListener('online',()=>{document.getElementById('offline-bar').style.display='none';flushQueue();});
window.addEventListener('offline',()=>{document.getElementById('offline-bar').style.display='block';});

// ── API ───────────────────────────────────────────────────────────
async function apiGet(action,params){
  if(!CFG.SCRIPT_URL) throw new Error('SCRIPT_URL sozlanmagan');
  const qs=new URLSearchParams({action,...params}).toString();
  const r=await fetch(`${CFG.SCRIPT_URL}?${qs}`);
  return r.json();
}
async function apiPost(d){
  if(!CFG.SCRIPT_URL){queueSave(d);return{status:'queued'};}
  await fetch(CFG.SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
  return{status:'sent'};
}

// ── LOGIN ─────────────────────────────────────────────────────────
async function doLogin(){
  const id=v('l-id').trim().toUpperCase(),pass=v('l-pass').trim();
  if(!id||!pass){showLoginErr('ID va parolni kiriting');return;}
  showOv('Tekshirilmoqda...');
  let result=null;
  if(CFG.SCRIPT_URL){try{result=await apiGet('checkLoginGet',{id,pass});}catch(e){result=null;}}
  if(!result||result.status!=='ok') result=demoLogin(id,pass);
  hideOv();
  if(!result||result.status!=='ok'){showLoginErr('Login yoki parol noto\'g\'ri');return;}
  ST.user={id,name:result.name,role:result.role,region:result.region||'Toshkent shahri',mgrId:result.mgrId||''};
  // 1 marta kirilsa, chiqish bosilmagunicha eslab qoladi
  localStorage.setItem('ff_user',JSON.stringify(ST.user));
  enterApp();
}

// Demo login (SCRIPT_URL sozlanmagan paytda sinov uchun)
function demoLogin(id,pass){
  const demo={'ADMIN':{name:'Administrator',role:'admin',pass:'Falcon@2025',region:'Toshkent shahri'}};
  const e=demo[id];
  if(!e||e.pass!==pass) return{status:'error'};
  return{status:'ok',name:e.name,role:e.role,region:e.region};
}

function showLoginErr(msg){const el=document.getElementById('l-err');el.textContent=msg;el.classList.remove('hide');}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('l-id')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  document.getElementById('l-pass')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  // Avtomatik kirish — avval login qilingan bo'lsa
  const saved=JSON.parse(localStorage.getItem('ff_user')||'null');
  if(saved){ST.user=saved;enterApp();}
});

function logout(){
  if(!confirm('Tizimdan chiqasizmi?')) return;
  localStorage.removeItem('ff_user');
  location.reload();
}

// ── ROL ASOSIDA MENYU ─────────────────────────────────────────────
const ROLE_LABELS={admin:'Administrator',manager:'Bo\'lim boshlig\'i',mp:'Med. Vakil',ta:'Torgovoy Agent'};
const NAV_BY_ROLE={
  mp:  [['home','🏠','Bosh sahifa'],['plan','📋','Reja'],['endday','📊','Kun yakuni'],['feedback','💬','Murojaat']],
  ta:  [['home','🏠','Bosh sahifa'],['endday','📊','Kun yakuni'],['feedback','💬','Murojaat']],
  manager:[['mgr','👔','Boshqaruv'],['paydoctor','💰','Pul berish'],['promo','🎁','Proma'],
           ['planmgr','📋','Med. Vakil rejalari'],['kpi','📈','Jamoa KPI'],['map','🗺️','Xarita']],
  admin:  [['mgr','👔','Boshqaruv'],['adminbalance','🏦','Menejer balans'],['promo','🎁','Proma'],
           ['planmgr','📋','Rejalar'],['kpi','📈','Jamoa KPI'],['map','🗺️','Xarita'],['feedbackbox','💬','Murojaatlar']],
};

function enterApp(){
  document.getElementById('pg-login').classList.add('hide');
  document.getElementById('app').classList.remove('hide');
  document.getElementById('hdr-name').textContent=ST.user.name;
  document.getElementById('hdr-role').textContent=ROLE_LABELS[ST.user.role]||ST.user.role;
  buildNav(); buildAllPages(); initData();
}

function buildNav(){
  const nav=document.getElementById('main-nav');
  const items=NAV_BY_ROLE[ST.user.role]||NAV_BY_ROLE.mp;
  nav.innerHTML=items.map((it,i)=>`<div class="nav-tab ${i===0?'active':''}" data-p="${it[0]}" onclick="showPage('${it[0]}')">${it[1]} ${it[2]}</div>`).join('');
}

function showPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p)?.classList.add('active');
  document.querySelector(`.nav-tab[data-p="${p}"]`)?.classList.add('active');
  if(p==='plan') renderPlans();
  if(p==='endday') renderEndDay();
  if(p==='mgr') renderMgrDashboard();
  if(p==='promo') renderPromoQueue();
  if(p==='kpi') renderTeamKPI();
  if(p==='planmgr') renderPlansManagerView();
  if(p==='paydoctor') renderPayDoctorPage();
  if(p==='adminbalance') renderAdminBalance();
  if(p==='map') renderMapPage();
  if(p==='feedbackbox') { const el=document.getElementById('fb-inbox'); if(el) el.innerHTML='<div class="alert alert-i">Barcha murojaatlar Google Sheets → Murojaatlar sahifasida saqlanadi. Vaqt, sana, hodim ismi va xabar mazmuni bilan ko\'rinadi.</div>'; }
}

// ── MA'LUMOTLARNI YUKLASH ─────────────────────────────────────────
async function initData(){
  showOv('Ma\'lumotlar yuklanmoqda...');
  try{
    const role=ST.user.role;
    if(role==='mp'||role==='admin'||role==='manager'){
      ST.doctors=await apiGet('getDoctors',{}).catch(()=>[]);
      if(ST.doctors.error) ST.doctors=[];
    }
    if(role==='ta'||role==='admin'){
      ST.pharmacies=await apiGet('getPharmacies',{}).catch(()=>[]);
      if(ST.pharmacies.error) ST.pharmacies=[];
    }
    ST.plans=await apiGet('getPlans',{empId:ST.user.id,role:ST.user.role}).catch(()=>[]);
    if(role==='manager'){
      ST.mgrBalance=await apiGet('getMgrBalance',{mgrId:ST.user.id}).catch(()=>({jami:0,sarflangan:0,qolgan:0}));
    }
    localStorage.setItem('ff_doc_cache',JSON.stringify(ST.doctors));
    localStorage.setItem('ff_pharm_cache',JSON.stringify(ST.pharmacies));
  }catch(e){
    ST.doctors=JSON.parse(localStorage.getItem('ff_doc_cache')||'[]');
    ST.pharmacies=JSON.parse(localStorage.getItem('ff_pharm_cache')||'[]');
  }
  hideOv(); flushQueue();
  if(document.getElementById('page-home')) renderHome();
}

// ── UI YORDAMCHI FUNKSIYALAR ──────────────────────────────────────
function v(id){return document.getElementById(id)?.value||'';}
function showOv(msg){document.getElementById('ov-msg').textContent=msg;document.getElementById('overlay').classList.remove('hide');}
function hideOv(){document.getElementById('overlay').classList.add('hide');}
function showEl(id){document.getElementById(id)?.classList.remove('hide');}
function hideEl(id){document.getElementById(id)?.classList.add('hide');}
function tgl(id,show){const e=document.getElementById(id);if(e)e.classList.toggle('hide',!show);}
function showModal(title,bodyHtml,buttons){
  document.getElementById('modal-box').innerHTML=`<div class="modal-title">${title}</div><div style="margin-bottom:18px">${bodyHtml}</div><div class="btn-row">${buttons}</div>`;
  document.getElementById('modal-bg').classList.remove('hide');
}
function closeModal(){document.getElementById('modal-bg').classList.add('hide');}
function fmtMoney(n){return Math.round(n).toLocaleString('uz-UZ')+' so\'m';}
function todayStr(){return new Date().toISOString().split('T')[0];}
function nowTimeStr(){return new Date().toTimeString().slice(0,8);}
function nowTimeFromTs(ts){return new Date(ts).toTimeString().slice(0,8);}

// ── VIZIT OQIMI ───────────────────────────────────────────────────
function startVisitFlow(type){
  ST.visit={type,target:null,gpsStart:null,gpsEnd:null,timerStart:null,timerRef:null,
            vals:{},products:[],fotoData:null,newObjData:null};
  const c=document.getElementById('visit-flow-container');
  c.innerHTML=visitFlowHTML(type);
  c.scrollIntoView({behavior:'smooth'});
  vfShowStep(1);
}

function visitFlowHTML(type){
  const isDoc=type==='doctor';
  return `
  <div class="card" style="margin-top:14px;border:2px solid var(--primary3)">
    <div class="card-h">${isDoc?'🏥 VRACH VIZITI':'💊 DORIXONA VIZITI'}
      <!-- Bekor tugmasi — aniq ko'rinadigan rang (oq fon, to'q matn) -->
      <button onclick="cancelVisitFlow()"
        style="margin-left:auto;padding:5px 13px;border-radius:8px;border:1.5px solid #fff;
               background:#fff;color:var(--primary);font-size:12px;font-weight:700;cursor:pointer">
        ✕ Bekor
      </button>
    </div>
    <div class="card-b">
      <div class="steps-bar">
        <span class="step-chip active" id="vfc1">1.Lokatsiya</span><span class="step-arrow">›</span>
        <span class="step-chip" id="vfc2">2.${isDoc?'Vrach':'Dorixona'}</span><span class="step-arrow">›</span>
        <span class="step-chip" id="vfc3">3.So'rovnoma</span><span class="step-arrow">›</span>
        <span class="step-chip" id="vfc4">4.Foto</span><span class="step-arrow">›</span>
        <span class="step-chip" id="vfc5">5.Yakun</span>
      </div>
      <div id="vfs1"></div><div id="vfs2" class="hide"></div><div id="vfs3" class="hide"></div>
      <div id="vfs4" class="hide"></div><div id="vfs5" class="hide"></div>
    </div>
  </div>`;
}

function cancelVisitFlow(){
  if(!confirm('Vizitni bekor qilasizmi? Kiritilgan ma\'lumotlar yo\'qoladi.')) return;
  clearInterval(ST.visit.timerRef);
  document.getElementById('visit-flow-container').innerHTML='';
}

function vfShowStep(n){
  for(let i=1;i<=5;i++) tgl('vfs'+i,i===n);
  for(let i=1;i<=5;i++){
    const c=document.getElementById('vfc'+i);
    if(!c) continue;
    c.className='step-chip'+(i<n?' done':i===n?' active':'');
  }
  if(n===1) renderVfStep1();
  if(n===2) renderVfStep2();
  if(n===3) {
    renderVfStep3();
    // 50ms kutib jadval/forma elementlarini yuklaymiz
    setTimeout(()=>{
      if(ST.visit.type==='doctor') { renderProductRows(); }
      else { buildBronTable(); }
    },50);
  }
  if(n===4) renderVfStep4();
}

// ── GPS (QADAM 1) ─────────────────────────────────────────────────
function renderVfStep1(){
  document.getElementById('vfs1').innerHTML=`
    <div class="alert alert-i">Vizitni boshlash uchun joylashuvingiz avtomatik aniqlanadi.</div>
    <div id="vf-gps-status" class="alert alert-w">GPS aniqlanmoqda...</div>
    <button class="btn btn-p btn-bl btn-lg hide" id="vf-gps-retry" onclick="vfGetGps()">Qayta urinish</button>`;
  vfGetGps();
}

function vfGetGps(){
  hideEl('vf-gps-retry');
  if(!navigator.geolocation){
    document.getElementById('vf-gps-status').className='alert alert-r';
    document.getElementById('vf-gps-status').textContent='GPS mavjud emas';
    showEl('vf-gps-retry'); return;
  }
  navigator.geolocation.getCurrentPosition(
    pos=>{
      ST.visit.gpsStart={lat:pos.coords.latitude,lng:pos.coords.longitude,acc:Math.round(pos.coords.accuracy)};
      document.getElementById('vf-gps-status').className='alert alert-ok';
      document.getElementById('vf-gps-status').textContent='Joylashuv aniqlandi. Davom etilmoqda...';
      setTimeout(()=>vfShowStep(2),700);
    },
    ()=>{
      document.getElementById('vf-gps-status').className='alert alert-r';
      document.getElementById('vf-gps-status').textContent='GPS ruxsati kerak. Sozlamalar → Joylashuv';
      showEl('vf-gps-retry');
    },
    {enableHighAccuracy:true,timeout:20000,maximumAge:0});
}
