// ╔════════════════════════════════════════════════════════════════╗
// ║  app3.js — OB'EKT TANLASH (Vrach / Dorixona, filial xotirasi)   ║
// ╚════════════════════════════════════════════════════════════════╝

// ── QADAM 2 ROUTING ──
function renderVfStep2() {
  if (ST.visit.type==='doctor') renderVfStep2Doctor(); else renderVfStep2Pharmacy();
}

// ════════════════════════════════════════════════════════════════
// VRACH TANLASH
// ════════════════════════════════════════════════════════════════
function renderVfStep2Doctor() {
  document.getElementById('vfs2').innerHTML = `
    <div class="fg"><label>Vrachni qidirish (2-3 harf) <span class="req">*</span></label>
      <div class="search-wrap"><input id="vf-doc-q" placeholder="Masalan: Abdu, Karim..." oninput="vfSearchDoc(this.value)" /></div>
      <div id="vf-doc-res" class="slist hide"></div></div>
    <div id="vf-doc-sel" class="alert alert-ok hide"></div>
    <div id="vf-new-doc-block" class="hide">
      <div class="alert alert-w">⚠️ Vrach bazada topilmadi. Yangi vrach qo'shing:</div>
      <div class="new-form">
        <div class="fg"><label>РЕГИОН <span class="req">*</span></label>
          <select id="nd-region"><option>Toshkent shahri</option><option>Toshkent viloyati</option>
          <option>Samarqand</option><option>Andijon</option><option>Farg'ona</option><option>Namangan</option>
          <option>Buxoro</option><option>Xorazm</option><option>Qashqadaryo</option><option>Surxondaryo</option>
          <option>Navoiy</option><option>Jizzax</option><option>Sirdaryo</option><option>Qoraqalpog'iston</option></select></div>
        <div class="frow">
          <div class="fg"><label>Ф.И.О Врача <span class="req">*</span></label><input id="nd-name" placeholder="Familiya Ism Sharif" /></div>
          <div class="fg"><label>Специальность <span class="req">*</span></label><input id="nd-spec" placeholder="Ginekolog..." /></div></div>
        <div class="frow">
          <div class="fg"><label>Объект <span class="req">*</span></label><input id="nd-obj" placeholder="Klinika nomi" /></div>
          <div class="fg"><label>Район <span class="req">*</span></label><input id="nd-dist" placeholder="Yunusobod..." /></div></div>
        <div class="frow">
          <div class="fg"><label>Телефон <span class="req">*</span></label><input id="nd-phone" type="tel" placeholder="+998901234567" /></div>
          <div class="fg"><label>Категория</label><select id="nd-cat"><option>A</option><option>B</option><option>C</option></select></div></div>
        <div class="fg"><label>Состояние</label><select id="nd-status"><option>Active</option><option>Inactive</option></select></div>
        <button class="btn btn-ok btn-bl" onclick="vfConfirmNewDoctor()">✅ Tasdiqlash</button>
      </div></div>
    <div class="btn-row">
      <button class="btn btn-o" onclick="vfShowStep(1)">← Orqaga</button>
      <button class="btn btn-p" id="vf-next2" onclick="vfStartTimer()" disabled>Vizitni boshlash ▶️</button></div>`;
}

