// app.js v12
// Login: faqat server (Hodimlar_Login Sheets) - kod ichida parol yo'q
// Yangi hodim qo'shilsa - Sheets ga qo'shiladi, kod o'zgarmaydi
// Tezlashtirish: login tezda, ma'lumotlar parallel

const CFG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyU2lVnFBgB4mJajLOvs8JlifQ5HqvSw5DGYV1mVOix9ee7RzJUJc8FUHOqZ-3hIAM8hg/exec',
};

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
const PRICES = {};
[168038.06,235828.91,238663.53,250196.48,175125.36,145600,123200,145600,162400,112000,
 123200,134400,364000,160160,129920,135520,135520,147840,160160,246400,147840,168000,
 168000,145600,140000].forEach((p,i)=>PRICES[PREPS[i]]=p);

const MIN_VISIT_SEC = 300;

let ST = {
  user:null, doctors:[], pharmacies:[], plans:[], promoQueue:[],
  todayVisits:[], mgrBalance:{jami:0,sarflangan:0,qolgan:0},
  visit:{type:null,target:null,gpsStart:null,gpsEnd:null,timerStart:null,timerRef:null,
         vals:{promoRequested:false,promaSumma:0},products:[],fotoData:null},
  mgrPay:{type:null,target:null},
};

// ═══ FAQAT SERVER DAN LOGIN ══════════════════════════
// Hodimlar_Login Sheets dan o'qiydi
// Yangi hodim qo'shilsa - Sheets ga qo'shish kifoya, kod o'zgarmaydi
// Xavfsiz: parollar GitHub da ko'rinmaydi

// Hodim ma'lumotlari cache (parolsiz - faqat offline uchun)
let _userInfoCache = {};

async function doLogin() {
  const id   = (document.getElementById('l-id')?.value||'').trim().toUpperCase();
  const pass = (document.getElementById('l-pass')?.value||'').trim();
  if (!id||!pass) { showLoginErr('ID va parolni kiriting'); return; }

  // Overlay ko'rsatamiz - server tekshiruvi
  showOv('Kirish tekshirilmoqda...');
  let result = null;

  // Server dan tekshiramiz (Hodimlar_Login Sheets)
  try {
    const srv = await fetch(
      CFG.SCRIPT_URL + '?action=checkLoginGet&id=' + encodeURIComponent(id) + '&pass=' + encodeURIComponent(pass),
      { redirect: 'follow' }
    );
    const data = await srv.json();
    if (data && data.status === 'ok') result = data;
  } catch(e) {
    // Server xato - lokal cache dan tekshiramiz (oflayn)
    const cached = JSON.parse(localStorage.getItem('ff_user_cache_' + id) || 'null');
    if (cached && cached.passHash === simpleHash(pass)) {
      result = { status:'ok', ...cached };
    }
  }

  hideOv();
  if (!result || result.status !== 'ok') {
    showLoginErr('Login yoki parol noto\'g\'ri');
    return;
  }

  // Muvaffaqiyatli login - passHash ni cache ga saqlaymiz (oflayn uchun)
  const userInfo = {
    name: result.name||'',
    role: result.role||'mp',
    region: result.region||'',
    mgrId: result.mgrId||'',
    district: result.district||'',
    group: result.group||'',
    passHash: simpleHash(pass), // parolni emas, hash ni saqlaymiz
  };
  localStorage.setItem('ff_user_cache_' + id, JSON.stringify(userInfo));

  ST.user = { id, ...userInfo };
  // mgrName ni ham saqlaymiz (agar server qaytargan bo'lsa)
  if(result.mgrName) ST.user.mgrName = result.mgrName;
  if(result.district) ST.user.district = result.district; // rayon(lar)
  if(result.districts && result.districts.length) ST.user.districts = result.districts;
  delete ST.user.passHash;
  localStorage.setItem('ff_user', JSON.stringify(ST.user));
  _userInfoCache[id] = userInfo;
  enterApp();
}

// Oddiy hash (security uchun emas, faqat oflayn tekshiruv uchun)
function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h.toString(36);
}

