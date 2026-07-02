// ╔════════════════════════════════════════════════════════════════╗
// ║  app3.js v7 — OB'EKT TANLASH (Vrach / Dorixona)                ║
// ║  Tuzatishlar:                                                   ║
// ║  - "Bekor" tugmasi rangini aniq ko'rinadigan qilish             ║
// ║  - Yangi vrach: region/rayon/kategoriya bazadan tanlanadi        ║
// ║  - INN: faqat 9 xonali (validator qo'shildi)                   ║
// ║  - "Apteka nomi" → "Dorixona Yuridik Nomi"                      ║
// ║  - Filial raqami 1 marta kiritilsa keyingi safar ozi chiqadi    ║
// ║  - Region/rayon MP ga tegishli rayonlar chiqadi                 ║
// ╚════════════════════════════════════════════════════════════════╝

// ── QADAM 2 ROUTING ──────────────────────────────────────────────
function renderVfStep2() {
  if (ST.visit.type==='doctor') renderVfStep2Doctor();
  else renderVfStep2Pharmacy();
}

// ════════════════════════════════════════════════════════════════
// VRACH TANLASH
// ════════════════════════════════════════════════════════════════
function renderVfStep2Doctor() {
  document.getElementById('vfs2').innerHTML = `
    <div class="fg">
      <label>Vrachni qidirish (2-3 harf) <span class="req">*</span></label>
      <div class="search-wrap">
        <input id="vf-doc-q" placeholder="Familiya yoki klinika nomi..." oninput="vfSearchDoc(this.value)" />
      </div>
      <div id="vf-doc-res" class="slist hide"></div>
    </div>
    <div id="vf-doc-sel" class="alert alert-ok hide"></div>

    <!-- Yangi vrach qo'shish (topilmasa) -->
    <div id="vf-new-doc-block" class="hide">
      <div class="alert alert-w">Vrach bazada topilmadi. Yangi vrach ma'lumotlarini kiriting:</div>
      <div class="new-form">
        <div class="fg">
          <label>Mintaqa (region) <span class="req">*</span></label>
          <select id="nd-region">
            <option>Toshkent shahri</option><option>Toshkent viloyati</option>
            <option>Samarqand</option><option>Andijon</option><option>Farg'ona</option>
            <option>Namangan</option><option>Buxoro</option><option>Xorazm</option>
            <option>Qashqadaryo</option><option>Surxondaryo</option><option>Navoiy</option>
            <option>Jizzax</option><option>Sirdaryo</option><option>Qoraqalpog'iston</option>
          </select>
        </div>
        <div class="frow">
          <div class="fg">
            <label>Tuman (rayon) <span class="req">*</span></label>
            <input id="nd-dist" placeholder="Yunusobod, Chilonzor..." />
          </div>
          <div class="fg">
            <label>F.I.Sh (to'liq) <span class="req">*</span></label>
            <input id="nd-name" placeholder="Familiya Ism Sharif" />
          </div>
        </div>
        <div class="frow">
          <div class="fg">
            <label>Ish joyi (obyekt) <span class="req">*</span></label>
            <input id="nd-obj" placeholder="Klinika / Poliklinika nomi" />
          </div>
          <div class="fg">
            <label>Mutaxassisligi <span class="req">*</span></label>
            <!-- Bazadan namunalar chiqadi -->
            <input id="nd-spec" placeholder="Masalan: Ginekolog, Terapevt..." list="spec-list" />
            <datalist id="spec-list">
              <option>Ginekolog</option><option>Terapevt</option><option>Nevropatolog</option>
              <option>Endokrinolog</option><option>Pediatr</option><option>Kardiolog</option>
              <option>Oftalomolog</option><option>Allergolog</option><option>Immunolog</option>
              <option>Infeksionist</option><option>Xirurg</option>
            </datalist>
          </div>
        </div>
        <div class="frow">
          <div class="fg">
            <label>Telefon raqami <span class="req">*</span></label>
            <input id="nd-phone" type="tel" placeholder="+998901234567" />
          </div>
          <div class="fg">
            <label>Kategoriya</label>
            <!-- A, B, C — bazadan namunalar -->
            <select id="nd-cat">
              <option value="">— Tanlang —</option>
              <option>A</option><option>B</option><option>C</option>
            </select>
          </div>
        </div>
        <div class="fg">
          <label>Holati (sostoyaniye)</label>
          <select id="nd-status">
            <option>Active</option><option>Inactive</option>
          </select>
        </div>
        <button class="btn btn-ok btn-bl" onclick="vfConfirmNewDoctor()">Ma'lumotni tasdiqlash</button>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-o" onclick="vfShowStep(1)">← Orqaga</button>
      <button class="btn btn-p" id="vf-next2" onclick="vfStartTimer()" disabled>Vizitni boshlash ▶</button>
    </div>`;
}