function vfSearchDoc(q) {
  q=q.trim(); if (q.length<2){hideEl('vf-doc-res');return;}
  const ql=q.toLowerCase();
  const res = ST.doctors.filter(r=>(r.name||'').toLowerCase().includes(ql)||(r.object||'').toLowerCase().includes(ql)||
    (r.specialty||'').toLowerCase().includes(ql)||(r.district||'').toLowerCase().includes(ql)).slice(0,10);
  const box = document.getElementById('vf-doc-res');
  if (!res.length) {
    box.innerHTML=`<div class="sitem"><span class="sitem-name" style="color:var(--muted)">Topilmadi</span><span class="sitem-meta">Pastdagi formani to'ldiring</span></div>`;
    showEl('vf-new-doc-block');
  } else {
    hideEl('vf-new-doc-block');
    box.innerHTML = res.map(r=>`<div class="sitem" onclick='vfSelectDoc(${JSON.stringify(r)})'>
      <span class="sitem-name">${r.name}</span>
      <span class="sitem-meta">${r.specialty||''} · ${r.object||''} · ${r.district||''}
        · <b class="bdg ${r.category==='A'?'bdg-g':r.category==='B'?'bdg-y':'bdg-b'}">${r.category||'—'}</b>
        · ${r.status==='Active'?'🟢':'⚪'} ${r.status||''}</span></div>`).join('');
  }
  showEl('vf-doc-res');
}
function vfSelectDoc(r) {
  ST.visit.target = r;
  hideEl('vf-doc-res'); hideEl('vf-new-doc-block');
  document.getElementById('vf-doc-q').value = r.name;
  document.getElementById('vf-doc-sel').innerHTML = `✅ <b>${r.name}</b> · ${r.specialty} · ${r.object} · ${r.district} · Kat: <b>${r.category||'—'}</b>`;
  showEl('vf-doc-sel');
  document.getElementById('vf-next2').disabled = false;
}
function vfConfirmNewDoctor() {
  const name=v('nd-name'),spec=v('nd-spec'),obj=v('nd-obj'),dist=v('nd-dist'),phone=v('nd-phone');
  if (!name||!spec||!obj||!dist||!phone) { alert('Barcha (*) maydonlarni to\'ldiring!'); return; }
  const newDoc = {id:'NEW-'+Date.now(),region:v('nd-region'),name,specialty:spec,object:obj,district:dist,phone,category:v('nd-cat'),status:v('nd-status'),_isNew:true};
  showModal('Ma\'lumotni tasdiqlang',
    `<div class="irow"><span class="irow-l">РЕГИОН</span><span class="irow-v">${newDoc.region}</span></div>
     <div class="irow"><span class="irow-l">Ф.И.О</span><span class="irow-v">${newDoc.name}</span></div>
     <div class="irow"><span class="irow-l">Объект</span><span class="irow-v">${newDoc.object}</span></div>
     <div class="irow"><span class="irow-l">Спец-ть</span><span class="irow-v">${newDoc.specialty}</span></div>
     <div class="irow"><span class="irow-l">Район</span><span class="irow-v">${newDoc.district}</span></div>
     <div class="irow"><span class="irow-l">Телефон</span><span class="irow-v">${newDoc.phone}</span></div>
     <p style="margin-top:10px;font-size:13px;color:var(--muted)">To'g'rimi?</p>`,
    `<button class="btn btn-o" onclick="closeModal()">← Tahrirlash</button>
     <button class="btn btn-ok" onclick='vfFinalizeNewDoctor(${JSON.stringify(newDoc)})'>✅ Ha, to'g'ri</button>`);
}
async function vfFinalizeNewDoctor(newDoc) {
  closeModal(); ST.doctors.push(newDoc); ST.visit.target=newDoc; ST.visit.newObjData=newDoc;
  document.getElementById('vf-doc-sel').innerHTML = `✅ <b>${newDoc.name}</b> (yangi) · ${newDoc.object}`;
  showEl('vf-doc-sel'); document.getElementById('vf-next2').disabled=false;
  await apiPost({action:'addNewDoctor',...newDoc,empName:ST.user.name});
}

