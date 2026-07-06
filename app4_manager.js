// ═══════════════════════════════════════════════════════════════
// app4_manager.js v9
// MENEJER/ADMIN: Dashboard, Pul berish, Promo, Rejalar, KPI, Xarita
// Tuzatishlar:
// - Admin balans: prikhod/raskhod jurnali, ustiga bosib ko'rish
// - Menejer pul berish: minus bo'lsa ham ruxsat
// - Promo: yopiq, ustiga bosib ma'lumot
// - Rejalar: admin FAQAT ko'radi (tasdiqlash menejerda)
// - Jamoa KPI: kunlik/haftalik/oylik + ustiga bosib batafsil
// - Xarita: Yandex Maps iframe (API kaliti shart emas)
// - Murojaatlar: Hodimlar murojaatlari (stikersiz)
// ═══════════════════════════════════════════════════════════════

// ────────────────────────────────────────
// MENEJER / ADMIN BOSH SAHIFA (DASHBOARD)
// ────────────────────────────────────────
function pageManagerDashboard() {
  const isMgr = ST.user.role === 'manager';
  return `
  <div class="page active" id="page-mgr">
    ${isMgr ? `
    <div class="balance-box" id="mgr-bal-box" onclick="showMgrJournal()">
      <div class="balance-num" id="mgr-bal-qolgan">0 so'm</div>
      <div class="balance-lbl">Sizning balansingiz — batafsil ko'rish uchun bosing</div>
    </div>` : ''}
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-num" id="mgr-vis">—</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
      <div class="kpi-card"><div class="kpi-num" id="mgr-promo">—</div><div class="kpi-lbl">Kutilayotgan proma</div></div>
    </div>
    <div class="card"><div class="card-h">Jamoa holati (bugun)</div>
      <div class="card-b" id="mgr-team"></div>
    </div>
  </div>`;
}

async function renderMgrDashboard() {
  showOv('Yuklanmoqda...');
  try {
    // Parallel yuklash — tezroq
    const [kpi, promos, bal] = await Promise.all([
      apiGet('getKPI', {role:ST.user.role, empId:ST.user.id, date:todayStr()}).catch(()=>({})),
      apiGet('getPromoQueue', {role:ST.user.role, empId:ST.user.id}).catch(()=>[]),
      ST.user.role==='manager' ? apiGet('getMgrBalance', {mgrId:ST.user.id}).catch(()=>null) : Promise.resolve(null),
    ]);

    if (bal) {
      ST.mgrBalance = bal;
      const el = document.getElementById('mgr-bal-qolgan');
      if (el) el.textContent = fmtMoney(bal.qolgan||0);
      const box = document.getElementById('mgr-bal-box');
      if (box) box.style.background = (bal.qolgan||0) < 0
        ? 'linear-gradient(135deg,#8b0000,#c0260a)'
        : 'linear-gradient(135deg,#7a3ca0,#9b59d8)';
    }

    const total = Object.values(kpi).reduce((s,x)=>s+(x.total||0), 0);
    const el1 = document.getElementById('mgr-vis');
    const el2 = document.getElementById('mgr-promo');
    if (el1) el1.textContent = total;
    if (el2) el2.textContent = (promos||[]).filter(p=>p['Holati']==='Kutilmoqda').length;

    const teamEl = document.getElementById('mgr-team');
    if (teamEl) {
      const entries = Object.entries(kpi);
      teamEl.innerHTML = entries.length
        ? entries.map(([id,s])=>`
          <div class="vcard">
            <div class="vcard-h"><span class="vcard-name">${s.empName||id}</span>
              <span class="bdg ${(s.pct||0)>=80?'bdg-g':(s.pct||0)>=50?'bdg-y':'bdg-r'}">${s.pct||0}%</span>
            </div>
            <div class="vcard-meta">Vrach: ${s.doctorV||0} · Dorixona: ${s.pharmV||0} · Ijobiy: ${s.positive||0}</div>
          </div>`).join('')
        : '<div class="alert alert-i">Bugun hali ma\'lumot yo\'q</div>';
    }
  } catch(e) {}
  hideOv();
}