function showLoginErr(msg) {
  const el = document.getElementById('l-err');
  if (el) { el.textContent = msg; el.classList.remove('hide'); }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('l-id')?.addEventListener('keydown',   e => { if(e.key==='Enter') doLogin(); });
  document.getElementById('l-pass')?.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
  // Avval kirgan bo'lsa - to'g'ridan sahifaga
  const saved = JSON.parse(localStorage.getItem('ff_user')||'null');
  if (saved && saved.id && saved.role) { ST.user = saved; enterApp(); }
});

function logout() {
  if (!confirm('Tizimdan chiqasizmi?')) return;
  localStorage.removeItem('ff_user');
  location.reload();
}

// ═══ OFLAYN NAVBAT ══════════════════════════════════
function queueSave(d) {
  const q = JSON.parse(localStorage.getItem('ff_q')||'[]');
  q.push({ ...d, _savedAt: new Date().toISOString(), _retries: 0 });
  localStorage.setItem('ff_q', JSON.stringify(q));
}
async function flushQueue() {
  if (!navigator.onLine || !CFG.SCRIPT_URL) return;
  const q = JSON.parse(localStorage.getItem('ff_q')||'[]');
  if (!q.length) return;
  const failed = [];
  for (const item of q) {
    try {
      const { _savedAt, _retries, ...data } = item;
      await fetch(CFG.SCRIPT_URL, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
    } catch(e) {
      item._retries = (item._retries||0) + 1;
      if (item._retries < 5) failed.push(item);
    }
  }
  localStorage.setItem('ff_q', JSON.stringify(failed));
}
window.addEventListener('online',  () => { const b=document.getElementById('offline-bar'); if(b)b.style.display='none'; setTimeout(flushQueue,1500); });
window.addEventListener('offline', () => { const b=document.getElementById('offline-bar'); if(b)b.style.display='block'; });

// ═══ API ════════════════════════════════════════════
const _apiCache = {};
async function apiGet(action, params, useCache=true) {
  const key = action + JSON.stringify(params);
  if (useCache && _apiCache[key]) return _apiCache[key];
  const qs = new URLSearchParams({ action, ...params }).toString();
  const r = await fetch(CFG.SCRIPT_URL + '?' + qs, { redirect:'follow' });
  const data = await r.json();
  if (!data.error) _apiCache[key] = data;
  return data;
}
async function apiPost(d) {
  if (!navigator.onLine) { queueSave(d); return { status:'queued', offline:true }; }
  try {
    // MUHIM TUZATISH: avvalgi kod mode:'no-cors' ishlatgani uchun server javobi
    // umuman o'qilmas edi (opaque response) — shuning uchun newBalance, fake, ref kabi
    // maydonlar doim "undefined" bo'lgan (#14 — balans yangilanmasligi shundan edi).
    // text/plain Content-Type + standart 'cors' rejimi — bu "simple request" hisoblanadi,
    // Apps Script preflight (OPTIONS) so'ramaydi VA javobni o'qish mumkin bo'ladi.
    const r = await fetch(CFG.SCRIPT_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(d)
    });
    let resp = { status:'sent' };
    try { const j = await r.json(); if (j && typeof j==='object') resp = { status:'sent', ...j }; } catch(e2) {}
    invalidateApiCache(d.action);
    return resp;
  } catch(e) {
    queueSave(d);
    return { status:'queued', error:e.message };
  }
}
// Amal bajarilgandan keyin tegishli GET keshlarini tozalaymiz — tez yangilanish uchun (#9,#12,#13)
function invalidateApiCache(action) {
  const map = {
    addPlan:['getPlans'], updatePlan:['getPlans'],
    requestPromo:['getPromoQueue'], decidePromo:['getPromoQueue'],
    addMgrBalance:['getMgrBalance','getAllBalances','getMgrJournal'],
    mgrPayDoctor:['getMgrBalance','getAllBalances','getMgrJournal','getPromoQueue'],
    addVisitMP:['getKPI','getDayVisits','getMyVisits','getPlans','getLocations'],
    addVisitTA:['getKPI','getDayVisits','getMyVisits','getLocations'],
    endDay:['getKPI'],
  };
  const keys = map[action]||[];
  Object.keys(_apiCache).forEach(k=>{ if(keys.some(p=>k.startsWith(p))) delete _apiCache[k]; });
}