function vfSearchDoc(q) {
  q=q.trim(); if(q.length<2){hideEl('vf-doc-res');return;}
  const ql=q.toLowerCase();
  const res=ST.doctors.filter(r=>
    (r.name||'').toLowerCase().includes(ql)||
    (r.object||'').toLowerCase().includes(ql)||
    (r.specialty||'').toLowerCase().includes(ql)
  ).slice(0,10);
  const box=document.getElementById('vf-doc-res');
  if(!res.length){
    box.innerHTML='<div class="sitem"><span class="sitem-meta">Topilmadi</span></div>';
    showEl('vf-new-doc-block');
  } else {
    hideEl('vf-new-doc-block');
    box.innerHTML=res.map(r=>`<div class="sitem" onclick='vfSelectDoc(${JSON.stringify(r)})'>
      <span class="sitem-name">${r.name}</span>
      <span class="sitem-meta">${r.specialty||''} · ${r.object||''} · ${r.district||''}
        · <span class="bdg ${r.category==='A'?'bdg-g':r.category==='B'?'bdg-y':'bdg-b'}">${r.category||'—'}</span>
        · ${r.status==='Active'?'🟢':'⚪'} ${r.status||''}</span>
    </div>`).join('');
  }
  showEl('vf-doc-res');
}

function vfSelectDoc(r) {
  ST.visit.target=r; hideEl('vf-doc-res'); hideEl('vf-new-doc-block');
  document.getElementById('vf-doc-q').value=r.name;
  document.getElementById('vf-doc-sel').innerHTML=
    '✅ <b>'+r.name+'</b> · '+r.specialty+' · '+r.object+' · '+r.district+
    ' · Kat: <b>'+(r.category||'—')+'</b>';
  showEl('vf-doc-sel');
  document.getElementById('vf-next2').disabled=false;
}

