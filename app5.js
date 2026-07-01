// ╔════════════════════════════════════════════════════════════════╗
// ║  app5.js — FOTO, YAKUNLASH, REJA, KUN YAKUNI                    ║
// ╚════════════════════════════════════════════════════════════════╝

// ── QADAM 4: FOTO (faqat kamera) ──
function renderVfStep4() {
  document.getElementById('vfs4').innerHTML = `
    <div class="alert alert-r">🚫 Faqat KAMERA orqali rasm oling! Galereyadan tanlash bloklangan.</div>
    <div class="foto-box" id="vf-foto-box" onclick="vfTakeFoto()">
      <div id="vf-foto-ph"><div style="font-size:42px">📷</div>
        <div style="margin-top:8px;font-weight:600">Kamerani ochish uchun bosing</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">
          ${ST.visit.type==='doctor'?'Vrach xonasi eshigi':'Dorixona ichi yoki tashqi ko\'rinishi'}</div></div>
      <img id="vf-foto-img" class="hide" alt="vizit foto" /></div>
    <input type="file" id="vf-foto-input" accept="image/*" capture="environment" class="hide" onchange="vfOnFoto(event)" />
    <button class="btn btn-p btn-bl" style="margin-top:12px" onclick="vfTakeFoto()">📷 Kamerani ochish</button>
    <div class="btn-row">
      <button class="btn btn-o" onclick="vfShowStep(3)">← Orqaga</button>
      <button class="btn btn-ok btn-lg" onclick="vfFinishVisit()">✅ Vizitni yakunlash</button></div>`;
}
function vfTakeFoto(){ document.getElementById('vf-foto-input').click(); }
function vfOnFoto(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX=1280; let w=img.width,h=img.height;
      if (w>MAX){h=Math.round(h*MAX/w);w=MAX;}
      if (h>MAX){w=Math.round(w*MAX/h);h=MAX;}
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      ST.visit.fotoData = canvas.toDataURL('image/jpeg',0.72);
      document.getElementById('vf-foto-img').src = ST.visit.fotoData;
      document.getElementById('vf-foto-img').classList.remove('hide');
      document.getElementById('vf-foto-ph').classList.add('hide');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ── VIZITNI YAKUNLASH ──
async function vfFinishVisit() {
  if (!ST.visit.fotoData) { alert('Rasm olish majburiy!'); return; }

  await new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => { ST.visit.gpsEnd = {lat:pos.coords.latitude,lng:pos.coords.longitude,acc:Math.round(pos.coords.accuracy)}; resolve(); },
      () => resolve(), {enableHighAccuracy:true,timeout:10000});
  });

  // Filial raqamini bazaga saqlash (keyingi safar so'ramaslik uchun)
  await vfSaveBranchToBase();

  showOv('Vizit saqlanmoqda...');
  const duration = Math.floor((Date.now()-ST.visit.timerStart)/1000);
  const ref = 'FF-'+Date.now();
  const isDoc = ST.visit.type==='doctor';

  let promoId = '';
  if (isDoc && ST.visit.vals.promoRequested) {
    const pr = await apiPost({action:'requestPromo', empId:ST.user.id, empName:ST.user.name, mgrId:ST.user.mgrId,
      doctorName:ST.visit.target.name, doctorObject:ST.visit.target.object, date:todayStr(), izoh:v('vf-promo-note')});
    promoId = pr.promoId||'';
  }

  let resp;
  if (isDoc) {
    resp = await apiPost({
      action:'addVisitMP', ref, date:todayStr(), empId:ST.user.id, empName:ST.user.name,
      region:ST.user.region, mgrId:ST.user.mgrId,
      doctorName:ST.visit.target.name, doctorSpec:ST.visit.target.specialty, doctorObject:ST.visit.target.object,
      doctorDistrict:ST.visit.target.district, doctorCategory:ST.visit.target.category, doctorPhone:ST.visit.target.phone,
      goal:ST.visit.vals.goal, goalOther:v('vf-goal-other'),
      products: ST.visit.products.filter(p=>p.name),
      sampleRequested: ST.visit.vals.sample==='Ha',
      result:ST.visit.vals.result, resultOther:v('vf-result-other'),
      promoRequested: !!ST.visit.vals.promoRequested, promoId,
      nextVisitDate:v('vf-next-date'), comment:v('vf-comment'),
      visitStartTime:nowTimeFromTs(ST.visit.timerStart), visitEndTime:nowTimeStr(), durationSec:duration,
      gpsStart:ST.visit.gpsStart, gpsEnd:ST.visit.gpsEnd, gpsAcc:ST.visit.gpsEnd?.acc||ST.visit.gpsStart?.acc||9999,
      fotoBase64: ST.visit.fotoData,
    });
  } else {
    const {bron, stock} = getBronAndStockData();
    resp = await apiPost({
      action:'addVisitTA', ref, date:todayStr(), empId:ST.user.id, empName:ST.user.name,
      region:ST.visit.target.region, district:ST.visit.target.district,
      pharmInn:ST.visit.target.inn, pharmName:ST.visit.target.legalName,
      branchNo: ST.visit.vals.branchNo||'Yo\'q', isNewPharmacy: !!ST.visit.target._isNew,
      bron, stock, comment:v('vf-comment'),
      visitStartTime:nowTimeFromTs(ST.visit.timerStart), visitEndTime:nowTimeStr(), durationSec:duration,
      gpsStart:ST.visit.gpsStart, gpsEnd:ST.visit.gpsEnd, gpsAcc:ST.visit.gpsEnd?.acc||ST.visit.gpsStart?.acc||9999,
      fotoBase64: ST.visit.fotoData,
    });
  }

  ST.todayVisits.push({ref, type:ST.visit.type, target:isDoc?ST.visit.target.name:ST.visit.target.legalName, result:ST.visit.vals.result||'OK'});
  hideOv(); vfShowStep(5); renderVfStep5(resp, isDoc, duration);
}