// ═══ MENYU ══════════════════════════════════════════
// "Menejer" (bo'lim boshlig'i emas)
const ROLE_LABELS = { admin:'Administrator', manager:'Menejer', mp:'Med. Vakil', ta:'Torgovoy Agent' };
const NAV_BY_ROLE = {
  mp:      [['home','Bosh sahifa'],['history','Tarix'],['plan','Reja'],['endday','Kun yakuni'],['report','Hisobot'],['feedback','Murojaat']],
  ta:      [['home','Bosh sahifa'],['history','Tarix'],['endday','Kun yakuni'],['report','Hisobot'],['feedback','Murojaat']],
  manager: [['mgr','Boshqaruv'],['paydoctor','Pul berish'],['promo','FCOIN'],['planmgr','MP rejalari'],['kpi','Jamoa KPI'],['map','Xarita']],
  admin:   [['mgr','Boshqaruv'],['adminbalance','Menejer balans'],['adminjournal','Admin jurnali'],['promo','FCOIN'],['planmgr','Rejalar'],['histadmin','Tarix'],['kpi','Jamoa KPI'],['map','Xarita'],['feedbackbox','Murojaatlar']],
};

function enterApp() {
  document.getElementById('pg-login')?.classList.add('hide');
  document.getElementById('app')?.classList.remove('hide');
  document.getElementById('hdr-name').textContent = ST.user.name;
  // "Menejer" - stikersiz
  let roleLabel = ROLE_LABELS[ST.user.role] || ST.user.role;
  if (ST.user.role==='mp' && ST.user.mgrId) {
    // Menejer ismini server dan olamiz yoki ID ko'rsatamiz
    roleLabel = 'Med. Vakil';
  }
  if (ST.user.role==='ta' && ST.user.isTeamLead) {
    roleLabel = 'Menejer';
  }
  document.getElementById('hdr-role').textContent = roleLabel;
  buildNav(); buildAllPages(); initData();
  if(ST.user.role==='mp'||ST.user.role==='ta') setTimeout(checkResumeActiveVisit,600);
}

function buildNav() {
  const nav = document.getElementById('main-nav');
  let items = NAV_BY_ROLE[ST.user.role] || NAV_BY_ROLE.mp;
  if (ST.user.role==='ta' && ST.user.isTeamLead) {
    items = items.concat([['team','Jamoa'],['map','Xarita']]);
  }
  nav.innerHTML = items.map((it,i) =>
    `<div class="nav-tab ${i===0?'active':''}" data-p="${it[0]}" onclick="showPage('${it[0]}')">${it[1]}</div>`
  ).join('');
}

function showPage(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('page-'+p)?.classList.add('active');
  document.querySelector(`.nav-tab[data-p="${p}"]`)?.classList.add('active');
  if (p==='home')         refreshHomeLive();
  if (p==='plan')         renderPlans();
  if (p==='history')      renderHistory();
  if (p==='histadmin')    { if(typeof renderAdminHistory==='function') renderAdminHistory(); }
  if (p==='histadmin')    renderAdminHistory();
  if (p==='endday')       renderEndDay();
  if (p==='report')       renderReportPage();
  if (p==='team')         renderTeamAgentPage();
  if (p==='mgr')          renderMgrDashboard();
  if (p==='promo')        renderPromoQueue();
  if (p==='kpi')          renderTeamKPI();
  if (p==='planmgr')      renderPlansManagerView();
  if (p==='paydoctor')    renderPayDoctorPage();
  if (p==='adminbalance') renderAdminBalance();
  if (p==='adminjournal') renderAdminJournal();
  if (p==='map')          renderMapPage();
  if (p==='feedbackbox')  renderFeedbackInbox();
}

