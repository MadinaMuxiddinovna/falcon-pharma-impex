// ╔════════════════════════════════════════════════════════════════╗
// ║  app4_manager.js — MENEJER: BOSHQARUV, PUL BERISH, PROMO,        ║
// ║  ADMIN: BALANS BERISH                                            ║
// ╚════════════════════════════════════════════════════════════════╝

// ════════════════════════════════════════════════════════════════
// MENEJER BOSHQARUV PANELI
// ════════════════════════════════════════════════════════════════
function pageManagerDashboard() {
  return `
  <div class="page active" id="page-mgr">
    ${ST.user.role==='manager' ? `
    <div class="balance-box">
      <div class="balance-num" id="mgr-bal-qolgan">0 so'm</div>
      <div class="balance-lbl">Sizning qolgan balansingiz</div>
    </div>` : ''}
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-num" id="mgr-total-visits">0</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
      <div class="kpi-card"><div class="kpi-num" id="mgr-pending-promo">0</div><div class="kpi-lbl">Kutilayotgan promo</div></div>
    </div>
    <div class="card"><div class="card-h">👥 Jamoa holati (bugun)</div><div class="card-b" id="mgr-team-status"></div></div>
  </div>`;
}

async function renderMgrDashboard() {
  showOv('Yuklanmoqda...');
  try {
    const kpi = await apiGet('getKPI',{role:ST.user.role,empId:ST.user.id});
    const total = Object.values(kpi).reduce((s,x)=>s+(x.total||0),0);
    document.getElementById('mgr-total-visits').textContent = total;
    const el = document.getElementById('mgr-team-status');
    el.innerHTML = Object.entries(kpi).map(([id,s])=>`
      <div class="vcard"><div class="vcard-h"><span class="vcard-name">${s.empName||id}</span>
        <span class="bdg ${s.pct>=80?'bdg-g':s.pct>=50?'bdg-y':'bdg-r'}">${s.pct||0}%</span></div>
      <div class="vcard-meta">Vrach: ${s.doctorV||0} · Apteka: ${s.pharmV||0} · Ijobiy: ${s.positive||0}</div></div>`).join('')
      || '<div class="alert alert-i">Bugun ma\'lumot yo\'q</div>';
  } catch(e){}
  try {
    const promos = await apiGet('getPromoQueue',{role:ST.user.role,empId:ST.user.id});
    const pending = (promos||[]).filter(p=>p.status==='Kutilmoqda');
    document.getElementById('mgr-pending-promo').textContent = pending.length;
  } catch(e){}
  if (ST.user.role==='manager') {
    try {
      ST.mgrBalance = await apiGet('getMgrBalance',{mgrId:ST.user.id});
      document.getElementById('mgr-bal-qolgan').textContent = fmtMoney(ST.mgrBalance.qolgan||0);
    } catch(e){}
  }
  hideOv();
}

// ════════════════════════════════════════════════════════════════
// MENEJER — PUL BERISH SAHIFASI
// DOKTOR | PROMA ikki rejim
// ════════════════════════════════════════════════════════════════
function pagePayDoctor() {
  return `
  <div class="page" id="page-paydoctor">
    <div class="balance-box">
      <div class="balance-num" id="pd-bal">0 so'm</div>
      <div class="balance-lbl">Qolgan balans</div>
    </div>
    <div class="card"><div class="card-h">💰 Pul berish turi</div>
      <div class="card-b">
        <div class="rg">
          <div class="ropt" style="padding:18px;flex-direction:column;gap:6px" onclick="pdSetType('DOKTOR')">
            <span style="font-size:26px">👨‍⚕️</span><span>DOKTOR</span>
            <span style="font-size:11px;color:var(--muted);font-weight:400">O'zingiz mustaqil</span></div>
          <div class="ropt" style="padding:18px;flex-direction:column;gap:6px" onclick="pdSetType('PROMO')">
            <span style="font-size:26px">🤝</span><span>PROMA</span>
            <span style="font-size:11px;color:var(--muted);font-weight:400">MP bilan birga (2x vizit)</span></div>
        </div>
      </div></div>
    <div id="pd-flow-container"></div>
  </div>`;
}

async function renderPayDoctorPage() {
  ST.mgrBalance = await apiGet('getMgrBalance',{mgrId:ST.user.id}).catch(()=>({jami:0,sarflangan:0,qolgan:0}));
  document.getElementById('pd-bal').textContent = fmtMoney(ST.mgrBalance.qolgan||0);
}

