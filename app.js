// ╔════════════════════════════════════════════════════════════════╗
// ║  app.js — CONFIG, AUTH (1 marta kirilsa eslab qoladi), NAV       ║
// ╚════════════════════════════════════════════════════════════════╝

const CFG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwQmrdnDNJNaxiTX4iZ2qpReeuWC6dYvlr_uRzeHY9LCZ9AD26dl3uxoNW9DD_e9fcb9w/exec',   // ★★★ Apps Script deploy URL shu yerga (QOLLANMA.md da ko'rsatilgan)
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
  user: null, doctors: [], pharmacies: [], plans: [], promoQueue: [], todayVisits: [],
  mgrBalance: { jami:0, sarflangan:0, qolgan:0 },
  visit: { type:null, target:null, gpsStart:null, gpsEnd:null, timerStart:null, timerRef:null,
           vals:{}, products:[], fotoData:null, newObjData:null },
  mgrPay: { type:null, target:null, mpForPromo:null, gps:null, timerStart:null, timerRef:null },
};

// ── OFLAYN NAVBAT ──
function queueSave(d) { const q=JSON.parse(localStorage.getItem('ff_q')||'[]'); q.push({...d,_t:Date.now()}); localStorage.setItem('ff_q',JSON.stringify(q)); }
async function flushQueue() {
  if (!navigator.onLine || !CFG.SCRIPT_URL) return;
  const q = JSON.parse(localStorage.getItem('ff_q')||'[]'); if (!q.length) return;
  const failed=[];
  for (const item of q) { try { await apiPost(item); } catch(e){ failed.push(item); } }
  localStorage.setItem('ff_q', JSON.stringify(failed));
}
window.addEventListener('online', ()=>{document.getElementById('offline-bar').style.display='none';flushQueue();});
window.addEventListener('offline', ()=>{document.getElementById('offline-bar').style.display='block';});

// ── API ──
async function apiGet(action, params) {
  if (!CFG.SCRIPT_URL) throw new Error('SCRIPT_URL yo\'q');
  const qs = new URLSearchParams({action,...params}).toString();
  const r = await fetch(`${CFG.SCRIPT_URL}?${qs}`);
  return r.json();
}
async function apiPost(d) {
  if (!CFG.SCRIPT_URL) { queueSave(d); return {status:'queued'}; }
  await fetch(CFG.SCRIPT_URL, {method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
  return {status:'sent'};
}

// ── LOGIN (haqiqiy server orqali, parol tekshiriladi) ──
async function doLogin() {
  const id=v('l-id').trim().toUpperCase(), pass=v('l-pass').trim();
  if (!id||!pass) { showLoginErr('ID va parolni kiriting'); return; }
  showOv('Tekshirilmoqda...');

  let result = null;
  if (CFG.SCRIPT_URL) {
    try { result = await apiGet('checkLoginGet', { id, pass }); }
    catch(e) { result = null; }
  }
  if (!result || result.status !== 'ok') result = demoLogin(id, pass);

  hideOv();
  if (!result || result.status!=='ok') { showLoginErr('Login yoki parol noto\'g\'ri'); return; }

  ST.user = { id, name:result.name, role:result.role, region:result.region||'Toshkent shahri', mgrId:result.mgrId||'' };

  // ★ "1 marta kirilsa saqlab qoladigan" — har doim eslab qoladi (logout bosilmagunicha)
  localStorage.setItem('ff_user', JSON.stringify(ST.user));
  enterApp();
}

function demoLogin(id, pass) {
  // SCRIPT_URL sozlanmagan holatda sinov uchun (productionda ishlatilmaydi)
  const demo = {
    'ADMIN':{name:'Administrator',role:'admin',pass:'admin123',region:'Toshkent shahri'},
  };
  const e = demo[id];
  if (!e||e.pass!==pass) return {status:'error'};
  return {status:'ok',name:e.name,role:e.role,region:e.region};
}

function showLoginErr(msg){ const el=document.getElementById('l-err'); el.textContent=msg; el.classList.remove('hide'); }

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('l-id')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  document.getElementById('l-pass')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});

  // ★★★ AVTOMATIK KIRISH — agar oldin login qilingan bo'lsa, login
  // sahifasi umuman ko'rsatilmaydi, to'g'ridan-to'g'ri ichkariga kiradi
  const saved = JSON.parse(localStorage.getItem('ff_user')||'null');
  if (saved) { ST.user=saved; enterApp(); }
});

function logout(){ if(!confirm('Tizimdan chiqasizmi? Keyingi safar qayta login/parol kiritishingiz kerak bo\'ladi.'))return; localStorage.removeItem('ff_user'); location.reload(); }