function renderVfStep5(resp, isDoc, duration) {
  const fake = resp?.fake;
  document.getElementById('vfs5').innerHTML = `
    <div class="success-scr">
      <div class="success-icon">${fake?'⚠️':'🎉'}</div>
      <div class="success-title" style="${fake?'color:var(--danger)':''}">${fake?'Vizit saqlandi (shubhali)':'Vizit muvaffaqiyatli saqlandi!'}</div>
      <div class="success-sub">${navigator.onLine?'Google Sheets\'ga yuborildi':'Oflayn saqlandi'}</div>
      ${fake?`<div class="alert alert-r" style="text-align:left">⚠️ Bu ma'lumot faqat Google Sheets'da ko'rinadi (sizga ko'rinmaydi)</div>`:''}
      <div class="alert alert-ok" style="text-align:left">📋 Davomiylik: ${Math.floor(duration/60)} daqiqa ${duration%60} soniya<br>🕐 ${new Date().toLocaleTimeString('uz-UZ')}</div>
      ${isDoc?`<div class="alert alert-i">📅 Bu vrachga 1 haftadan keyin avtomatik reja tushirildi.</div>`:''}
      <div class="btn-row" style="justify-content:center;margin-top:16px">
        <button class="btn btn-p btn-lg" onclick="vfNextVisit()">➡️ Keyingi vizit</button>
        <button class="btn btn-o" onclick="document.getElementById('visit-flow-container').innerHTML='';renderHome()">🏠 Bosh sahifa</button></div>
    </div>`;
}
function vfNextVisit(){ startVisitFlow(ST.visit.type); }