function pdSetType(type) {
  ST.mgrPay = { type, target:null, mpForPromo:null, gps:null, timerStart:null, timerRef:null };
  const c = document.getElementById('pd-flow-container');
  c.innerHTML = pdFlowHTML(type);
  c.scrollIntoView({behavior:'smooth'});
  pdShowStep(1);
}

function pdFlowHTML(type) {
  return `
  <div class="card" style="margin-top:14px;border:2px solid #7a3ca0">
    <div class="card-h" style="background:#7a3ca0">${type==='DOKTOR'?'👨‍⚕️ DOKTOR — Mustaqil to\'lov':'🤝 PROMA — 2x vizit'}
      <button class="btn btn-o" style="margin-left:auto;padding:4px 10px;font-size:11px;background:#fff" onclick="document.getElementById('pd-flow-container').innerHTML=''">✕</button></div>
    <div class="card-b">
      <div id="pds1"></div><div id="pds2" class="hide"></div><div id="pds3" class="hide"></div>
    </div></div>`;
}

function pdShowStep(n) {
  for (let i=1;i<=3;i++) tgl('pds'+i, i===n);
  if (n===1) pdRenderStep1();
  if (n===2) pdRenderStep2();
}

// ── QADAM 1: Menejer GPS + (PROMO bo'lsa) MP tanlash ──
function pdRenderStep1() {
  const isPromo = ST.mgrPay.type === 'PROMO';
  document.getElementById('pds1').innerHTML = `
    <div class="alert alert-i">📍 Sizning lokatsiyangiz avtomatik aniqlanadi.</div>
    <div id="pd-gps-status" class="alert alert-w">📡 GPS aniqlanmoqda...</div>
    ${isPromo ? `
    <div class="fg hide" id="pd-mp-select-block">
      <label>Promo so'ragan MP ni tanlang <span class="req">*</span></label>
      <select id="pd-mp-select" onchange="pdSelectMP(this.value)">
        <option value="">— Tanlang —</option>
      </select>
    </div>` : ''}
    <button class="btn btn-p btn-bl btn-lg hide" id="pd-next1" onclick="pdGoStep2()" disabled>Davom etish →</button>`;
  pdGetGps();
}

async function pdGetGps() {
  navigator.geolocation.getCurrentPosition(
    async pos => {
      ST.mgrPay.gps = {lat:pos.coords.latitude,lng:pos.coords.longitude,acc:Math.round(pos.coords.accuracy)};
      document.getElementById('pd-gps-status').className='alert alert-ok';
      document.getElementById('pd-gps-status').textContent='✅ Lokatsiya aniqlandi';
      showEl('pd-next1');
      if (ST.mgrPay.type==='PROMO') {
        showEl('pd-mp-select-block');
        const promos = await apiGet('getPromoQueue',{role:'manager',empId:ST.user.id}).catch(()=>[]);
        const pending = (promos||[]).filter(p=>p.status==='Kutilmoqda');
        const sel = document.getElementById('pd-mp-select');
        sel.innerHTML = '<option value="">— Tanlang —</option>' + pending.map(p=>
          `<option value='${JSON.stringify(p).replace(/'/g,"&apos;")}'>${p.empName} → ${p.doctorName} (${p.sana})</option>`).join('');
        if (!pending.length) {
          document.getElementById('pd-mp-select-block').innerHTML = '<div class="alert alert-w">Hozircha kutilayotgan promo so\'rovi yo\'q</div>';
        }
      } else {
        document.getElementById('pd-next1').disabled = false;
      }
    },
    () => { document.getElementById('pd-gps-status').className='alert alert-r'; document.getElementById('pd-gps-status').textContent='❌ GPS ruxsati kerak'; },
    {enableHighAccuracy:true,timeout:20000});
}
function pdSelectMP(val) {
  if (!val) { document.getElementById('pd-next1').disabled=true; return; }
  ST.mgrPay.mpForPromo = JSON.parse(val.replace(/&apos;/g,"'"));
  document.getElementById('pd-next1').disabled = false;
}
function pdGoStep2() { pdShowStep(2); }

