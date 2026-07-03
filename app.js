// ═══════════════════════════════════════════════════
// app.js v9 — CONFIG, AUTH, NAV
// Login: avval lokal cache → keyin server
// Barcha hodimlar cache da — internet bo'lmasa ham kiradi
// ═══════════════════════════════════════════════════

// ★ SCRIPT_URL — Apps Script deploy URL (shu yerga qo'ying)
const CFG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwQmrdnDNJNaxiTX4iZ2qpReeuWC6dYvlr_uRzeHY9LCZ9AD26dl3uxoNW9DD_e9fcb9w/exec',
};

// ═══ PREPARAT VA NARXLAR ════════════════════════════
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
 168000,145600,140000].forEach((p,i) => PRICES[PREPS[i]] = p);

const MIN_VISIT_SEC = 300;

// ═══ GLOBAL HOLAT ════════════════════════════════════
let ST = {
  user: null,
  doctors: [],
  pharmacies: [],
  plans: [],
  promoQueue: [],
  todayVisits: [],
  mgrBalance: { jami:0, sarflangan:0, qolgan:0 },
  visit: {
    type:null, target:null, gpsStart:null, gpsEnd:null,
    timerStart:null, timerRef:null, vals:{}, products:[], fotoData:null, newObjData:null
  },
  mgrPay: { type:null, target:null, mpForPromo:null, gps:null },
};

// ═══ LOGIN CACHE — barcha hodimlar (internet bo'lmasa ham kiradi) ════
// Hodimlar_Login sahifasidagi parollar bilan bir xil
const _LOGIN_CACHE = {
  'ADMIN': {name:'Administrator',role:'admin',pass:'Falcon@2025',region:'Toshkent shahri',mgrId:'',district:'',group:''},
  'MGR01': {name:'Murhamedova Zuhra',role:'manager',pass:'Zuhra#8842',region:'Toshkent shahri',mgrId:'',district:'',group:''},
  'MGR02': {name:'Radjabova Fotima',role:'manager',pass:'Fotima#3317',region:'Toshkent shahri',mgrId:'',district:'',group:''},
  'MGR03': {name:"Abdullayeva Ra'no",role:'manager',pass:'Rano#5591',region:'Toshkent shahri',mgrId:'',district:'',group:''},
  'MGR04': {name:'Zuparova Umida',role:'manager',pass:'Umida#7763',region:'Toshkent shahri',mgrId:'',district:'',group:''},
  'MP01':  {name:'Mominova Diyora',role:'mp',pass:'Diyora#2284',region:'Toshkent shahri',mgrId:'MGR01',district:'',group:''},
  'MP02':  {name:'Xasanova Nodirabegim',role:'mp',pass:'Nodira#6615',region:'Toshkent viloyati',mgrId:'MGR01',district:'',group:''},
  'MP03':  {name:'Xabibullaxanova Ruxsoraxon',role:'mp',pass:'Ruxsora#4423',region:'Toshkent shahri',mgrId:'MGR02',district:'',group:''},
  'MP04':  {name:'Qunduzova Xadicha',role:'mp',pass:'Xadicha#8871',region:'Toshkent shahri',mgrId:'MGR02',district:'',group:''},
  'MP05':  {name:'Muminova Umida',role:'mp',pass:'Umida#3356',region:'Toshkent shahri',mgrId:'MGR02',district:'',group:''},
  'MP06':  {name:'Abduraimova Durdona',role:'mp',pass:'Durdona#7712',region:'Toshkent shahri',mgrId:'MGR02',district:'',group:''},
  'MP07':  {name:'Tojiddinova Durdona',role:'mp',pass:'Tojiddin#5534',region:'Toshkent shahri',mgrId:'MGR02',district:'',group:''},
  'MP08':  {name:'Shukurova Xolida',role:'mp',pass:'Xolida#9923',region:'Toshkent shahri',mgrId:'MGR02',district:'',group:''},
  'MP09':  {name:'Mirzayeva Zilola',role:'mp',pass:'Zilola#4478',region:'Toshkent shahri',mgrId:'MGR03',district:'',group:''},
  'MP10':  {name:'Ismolova Madina',role:'mp',pass:'Madina#6641',region:'Toshkent shahri',mgrId:'MGR03',district:'',group:''},
  'MP11':  {name:'Najmiddinova Ziyoda',role:'mp',pass:'Ziyoda#2267',region:'Toshkent shahri',mgrId:'MGR03',district:'',group:''},
  'MP12':  {name:'Ilxomova Nodirabegim',role:'mp',pass:'Nodira2#8853',region:'Toshkent shahri',mgrId:'MGR03',district:'',group:''},
  'MP13':  {name:'Xodjayeva Nigora',role:'mp',pass:'Nigora#3312',region:'Toshkent shahri',mgrId:'MGR03',district:'',group:''},
  'MP14':  {name:'Adilova Madina',role:'mp',pass:'Adilova#7789',region:'Toshkent shahri',mgrId:'MGR03',district:'',group:''},
  'MP15':  {name:'Abduganiyeva Saidaxon',role:'mp',pass:'Saidaxon#5545',region:'Toshkent shahri',mgrId:'MGR04',district:'',group:''},
  'MP16':  {name:'Shosalimova Zuhra',role:'mp',pass:'Zuhra2#1123',region:'Toshkent shahri',mgrId:'MGR04',district:'',group:''},
  'MP17':  {name:'Sultonova Gulchexra',role:'mp',pass:'Gulchexra#6678',region:'Toshkent shahri',mgrId:'MGR04',district:'',group:''},
  'TA01':  {name:'Deryabin Ivan',role:'ta',pass:'Ivan#9934',region:'Toshkent shahri',mgrId:'',district:'',group:''},
  'TA02':  {name:'Anvarxodjayev Akmal',role:'ta',pass:'Akmal#4456',region:'Toshkent shahri',mgrId:'',district:'',group:''},
};