// ════════════════════════════════════════════════════════════════
// REJA — FAQAT MP UCHUN (oylik/haftalik/kunlik)
// MP tuzadi -> Menejerga yuboriladi -> Menejer tasdiqlaydi/o'zgartiradi
// ════════════════════════════════════════════════════════════════
function pagePlan() {
  return `
  <div class="page" id="page-plan">
    <div class="card"><div class="card-h">📋 Mening rejam (vrach vizitlari)</div>
      <div class="card-b">
        <div class="frow3" style="margin-bottom:14px">
          <div class="ropt on" onclick="setPlanFilter(this,'day')">Kunlik</div>
          <div class="ropt" onclick="setPlanFilter(this,'week')">Haftalik</div>
          <div class="ropt" onclick="setPlanFilter(this,'month')">Oylik</div></div>
        <div id="plan-list"></div>
        <button class="btn btn-p btn-bl" style="margin-top:12px" onclick="toggleAddPlanForm()">➕ Yangi reja qo'shish</button>
      </div></div>
    <div class="card hide" id="add-plan-card"><div class="card-h">➕ Yangi reja (obyekt bo'yicha)</div>
      <div class="card-b">
        <div class="fg"><label>Sana</label><input type="date" id="ap-date" value="${todayStr()}" /></div>
        <div class="fg"><label>Vrach qidirish</label>
          <div class="search-wrap"><input id="ap-search" placeholder="2-3 harf..." oninput="apSearchTarget(this.value)" /></div>
          <div id="ap-search-res" class="slist hide"></div></div>
        <div id="ap-selected" class="alert alert-ok hide"></div>
        <div class="fg"><label>Maqsad</label><input id="ap-goal" placeholder="Tanishuv, eslatish..." /></div>
        <div class="btn-row"><button class="btn btn-o" onclick="toggleAddPlanForm()">Bekor</button>
          <button class="btn btn-p" onclick="savePlan()">Menejerga yuborish</button></div>
      </div></div>
  </div>`;
}
let planFilter='day', apTarget=null;
function setPlanFilter(el,f) {
  document.querySelectorAll('#page-plan .frow3 .ropt').forEach(e=>e.classList.remove('on'));
  el.classList.add('on'); planFilter=f; renderPlans();
}
function toggleAddPlanForm(){ document.getElementById('add-plan-card').classList.toggle('hide'); }
function apSearchTarget(q) {
  q=q.trim(); if(q.length<2){hideEl('ap-search-res');return;}
  const ql=q.toLowerCase();
  const res = ST.doctors.filter(r=>(r.name||'').toLowerCase().includes(ql)||(r.object||'').toLowerCase().includes(ql)).slice(0,8);
  document.getElementById('ap-search-res').innerHTML = res.map(r=>`
    <div class="sitem" onclick='apSelectTarget(${JSON.stringify(r)})'>
      <span class="sitem-name">${r.name}</span><span class="sitem-meta">${r.specialty} · ${r.object}</span></div>`).join('');
  showEl('ap-search-res');
}
function apSelectTarget(r) {
  apTarget = r; hideEl('ap-search-res');
  document.getElementById('ap-search').value = r.name;
  document.getElementById('ap-selected').innerHTML = `✅ ${r.name} · ${r.object}`;
  showEl('ap-selected');
}
function renderPlans() {
  const el = document.getElementById('plan-list'); if(!el)return;
  const today=todayStr();
  let list;
  if (planFilter==='day') list = ST.plans.filter(p=>p.date===today);
  else if (planFilter==='week') { const w=new Date();w.setDate(w.getDate()+7); list=ST.plans.filter(p=>p.date>=today&&p.date<=w.toISOString().split('T')[0]); }
  else { const m=new Date();m.setMonth(m.getMonth()+1); list=ST.plans.filter(p=>p.date>=today&&p.date<=m.toISOString().split('T')[0]); }
  if (!list.length) { el.innerHTML='<div class="alert alert-i">Reja topilmadi</div>'; return; }
  el.innerHTML = list.map(p=>`
    <div class="vcard"><div class="vcard-h"><span class="vcard-name">${p.targetName}</span>
      <span class="bdg ${p.status==='Tasdiqlangan'?'bdg-g':'bdg-y'}">${p.status}</span></div>
    <div class="vcard-meta">🏥 ${p.targetObject||''} · 📅 ${p.date} · 🎯 ${p.goal}</div></div>`).join('');
}
async function savePlan() {
  if (!apTarget) { alert('Vrachni tanlang!'); return; }
  const plan = { action:'addPlan', empId:ST.user.id, empName:ST.user.name, mgrId:ST.user.mgrId, type:'doctor',
    targetName:apTarget.name, targetObject:apTarget.object, date:v('ap-date'), goal:v('ap-goal')||'Umumiy',
    status:'Kutilmoqda', createdAt:new Date().toISOString() };
  showOv('Menejerga yuborilmoqda...');
  await apiPost(plan); ST.plans.push(plan); hideOv(); toggleAddPlanForm(); renderPlans();
  showModal('✅ Yuborildi', '<p>Reja menejeringizga yuborildi. U tasdiqlaganda statusi yangilanadi.</p>', `<button class="btn btn-p" onclick="closeModal()">OK</button>`);
}