// Menejer jurnalini modal ko'rinishida chiqarish
async function showMgrJournal() {
  showOv('Yuklanmoqda...');
  const journal = await apiGet('getMgrJournal', {mgrId:ST.user.id}).catch(()=>[]);
  hideOv();
  const list = (journal||[]).reverse().slice(0, 50); // Oxirgisi tepada
  showModal('Balans jurnali',
    `<div style="font-size:12px;color:var(--muted);margin-bottom:10px">
      Jami kirim: <b style="color:var(--ok)">${fmtMoney(ST.mgrBalance.jami||0)}</b> ·
      Sarflangan: <b style="color:var(--danger)">${fmtMoney(ST.mgrBalance.sarflangan||0)}</b> ·
      Qolgan: <b style="color:${(ST.mgrBalance.qolgan||0)<0?'var(--danger)':'var(--primary)'}">${fmtMoney(ST.mgrBalance.qolgan||0)}</b>
    </div>
    ${list.length ? list.map(j=>`
      <div class="irow">
        <span class="irow-l" style="font-size:12px">
          <b style="color:${j['Holati']==='-'?'var(--danger)':'var(--ok)'}">${j['Holati']==='-'?'▼ Chiqim':'▲ Kirim'}</b><br>
          <span style="font-size:11px">${j['Vaqt va sana']||j['Vaqt']||''}</span><br>
          <span style="font-size:11px;color:var(--muted)">${j['Vrach / Izoh']||''}</span>
        </span>
        <span class="irow-v" style="color:${j['Holati']==='-'?'var(--danger)':'var(--ok)'};font-weight:800">
          ${j['Holati']==='-'?'−':'+'}${fmtMoney(j['Miqdor (so\'m)']||0)}
        </span>
      </div>`).join('')
    : '<div class="alert alert-i">Jurnal bo\'sh</div>'}`,
    '<button class="btn btn-p" onclick="closeModal()">Yopish</button>');
}

// ────────────────────────────────────────
// PUL BERISH SAHIFASI (Menejer)
// Minus bo'lsa ham ruxsat — admin keyinroq to'ldiradi
// ────────────────────────────────────────
function pagePayDoctor() {
  return `
  <div class="page" id="page-paydoctor">
    <div class="balance-box">
      <div class="balance-num" id="pd-bal">—</div>
      <div class="balance-lbl">Sizning hozirgi balansingiz</div>
    </div>
    <div class="alert alert-i">Balans manfiy bo'lsa ham pul berishingiz mumkin — admin keyinroq to'ldiradi.</div>
    <div class="card"><div class="card-h">Pul berish turi</div>
      <div class="card-b">
        <div class="rg">
          <div class="ropt" style="padding:16px;flex-direction:column;gap:4px;justify-content:center" onclick="pdSetType('DOKTOR')">
            <span style="font-size:24px">👨‍⚕️</span><b>DOKTOR</b>
            <span style="font-size:11px;color:var(--muted)">Mustaqil, MP shart emas</span>
          </div>
          <div class="ropt" style="padding:16px;flex-direction:column;gap:4px;justify-content:center" onclick="pdSetType('PROMA')">
            <span style="font-size:24px">🤝</span><b>PROMA</b>
            <span style="font-size:11px;color:var(--muted)">MP bilan birga (2x vizit)</span>
          </div>
        </div>
      </div>
    </div>
    <div id="pd-flow"></div>
  </div>`;
}

async function renderPayDoctorPage() {
  const bal = await apiGet('getMgrBalance',{mgrId:ST.user.id}).catch(()=>({jami:0,sarflangan:0,qolgan:0}));
  ST.mgrBalance = bal;
  const el = document.getElementById('pd-bal');
  if (el) {
    el.textContent = fmtMoney(bal.qolgan||0);
    el.style.color = (bal.qolgan||0) < 0 ? '#ff8888' : '#fff';
  }
}