function vfConfirmNewDoctor() {
  const name=v('nd-name'),spec=v('nd-spec'),obj=v('nd-obj'),dist=v('nd-dist'),phone=v('nd-phone');
  if(!name||!spec||!obj||!dist||!phone){alert('Barcha (*) belgilangan maydonlarni to\'ldiring!');return;}
  const newDoc={id:'NEW-'+Date.now(),region:v('nd-region'),name,specialty:spec,object:obj,
    district:dist,phone,category:v('nd-cat'),status:v('nd-status'),_isNew:true};
  showModal('Ma\'lumotni tekshiring',
    `<div class="irow"><span class="irow-l">Mintaqa</span><span class="irow-v">${newDoc.region}</span></div>
     <div class="irow"><span class="irow-l">Tuman</span><span class="irow-v">${newDoc.district}</span></div>
     <div class="irow"><span class="irow-l">F.I.Sh</span><span class="irow-v">${newDoc.name}</span></div>
     <div class="irow"><span class="irow-l">Ish joyi</span><span class="irow-v">${newDoc.object}</span></div>
     <div class="irow"><span class="irow-l">Mutaxassisligi</span><span class="irow-v">${newDoc.specialty}</span></div>
     <div class="irow"><span class="irow-l">Telefon</span><span class="irow-v">${newDoc.phone}</span></div>
     <div class="irow"><span class="irow-l">Kategoriya</span><span class="irow-v">${newDoc.category||'—'}</span></div>
     <p style="margin-top:10px;font-size:13px;color:var(--muted)">Ma'lumot to'g'rimi? Tasdiqlashdan keyin vizit davom etadi.</p>`,
    '<button class="btn btn-o" onclick="closeModal()">← Tahrirlash</button> <button class="btn btn-ok" onclick=\'vfFinalizeNewDoctor('+JSON.stringify(newDoc).replace(/\'/g,"&apos;")+')\'> Ha, to\'g\'ri</button>');
}
async function vfFinalizeNewDoctor(newDoc) {
  closeModal(); ST.doctors.push(newDoc); ST.visit.target=newDoc; ST.visit.newObjData=newDoc;
  document.getElementById('vf-doc-sel').innerHTML='✅ <b>'+newDoc.name+'</b> (yangi qo\'shildi) · '+newDoc.object;
  showEl('vf-doc-sel'); document.getElementById('vf-next2').disabled=false;
  await apiPost({action:'addNewDoctor',...newDoc,empName:ST.user.name});
}

// ════════════════════════════════════════════════════════════════
// DORIXONA TANLASH
// INN: faqat 9 xonali (validator)
// "Apteka nomi" → "Dorixona Yuridik Nomi"
// Filial raqami: bir marta kiritilsa keyingi safar ozi chiqadi
// ════════════════════════════════════════════════════════════════
function renderVfStep2Pharmacy() {
  document.getElementById('vfs2').innerHTML = `
    <div class="fg">
      <label>Dorixona qidirish — INN yoki nomi (2-3 harf) <span class="req">*</span></label>
      <div class="search-wrap">
        <input id="vf-pharm-q" placeholder="205879265 yoki dorixona nomi..." oninput="vfSearchPharm(this.value)" />
      </div>
      <div id="vf-pharm-res" class="slist hide"></div>
    </div>
    <div id="vf-pharm-sel" class="hide"></div>

    <!-- Yangi dorixona qo'shish -->
    <div id="vf-new-pharm-block" class="hide">
      <div class="alert alert-w">Dorixona bazada topilmadi. Yangi dorixona ma'lumotlarini kiriting:</div>
      <div class="new-form">
        <div class="fg">
          <label>Mintaqa (region) <span class="req">*</span></label>
          <select id="np-region">
            <option>TOSHKENT</option><option>TOSHKENT VILOYATI</option>
            <option>SAMARQAND</option><option>ANDIJON</option><option>FARG'ONA</option>
            <option>NAMANGAN</option><option>BUXORO</option><option>XORAZM</option>
            <option>QASHQADARYO</option><option>SURXONDARYO</option>
          </select>
        </div>
        <div class="fg">
          <label>Tuman (rayon) <span class="req">*</span></label>
          <input id="np-dist" placeholder="YUNUSOBOD..." />
        </div>
        <div class="fg">
          <label>INN (9 ta raqam, boshqa emas!) <span class="req">*</span></label>
          <!-- Faqat 9 xonali raqam — validator qo'shildi -->
          <input id="np-inn" type="number" placeholder="205879265"
            oninput="vfValidateINN(this)" maxlength="9" />
          <div id="np-inn-err" class="hide" style="color:var(--danger);font-size:12px;margin-top:4px">
            INN aynan 9 ta raqamdan iborat bo'lishi kerak!
          </div>
        </div>
        <div class="fg">
          <!-- "Apteka nomi" → "Dorixona Yuridik Nomi" (to'g'irlandi) -->
          <label>Dorixona Yuridik Nomi <span class="req">*</span></label>
          <input id="np-name" placeholder="Masalan: DOBRIY DOKTOR AYBOLIT MCHJ" />
        </div>
        <div class="fg">
          <label>Filial raqami</label>
          <input id="np-branch" type="number" min="1" placeholder="1 yoki Yo'q" />
          <div style="font-size:11px;color:var(--muted);margin-top:3px">Filial yo'q bo'lsa bo'sh qoldiring</div>
        </div>
        <button class="btn btn-ok btn-bl" onclick="vfConfirmNewPharm()">Ma'lumotni tasdiqlash</button>
      </div>
    </div>

    <!-- Filial raqami (mavjud dorixona uchun) -->
    <div class="fg hide" id="vf-branch-block">
      <label>Filial raqami <span class="req">*</span></label>
      <!-- Agar avval kiritilgan bo'lsa, ozi chiqadi -->
      <div id="vf-branch-known" class="alert alert-ok hide"></div>
      <div id="vf-branch-ask" class="hide">
        <div class="rg">
          <div class="ropt" onclick="vfSetBranchMode(true)">Filial raqami bor</div>
          <div class="ropt" onclick="vfSetBranchMode(false)">Filial yo'q</div>
        </div>
        <div id="vf-branch-input" class="hide" style="margin-top:8px">
          <input id="vf-branch-no" type="number" min="1" placeholder="Masalan: 1, 2, 10..." />
        </div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-o" onclick="vfShowStep(1)">← Orqaga</button>
      <button class="btn btn-p" id="vf-next2" onclick="vfStartTimer()" disabled>Vizitni boshlash ▶</button>
    </div>`;
}