// ════════════════════════════════════════════════════════════════
// KUN YAKUNI — KPI
// MP: vrach vizitlari soni / norma (admin belgilaydi)
// TA: 25 ta apteka = 100%
// ════════════════════════════════════════════════════════════════
function pageEndDay() {
  const isTA = ST.user.role==='ta';
  return `
  <div class="page" id="page-endday">
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-num" id="ed-done">0</div><div class="kpi-lbl">Bajarilgan vizit</div></div>
      <div class="kpi-card"><div class="kpi-num" id="ed-pct">0%</div><div class="kpi-lbl">${isTA?'25 ta = 100%':'KPI bajarilish'}</div></div>
    </div>
    <div class="card"><div class="card-h">📋 Bugungi vizitlar</div><div class="card-b" id="ed-list"></div></div>
    <div class="card"><div class="card-b">
      <div class="alert alert-w">⚠️ Kunni yakunlasangiz, hisobotingiz menejerga yuboriladi.</div>
      <button class="btn btn-ok btn-bl btn-lg" onclick="confirmEndDay()">🏁 Kunni yakunlash</button></div></div>
  </div>`;
}
function renderEndDay() {
  const done = ST.todayVisits.length;
  const isTA = ST.user.role==='ta';
  const pct = isTA ? Math.round(done/25*100) : Math.round(done/12*100); // admin sozlaydigan norma
  document.getElementById('ed-done').textContent = done;
  document.getElementById('ed-pct').textContent = Math.min(pct,999)+'%';
  const el = document.getElementById('ed-list');
  el.innerHTML = done ? ST.todayVisits.map(v=>`<div class="irow"><span class="irow-l">${v.type==='doctor'?'🏥':'💊'} ${v.target}</span>
    <span class="irow-v"><span class="bdg bdg-g">${v.result||'OK'}</span></span></div>`).join('') : '<div class="alert alert-i">Bugun hali vizit yo\'q</div>';
}
function confirmEndDay() {
  showModal('Kunni yakunlash', `<p style="font-size:14px;line-height:1.6">Kunni yakunlaysizmi? Hali vizit qilish kerak bo'lsa "Davom etish" bosing.</p>`,
    `<button class="btn btn-p" onclick="closeModal()">↩️ Davom etish</button>
     <button class="btn btn-ok" onclick="closeModal();doEndDay()">✅ Ha, yakunlash</button>`);
}
async function doEndDay() {
  showOv('Yakunlanmoqda...');
  await apiPost({action:'endDay',empId:ST.user.id,empName:ST.user.name,role:ST.user.role,date:todayStr()});
  hideOv();
  showModal('✅ Kun yakunlandi', '<p>Hisobotingiz menejerga yuborildi. Yaxshi dam oling!</p>', `<button class="btn btn-p" onclick="closeModal()">OK</button>`);
}

// ════════════════════════════════════════════════════════════════
// MUROJAAT
// ════════════════════════════════════════════════════════════════
function pageFeedback() {
  return `
  <div class="page" id="page-feedback">
    <div class="card"><div class="card-h">💬 Taklif va shikoyatlaringizni qoldiring</div>
      <div class="card-b">
        <div class="alert alert-i">Xabaringiz to'g'ridan-to'g'ri rahbariyatga yuboriladi. Tasdiq sifatida "anonim qabul qilindi" ko'rasiz (lekin kim ekanligi adminda saqlanadi).</div>
        <div class="fg"><label>Tur</label><div class="rg">
          <div class="ropt on" onclick="setFbType(this,'Taklif')">💡 Taklif</div>
          <div class="ropt" onclick="setFbType(this,'Shikoyat')">⚠️ Shikoyat</div></div></div>
        <div class="fg"><label>Xabar <span class="req">*</span></label><textarea id="fb-msg" rows="4" placeholder="Fikringizni yozing..."></textarea></div>
        <button class="btn btn-p btn-bl btn-lg" onclick="submitFb()">📤 Yuborish</button>
        <div id="fb-result" class="hide" style="margin-top:14px"></div>
      </div></div>
  </div>`;
}
let fbType='Taklif';
function setFbType(el,t){ document.querySelectorAll('#page-feedback .rg .ropt').forEach(e=>e.classList.remove('on')); el.classList.add('on'); fbType=t; }
async function submitFb() {
  const msg=v('fb-msg').trim(); if(!msg){alert('Xabar matnini kiriting!');return;}
  showOv('Yuborilmoqda...');
  await apiPost({action:'submitFeedback',empId:ST.user.id,empName:ST.user.name,message:msg,type:fbType});
  hideOv(); document.getElementById('fb-msg').value='';
  const r=document.getElementById('fb-result');
  r.innerHTML='<div class="alert alert-ok">✅ So\'rovingiz yuborildi. Anonim qabul qilindi.</div>';
  r.classList.remove('hide');
}