// ════════════════════════════════════════════════════════════════
// DORIXONA TANLASH — Filial avtomatik eslab qoladi
// Ma'lumot formati: rowNum, region, district, inn, legalName, branch
// ════════════════════════════════════════════════════════════════
function renderVfStep2Pharmacy() {
  document.getElementById('vfs2').innerHTML = `
    <div class="fg"><label>Dorixona qidirish — INN yoki nom <span class="req">*</span></label>
      <div class="search-wrap"><input id="vf-pharm-q" placeholder="205879265 yoki Aybolit..." oninput="vfSearchPharm(this.value)" /></div>
      <div id="vf-pharm-res" class="slist hide"></div></div>
    <div id="vf-pharm-sel" class="hide"></div>

    <div id="vf-new-pharm-block" class="hide">
      <div class="alert alert-w">⚠️ Dorixona bazada topilmadi. Yangi qo'shing:</div>
      <div class="new-form">
        <div class="fg"><label>РЕГИОН <span class="req">*</span></label>
          <select id="np-region"><option>TOSHKENT</option><option>TOSHKENT VILOYATI</option>
          <option>SAMARQAND</option><option>ANDIJON</option><option>FARG'ONA</option></select></div>
        <div class="fg"><label>РАЙОН <span class="req">*</span></label><input id="np-dist" placeholder="YUNUSOBOD..." /></div>
        <div class="fg"><label>ИНН (9 ta raqam) <span class="req">*</span></label>
          <input id="np-inn" type="number" maxlength="9" placeholder="205879265" /></div>
        <div class="fg"><label>Apteka nomi <span class="req">*</span></label>
          <input id="np-name" placeholder="DOBRIY DOKTOR AYBOLIT MCHJ" /></div>
        <button class="btn btn-ok btn-bl" onclick="vfConfirmNewPharm()">✅ Tasdiqlash</button>
      </div></div>

    <div class="fg hide" id="vf-branch-block">
      <label>Filial raqami <span class="req">*</span></label>
      <div id="vf-branch-known" class="alert alert-ok hide"></div>
      <div id="vf-branch-ask" class="hide">
        <div class="rg">
          <div class="ropt" onclick="vfSetBranchMode(true)">📍 Filial raqami bor</div>
          <div class="ropt" onclick="vfSetBranchMode(false)">🚫 Filial yo'q</div></div>
        <div id="vf-branch-input" class="hide" style="margin-top:8px"><input id="vf-branch-no" type="number" min="1" placeholder="Masalan: 1, 2, 10..." /></div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-o" onclick="vfShowStep(1)">← Orqaga</button>
      <button class="btn btn-p" id="vf-next2" onclick="vfStartTimer()" disabled>Vizitni boshlash ▶️</button></div>`;
}

function vfSearchPharm(q) {
  q=q.trim(); if(q.length<2){hideEl('vf-pharm-res');return;}
  const ql=q.toLowerCase();
  const res = ST.pharmacies.filter(r=>(r.inn||'').includes(q)||(r.legalName||'').toLowerCase().includes(ql)).slice(0,10);
  const box = document.getElementById('vf-pharm-res');
  if (!res.length) {
    box.innerHTML=`<div class="sitem"><span class="sitem-name" style="color:var(--muted)">Topilmadi</span><span class="sitem-meta">Pastdagi formani to'ldiring</span></div>`;
    showEl('vf-new-pharm-block');
  } else {
    hideEl('vf-new-pharm-block');
    box.innerHTML = res.map(r=>`<div class="sitem" onclick='vfSelectPharm(${JSON.stringify(r)})'>
      <span class="sitem-name">${r.legalName}</span>
      <span class="sitem-meta">ИНН: ${r.inn} · ${r.district} ${r.branch?(' · Filial: '+r.branch):''}</span></div>`).join('');
  }
  showEl('vf-pharm-res');
}

function vfSelectPharm(r) {
  ST.visit.target = r;
  hideEl('vf-pharm-res'); hideEl('vf-new-pharm-block');
  document.getElementById('vf-pharm-q').value = r.legalName;
  document.getElementById('vf-pharm-sel').innerHTML = `<div class="alert alert-ok">✅ <b>${r.legalName}</b> · ИНН: ${r.inn} · ${r.district}</div>`;
  showEl('vf-pharm-sel');
  showEl('vf-branch-block');

  // ★ FILIAL XOTIRASI: agar bazada filial allaqachon bor bo'lsa, qaytadan so'ramaydi
  if (r.branch && r.branch.trim()) {
    document.getElementById('vf-branch-known').innerHTML = `✅ Filial bazada saqlangan: <b>${r.branch}</b> (avtomatik olindi)`;
    showEl('vf-branch-known');
    hideEl('vf-branch-ask');
    ST.visit.vals.branchNo = r.branch;
    document.getElementById('vf-next2').disabled = false;
  } else {
    hideEl('vf-branch-known');
    showEl('vf-branch-ask');
    document.getElementById('vf-next2').disabled = true;
  }
}