// Bosh sahifa ochilganda — rejalar, bugungi vizitlar va KPI ni serverdan yangilaymiz
// (foydalanuvchi saytga necha marta kirsa ham eng oxirgi holat ko'rinishi uchun — #1,#3,#10)
async function refreshHomeLive() {
  renderHome();
  try {
    const [plans, dayVisits] = await Promise.all([
      apiGet('getPlans',{empId:ST.user.id,role:ST.user.role},false).catch(()=>null),
      apiGet('getDayVisits',{empId:ST.user.id,date:todayStr()},false).catch(()=>null),
    ]);
    if (plans && !plans.error && Array.isArray(plans)) ST.plans = plans;
    if (dayVisits && !dayVisits.error) {
      const merged = mergeTodayVisits(dayVisits);
      ST.todayVisits = merged;
      localStorage.setItem('ff_vis_cache_'+ST.user.id, JSON.stringify(merged));
    }
  } catch(e) {}
  if (document.getElementById('page-home')?.classList.contains('active')) renderHome();
}

// ═══ MA'LUMOT YUKLASH ═══════════════════════════════
async function initData() {
  const role = ST.user.role;
  // Cache dan darhol ko'rsatamiz
  const cd = JSON.parse(localStorage.getItem('ff_doc_cache')||'[]');
  const cp = JSON.parse(localStorage.getItem('ff_pharm_cache')||'[]');
  const cv = JSON.parse(localStorage.getItem('ff_vis_cache_'+ST.user.id)||'[]');
  if (cd.length) ST.doctors = cd;
  if (cp.length) ST.pharmacies = cp;
  if (cv.length) {
    // date maydoni turli formatlarda bo'lishi mumkin - shuning uchun slice(0,10) bilan tekshiramiz
    const today = todayStr();
    ST.todayVisits = cv.filter(v => {
      const d = String(v.date||'').slice(0,10);
      return d === today;
    });
  }

  // Bosh sahifani cache dan ko'rsatamiz
  if (document.getElementById('page-home')) renderHome();

  // Fon rejimida server dan yangilaymiz
  if (!navigator.onLine) return;
  Promise.all([
    (role==='mp'||role==='admin'||role==='manager') ? apiGet('getDoctors',{},false).catch(()=>null) : Promise.resolve(null),
    (role==='ta'||role==='admin'||role==='mp')      ? apiGet('getPharmacies',{},false).catch(()=>null) : Promise.resolve(null),
    apiGet('getPlans',{empId:ST.user.id,role},false).catch(()=>null),
    apiGet('getDayVisits',{empId:ST.user.id,date:todayStr()},false).catch(()=>null),
  ]).then(([docs,pharma,plans,vis]) => {
    if (docs&&!docs.error)  { ST.doctors=docs;   localStorage.setItem('ff_doc_cache',JSON.stringify(docs)); }
    if (pharma&&!pharma.error) { ST.pharmacies=pharma; localStorage.setItem('ff_pharm_cache',JSON.stringify(pharma)); }
    if (plans&&!plans.error)   { ST.plans=plans; }
    if (vis&&!vis.error)  {
      ST.todayVisits=mergeTodayVisits(vis);
      // Lokal navbatdagi vizitlarni ham qo'shamiz
      const localQ=JSON.parse(localStorage.getItem('ff_q')||'[]');
      localQ.filter(q=>q.action==='addVisitMP'||q.action==='addVisitTA').forEach(q=>{
        const already=vis.some(v=>v.ref===q.ref);
        if(!already) ST.todayVisits.push({type:q.action==='addVisitMP'?'doctor':'pharmacy',target:q.doctorObject||q.pharmName||'',doctor:q.doctorName||'',result:q.result||'OK',time:q.visitStartTime||'',date:q.date,ref:q.ref,offline:true});
      });
      localStorage.setItem('ff_vis_cache_'+ST.user.id,JSON.stringify(ST.todayVisits));
    }
    // Menejer ismini topamiz (MGR02 → Radjabova Fotima) — async funksiyada
    if (ST.user.mgrId && !ST.user.mgrName) {
      apiGet('getMgrInfo',{mgrId:ST.user.mgrId},false).then(mgrInfo=>{
        if (mgrInfo && mgrInfo.name) {
          ST.user.mgrName = mgrInfo.name;
          if (!ST.user.district) ST.user.district = mgrInfo.district||'';
          localStorage.setItem('ff_user', JSON.stringify(ST.user));
          // Bosh sahifani yangilaymiz
          if(document.getElementById('page-home')?.classList.contains('active')) renderHome();
        }
      }).catch(()=>{});
    }
    if (document.getElementById('page-home')?.classList.contains('active')) renderHome();
    if (document.getElementById('page-endday')?.classList.contains('active')) renderEndDay();
    // Admin/menejer uchun KPI ham yangilansin
    if (document.getElementById('page-kpi')?.classList.contains('active')) {
      if(typeof renderTeamKPI==='function') renderTeamKPI();
    }
    flushQueue();
  });
}