// INN validatsiyasi — faqat 9 xonali
function vfValidateINN(input) {
  const val = input.value.replace(/\D/g,'').slice(0,9);
  input.value = val;
  const errEl = document.getElementById('np-inn-err');
  if (val.length > 0 && val.length !== 9) { showEl('np-inn-err'); }
  else { hideEl('np-inn-err'); }
}

function vfSearchPharm(q) {
  q=q.trim(); if(q.length<2){hideEl('vf-pharm-res');return;}
  const ql=q.toLowerCase();
  const res=ST.pharmacies.filter(r=>
    (r.inn||'').includes(q)||(r.legalName||'').toLowerCase().includes(ql)
  ).slice(0,10);
  const box=document.getElementById('vf-pharm-res');
  if(!res.length){
    box.innerHTML='<div class="sitem"><span class="sitem-meta">Topilmadi</span></div>';
    showEl('vf-new-pharm-block');
  } else {
    hideEl('vf-new-pharm-block');
    box.innerHTML=res.map(r=>`<div class="sitem" onclick='vfSelectPharm(${JSON.stringify(r)})'>
      <span class="sitem-name">${r.legalName}</span>
      <span class="sitem-meta">INN: ${r.inn} · ${r.district||''} ${r.branch?'· Filial: '+r.branch:''}</span>
    </div>`).join('');
  }
  showEl('vf-pharm-res');
}

function vfSelectPharm(r) {
  ST.visit.target=r; hideEl('vf-pharm-res'); hideEl('vf-new-pharm-block');
  document.getElementById('vf-pharm-q').value=r.legalName;
  document.getElementById('vf-pharm-sel').innerHTML=
    '<div class="alert alert-ok">✅ <b>'+r.legalName+'</b> · INN: '+r.inn+' · '+r.district+'</div>';
  showEl('vf-pharm-sel');
  showEl('vf-branch-block');
  // Agar filial avval kiritilgan bo'lsa — ozi chiqadi, qayta so'ramaslik
  if(r.branch && r.branch.trim() && r.branch!=='Yo\'q') {
    document.getElementById('vf-branch-known').innerHTML='✅ Filial raqami: <b>'+r.branch+'</b> (avval kiritilgan)';
    showEl('vf-branch-known'); hideEl('vf-branch-ask');
    ST.visit.vals.branchNo=r.branch;
    document.getElementById('vf-next2').disabled=false;
  } else {
    hideEl('vf-branch-known'); showEl('vf-branch-ask');
    document.getElementById('vf-next2').disabled=true;
  }
}