// ── QADAM 2: Vrach tanlash (DOKTOR rejimida o'zi qidiradi, PROMO da MP tanlagan vrach avtomatik) ──
function pdRenderStep2() {
  if (ST.mgrPay.type==='PROMO' && ST.mgrPay.mpForPromo) {
    const mp = ST.mgrPay.mpForPromo;
    document.getElementById('pds2').innerHTML = `
      <div class="alert alert-ok">✅ Vrach (MP so'rovidan): <b>${mp.doctorName}</b> · ${mp.doctorObject}</div>
      <div class="fg"><label>Summasi (so'm) <span class="req">*</span></label>
        <input id="pd-summa" type="number" min="0" placeholder="200000" oninput="pdShowSummaPreview()" /></div>
      <div id="pd-summa-preview" class="alert alert-i hide"></div>
      <div class="fg"><label>Komentariya <span class="req">*</span></label><textarea id="pd-comment" rows="3" placeholder="Izoh..."></textarea></div>
      <div class="btn-row"><button class="btn btn-o" onclick="pdShowStep(1)">← Orqaga</button>
        <button class="btn btn-purple btn-lg" onclick="pdConfirmPay()">💰 To'lovni amalga oshirish</button></div>`;
    ST.mgrPay.target = { name:mp.doctorName, object:mp.doctorObject, specialty:'', district:'', phone:'' };
  } else {
    document.getElementById('pds2').innerHTML = `
      <div class="fg"><label>Vrach qidirish (2-3 harf) <span class="req">*</span></label>
        <div class="search-wrap"><input id="pd-doc-q" placeholder="Familiya..." oninput="pdSearchDoc(this.value)" /></div>
        <div id="pd-doc-res" class="slist hide"></div></div>
      <div id="pd-doc-sel" class="alert alert-ok hide"></div>
      <div class="fg"><label>Summasi (so'm) <span class="req">*</span></label>
        <input id="pd-summa" type="number" min="0" placeholder="200000" oninput="pdShowSummaPreview()" /></div>
      <div id="pd-summa-preview" class="alert alert-i hide"></div>
      <div class="fg"><label>Komentariya <span class="req">*</span></label><textarea id="pd-comment" rows="3" placeholder="Izoh..."></textarea></div>
      <div class="btn-row"><button class="btn btn-o" onclick="pdShowStep(1)">← Orqaga</button>
        <button class="btn btn-purple btn-lg" onclick="pdConfirmPay()">💰 To'lovni amalga oshirish</button></div>`;
  }
}
function pdSearchDoc(q) {
  q=q.trim(); if(q.length<2){hideEl('pd-doc-res');return;}
  const ql=q.toLowerCase();
  const res = ST.doctors.filter(r=>(r.name||'').toLowerCase().includes(ql)).slice(0,8);
  document.getElementById('pd-doc-res').innerHTML = res.map(r=>`
    <div class="sitem" onclick='pdSelectDoc(${JSON.stringify(r)})'>
      <span class="sitem-name">${r.name}</span><span class="sitem-meta">${r.specialty} · ${r.object} · ${r.district}</span></div>`).join('');
  showEl('pd-doc-res');
}
function pdSelectDoc(r) {
  ST.mgrPay.target = r; hideEl('pd-doc-res');
  document.getElementById('pd-doc-q').value = r.name;
  document.getElementById('pd-doc-sel').innerHTML = `✅ ${r.name} · ${r.specialty} · ${r.object} · ${r.district} · ${r.phone}`;
  showEl('pd-doc-sel');
}
function pdShowSummaPreview() {
  const summa = Number(v('pd-summa'))||0;
  const t = ST.mgrPay.target;
  const el = document.getElementById('pd-summa-preview');
  if (summa && t) {
    el.innerHTML = `<b>${t.name}</b> ${t.specialty?'· '+t.specialty:''} ${t.object?'· '+t.object:''}<br>
      <span style="font-size:18px;font-weight:800;color:var(--ok)">${fmtMoney(summa)}</span> berildi`;
    showEl(el.id);
  } else hideEl(el.id);
}