// ═══ UI HELPERS ═════════════════════════════════════
function v(id) { return document.getElementById(id)?.value||''; }
function showOv(msg) { const m=document.getElementById('ov-msg');if(m)m.textContent=msg||'...'; document.getElementById('overlay')?.classList.remove('hide'); }
function hideOv() { document.getElementById('overlay')?.classList.add('hide'); }
function showEl(id) { document.getElementById(id)?.classList.remove('hide'); }
function hideEl(id) { document.getElementById(id)?.classList.add('hide'); }
function tgl(id, show) { document.getElementById(id)?.classList.toggle('hide', !show); }
function showModal(title, body, btns) {
  document.getElementById('modal-box').innerHTML = `<div class="modal-title">${title}</div><div style="margin-bottom:18px">${body}</div><div class="btn-row">${btns}</div>`;
  document.getElementById('modal-bg')?.classList.remove('hide');
}
function closeModal() { document.getElementById('modal-bg')?.classList.add('hide'); }
function fmtMoney(n) { return Math.round(n||0).toLocaleString('uz-UZ')+" so'm"; }
function fmtCoin(n) { return Math.round(n||0).toLocaleString('uz-UZ')+" FCOIN"; }
function todayStr() {
  // Lokal sana (timezone muammosini hal qiladi)
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}
function nowTimeStr() { return new Date().toTimeString().slice(0,8); }
function nowTimeFromTs(ts) { return new Date(ts).toTimeString().slice(0,8); }

// Server dan yangi ro'yxat kelganda, shu sessiyada saqlangan (lekin serverda hali
// "ko'rinmagan" — Sheets yozuvi kechikkan) vizitlarni yo'qotmaslik uchun birlashtiramiz (#9,#12)
function mergeTodayVisits(serverList) {
  const server = Array.isArray(serverList) ? serverList : [];
  const local = ST.todayVisits || [];
  const merged = [...server];
  local.forEach(v => {
    if (v && v.ref && !merged.some(x => x.ref === v.ref)) merged.push(v);
  });
  return merged;
}

// ═══ VIZIT OQIMI ════════════════════════════════════
function startVisitFlow(type) {
  if(localStorage.getItem('ff_endday_'+ST.user.id)===todayStr()){
    alert('Bugungi kun yakunlangan — endi vizit qilib bo\'lmaydi!');
    return;
  }
  // Vrach/dorixona bazasini fonda yangilaymiz — kun davomida bazaga yangi qo'shilgan/o'chirilganlar ko'rinsin (#14)
  apiGet('getDoctors',{},false).then(docs=>{if(docs&&!docs.error){ST.doctors=docs;localStorage.setItem('ff_doc_cache',JSON.stringify(docs));}}).catch(()=>{});
  apiGet('getPharmacies',{},false).then(ph=>{if(ph&&!ph.error){ST.pharmacies=ph;localStorage.setItem('ff_pharm_cache',JSON.stringify(ph));}}).catch(()=>{});
  ST.visit = { type, target:null, gpsStart:null, gpsEnd:null, timerStart:null, timerRef:null,
    vals:{promoRequested:false,promaSumma:0}, products:[], fotoData:null };
  const c = document.getElementById('visit-flow-container');
  c.innerHTML = visitFlowHTML(type);
  c.scrollIntoView({ behavior:'smooth' });
  vfShowStep(1);
}