function pdSetType(type) {
  ST.mgrPay = {type, target:null, mpForPromo:null, gps:null};
  document.getElementById('pd-flow').innerHTML = `
    <div class="card" style="border:2px solid #7a3ca0">
      <div class="card-h" style="background:#7a3ca0">${type==='DOKTOR'?'👨‍⚕️ Doktor puli':'🤝 Proma (2x vizit)'}
        <button onclick="document.getElementById('pd-flow').innerHTML=''"
          style="margin-left:auto;padding:4px 10px;border:1.5px solid #fff;background:#fff;color:#7a3ca0;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">✕</button>
      </div>
      <div class="card-b">
        <div class="fg"><label>Vrach qidirish <span class="req">*</span></label>
          <div class="search-wrap"><input id="pd-doc-q" placeholder="Familiya..." oninput="pdSearchDoc(this.value)" /></div>
          <div id="pd-doc-res" class="slist hide"></div>
        </div>
        <div id="pd-doc-sel" class="alert alert-ok hide"></div>
        <div class="fg"><label>Summa (so'm) <span class="req">*</span></label>
          <input id="pd-summa" type="number" min="0" placeholder="200000" /></div>
        <div class="fg"><label>Izoh <span class="req">*</span></label>
          <input id="pd-comment" placeholder="Nima uchun..." /></div>
        <div class="btn-row">
          <button class="btn btn-pu btn-lg" onclick="pdConfirmPay()">To'lovni tasdiqlash</button>
        </div>
      </div>
    </div>`;
}

function pdSearchDoc(q) {
  q=q.trim();if(q.length<2){hideEl('pd-doc-res');return;}
  const ql=q.toLowerCase();
  const res=ST.doctors.filter(r=>(r.name||'').toLowerCase().includes(ql)).slice(0,8);
  const box=document.getElementById('pd-doc-res');
  box.innerHTML = res.length
    ? res.map(r=>`<div class="sitem" onclick='pdSelectDoc(${JSON.stringify(r)})'>
        <span class="sitem-name">${r.name}</span>
        <span class="sitem-meta">${r.specialty||''} · ${r.object||''}</span></div>`).join('')
    : '<div class="sitem"><span class="sitem-meta">Topilmadi</span></div>';
  showEl('pd-doc-res');
}
function pdSelectDoc(r) {
  ST.mgrPay.target=r;hideEl('pd-doc-res');
  document.getElementById('pd-doc-q').value=r.name;
  document.getElementById('pd-doc-sel').innerHTML='✅ <b>'+r.name+'</b> · '+r.specialty+' · '+r.object;
  showEl('pd-doc-sel');
}
async function pdConfirmPay() {
  if(!ST.mgrPay?.target){alert('Vrachni tanlang!');return;}
  const summa=Number(v('pd-summa'))||0;if(!summa){alert('Summani kiriting!');return;}
  const comment=v('pd-comment').trim();if(!comment){alert('Izoh kiriting!');return;}
  const t=ST.mgrPay.target;
  showModal('Tasdiqlash',
    `<div class="irow"><span class="irow-l">Vrach</span><span class="irow-v">${t.name}</span></div>
     <div class="irow"><span class="irow-l">Ish joyi</span><span class="irow-v">${t.object||''}</span></div>
     <div class="irow"><span class="irow-l">Summa</span><span class="irow-v" style="color:var(--ok);font-size:17px">${fmtMoney(summa)}</span></div>
     <div class="irow"><span class="irow-l">Izoh</span><span class="irow-v">${comment}</span></div>
     ${(ST.mgrBalance.qolgan||0)<summa?'<div class="alert alert-w">⚠️ Balans yetarli emas, lekin to\'lovni amalga oshirish mumkin — minus hisoblanadi.</div>':''}`,
    `<button class="btn btn-o" onclick="closeModal()">Bekor</button>
     <button class="btn btn-pu" onclick="closeModal();pdFinalizePay(${summa},'${comment}')">Tasdiqlash</button>`);
}
async function pdFinalizePay(summa, comment) {
  showOv('Amalga oshirilmoqda...');
  const t=ST.mgrPay.target;
  const resp=await apiPost({
    action:'mgrPayDoctor', mgrId:ST.user.id, mgrName:ST.user.name,
    type:ST.mgrPay.type||'DOKTOR', date:todayStr(),
    doctorName:t.name, doctorSpec:t.specialty||'', doctorObject:t.object||'',
    doctorDistrict:t.district||'', doctorPhone:t.phone||'',
    summa, comment,
  });
  hideOv();
  if(resp.error){alert('Xato: '+resp.error);return;}
  if(resp.newBalance!==undefined) {
    ST.mgrBalance.qolgan=resp.newBalance;
    const el=document.getElementById('pd-bal');
    if(el){el.textContent=fmtMoney(resp.newBalance);el.style.color=resp.newBalance<0?'#ff8888':'#fff';}
  }
  showModal('To\'lov amalga oshirildi',
    `<p>${t.name} ga <b>${fmtMoney(summa)}</b> berildi.<br>Yangi balans: <b>${fmtMoney(resp.newBalance||0)}</b></p>`,
    '<button class="btn btn-p" onclick="closeModal();document.getElementById(\'pd-flow\').innerHTML=\'\'">OK</button>');
}