async function pdConfirmPay() {
  const summa = Number(v('pd-summa'))||0;
  if (!ST.mgrPay.target) { alert('Vrachni tanlang!'); return; }
  if (!summa) { alert('Summani kiriting!'); return; }
  if (!v('pd-comment').trim()) { alert('Komentariya majburiy!'); return; }
  if (summa > ST.mgrBalance.qolgan) { alert('Balansda yetarli mablag\' yo\'q! Qolgan: '+fmtMoney(ST.mgrBalance.qolgan)); return; }

  showModal('Tasdiqlash',
    `<div class="irow"><span class="irow-l">Vrach</span><span class="irow-v">${ST.mgrPay.target.name}</span></div>
     <div class="irow"><span class="irow-l">Ob'ekt</span><span class="irow-v">${ST.mgrPay.target.object||''}</span></div>
     <div class="irow"><span class="irow-l">Tur</span><span class="irow-v">${ST.mgrPay.type}</span></div>
     ${ST.mgrPay.type==='PROMO'?`<div class="irow"><span class="irow-l">MP</span><span class="irow-v">${ST.mgrPay.mpForPromo.empName}</span></div>`:''}
     <div class="irow"><span class="irow-l">Summa</span><span class="irow-v" style="color:var(--ok);font-size:17px">${fmtMoney(summa)}</span></div>
     <p style="margin-top:10px;font-size:13px;color:var(--muted)">Tasdiqlaysizmi?</p>`,
    `<button class="btn btn-o" onclick="closeModal()">← Bekor</button>
     <button class="btn btn-purple" onclick="pdFinalizePay(${summa})">✅ Ha, tasdiqlash</button>`);
}

async function pdFinalizePay(summa) {
  closeModal();
  showOv('To\'lov amalga oshirilmoqda...');
  const t = ST.mgrPay.target;

  const payload = {
    action:'mgrPayDoctor', mgrId:ST.user.id, mgrName:ST.user.name, type:ST.mgrPay.type,
    date: todayStr(), doctorName:t.name, doctorSpec:t.specialty||'', doctorObject:t.object||'',
    doctorDistrict:t.district||'', doctorPhone:t.phone||'',
    summa, comment: v('pd-comment'),
    mgrStart: nowTimeStr(), mgrEnd: nowTimeStr(),
    mgrLat: ST.mgrPay.gps?.lat, mgrLng: ST.mgrPay.gps?.lng,
  };
  if (ST.mgrPay.type==='PROMO' && ST.mgrPay.mpForPromo) {
    payload.mpId = ST.mgrPay.mpForPromo.empId;
    payload.mpName = ST.mgrPay.mpForPromo.empName;
    // MP lokatsiyasi — promo so'rovida saqlanmagan, shuning uchun bu yerda
    // ideal holatda MP o'z vizitidagi GPS ni yuborgan bo'lishi kerak.
    // Soddalashtirish: agar mavjud bo'lsa oxirgi MP vizit lokatsiyasidan foydalaniladi (backend tomonidan).
    payload.mpLat = ST.mgrPay.mpForPromo.mpLat || '';
    payload.mpLng = ST.mgrPay.mpForPromo.mpLng || '';
  }

  const resp = await apiPost(payload);
  hideOv();

  if (resp.error) { showModal('❌ Xato', `<p>${resp.error}</p>`, `<button class="btn btn-p" onclick="closeModal()">OK</button>`); return; }

  ST.mgrBalance.qolgan -= summa;
  ST.mgrBalance.sarflangan = (ST.mgrBalance.sarflangan||0) + summa;
  document.getElementById('pd-bal').textContent = fmtMoney(ST.mgrBalance.qolgan);

  let statusMsg = '';
  if (ST.mgrPay.type==='PROMO') {
    statusMsg = resp.holat==='Dvoynoy vizit' ?
      '<div class="alert alert-ok">✅ Dvoynoy vizit tasdiqlandi (lokatsiyalar mos)</div>' :
      '<div class="alert alert-r">⚠️ Dvoynoy vizit EMAS deb belgilandi (lokatsiyalar mos kelmadi yoki MP lokatsiyasi yo\'q)</div>';
  }

  showModal('✅ To\'lov amalga oshirildi',
    `<p style="font-size:14px;line-height:1.6">${t.name} ga <b>${fmtMoney(summa)}</b> berildi.</p>${statusMsg}`,
    `<button class="btn btn-p" onclick="closeModal();document.getElementById('pd-flow-container').innerHTML=''">OK</button>`);
}