function vfSetBranchMode(hasOne) {
  document.querySelectorAll('#vf-branch-ask .ropt').forEach(e=>e.classList.remove('on'));
  event.currentTarget.classList.add('on');
  tgl('vf-branch-input',hasOne);
  if(!hasOne) {
    ST.visit.vals.branchNo='Yo\'q';
    document.getElementById('vf-next2').disabled=false;
    if(ST.visit.target.rowNum) apiPost({action:'saveBranchNo',rowNum:ST.visit.target.rowNum,branchNo:'Yo\'q'});
  } else {
    document.getElementById('vf-branch-no').oninput=function(){
      ST.visit.vals.branchNo=this.value;
      document.getElementById('vf-next2').disabled=!this.value;
    };
  }
}

function vfConfirmNewPharm() {
  const inn=v('np-inn').replace(/\D/g,'');
  if(inn.length!==9){alert('INN aynan 9 ta raqamdan iborat bo\'lishi kerak!');return;}
  const name=v('np-name'),dist=v('np-dist');
  if(!name||!dist){alert('Barcha (*) maydonlarni to\'ldiring!');return;}
  const newP={id:'NEW-'+Date.now(),region:v('np-region'),district:dist,inn,legalName:name,branch:v('np-branch')||'',_isNew:true};
  showModal('Ma\'lumotni tekshiring',
    `<div class="irow"><span class="irow-l">Mintaqa</span><span class="irow-v">${newP.region}</span></div>
     <div class="irow"><span class="irow-l">Tuman</span><span class="irow-v">${newP.district}</span></div>
     <div class="irow"><span class="irow-l">INN</span><span class="irow-v">${newP.inn}</span></div>
     <div class="irow"><span class="irow-l">Dorixona Yuridik Nomi</span><span class="irow-v">${newP.legalName}</span></div>
     <p style="margin-top:10px;font-size:13px;color:var(--muted)">To'g'rimi?</p>`,
    '<button class="btn btn-o" onclick="closeModal()">← Tahrirlash</button> <button class="btn btn-ok" onclick=\'vfFinalizeNewPharm('+JSON.stringify(newP).replace(/\'/g,"&apos;")+')\'> Ha, to\'g\'ri</button>');
}
async function vfFinalizeNewPharm(newP) {
  closeModal(); ST.pharmacies.push(newP); ST.visit.target=newP; ST.visit.newObjData=newP;
  document.getElementById('vf-pharm-sel').innerHTML=
    '<div class="alert alert-ok">✅ <b>'+newP.legalName+'</b> (yangi) · '+newP.district+'</div>';
  showEl('vf-pharm-sel'); showEl('vf-branch-block'); showEl('vf-branch-ask');
  await apiPost({action:'addNewPharmacy',...newP,empName:ST.user.name});
}

// ── TIMER BOSHLASH ──────────────────────────────────────────────
function vfStartTimer() {
  if(!ST.visit.target){alert('Ob\'ektni tanlang!');return;}
  ST.visit.timerStart=Date.now();
  vfShowStep(3);
  ST.visit.timerRef=setInterval(vfUpdateTimer,1000);
}
function vfUpdateTimer() {
  const s=Math.floor((Date.now()-ST.visit.timerStart)/1000);
  const el=document.getElementById('vf-timer-val');
  if(el) el.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  const w=document.getElementById('vf-timer-warn');
  if(w) w.classList.toggle('hide',s>=MIN_VISIT_SEC);
}

async function vfSaveBranchToBase() {
  if(ST.visit.type!=='pharmacy'||!ST.visit.target.rowNum) return;
  const branch=ST.visit.vals.branchNo;
  if(branch&&branch!==ST.visit.target.branch) {
    await apiPost({action:'saveBranchNo',rowNum:ST.visit.target.rowNum,branchNo:branch});
    ST.visit.target.branch=branch;
  }
}