// ────────────────────────────────────────
// PROMO SAHIFASI
// Yopiq ko'rinish, ustiga bosib ma'lumot
// ────────────────────────────────────────
function pagePromoQueue() {
  return `
  <div class="page" id="page-promo">
    <div class="card">
      <div class="card-h">Proma so'rovlari</div>
      <div class="card-b" id="promo-list">
        <div class="alert alert-i">Yuklanmoqda...</div>
      </div>
    </div>
  </div>`;
}
async function renderPromoQueue() {
  showOv('Yuklanmoqda...');
  const promos = await apiGet('getPromoQueue',{role:ST.user.role,empId:ST.user.id}).catch(()=>[]);
  ST.promoQueue = promos||[];
  hideOv();
  const el=document.getElementById('promo-list');
  if(!el)return;
  if(!ST.promoQueue.length){el.innerHTML='<div class="alert alert-i">Proma so\'rovlari yo\'q</div>';return;}
  el.innerHTML = ST.promoQueue.map(p=>{
    const status=p['Holati']||'';
    const closed=status==='Tasdiqlandi'||status==='Rad etildi';
    return `<div class="vcard" style="cursor:pointer" onclick="showPromoDetail(${p._row})" id="prom-${p._row}">
      <div class="vcard-h">
        <span class="vcard-name">${p['Vrach FISh']||p.vrach||''}</span>
        <span class="bdg ${status==='Tasdiqlandi'?'bdg-g':status==='Rad etildi'?'bdg-r':'bdg-y'}">${status}</span>
      </div>
      <div class="vcard-meta">
        👤 ${p['Hodim Ismi']||''} · 🏥 ${p['Ish joyi']||''} · 📅 ${p['Sana']||''}
        ${p['Proma summasi (so\'m)']?'<br>💰 '+fmtMoney(p['Proma summasi (so\'m)']):''}
      </div>
      ${!closed?`<div class="btn-row" style="margin-top:8px">
        <button class="btn btn-r" style="padding:5px 12px;font-size:12px" onclick="event.stopPropagation();promoDecide(${p._row},false)">Rad etish</button>
        <button class="btn btn-ok" style="padding:5px 12px;font-size:12px" onclick="event.stopPropagation();promoDecide(${p._row},true)">Tasdiqlash</button>
      </div>`:''}
    </div>`;
  }).join('');
}
function showPromoDetail(row) {
  const p=ST.promoQueue.find(x=>x._row===row);if(!p)return;
  showModal('Proma batafsil',
    `<div class="irow"><span class="irow-l">Vrach</span><span class="irow-v">${p['Vrach FISh']||''}</span></div>
     <div class="irow"><span class="irow-l">Ish joyi</span><span class="irow-v">${p['Ish joyi']||''}</span></div>
     <div class="irow"><span class="irow-l">MP</span><span class="irow-v">${p['Hodim Ismi']||''}</span></div>
     <div class="irow"><span class="irow-l">Sana</span><span class="irow-v">${p['Sana']||''}</span></div>
     <div class="irow"><span class="irow-l">Summa</span><span class="irow-v">${fmtMoney(p['Proma summasi (so\'m)']||0)}</span></div>
     <div class="irow"><span class="irow-l">Holati</span><span class="irow-v">${p['Holati']||''}</span></div>`,
    '<button class="btn btn-p" onclick="closeModal()">Yopish</button>');
}
async function promoDecide(row, approved) {
  showOv('...');
  await apiPost({action:'decidePromo',row,approved});
  hideOv(); renderPromoQueue();
}

