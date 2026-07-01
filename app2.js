// ╔════════════════════════════════════════════════════════════════╗
// ║  app2.js — SAHIFALARNI QURISH + BOSH SAHIFA                      ║
// ╚════════════════════════════════════════════════════════════════╝

function buildAllPages() {
  const role = ST.user.role;
  const c = document.getElementById('pages-container');
  let html = '';

  if (role==='mp') { html += pageHomeMP(); html += pagePlan(); html += pageEndDay(); html += pageFeedback(); }
  if (role==='ta') { html += pageHomeTA(); html += pageEndDay(); html += pageFeedback(); }
  if (role==='manager') {
    html += pageManagerDashboard(); html += pagePayDoctor(); html += pagePromoQueue();
    html += pagePlanManager(); html += pageTeamKPI(); html += pageMap();
  }
  if (role==='admin') {
    html += pageManagerDashboard(); html += pageAdminBalance(); html += pagePromoQueue();
    html += pagePlanManager(); html += pageTeamKPI(); html += pageMap();
    html += pageNewObjects(); html += pageFeedbackInbox();
  }
  c.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════
// MP — BOSH SAHIFA
// ════════════════════════════════════════════════════════════════
function pageHomeMP() {
  return `
  <div class="page active" id="page-home">
    <div class="card"><div class="card-b" style="text-align:center;padding:24px 17px">
      <div style="font-size:13px;color:var(--muted);text-transform:uppercase;margin-bottom:4px" id="home-date"></div>
      <div style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:14px" id="home-name"></div>
      <div class="kpi-grid" style="margin-bottom:0">
        <div class="kpi-card"><div class="kpi-num" id="home-done">0</div><div class="kpi-lbl">Bugun vizit</div></div>
        <div class="kpi-card"><div class="kpi-num" id="home-plan">0</div><div class="kpi-lbl">Reja</div></div>
      </div>
    </div></div>
    <div class="card">
      <div class="card-h">🚀 Yangi vizit boshlash</div>
      <div class="card-b">
        <div class="alert alert-i">Vizit turini tanlang. Adashib boshqasini bossangiz, "Orqaga" tugmasi orqali qaytishingiz mumkin.</div>
        <div class="rg">
          <div class="ropt" style="padding:18px;flex-direction:column;gap:6px" onclick="startVisitFlow('doctor')">
            <span style="font-size:28px">🏥</span><span>VRACH VIZITI</span></div>
          <div class="ropt" style="padding:18px;flex-direction:column;gap:6px" onclick="warnPharmacyForMP()">
            <span style="font-size:28px">💊</span><span>DORIXONA</span></div>
        </div>
      </div>
    </div>
    <div id="visit-flow-container"></div>
  </div>`;
}

function warnPharmacyForMP() {
  showModal('Diqqat', `<p style="font-size:14px;line-height:1.6">MP odatda vrach vizit qiladi. Agar dorixona vizitini boshlamoqchi bo'lsangiz davom eting, aks holda bekor qiling.</p>`,
    `<button class="btn btn-o" onclick="closeModal()">Bekor</button>
     <button class="btn btn-p" onclick="closeModal();startVisitFlow('pharmacy')">Davom etish</button>`);
}

// ════════════════════════════════════════════════════════════════
// TA — BOSH SAHIFA (faqat dorixona)
// ════════════════════════════════════════════════════════════════
function pageHomeTA() {
  return `
  <div class="page active" id="page-home">
    <div class="card"><div class="card-b" style="text-align:center;padding:24px 17px">
      <div style="font-size:13px;color:var(--muted);text-transform:uppercase;margin-bottom:4px" id="home-date"></div>
      <div style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:14px" id="home-name"></div>
      <div class="kpi-grid" style="margin-bottom:0">
        <div class="kpi-card"><div class="kpi-num" id="home-done">0</div><div class="kpi-lbl">Bugun vizit</div></div>
        <div class="kpi-card"><div class="kpi-num" id="home-pct">0%</div><div class="kpi-lbl">25 ta = 100%</div></div>
      </div>
    </div></div>
    <div class="card"><div class="card-h">🚀 Dorixona vizitini boshlash</div>
      <div class="card-b"><button class="btn btn-p btn-bl btn-lg" onclick="startVisitFlow('pharmacy')">💊 Boshlash</button></div></div>
    <div id="visit-flow-container"></div>
  </div>`;
}

function renderHome() {
  const dateEl = document.getElementById('home-date');
  if (!dateEl) return;
  dateEl.textContent = new Date().toLocaleDateString('uz-UZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  document.getElementById('home-name').textContent = '👋 '+ST.user.name;
  document.getElementById('home-done').textContent = ST.todayVisits.length;
  if (ST.user.role==='mp') {
    const todayPlans = ST.plans.filter(p=>p.date===todayStr());
    document.getElementById('home-plan').textContent = todayPlans.length;
  } else if (ST.user.role==='ta') {
    const pct = Math.round(ST.todayVisits.length/25*100);
    document.getElementById('home-pct').textContent = pct+'%';
  }
}

// ════════════════════════════════════════════════════════════════
// VIZIT JARAYONI BOSHLASH (umumiy strukturasi)
// ════════════════════════════════════════════════════════════════
function startVisitFlow(type) {
  ST.visit = { type, target:null, gpsStart:null, gpsEnd:null, timerStart:null, timerRef:null,
               vals:{}, products:[], fotoData:null, newObjData:null };
  const c = document.getElementById('visit-flow-container');
  c.innerHTML = visitFlowHTML(type);
  c.scrollIntoView({behavior:'smooth'});
  vfShowStep(1);
}
function visitFlowHTML(type) {
  const isDoc = type==='doctor';
  return `
  <div class="card" style="margin-top:14px;border:2px solid var(--primary3)">
    <div class="card-h">${isDoc?'🏥 VRACH VIZITI':'💊 DORIXONA VIZITI'}
      <button class="btn btn-o" style="margin-left:auto;padding:4px 10px;font-size:11px" onclick="cancelVisitFlow()">✕ Bekor</button></div>
    <div class="card-b">
      <div class="steps-bar" id="vf-steps">
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
function cancelVisitFlow() {
  if (!confirm('Vizitni bekor qilasizmi?')) return;
  clearInterval(ST.visit.timerRef);
  document.getElementById('visit-flow-container').innerHTML='';
}
function vfShowStep(n) {
  for (let i=1;i<=5;i++) tgl('vfs'+i, i===n);
  for (let i=1;i<=5;i++) { const c=document.getElementById('vfc'+i); if(!c)continue; c.className='step-chip'+(i<n?' done':i===n?' active':''); }
  if (n===1) renderVfStep1();
  if (n===2) renderVfStep2();
  if (n===3) { renderVfStep3(); setTimeout(()=>{ if(ST.visit.type==='doctor') renderProductRows(); else buildStockTableRows(); },50); }
  if (n===4) renderVfStep4();
}

// ── QADAM 1: GPS (fonda, MP/TP ko'rmaydi koordinatalarni) ──
function renderVfStep1() {
  document.getElementById('vfs1').innerHTML = `
    <div class="alert alert-i">📍 Vizitni boshlash uchun lokatsiyangiz avtomatik aniqlanadi.</div>
    <div id="vf-gps-status" class="alert alert-w">📡 GPS aniqlanmoqda...</div>
    <button class="btn btn-p btn-bl btn-lg hide" id="vf-gps-retry" onclick="vfGetGps()">📍 Qayta urinish</button>`;
  vfGetGps();
}
function vfGetGps() {
  hideEl('vf-gps-retry');
  if (!navigator.geolocation) {
    document.getElementById('vf-gps-status').className='alert alert-r';
    document.getElementById('vf-gps-status').textContent='❌ GPS mavjud emas'; showEl('vf-gps-retry'); return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      ST.visit.gpsStart = {lat:pos.coords.latitude,lng:pos.coords.longitude,acc:Math.round(pos.coords.accuracy)};
      document.getElementById('vf-gps-status').className='alert alert-ok';
      document.getElementById('vf-gps-status').textContent='✅ Lokatsiya aniqlandi. Davom etilmoqda...';
      setTimeout(()=>vfShowStep(2),700);
    },
    err => {
      document.getElementById('vf-gps-status').className='alert alert-r';
      document.getElementById('vf-gps-status').textContent='❌ GPS ruxsati kerak. Sozlamalar → Joylashuv.';
      showEl('vf-gps-retry');
    }, {enableHighAccuracy:true,timeout:20000,maximumAge:0});
}