// ════════════════════════════════════════════════════════════════
// PROMO NAVBATI — Menejer ko'radi, lekin endi PUL BERISH orqali
// hal qilinadi (pdSetType('PROMO')). Bu sahifa faqat ko'rish uchun.
// ════════════════════════════════════════════════════════════════
function pagePromoQueue() {
  return `
  <div class="page" id="page-promo">
    <div class="card"><div class="card-h">🎁 Promo so'rovlari (MP yuborgan)</div>
      <div class="card-b" id="promo-list">
        <div class="alert alert-i">Promo so'rovini tasdiqlash uchun "💰 Pul berish" → "PROMA" bo'limidan foydalaning. Bu yerda faqat ko'rish.</div>
      </div></div>
  </div>`;
}
async function renderPromoQueue() {
  showOv('Yuklanmoqda...');
  const promos = await apiGet('getPromoQueue',{role:ST.user.role,empId:ST.user.id}).catch(()=>[]);
  ST.promoQueue = promos||[];
  hideOv();
  const el = document.getElementById('promo-list');
  const listHtml = ST.promoQueue.map(p=>`
    <div class="vcard"><div class="vcard-h"><span class="vcard-name">${p.doctorName}</span>
      <span class="bdg ${p.status==='Tasdiqlandi'?'bdg-g':p.status==='Rad etildi'?'bdg-r':'bdg-y'}">${p.status}</span></div>
    <div class="vcard-meta">👤 ${p.empName} · 🏥 ${p.doctorObject} · 📅 ${p.sana}${p.izoh?'<br>📝 '+p.izoh:''}</div></div>`).join('');
  el.innerHTML = `<div class="alert alert-i">Tasdiqlash uchun "💰 Pul berish" → "PROMA" bo'limiga o'ting.</div>` + (listHtml||'<div class="alert alert-i">Promo so\'rovlari yo\'q</div>');
}

// ════════════════════════════════════════════════════════════════
// ADMIN — MENEJERLARGA BALANS BERISH
// ════════════════════════════════════════════════════════════════
function pageAdminBalance() {
  return `
  <div class="page" id="page-adminbalance">
    <div class="card"><div class="card-h">🏦 Menejerlarga mablag' ajratish</div>
      <div class="card-b">
        <div class="fg"><label>Menejer</label><select id="ab-mgr-select"><option value="">— Yuklanmoqda... —</option></select></div>
        <div class="fg"><label>Jami ajratiladigan summa (so'm)</label><input id="ab-summa" type="number" min="0" placeholder="5000000" /></div>
        <button class="btn btn-purple btn-bl" onclick="abSetBalance()">💾 Saqlash</button>
      </div></div>
    <div class="card"><div class="card-h">📊 Menejerlar balansi</div><div class="card-b" id="ab-balance-list"></div></div>
  </div>`;
}
async function renderAdminBalance() {
  showOv('Yuklanmoqda...');
  const emps = await apiGet('getEmployees',{}).catch(()=>({}));
  const mgrs = Object.entries(emps).filter(([id,e])=>e.role==='manager');
  const sel = document.getElementById('ab-mgr-select');
  sel.innerHTML = '<option value="">— Tanlang —</option>' + mgrs.map(([id,e])=>`<option value="${id}|${e.name}">${e.name} (${id})</option>`).join('');

  const el = document.getElementById('ab-balance-list');
  el.innerHTML = '';
  for (const [id,e] of mgrs) {
    const bal = await apiGet('getMgrBalance',{mgrId:id}).catch(()=>({jami:0,sarflangan:0,qolgan:0}));
    el.innerHTML += `<div class="vcard"><div class="vcard-h"><span class="vcard-name">${e.name}</span>
      <span class="bdg bdg-p">${fmtMoney(bal.qolgan)} qoldi</span></div>
      <div class="vcard-meta">Jami: ${fmtMoney(bal.jami)} · Sarflangan: ${fmtMoney(bal.sarflangan)}</div></div>`;
  }
  hideOv();
}
async function abSetBalance() {
  const sel = v('ab-mgr-select'); if (!sel) { alert('Menejerni tanlang!'); return; }
  const [mgrId, mgrName] = sel.split('|');
  const summa = Number(v('ab-summa'))||0;
  if (!summa) { alert('Summani kiriting!'); return; }
  showOv('Saqlanmoqda...');
  await apiPost({action:'setMgrBalance', mgrId, mgrName, summa});
  hideOv();
  showModal('✅ Saqlandi', `<p>${mgrName} ga ${fmtMoney(summa)} ajratildi.</p>`, `<button class="btn btn-p" onclick="closeModal()">OK</button>`);
  renderAdminBalance();
}