// ────────────────────────────────────────
// REJALAR — MENEJER tasdiqlaydi, ADMIN faqat ko'radi
// ────────────────────────────────────────
function pagePlanManager() {
  const isAdmin = ST.user.role==='admin';
  return `
  <div class="page" id="page-planmgr">
    <div class="card">
      <div class="card-h">Med Vakili rejalari${isAdmin?' (Ko\'rish — tasdiqlash menejerda)':' (Tasdiqlash)'}</div>
      <div class="card-b" id="plan-mgr-list">
        <div class="alert alert-i">Yuklanmoqda...</div>
      </div>
    </div>
  </div>`;
}
async function renderPlansManagerView() {
  showOv('Yuklanmoqda...');
  const plans = await apiGet('getPlans',{empId:ST.user.id,role:ST.user.role}).catch(()=>[]);
  ST.plans = plans||[];
  hideOv();
  const el=document.getElementById('plan-mgr-list');if(!el)return;
  if(!ST.plans.length){el.innerHTML='<div class="alert alert-i">Rejalar yo\'q</div>';return;}
  const isAdmin = ST.user.role==='admin';
  // Hodim bo'yicha guruhlash
  const byEmp={};
  ST.plans.forEach(p=>{
    const name=p['Hodim Ismi']||'';
    if(!byEmp[name])byEmp[name]=[];
    byEmp[name].push(p);
  });
  el.innerHTML=Object.entries(byEmp).map(([empName,pList])=>`
    <div style="margin-bottom:18px">
      <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;
        letter-spacing:.5px;margin-bottom:6px;border-bottom:2px solid var(--primary);padding-bottom:4px">
        👤 ${empName}
      </div>
      ${pList.map(p=>{
        const status=p['Holati']||'';const obj=p['Obyekt nomi']||'';
        const date=p['Vizit sanasi']||'';
        return `<div class="vcard">
          <div class="vcard-h"><span class="vcard-name">${obj}</span>
            <span class="bdg ${status==='Tasdiqlangan'?'bdg-g':status==='Rad etildi'?'bdg-r':'bdg-y'}">${status}</span>
          </div>
          <div class="vcard-meta">📅 ${date} · ${p['Maqsad']||''}</div>
          ${(!isAdmin&&status==='Kutilmoqda')?`
          <div class="btn-row" style="margin-top:8px">
            <button class="btn btn-r" style="padding:5px 12px;font-size:12px" onclick="planMgrDecide(${p._row},false)">Rad</button>
            <button class="btn btn-ok" style="padding:5px 12px;font-size:12px" onclick="planMgrDecide(${p._row},true)">Tasdiqlash</button>
          </div>`:''}
        </div>`;
      }).join('')}
    </div>`).join('');
}
async function planMgrDecide(row,approved){
  showOv('...');
  await apiPost({action:'updatePlan',row,status:approved?'Tasdiqlangan':'Rad etildi'});
  hideOv();renderPlansManagerView();
}