function visitFlowHTML(type) {
  const isDoc = type==='doctor';
  return `
  <div class="card" style="margin-top:14px;border:2px solid var(--primary3)">
    <div class="card-h">${isDoc?'🏥 VRACH VIZITI':'💊 DORIXONA VIZITI'}
      <button onclick="cancelVisitFlow()"
        style="margin-left:auto;padding:5px 13px;border-radius:8px;border:1.5px solid #fff;
          background:#fff;color:var(--primary);font-size:12px;font-weight:700;cursor:pointer">
        ✕ Bekor
      </button>
    </div>
    <div class="card-b">
      <div class="steps-bar">
        <span class="step-chip active" id="vfc1">1.GPS</span><span class="step-arrow">›</span>
        <span class="step-chip" id="vfc2">2.${isDoc?'Vrach':'Dorixona'}</span><span class="step-arrow">›</span>
        <span class="step-chip" id="vfc3">3.So'rovnoma</span><span class="step-arrow">›</span>
        <span class="step-chip" id="vfc4">4.Yakun</span>
      </div>
      <div id="vfs1"></div><div id="vfs2" class="hide"></div>
      <div id="vfs3" class="hide"></div><div id="vfs4" class="hide"></div>
    </div>
  </div>`;
}

function cancelVisitFlow() {
  if (!confirm('Vizitni bekor qilasizmi?')) return;
  clearInterval(ST.visit.timerRef);
  clearActiveVisitProgress();
  document.getElementById('visit-flow-container').innerHTML = '';
}

// 4 qadam: GPS → Vrach/Dorixona → So'rovnoma → Yakun (foto yo'q)
function vfShowStep(n) {
  for (let i=1;i<=4;i++) tgl('vfs'+i, i===n);
  for (let i=1;i<=4;i++) {
    const c = document.getElementById('vfc'+i);
    if (!c) continue;
    c.className = 'step-chip'+(i<n?' done':i===n?' active':'');
  }
  if (n===1) renderVfStep1();
  if (n===2) renderVfStep2();
  if (n===3) { renderVfStep3(); setTimeout(()=>{ if(ST.visit.type==='doctor')renderProductRows(); else buildBronTable(); },30); }
  if (n===4) renderVfStep4();
}

// GPS
function renderVfStep1() {
  document.getElementById('vfs1').innerHTML = `
    <div class="alert alert-i">GPS joylashuv aniqlanmoqda...</div>
    <div id="vf-gps-status" class="alert alert-w">Aniqlanmoqda...</div>
    <button class="btn btn-o btn-bl hide" id="vf-gps-skip" onclick="vfShowStep(2)">GPS xato — baribir davom etish</button>
    <button class="btn btn-p btn-bl hide" id="vf-gps-retry" onclick="vfGetGps()">Qayta urinish</button>`;
  vfGetGps();
}
function vfGetGps() {
  hideEl('vf-gps-skip'); hideEl('vf-gps-retry');
  const timer = setTimeout(() => {
    const s = document.getElementById('vf-gps-status');
    if (s) { s.className='alert alert-w'; s.textContent='GPS sekin — davom etishingiz mumkin'; }
    showEl('vf-gps-skip'); showEl('vf-gps-retry');
  }, 10000);
  navigator.geolocation?.getCurrentPosition(
    pos => {
      clearTimeout(timer);
      ST.visit.gpsStart = { lat:pos.coords.latitude, lng:pos.coords.longitude, acc:Math.round(pos.coords.accuracy) };
      const s = document.getElementById('vf-gps-status');
      if (s) { s.className='alert alert-ok'; s.textContent='✅ Joylashuv aniqlandi ('+ST.visit.gpsStart.acc+'m)'; }
      setTimeout(() => vfShowStep(2), 500);
    },
    () => {
      clearTimeout(timer);
      const s = document.getElementById('vf-gps-status');
      if (s) { s.className='alert alert-r'; s.textContent='GPS ruxsati kerak — Sozlamalar → Joylashuv'; }
      showEl('vf-gps-skip'); showEl('vf-gps-retry');
    },
    { enableHighAccuracy:true, timeout:9000 }
  ) || (() => { clearTimeout(timer); vfShowStep(2); })();
}