// Cache dan login tekshirish
function cacheLogin(id, pass) {
  const u = _LOGIN_CACHE[id];
  if (!u || u.pass !== pass) return null;
  return { status:'ok', name:u.name, role:u.role, region:u.region,
    mgrId:u.mgrId, district:u.district, group:u.group };
}

// ═══ OFLAYN NAVBAT ════════════════════════════════════
function queueSave(d) {
  const q = JSON.parse(localStorage.getItem('ff_q') || '[]');
  q.push({ ...d, _savedAt: new Date().toISOString(), _retries: 0 });
  localStorage.setItem('ff_q', JSON.stringify(q));
}

async function flushQueue() {
  if (!navigator.onLine || !CFG.SCRIPT_URL) return;
  const q = JSON.parse(localStorage.getItem('ff_q') || '[]');
  if (!q.length) return;
  const failed = [];
  for (const item of q) {
    try {
      const { _savedAt, _retries, ...data } = item;
      await fetch(CFG.SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch(e) {
      item._retries = (item._retries || 0) + 1;
      if (item._retries < 5) failed.push(item);
    }
  }
  localStorage.setItem('ff_q', JSON.stringify(failed));
}

window.addEventListener('online', () => {
  const bar = document.getElementById('offline-bar');
  if (bar) bar.style.display = 'none';
  setTimeout(flushQueue, 1500);
});
window.addEventListener('offline', () => {
  const bar = document.getElementById('offline-bar');
  if (bar) bar.style.display = 'block';
});

// ═══ API ════════════════════════════════════════════
async function apiGet(action, params) {
  if (!CFG.SCRIPT_URL) throw new Error('SCRIPT_URL yo\'q');
  const qs = new URLSearchParams({ action, ...params }).toString();
  const r = await fetch(`${CFG.SCRIPT_URL}?${qs}`, { redirect: 'follow' });
  return r.json();
}

async function apiPost(d) {
  if (!CFG.SCRIPT_URL) { queueSave(d); return { status:'queued' }; }
  if (!navigator.onLine) { queueSave(d); return { status:'queued', offline:true }; }
  try {
    await fetch(CFG.SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d)
    });
    return { status:'sent' };
  } catch(e) {
    queueSave(d);
    return { status:'queued', error: e.message };
  }
}

// ═══ LOGIN ══════════════════════════════════════════
async function doLogin() {
  const id   = (document.getElementById('l-id')?.value || '').trim().toUpperCase();
  const pass = (document.getElementById('l-pass')?.value || '').trim();
  if (!id || !pass) { showLoginErr('ID va parolni kiriting'); return; }

  showOv('Tekshirilmoqda...');

  // 1. Avval lokal cache → tez, internet shart emas
  let result = cacheLogin(id, pass);

  // 2. Cache da yo'q bo'lsa (yangi hodim) → serverdan tekshir
  if (!result) {
    if (CFG.SCRIPT_URL) {
      try {
        const srv = await apiGet('checkLoginGet', { id, pass });
        if (srv && srv.status === 'ok') result = srv;
      } catch(e) {}
    }
  }

  hideOv();

  if (!result || result.status !== 'ok') {
    showLoginErr('Login yoki parol noto\'g\'ri');
    return;
  }

  ST.user = {
    id,
    name:     result.name     || '',
    role:     result.role     || 'mp',
    region:   result.region   || 'Toshkent shahri',
    mgrId:    result.mgrId    || '',
    district: result.district || '',
    group:    result.group    || '',
  };

  localStorage.setItem('ff_user', JSON.stringify(ST.user));
  enterApp();
}