function vfSetBranchMode(hasOne) {
  document.querySelectorAll('#vf-branch-ask .ropt').forEach(e=>e.classList.remove('on'));
  event.currentTarget.classList.add('on');
  tgl('vf-branch-input', hasOne);
  if (!hasOne) {
    ST.visit.vals.branchNo = 'Yo\'q';
    document.getElementById('vf-next2').disabled = false;
    // Bazaga "Yo'q" deb yozib qo'yamiz — keyingi safar qayta so'ramaydi
    if (ST.visit.target.rowNum) apiPost({action:'saveBranchNo', rowNum:ST.visit.target.rowNum, branchNo:'Yo\'q'});
  } else {
    document.getElementById('vf-branch-no').oninput = function() {
      ST.visit.vals.branchNo = this.value;
      document.getElementById('vf-next2').disabled = !this.value;
    };
  }
}

// Vizit yakunlanganda filial raqami bazaga (E ustun) yoziladi — vfFinishVisit ichida chaqiriladi
async function vfSaveBranchToBase() {
  if (ST.visit.type!=='pharmacy') return;
  if (!ST.visit.target.rowNum) return; // yangi apteka bo'lsa kerak emas
  const branch = ST.visit.vals.branchNo;
  if (branch && branch !== ST.visit.target.branch) {
    await apiPost({ action:'saveBranchNo', rowNum: ST.visit.target.rowNum, branchNo: branch });
    ST.visit.target.branch = branch; // local cache yangilash
  }
}

function vfConfirmNewPharm() {
  const inn=v('np-inn').replace(/\s/g,''), name=v('np-name'), dist=v('np-dist');
  if (inn.length!==9||isNaN(inn)) { alert('INN 9 ta raqam bo\'lishi shart!'); return; }
  if (!name||!dist) { alert('Barcha (*) maydonlarni to\'ldiring!'); return; }
  const newP = {id:'NEW-'+Date.now(),region:v('np-region'),district:dist,inn,legalName:name,branch:'',_isNew:true};
  showModal('Ma\'lumotni tasdiqlang',
    `<div class="irow"><span class="irow-l">РЕГИОН</span><span class="irow-v">${newP.region}</span></div>
     <div class="irow"><span class="irow-l">РАЙОН</span><span class="irow-v">${newP.district}</span></div>
     <div class="irow"><span class="irow-l">ИНН</span><span class="irow-v">${newP.inn}</span></div>
     <div class="irow"><span class="irow-l">Nomi</span><span class="irow-v">${newP.legalName}</span></div>
     <p style="margin-top:10px;font-size:13px;color:var(--muted)">To'g'rimi?</p>`,
    `<button class="btn btn-o" onclick="closeModal()">← Tahrirlash</button>
     <button class="btn btn-ok" onclick='vfFinalizeNewPharm(${JSON.stringify(newP)})'>✅ Ha, to'g'ri</button>`);
}
async function vfFinalizeNewPharm(newP) {
  closeModal(); ST.pharmacies.push(newP); ST.visit.target=newP; ST.visit.newObjData=newP;
  document.getElementById('vf-pharm-sel').innerHTML = `<div class="alert alert-ok">✅ <b>${newP.legalName}</b> (yangi) · ${newP.district}</div>`;
  showEl('vf-pharm-sel'); showEl('vf-branch-block'); showEl('vf-branch-ask');
  await apiPost({action:'addNewPharmacy',...newP,empName:ST.user.name});
}

// ── TIMER BOSHLASH ──
function vfStartTimer() {
  if (!ST.visit.target) { alert('Ob\'ektni tanlang!'); return; }
  ST.visit.timerStart = Date.now();
  vfShowStep(3);
  ST.visit.timerRef = setInterval(vfUpdateTimer, 1000);
}
function vfUpdateTimer() {
  const s = Math.floor((Date.now()-ST.visit.timerStart)/1000);
  const el = document.getElementById('vf-timer-val');
  if (el) el.textContent = String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  const w = document.getElementById('vf-timer-warn');
  if (w) w.classList.toggle('hide', s>=MIN_VISIT_SEC);
}