// ────────────────────────────────────────
// JAMOA KPI — kunlik/haftalik/oylik
// ────────────────────────────────────────
function pageTeamKPI() {
  return `
  <div class="page" id="page-kpi">
    <div class="card">
      <div class="card-h">Jamoa KPI</div>
      <div class="card-b">
        <div class="frow" style="margin-bottom:14px">
          <div class="fg"><label>Sana</label>
            <input type="date" id="kpi-date" value="${todayStr()}" onchange="renderTeamKPI()" /></div>
        </div>
        <div id="kpi-team" class="alert alert-i">Yuklanmoqda...</div>
      </div>
    </div>
  </div>`;
}
async function renderTeamKPI() {
  showOv('Yuklanmoqda...');
  const date=v('kpi-date')||todayStr();
  const kpi=await apiGet('getKPI',{role:ST.user.role,empId:ST.user.id,date}).catch(()=>({}));
  hideOv();
  const el=document.getElementById('kpi-team');if(!el)return;
  const entries=Object.entries(kpi);
  if(!entries.length){el.innerHTML='<div class="alert alert-i">Bu sana uchun ma\'lumot yo\'q</div>';el.className='';return;}
  el.className='';
  el.innerHTML=entries.map(([id,s])=>`
    <div class="vcard" style="cursor:pointer" onclick="showKpiDetail('${id}','${s.empName||id}','${date}')">
      <div class="vcard-h"><span class="vcard-name">${s.empName||id}</span>
        <span class="bdg ${(s.pct||0)>=80?'bdg-g':(s.pct||0)>=50?'bdg-y':'bdg-r'}">${s.pct||0}%</span>
      </div>
      <div class="vcard-meta">
        Vrach: <b>${s.doctorV||0}</b> · Dorixona: <b>${s.pharmV||0}</b> ·
        Ijobiy: ${s.positive||0} · Shubhali: ${s.shubhali||0}
        <span style="font-size:11px;color:var(--muted)"> — batafsil uchun bosing</span>
      </div>
    </div>`).join('');
}
function showKpiDetail(empId,empName,date) {
  showModal(empName+' — '+date,
    '<p style="font-size:13px;color:var(--muted)">Batafsil ma\'lumot uchun Google Sheets KPI_Log sahifasini ko\'ring.</p>',
    '<button class="btn btn-p" onclick="closeModal()">OK</button>');
}