// ── ROL ASOSIDA MENYU — har bir rol FAQAT o'ziga tegishli narsalarni ko'radi ──
const ROLE_LABELS = {admin:'Administrator',manager:'Bo\'lim boshlig\'i',mp:'Med. Vakil',ta:'Torgovoy Agent'};

const NAV_BY_ROLE = {
  // Med. Vakil — faqat Doktor va Dorixona vizit (ikkalasi ham), Reja
  mp: [['home','🏠','Bosh sahifa'],['plan','📋','Reja'],['endday','📊','Kun yakuni'],['feedback','💬','Murojaat']],
  // Torgovoy Agent — FAQAT dorixona (vrach umuman ko'rinmaydi)
  ta: [['home','🏠','Bosh sahifa'],['endday','📊','Kun yakuni'],['feedback','💬','Murojaat']],
  // Menejer — faqat o'ziga tegishli: boshqaruv, pul berish, promo, o'z MP rejalari, jamoa KPI, xarita
  manager: [['mgr','👔','Boshqaruv'],['paydoctor','💰','Pul berish'],['promo','🎁','Promo'],['planmgr','📋','MP rejalari'],['kpi','📈','Jamoa KPI'],['map','🗺️','Xarita']],
  // Admin — hammasini ko'radi
  admin: [['mgr','👔','Boshqaruv'],['adminbalance','🏦','Menejer balans'],['promo','🎁','Promo'],['planmgr','📋','Rejalar'],['kpi','📈','Jamoa KPI'],['map','🗺️','Xarita'],['newobj','🆕','Yangi obyekt'],['feedbackbox','💬','Murojaatlar']],
};

function enterApp() {
  document.getElementById('pg-login').classList.add('hide');
  document.getElementById('app').classList.remove('hide');
  document.getElementById('hdr-name').textContent = ST.user.name;
  document.getElementById('hdr-role').textContent = ROLE_LABELS[ST.user.role]||ST.user.role;
  buildNav(); buildAllPages(); initData();
}
function buildNav() {
  const nav = document.getElementById('main-nav');
  const items = NAV_BY_ROLE[ST.user.role]||NAV_BY_ROLE.mp;
  nav.innerHTML = items.map((it,i)=>`<div class="nav-tab ${i===0?'active':''}" data-p="${it[0]}" onclick="showPage('${it[0]}')">${it[1]} ${it[2]}</div>`).join('');
}
function showPage(p) {
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p)?.classList.add('active');
  document.querySelector(`.nav-tab[data-p="${p}"]`)?.classList.add('active');
  if (p==='plan') renderPlans();
  if (p==='endday') renderEndDay();
  if (p==='mgr') renderMgrDashboard();
  if (p==='promo') renderPromoQueue();
  if (p==='kpi') renderTeamKPI();
  if (p==='planmgr') renderPlansManagerView();
  if (p==='paydoctor') renderPayDoctorPage();
  if (p==='adminbalance') renderAdminBalance();
  if (p==='map') renderMapPage();
}

// ── MA'LUMOT YUKLASH (rolga qarab faqat kerakli baza yuklanadi) ──
async function initData() {
  showOv('Ma\'lumotlar yuklanmoqda...');
  try {
    const role = ST.user.role;
    // Faqat MP, Menejer, Admin uchun vrach bazasi yuklanadi (TA uchun YO'Q)
    if (role==='mp'||role==='admin'||role==='manager') {
      ST.doctors = await apiGet('getDoctors',{}).catch(()=>[]);
      if (ST.doctors.error) ST.doctors = [];
    }
    // Faqat TA va Admin uchun apteka bazasi (MP ga umuman kerak emas)
    if (role==='ta'||role==='admin') {
      ST.pharmacies = await apiGet('getPharmacies',{}).catch(()=>[]);
      if (ST.pharmacies.error) ST.pharmacies = [];
    }
    ST.plans = await apiGet('getPlans',{empId:ST.user.id,role:ST.user.role}).catch(()=>[]);
    if (role==='manager') {
      ST.mgrBalance = await apiGet('getMgrBalance',{mgrId:ST.user.id}).catch(()=>({jami:0,sarflangan:0,qolgan:0}));
    }
    localStorage.setItem('ff_doc_cache', JSON.stringify(ST.doctors));
    localStorage.setItem('ff_pharm_cache', JSON.stringify(ST.pharmacies));
  } catch(e) {
    ST.doctors = JSON.parse(localStorage.getItem('ff_doc_cache')||'[]');
    ST.pharmacies = JSON.parse(localStorage.getItem('ff_pharm_cache')||'[]');
  }
  hideOv(); flushQueue();
  if (document.getElementById('page-home')) renderHome();
}

// ── UI HELPERS ──
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