// ════════════════════════════════════════════════════════════════
// MENEJER REJALARI KO'RINISHI (admin/menejer)
// ════════════════════════════════════════════════════════════════
function pagePlanManager() {
  return `<div class="page" id="page-planmgr">
    <div class="card"><div class="card-h">📋 MP rejalari (tasdiqlash)</div><div class="card-b" id="plan-mgr-list"></div></div>
  </div>`;
}
async function renderPlansManagerView() {
  showOv('Yuklanmoqda...');
  const plans = await apiGet('getPlans',{empId:ST.user.id,role:ST.user.role}).catch(()=>[]);
  ST.plans = plans||[];
  hideOv();
  const el = document.getElementById('plan-mgr-list');
  const pending = ST.plans.filter(p=>p.status==='Kutilmoqda');
  if (!pending.length) { el.innerHTML='<div class="alert alert-ok">✅ Barcha rejalar tasdiqlangan</div>'; return; }
  el.innerHTML = pending.map(p=>`
    <div class="vcard"><div class="vcard-h"><span class="vcard-name">${p.targetName}</span>
      <span class="bdg bdg-y">Kutilmoqda</span></div>
    <div class="vcard-meta">👤 ${p.empName} · 🏥 ${p.targetObject||''} · 📅 ${p.date} · 🎯 ${p.goal}
      <div class="btn-row" style="margin-top:8px">
        <button class="btn btn-r" style="padding:5px 12px;font-size:12px" onclick="planMgrReject(${p._row})">❌ Rad</button>
        <button class="btn btn-ok" style="padding:5px 12px;font-size:12px" onclick="planMgrApprove(${p._row})">✅ Tasdiqlash</button>
      </div></div></div>`).join('');
}
async function planMgrApprove(row) { showOv('...'); await apiPost({action:'updatePlan',row,status:'Tasdiqlangan'}); hideOv(); renderPlansManagerView(); }
async function planMgrReject(row) { showOv('...'); await apiPost({action:'updatePlan',row,status:'Rad etildi'}); hideOv(); renderPlansManagerView(); }

// ════════════════════════════════════════════════════════════════
// JAMOA KPI
// ════════════════════════════════════════════════════════════════
function pageTeamKPI() {
  return `<div class="page" id="page-kpi">
    <div class="card"><div class="card-h">📈 Jamoa KPI</div>
      <div class="card-b"><div class="fg"><label>Sana</label><input type="date" id="kpi-date" value="${todayStr()}" onchange="renderTeamKPI()" /></div>
        <div id="kpi-team-list"></div></div></div>
  </div>`;
}
async function renderTeamKPI() {
  showOv('Yuklanmoqda...');
  const date = v('kpi-date')||todayStr();
  const kpi = await apiGet('getKPI',{role:ST.user.role,empId:ST.user.id,date}).catch(()=>({}));
  hideOv();
  const el = document.getElementById('kpi-team-list');
  const entries = Object.entries(kpi);
  if (!entries.length) { el.innerHTML='<div class="alert alert-i">Ma\'lumot yo\'q</div>'; return; }
  el.innerHTML = entries.map(([id,s])=>`
    <div class="vcard"><div class="vcard-h"><span class="vcard-name">${s.empName||id}</span>
      <span class="bdg ${s.pct>=80?'bdg-g':s.pct>=50?'bdg-y':'bdg-r'}">${s.pct||0}%</span></div>
    <div class="vcard-meta">Vrach: <b>${s.doctorV||0}</b> · Apteka: <b>${s.pharmV||0}</b> · Ijobiy: ${s.positive||0}</div></div>`).join('');
}

// ════════════════════════════════════════════════════════════════
// YANGI OBYEKTLAR (Admin)
// ════════════════════════════════════════════════════════════════
function pageNewObjects() {
  return `<div class="page" id="page-newobj">
    <div class="card"><div class="card-h">🆕 Yangi qo'shilgan vrach/dorixonalar</div>
      <div class="card-b"><div class="alert alert-i">Bu obyektlar daladan qo'shilgan. Google Sheets dagi "Yangi_Vrachlar" va "Yangi_Aptekalar" sahifalarini ko'rib, asosiy bazaga qo'lda ko'chiring.</div></div></div>
  </div>`;
}
function pageFeedbackInbox() {
  return `<div class="page" id="page-feedbackbox">
    <div class="card"><div class="card-h">💬 Hodimlar murojaatlari</div>
      <div class="card-b"><div class="alert alert-i">Google Sheets "Murojaatlar" sahifasida to'liq ro'yxat (kim yuborganini ham ko'rasiz).</div></div></div>
  </div>`;
}