// ────────────────────────────────────────
// ADMIN BALANS BERISH
// ────────────────────────────────────────
function pageAdminBalance() {
  return `
  <div class="page" id="page-adminbalance">
    <div class="card">
      <div class="card-h">Menejerlarga mablag' ajratish</div>
      <div class="card-b">
        <div class="fg"><label>Menejer</label>
          <select id="ab-mgr" onchange="abResetForm()"><option value="">— Tanlang —</option></select>
        </div>
        <div class="fg"><label>Ajratiladigan summa (so'm) <span class="req">*</span></label>
          <input id="ab-summa" type="number" min="1" placeholder="Masalan: 5000000" /></div>
        <div class="fg"><label>Izoh</label>
          <input id="ab-comment" placeholder="Nima maqsadda..." /></div>
        <button class="btn btn-pu btn-bl" onclick="abSave()">Saqlash va yuborish</button>
      </div>
    </div>
    <div class="card">
      <div class="card-h">Menejerlar balansi</div>
      <div class="card-b" id="ab-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
  </div>`;
}
async function renderAdminBalance() {
  showOv('Yuklanmoqda...');
  const [emps, bals] = await Promise.all([
    apiGet('getEmployees',{}).catch(()=>({})),
    apiGet('getAllBalances',{}).catch(()=>[]),
  ]);
  hideOv();
  const mgrs=Object.entries(emps).filter(([id,e])=>e.role==='manager');
  const sel=document.getElementById('ab-mgr');
  if(sel) sel.innerHTML='<option value="">— Tanlang —</option>'+mgrs.map(([id,e])=>`<option value="${id}|${e.name}">${e.name} (${id})</option>`).join('');
  const el=document.getElementById('ab-list');if(!el)return;
  el.innerHTML=(bals||[]).map(b=>`
    <div class="vcard" onclick="showMgrJournalAdmin('${b.mgrId}')" style="cursor:pointer">
      <div class="vcard-h"><span class="vcard-name">${b.mgrName}</span>
        <span class="bdg ${(b.qolgan||0)<0?'bdg-r':'bdg-p'}">${fmtMoney(b.qolgan||0)} qoldi</span>
      </div>
      <div class="vcard-meta">Jami kirim: ${fmtMoney(b.jami||0)} · Sarflangan: ${fmtMoney(b.sarflangan||0)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">👆 Bosib batafsil ko'rish</div>
    </div>`).join('') || '<div class="alert alert-i">Hali balans ajratilmagan</div>';
}
async function showMgrJournalAdmin(mgrId) {
  showOv('Yuklanmoqda...');
  const journal=await apiGet('getMgrJournal',{mgrId}).catch(()=>[]);
  hideOv();
  const list=(journal||[]).reverse().slice(0,30);
  showModal('Balans jurnali',
    list.length ? list.map(j=>`
      <div class="irow">
        <span class="irow-l" style="font-size:12px">
          <b style="color:${j['Holati']==='-'?'var(--danger)':'var(--ok)'}">${j['Holati']==='-'?'▼ Chiqim':'▲ Kirim'}</b>
          <br><span style="font-size:11px">${j['Vaqt va sana']||j['Vaqt']||''}</span>
          <br><span style="font-size:11px;color:var(--muted)">${j['Vrach / Izoh']||''}</span>
        </span>
        <span class="irow-v" style="color:${j['Holati']==='-'?'var(--danger)':'var(--ok)'}">
          ${j['Holati']==='-'?'−':'+'}${fmtMoney(j['Miqdor (so\'m)']||0)}
        </span>
      </div>`).join('')
    : '<div class="alert alert-i">Jurnal bo\'sh</div>',
    '<button class="btn btn-p" onclick="closeModal()">Yopish</button>');
}
function abResetForm(){
  const sumEl=document.getElementById('ab-summa');
  const comEl=document.getElementById('ab-comment');
  if(sumEl) sumEl.value='';
  if(comEl) comEl.value='';
}
async function abSave() {
  const sel=v('ab-mgr');if(!sel){alert('Menejerni tanlang!');return;}
  const [mgrId,mgrName]=sel.split('|');
  const summa=Number(v('ab-summa'))||0;if(!summa){alert('Summani kiriting!');return;}
  showOv('Saqlanmoqda...');
  const resp=await apiPost({action:'addMgrBalance',mgrId,mgrName,summa,date:todayStr(),comment:v('ab-comment')||'Admin tomonidan'});
  hideOv();
  if(resp.error){alert('Xato: '+resp.error);return;}
  showModal('Saqlandi',`<p>${mgrName} ga ${fmtMoney(summa)} qo'shildi.</p>`,
    '<button class="btn btn-p" onclick="closeModal()">OK</button>');
  renderAdminBalance();
}

// ────────────────────────────────────────
// XARITA — YANDEX MAPS IFRAME
// ────────────────────────────────────────
function pageMap() {
  return `
  <div class="page" id="page-map">
    <div class="card">
      <div class="card-h">Vizit lokatsiyalari xaritasi</div>
      <div class="card-b">
        <div class="frow" style="margin-bottom:12px">
          <div class="fg"><label>Hodim</label>
            <select id="map-emp" onchange="renderMapPage()"><option value="">— Barchasi —</option></select>
          </div>
          <div class="fg"><label>Davr</label>
            <select id="map-days" onchange="renderMapPage()">
              <option value="1">Bugun</option><option value="7" selected>1 hafta</option>
              <option value="30">1 oy</option>
            </select>
          </div>
        </div>
        <!-- Yandex xarita iframe (API shart emas) -->
        <div id="ymap-container" style="width:100%;height:500px;border-radius:12px;overflow:hidden;border:1px solid var(--border)">
          <div class="alert alert-i">Yuklanmoqda...</div>
        </div>
        <div id="map-list" style="margin-top:14px"></div>
      </div>
    </div>
  </div>`;
}