function showLoginErr(msg) {
  const el = document.getElementById('l-err');
  if (el) { el.textContent = msg; el.classList.remove('hide'); }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('l-id')?.addEventListener('keydown',   e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('l-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  // Avval login qilingan bo'lsa — to'g'ridan sahifaga kiradi
  const saved = JSON.parse(localStorage.getItem('ff_user') || 'null');
  if (saved) { ST.user = saved; enterApp(); }
});

function logout() {
  if (!confirm('Tizimdan chiqasizmi?')) return;
  localStorage.removeItem('ff_user');
  location.reload();
}

// ═══ ROL ASOSIDA MENYU ══════════════════════════════
const ROLE_LABELS = {
  admin:   'Administrator',
  manager: "Bo'lim boshlig'i",
  mp:      'Med. Vakil',
  ta:      'Torgovoy Agent',
};

const NAV_BY_ROLE = {
  mp:      [['home','Bosh sahifa'],['plan','Reja'],['endday','Kun yakuni'],['feedback','Murojaat']],
  ta:      [['home','Bosh sahifa'],['endday','Kun yakuni'],['feedback','Murojaat']],
  manager: [['mgr','Boshqaruv'],['paydoctor','Pul berish'],['promo','Proma'],['planmgr','MP rejalari'],['kpi','Jamoa KPI'],['map','Xarita']],
  admin:   [['mgr','Boshqaruv'],['adminbalance','Menejer balans'],['promo','Proma'],['planmgr','Rejalar'],['kpi','Jamoa KPI'],['map','Xarita'],['feedbackbox','Murojaatlar']],
};

function enterApp() {
  document.getElementById('pg-login')?.classList.add('hide');
  document.getElementById('app')?.classList.remove('hide');
  document.getElementById('hdr-name').textContent = ST.user.name;
  document.getElementById('hdr-role').textContent = ROLE_LABELS[ST.user.role] || ST.user.role;
  buildNav();
  buildAllPages();
  initData();
}

function buildNav() {
  const nav   = document.getElementById('main-nav');
  const items = NAV_BY_ROLE[ST.user.role] || NAV_BY_ROLE.mp;
  nav.innerHTML = items.map((it, i) =>
    `<div class="nav-tab ${i===0?'active':''}" data-p="${it[0]}" onclick="showPage('${it[0]}')">${it[1]}</div>`
  ).join('');
}

function showPage(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + p)?.classList.add('active');
  document.querySelector(`.nav-tab[data-p="${p}"]`)?.classList.add('active');
  if (p === 'plan')         renderPlans();
  if (p === 'endday')       renderEndDay();
  if (p === 'mgr')          renderMgrDashboard();
  if (p === 'promo')        renderPromoQueue();
  if (p === 'kpi')          renderTeamKPI();
  if (p === 'planmgr')      renderPlansManagerView();
  if (p === 'paydoctor')    renderPayDoctorPage();
  if (p === 'adminbalance') renderAdminBalance();
  if (p === 'map')          renderMapPage();
  if (p === 'feedbackbox') {
    const el = document.getElementById('fb-inbox');
    if (el) el.innerHTML = '<div class="alert alert-i">Barcha murojaatlar Google Sheets → Murojaatlar sahifasida saqlanadi.</div>';
  }
}

// ═══ MA'LUMOTLARNI YUKLASH (parallel — tezroq) ════
async function initData() {
  showOv("Ma'lumotlar yuklanmoqda...");
  try {
    const role = ST.user.role;
    const needDocs  = role === 'mp' || role === 'admin' || role === 'manager';
    const needPharm = role === 'ta' || role === 'admin' || role === 'mp';

    const [docs, pharma, plans, bal] = await Promise.all([
      needDocs  ? apiGet('getDoctors',    {}).catch(() => []) : Promise.resolve([]),
      needPharm ? apiGet('getPharmacies', {}).catch(() => []) : Promise.resolve([]),
      apiGet('getPlans', { empId: ST.user.id, role: ST.user.role }).catch(() => []),
      role === 'manager' ? apiGet('getMgrBalance', { mgrId: ST.user.id }).catch(() => null) : Promise.resolve(null),
    ]);

    if (!docs.error)   ST.doctors    = docs   || [];
    if (!pharma.error) ST.pharmacies = pharma || [];
    ST.plans = plans || [];
    if (bal) ST.mgrBalance = bal;

    // Cache ga saqlaymiz (oflayn uchun)
    localStorage.setItem('ff_doc_cache',   JSON.stringify(ST.doctors));
    localStorage.setItem('ff_pharm_cache', JSON.stringify(ST.pharmacies));

  } catch(e) {
    // Oflayn — cache dan olamiz
    ST.doctors    = JSON.parse(localStorage.getItem('ff_doc_cache')   || '[]');
    ST.pharmacies = JSON.parse(localStorage.getItem('ff_pharm_cache') || '[]');
  }

  hideOv();
  flushQueue(); // Internet bo'lsa navbatdagilarni yuboramiz

  const home = document.getElementById('page-home');
  if (home) renderHome();
}