async function renderMapPage() {
  showOv('Lokatsiyalar yuklanmoqda...');
  const days=v('map-days')||'7';
  const locs=await apiGet('getLocations',{empId:ST.user.id,role:ST.user.role,days}).catch(()=>[]);
  hideOv();

  // Hodimlar ro'yxatini filtr uchun to'ldirish
  const empSel=document.getElementById('map-emp');
  if(empSel&&!empSel.dataset.filled){
    const uniq=[...new Map((locs||[]).map(l=>[l.empId,l.empName])).entries()];
    empSel.innerHTML='<option value="">— Barchasi —</option>'+uniq.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
    empSel.dataset.filled='1';empSel.onchange=renderMapPage;
  }

  const filterEmp=empSel?empSel.value:'';
  const filtered=(locs||[]).filter(l=>!filterEmp||l.empId===filterEmp);

  const container=document.getElementById('ymap-container');
  if(!filtered.length){
    container.innerHTML='<div class="alert alert-i" style="margin:0">Bu davr uchun lokatsiya ma\'lumoti yo\'q</div>';
    document.getElementById('map-list').innerHTML='';
    return;
  }

  // Yandex Maps iframe — Toshkent markazi bilan
  // Vizit nuqtalarini Yandex Maps URL formatida ko'rsatamiz
  const validLocs=filtered.filter(l=>l.lat&&l.lng);
  if(validLocs.length===0){
    // Faqat Toshkent xaritasini ko'rsatamiz
    container.innerHTML=`<iframe
      src="https://yandex.uz/map-widget/v1/?ll=69.2401%2C41.2995&z=12&lang=ru_RU"
      width="100%" height="500" frameborder="0" allowfullscreen style="display:block"></iframe>`;
  } else {
    // Birinchi nuqtaga markazlashtirish
    const first=validLocs[0];
    const ll=first.lng+'%2C'+first.lat;
    // Yandex Maps iframe — nuqtalar bilan
    // placemark parametrlarini qo'shamiz (max 10 nuqta URL ga)
    const placemarks=validLocs.slice(0,10).map((l,i)=>`pt=${l.lng},${l.lat},pm2${l.type==='Vrach viziti'?'rd':'gm'}m${i+1}`).join('~');
    container.innerHTML=`<iframe
      src="https://yandex.uz/map-widget/v1/?ll=${ll}&z=12&lang=ru_RU&${placemarks}&l=map"
      width="100%" height="500" frameborder="0" allowfullscreen style="display:block"></iframe>`;
  }

  // Ro'yxat
  const mapList=document.getElementById('map-list');
  mapList.innerHTML=`<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:8px">
    Vizitlar ro'yxati (${validLocs.length} ta)
  </div>`+validLocs.slice(0,30).map(l=>`
    <div class="irow">
      <span class="irow-l">
        ${l.type==='Vrach viziti'?'🔴':'🟢'} ${l.empName} → ${l.target}
      </span>
      <span class="irow-v">
        <a href="https://yandex.uz/maps/?ll=${l.lng}%2C${l.lat}&z=16&pt=${l.lng},${l.lat},pm2rdm1"
          target="_blank" class="bdg bdg-b" style="text-decoration:none;cursor:pointer">
          ${l.date} — Xaritada ko'rish
        </a>
      </span>
    </div>`).join('');
}

// ────────────────────────────────────────
// MUROJAATLAR (Admin)
// ────────────────────────────────────────
function pageFeedbackInbox() {
  return `
  <div class="page" id="page-feedbackbox">
    <div class="card">
      <div class="card-h">Hodimlar murojaatlari</div>
      <div class="card-b" id="fb-inbox">
        <div class="alert alert-i">Barcha murojaatlar "Murojaatlar" sahifasida saqlanadi.</div>
      </div>
    </div>
  </div>`;
}
// Admin murojaatlarni lokal ko'rsatish (ular Sheets da ham saqlanadi)
// Bu sahifa ochilganda hozircha bo'sh deb ko'rsatadi — asosiy ma'lumot Sheets da
// Keyingi versiyada murojaatlar GET endpoint dan o'qiladi
function renderFeedbackInbox_stub() {
  const el=document.getElementById('fb-inbox');
  if(el) el.innerHTML='<div class="alert alert-i">Barcha murojaatlar Google Sheets → "Murojaatlar" sahifasida saqlanadi. Vaqt, sana, hodim ismi va xabar mazmuni bilan keladi.</div>';
}