// ═══ UI HELPERS ════════════════════════════════════
function v(id)   { return document.getElementById(id)?.value || ''; }
function showOv(msg) {
  const m = document.getElementById('ov-msg');
  if (m) m.textContent = msg;
  document.getElementById('overlay')?.classList.remove('hide');
}
function hideOv() { document.getElementById('overlay')?.classList.add('hide'); }
function showEl(id) { document.getElementById(id)?.classList.remove('hide'); }
function hideEl(id) { document.getElementById(id)?.classList.add('hide'); }
function tgl(id, show) { document.getElementById(id)?.classList.toggle('hide', !show); }
function showModal(title, body, btns) {
  document.getElementById('modal-box').innerHTML =
    `<div class="modal-title">${title}</div><div style="margin-bottom:18px">${body}</div><div class="btn-row">${btns}</div>`;
  document.getElementById('modal-bg')?.classList.remove('hide');
}
function closeModal() { document.getElementById('modal-bg')?.classList.add('hide'); }
function fmtMoney(n)  { return Math.round(n || 0).toLocaleString('uz-UZ') + " so'm"; }
function todayStr()   { return new Date().toISOString().split('T')[0]; }
function nowTimeStr() { return new Date().toTimeString().slice(0, 8); }
function nowTimeFromTs(ts) { return new Date(ts).toTimeString().slice(0, 8); }

// ═══ VIZIT OQIMI ═══════════════════════════════════
function startVisitFlow(type) {
  ST.visit = {
    type, target:null, gpsStart:null, gpsEnd:null,
    timerStart:null, timerRef:null, vals:{}, products:[], fotoData:null, newObjData:null,
  };
  const c = document.getElementById('visit-flow-container');
  c.innerHTML = visitFlowHTML(type);
  c.scrollIntoView({ behavior:'smooth' });
  vfShowStep(1);
}

function visitFlowHTML(type) {
  const isDoc = type === 'doctor';
  return `
  <div class="card" style="margin-top:14px;border:2px solid var(--primary3)">
    <div class="card-h">${isDoc ? '🏥 VRACH VIZITI' : '💊 DORIXONA VIZITI'}
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
      <div id="vfs1"></div><div id="vfs2" class="hide"></div>
      <div id="vfs3" class="hide"></div><div id="vfs4" class="hide"></div>
      <div id="vfs5" class="hide"></div>
    </div>
  </div>`;
}

function cancelVisitFlow() {
  if (!confirm("Vizitni bekor qilasizmi? Kiritilgan ma'lumotlar yo'qoladi.")) return;
  clearInterval(ST.visit.timerRef);
  document.getElementById('visit-flow-container').innerHTML = '';
}

function vfShowStep(n) {
  for (let i = 1; i <= 5; i++) tgl('vfs' + i, i === n);
  for (let i = 1; i <= 5; i++) {
    const c = document.getElementById('vfc' + i);
    if (!c) continue;
    c.className = 'step-chip' + (i < n ? ' done' : i === n ? ' active' : '');
  }
  if (n === 1) renderVfStep1();
  if (n === 2) renderVfStep2();
  if (n === 3) {
    renderVfStep3();
    setTimeout(() => {
      if (ST.visit.type === 'doctor') renderProductRows();
      else buildBronTable();
    }, 50);
  }
  if (n === 4) renderVfStep4();
}

// GPS (Qadam 1)
function renderVfStep1() {
  document.getElementById('vfs1').innerHTML = `
    <div class="alert alert-i">Vizitni boshlash uchun joylashuvingiz avtomatik aniqlanadi.</div>
    <div id="vf-gps-status" class="alert alert-w">GPS aniqlanmoqda...</div>
    <button class="btn btn-p btn-bl btn-lg hide" id="vf-gps-retry" onclick="vfGetGps()">Qayta urinish</button>`;
  vfGetGps();
}

function vfGetGps() {
  hideEl('vf-gps-retry');
  if (!navigator.geolocation) {
    document.getElementById('vf-gps-status').className = 'alert alert-r';
    document.getElementById('vf-gps-status').textContent = 'GPS mavjud emas';
    showEl('vf-gps-retry');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      ST.visit.gpsStart = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy) };
      document.getElementById('vf-gps-status').className = 'alert alert-ok';
      document.getElementById('vf-gps-status').textContent = 'Joylashuv aniqlandi. Davom etilmoqda...';
      setTimeout(() => vfShowStep(2), 700);
    },
    () => {
      document.getElementById('vf-gps-status').className = 'alert alert-r';
      document.getElementById('vf-gps-status').textContent = 'GPS ruxsati kerak. Sozlamalar → Joylashuv';
      showEl('vf-gps-retry');
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}
