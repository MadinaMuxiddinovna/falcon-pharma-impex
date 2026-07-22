// app3.js v10 — OB'EKT TANLASH (Vrach / Dorixona)
// Tuzatishlar:
// - Yangi vrach: FIO 3 ta alohida qator, region/rayon MP niki avtomatik
// - Yangi apteka: region/rayon avtomatik, INN 9 raqam, Yuridik Nomi qo'lda
// - Filial 1 marta kiritilsa eslab qoladi
// - Vrach tanlanganda: to'liq ma'lumot (rayon, tel) ko'rinadi
// - MP menejer ismi header da chiqadi

// ── QADAM 2 ROUTING ────────────────────────────────
function renderVfStep2() {
  if (ST.visit.type === 'doctor') renderVfStep2Doctor();
  else renderVfStep2Pharmacy();
}

// ── VRACH TANLASH ───────────────────────────────────
function renderVfStep2Doctor() {
  document.getElementById('vfs2').innerHTML = `
    <div class="fg">
      <label>Vrachni qidirish (2-3 harf) <span class="req">*</span></label>
      <div class="search-wrap">
        <input id="vf-doc-q" placeholder="Familiya yoki klinika..." oninput="vfSearchDoc(this.value)" onfocus="vfSearchDoc(this.value,true)" />
      </div>
      <div id="vf-doc-res" class="slist hide"></div>
    </div>
    <div id="vf-doc-sel" class="alert alert-ok hide"></div>

    <div id="vf-new-doc-block" class="hide">
      <div class="alert alert-w">Vrach bazada topilmadi — yangi vrach ma'lumotlarini kiriting:</div>
      <div class="new-form">
        <!-- Region va rayon MP niki avtomatik chiqadi -->
        <div class="frow">
          <div class="fg">
            <label>Mintaqa (region)</label>
            <input id="nd-region" value="${ST.user.region||'Toshkent shahri'}" readonly style="background:#f0f4ff;color:var(--muted)" />
          </div>
          <div class="fg">
            <label>Tuman (rayon)</label>
            <select id="nd-dist">${vfBuildTumanOptions()}</select>
          </div>
        </div>
        <!-- FIO: 3 ta alohida qator -->
        <div class="fg">
          <label>Familiya <span class="req">*</span></label>
          <input id="nd-familiya" placeholder="Masalan: Karimov" />
        </div>
        <div class="fg">
          <label>Ismi <span class="req">*</span></label>
          <input id="nd-ism" placeholder="Masalan: Sardor" />
        </div>
        <div class="fg">
          <label>Sharifi <span class="req">*</span></label>
          <input id="nd-sharif" placeholder="Masalan: Aliyevich" />
        </div>
        <div class="fg">
          <label>Ish joyi (obyekt) <span class="req">*</span></label>
          <input id="nd-obj" placeholder="Klinika / Poliklinika nomi" />
        </div>
        <div class="fg">
          <!-- Mutaxassislik — faqat tanlash, yozish mumkin emas -->
          <label>Mutaxassisligi <span class="req">*</span></label>
          <select id="nd-spec">
            <option value="">— Tanlang —</option>
            <option>Allergolog</option><option>Dermatolog</option><option>Endokrinolog</option>
            <option>Gepatolog</option><option>Ginekolog</option><option>Immunolog</option>
            <option>Infeksionist</option><option>Kardiolog</option><option>LOR</option>
            <option>Neonatolog</option><option>Nevropatolog</option><option>Oftalomolog</option>
            <option>Onkolog</option><option>Ortoped</option><option>Pediatr</option>
            <option>Terapevt</option><option>Urolog</option><option>VOP</option><option>Xirurg</option>
          </select>
        </div>
        <div class="fg">
          <label>Kategoriya</label>
          <select id="nd-cat">
            <option value="">— Tanlang —</option>
            <option>A</option><option>B</option><option>C</option>
          </select>
        </div>
        <div class="fg">
          <!-- Telefon: +998 qotirilgan, 9 ta raqam, probelsiz -->
          <label>Telefon raqami <span class="req">*</span></label>
          <div style="display:flex;align-items:center;gap:0">
            <span style="background:#eef2fb;border:1.5px solid var(--border);border-right:none;
              padding:10px 12px;border-radius:8px 0 0 8px;font-size:14px;color:var(--muted);white-space:nowrap">+998</span>
            <input id="nd-phone" type="tel" maxlength="9" placeholder="901234567"
              style="border-radius:0 8px 8px 0;border-left:none"
              oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,9)" />
          </div>
          <div id="nd-phone-err" class="hide" style="color:var(--danger);font-size:12px;margin-top:4px">
            Telefon aynan 9 ta raqamdan iborat bo'lishi kerak
          </div>
        </div>
        <button class="btn btn-ok btn-bl" onclick="vfConfirmNewDoctor()">Ma'lumotni tasdiqlash</button>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-o" onclick="vfShowStep(1)">← Orqaga</button>
      <button class="btn btn-p" id="vf-next2" onclick="vfStartTimer()" disabled>Vizitni boshlash ▶</button>
    </div>`;
  // Reja obyektidan kelingan bo'lsa — endi (vf-doc-q haqiqatan mavjud bo'lganda) qo'llaymiz
  if(window._pendingPlanObj){
    const objName=window._pendingPlanObj;
    window._pendingPlanObj=null;
    const matches=ST.doctors.filter(d=>(d.object||'')===objName);
    const inp=document.getElementById('vf-doc-q');
    if(inp){
      if(matches.length===1){
        vfSelectDoc(matches[0]);
      } else if(objName){
        inp.value=objName;
        vfSearchDoc(objName);
      }
    }
  }
}

function vfSearchDoc(q, isFocus) {
  q = (q||'').trim();
  const dist=(ST.user.district||'').toLowerCase();
  let res;
  if (q.length < 2) {
    if (!isFocus) { hideEl('vf-doc-res'); return; }
    // Fokus qilinganda, hali hech narsa yozilmagan bo'lsa — o'z rayoni vrachlarini ko'rsatamiz
    res = dist ? ST.doctors.filter(r => (r.district||'').toLowerCase()===dist) : ST.doctors.slice();
  } else {
    const ql = q.toLowerCase();
    res = ST.doctors.filter(r =>
      (r.name||'').toLowerCase().includes(ql) ||
      (r.object||'').toLowerCase().includes(ql) ||
      (r.specialty||'').toLowerCase().includes(ql)
    );
  }
  // O'z rayoni natijalari birinchi chiqadi
  res = res.slice().sort((a,b)=>{
    const ad=(a.district||'').toLowerCase()===dist?0:1;
    const bd=(b.district||'').toLowerCase()===dist?0:1;
    return ad-bd;
  }).slice(0, 10);
  window._docSearchRes = res;
  const box = document.getElementById('vf-doc-res');
  if (!res.length) {
    box.innerHTML = '<div class="sitem"><span class="sitem-meta">Topilmadi — pastda yangi vrach qo\'shing</span></div>';
    showEl('vf-new-doc-block');
  } else {
    hideEl('vf-new-doc-block');
    // To'liq ma'lumot: rayon, tel ko'rinadi
    box.innerHTML = res.map((r,i) => `
      <div class="sitem" onclick="vfSelectDocByIdx(${i})">
        <span class="sitem-name">${r.name}</span>
        <span class="sitem-meta">
          ${r.specialty||''} · ${r.object||''} · ${r.district||''}
          ${r.phone?'· '+r.phone:''}
          · <span class="bdg ${r.category==='A'?'bdg-g':r.category==='B'?'bdg-y':'bdg-b'}">${r.category||'—'}</span>
          · ${r.status==='Active'?'🟢':'⚪'}
        </span>
      </div>`).join('');
  }
  showEl('vf-doc-res');
}

function vfSelectDocByIdx(i) {
  const r = (window._docSearchRes||[])[i];
  if (r) vfSelectDoc(r);
}
function vfSelectDoc(r) {
  ST.visit.target = r;
  hideEl('vf-doc-res'); hideEl('vf-new-doc-block');
  document.getElementById('vf-doc-q').value = r.name;
  document.getElementById('vf-doc-sel').innerHTML =
    `✅ <b>${r.name}</b> · ${r.specialty||''} · ${r.object||''} · ${r.district||''} · ${r.phone||''} · Kat: <b>${r.category||'—'}</b>`;
  showEl('vf-doc-sel');
  document.getElementById('vf-next2').disabled = false;
}

function vfConfirmNewDoctor() {
  const familiya = (document.getElementById('nd-familiya')?.value||'').trim();
  const ism      = (document.getElementById('nd-ism')?.value||'').trim();
  const sharif   = (document.getElementById('nd-sharif')?.value||'').trim();
  const obj      = (document.getElementById('nd-obj')?.value||'').trim();
  const spec     = (document.getElementById('nd-spec')?.value||'').trim();
  const phone    = (document.getElementById('nd-phone')?.value||'').replace(/\D/g,'');

  if (!familiya||!ism||!sharif) { alert('Familiya, Ismi va Sharifi — har birini to\'ldiring!'); return; }
  if (!obj)  { alert('Ish joyini kiriting!'); return; }
  if (!spec) { alert('Mutaxassisligini tanlang!'); return; }
  if (phone.length !== 9) {
    document.getElementById('nd-phone-err').classList.remove('hide');
    alert('Telefon aynan 9 ta raqam bo\'lishi kerak!'); return;
  }
  document.getElementById('nd-phone-err').classList.add('hide');

  const fullName = familiya + ' ' + ism + ' ' + sharif;
  const region   = (document.getElementById('nd-region')?.value||ST.user.region||'').trim();
  const district = (document.getElementById('nd-dist')?.value||ST.user.district||'').trim();
  const fullPhone = '+998' + phone;

  const newDoc = {
    id: 'NEW-'+Date.now(),
    name: fullName, familiya, ism, sharif,
    region, district, object: obj,
    specialty: spec, phone: fullPhone,
    category: document.getElementById('nd-cat')?.value||'',
    status: 'Active', _isNew: true,
  };

  showModal('Ma\'lumotni tekshiring',
    `<div class="irow"><span class="irow-l">Mintaqa</span><span class="irow-v">${region}</span></div>
     <div class="irow"><span class="irow-l">Tuman</span><span class="irow-v">${district}</span></div>
     <div class="irow"><span class="irow-l">Familiya</span><span class="irow-v">${familiya}</span></div>
     <div class="irow"><span class="irow-l">Ismi</span><span class="irow-v">${ism}</span></div>
     <div class="irow"><span class="irow-l">Sharifi</span><span class="irow-v">${sharif}</span></div>
     <div class="irow"><span class="irow-l">Ish joyi</span><span class="irow-v">${obj}</span></div>
     <div class="irow"><span class="irow-l">Mutaxassisligi</span><span class="irow-v">${spec}</span></div>
     <div class="irow"><span class="irow-l">Telefon</span><span class="irow-v">${fullPhone}</span></div>
     <div class="irow"><span class="irow-l">Kategoriya</span><span class="irow-v">${newDoc.category||'—'}</span></div>
     <p style="margin-top:10px;font-size:13px;color:var(--ok)">✅ To'g'ri bo'lsa tasdiqlang — vizit davom etadi.</p>`,
    `<button class="btn btn-o" onclick="closeModal()">← Tahrirlash</button>
     <button class="btn btn-ok" onclick='closeModal();vfFinalizeNewDoctor(${JSON.stringify(newDoc).replace(/'/g,"&apos;")})'>Ha, to'g'ri</button>`);
}

async function vfFinalizeNewDoctor(newDoc) {
  ST.doctors.push(newDoc); ST.visit.target = newDoc; ST.visit.newObjData = newDoc;
  document.getElementById('vf-doc-q').value = newDoc.name;
  document.getElementById('vf-doc-sel').innerHTML = `✅ <b>${newDoc.name}</b> (yangi) · ${newDoc.object}`;
  showEl('vf-doc-sel'); hideEl('vf-new-doc-block');
  document.getElementById('vf-next2').disabled = false;
  await apiPost({ action:'addNewDoctor', ...newDoc, empName:ST.user.name });
}

// ── DORIXONA TANLASH ────────────────────────────────
const TASHKENT_SHAHAR_TUMANLAR=["Chilonzor","Yunusobod","Sergeli","Shayxontohur","Uchtepa","Keles",
  "Mirzo Ulug'bek","Olmazor","Qibray","Yashnobod","Bektemir","Mirobod","Yakkasaroy","Yangihayot"];
// Toshkent shahri MP/agentlari uchun standart 14 ta tuman; viloyat xodimlari uchun
// o'zining ro'yxatdagi rayon(lar)i ko'rsatiladi (#10)
function vfBuildTumanOptions(){
  const own=(ST.user.district||'').split(',').map(s=>s.trim()).filter(Boolean);
  const combined=[...new Set([...own,...TASHKENT_SHAHAR_TUMANLAR])].sort((a,b)=>a.localeCompare(b));
  const myFirst=own[0]||'';
  return combined.map(t=>`<option${t===myFirst?' selected':''}>${t}</option>`).join('');
}
function renderVfStep2Pharmacy() {
  document.getElementById('vfs2').innerHTML = `
    <div class="fg">
      <label>Dorixona qidirish — INN yoki nom <span class="req">*</span></label>
      <div class="search-wrap">
        <input id="vf-pharm-q" placeholder="INN raqam yoki dorixona nomi..." oninput="vfSearchPharm(this.value)" onfocus="vfSearchPharm(this.value,true)" />
      </div>
      <div id="vf-pharm-res" class="slist hide"></div>
    </div>
    <div id="vf-pharm-sel" class="hide"></div>

    <div id="vf-new-pharm-block" class="hide">
      <div class="alert alert-w">Dorixona bazada topilmadi — yangi dorixona ma'lumotlarini kiriting:</div>
      <div class="new-form">
        <!-- Region va rayon MP niki avtomatik -->
        <div class="frow">
          <div class="fg">
            <label>Mintaqa (region)</label>
            <input id="np-region" value="${ST.user.region||'Toshkent shahri'}" readonly style="background:#f0f4ff;color:var(--muted)" />
          </div>
          <div class="fg">
            <label>Tuman (rayon)</label>
            <select id="np-dist">${vfBuildTumanOptions()}</select>
          </div>
        </div>
        <div class="fg">
          <label>INN (aynan 9 ta raqam) <span class="req">*</span></label>
          <input id="np-inn" type="number" maxlength="9" placeholder="205879265"
            oninput="vfValidateINN(this)" />
          <div id="np-inn-err" class="hide" style="color:var(--danger);font-size:12px;margin-top:4px">
            INN aynan 9 ta raqamdan iborat bo'lishi kerak!
          </div>
        </div>
        <div class="fg">
          <!-- Dorixona Yuridik Nomi — qo'lda yoziladi -->
          <label>Dorixona Yuridik Nomi <span class="req">*</span></label>
          <input id="np-name" placeholder="Masalan: DOBRIY DOKTOR AYBOLIT MCHJ" />
        </div>
        <div class="fg">
          <label>Filial raqami <span class="req">*</span></label>
          <input id="np-branch" type="number" min="0" placeholder="Masalan: 1, 2, 5... (yo'q bo'lsa 0)" />
        </div>
        <div class="fg">
          <label>ЛПР F.I.Sh (mas'ul shaxs)</label>
          <input id="np-lpr-name" placeholder="Familiya Ismi Sharifi" />
        </div>
        <div class="fg">
          <label>ЛПР Telefon raqami</label>
          <div style="display:flex;align-items:center;gap:0">
            <span style="background:#eef2fb;border:1.5px solid var(--border);border-right:none;
              padding:10px 12px;border-radius:8px 0 0 8px;font-size:14px;color:var(--muted);white-space:nowrap">+998</span>
            <input id="np-lpr-phone" type="tel" maxlength="9" placeholder="901234567"
              style="border-radius:0 8px 8px 0;border-left:none"
              oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,9)" />
          </div>
        </div>
        <button class="btn btn-ok btn-bl" onclick="vfConfirmNewPharm()">Ma'lumotni tasdiqlash</button>
      </div>
    </div>

    <div class="fg hide" id="vf-branch-block">
      <label>Tuman (rayon) <span class="req">*</span></label>
      <select id="vf-pharm-tuman" onchange="ST.visit.vals.pharmTuman=this.value;vfCheckBranchReady();">
        <option value="">— Tanlang —</option>
        ${vfBuildTumanOptions()}
      </select>
      <label style="margin-top:10px">Filial raqami <span class="req">*</span></label>
      <div id="vf-branch-known" class="alert alert-ok hide"></div>
      <div id="vf-branch-ask" class="hide">
        <input id="vf-branch-no" type="number" min="1" placeholder="Masalan: 2 yoki 45..."
          oninput="ST.visit.vals.branchNo=this.value;vfCheckBranchReady();" />
      </div>
      <div class="fg" style="margin-top:10px">
        <label>ЛПР F.I.Sh (mas'ul shaxs) <span class="req">*</span></label>
        <input id="vf-pharm-lpr-name" placeholder="Familiya Ismi Sharifi" oninput="vfCheckBranchReady();" />
      </div>
      <div class="fg">
        <label>ЛПР Telefon raqami <span class="req">*</span></label>
        <div style="display:flex;align-items:center;gap:0">
          <span style="background:#eef2fb;border:1.5px solid var(--border);border-right:none;
            padding:10px 12px;border-radius:8px 0 0 8px;font-size:14px;color:var(--muted);white-space:nowrap">+998</span>
          <input id="vf-pharm-lpr-phone" type="tel" maxlength="9" placeholder="901234567"
            style="border-radius:0 8px 8px 0;border-left:none"
            oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,9);vfCheckBranchReady();" />
        </div>
      </div>
      <div class="fg">
        <label>ЛПУ (obyekt nomi) <span class="req">*</span></label>
        <input id="vf-pharm-lpu" placeholder="Masalan: 6-Oilaviy Poliklinika" oninput="vfCheckBranchReady();" />
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-o" onclick="vfShowStep(1)">← Orqaga</button>
      <button class="btn btn-p" id="vf-next2" onclick="vfStartTimer()" disabled>Vizitni boshlash ▶</button>
    </div>`;
}

function vfValidateINN(input) {
  const val = input.value.replace(/\D/g,'').slice(0,9);
  input.value = val;
  const err = document.getElementById('np-inn-err');
  if (err) err.classList.toggle('hide', val.length===0||val.length===9);
}

function vfSearchPharm(q, isFocus) {
  q = (q||'').trim();
  const dist=(ST.user.district||'').toLowerCase();
  let res;
  if (q.length < 2) {
    if (!isFocus) { hideEl('vf-pharm-res'); return; }
    res = dist ? ST.pharmacies.filter(r => (r.district||'').toLowerCase()===dist) : ST.pharmacies.slice();
  } else {
    const ql = q.toLowerCase();
    res = ST.pharmacies.filter(r =>
      (r.inn||'').includes(q) || (r.legalName||'').toLowerCase().includes(ql)
    );
  }
  // INN bo'yicha noyoblashtiramiz — har filial emas, har KOMPANIYA uchun 1 ta natija (#3)
  const uniqMap=new Map();
  res.forEach(r=>{ if(!uniqMap.has(r.inn)) uniqMap.set(r.inn,r); });
  res = [...uniqMap.values()].sort((a,b)=>{
    const ad=(a.district||'').toLowerCase()===dist?0:1;
    const bd=(b.district||'').toLowerCase()===dist?0:1;
    return ad-bd;
  }).slice(0, 10);
  window._pharmSearchRes = res;
  const box = document.getElementById('vf-pharm-res');
  if (!res.length) {
    box.innerHTML = '<div class="sitem"><span class="sitem-meta">Topilmadi — pastda yangi dorixona qo\'shing</span></div>';
    showEl('vf-new-pharm-block'); hideEl('vf-branch-block');
  } else {
    hideEl('vf-new-pharm-block');
    box.innerHTML = res.map((r,i) => `
      <div class="sitem" onclick="vfSelectPharmByIdx(${i})">
        <span class="sitem-name">${r.legalName}</span>
        <span class="sitem-meta">INN: ${r.inn}</span>
      </div>`).join('');
  }
  showEl('vf-pharm-res');
}

function vfSelectPharmByIdx(i) {
  const r = (window._pharmSearchRes||[])[i];
  if (r) vfSelectPharm(r);
}
function vfCheckBranchReady(){
  const tuman=document.getElementById('vf-pharm-tuman')?.value||'';
  const branch=ST.visit.vals.branchNo;
  const lprName=(document.getElementById('vf-pharm-lpr-name')?.value||'').trim();
  const lprPhoneRaw=(document.getElementById('vf-pharm-lpr-phone')?.value||'').trim();
  const lpu=(document.getElementById('vf-pharm-lpu')?.value||'').trim();
  // Har bir o'zgarishda darhol ST.visit'ga yozamiz — bosqich almashsa ham yo'qolmasin
  ST.visit._lprData={
    lprName, lprPhone:lprPhoneRaw?('+998'+lprPhoneRaw):'', lpuObject:lpu,
    paymentType:ST.visit._lprData?.paymentType||'',
  };
  ST.visit.vals.pharmTuman=tuman;
  const btn=document.getElementById('vf-next2');
  if(btn) btn.disabled = !(tuman && branch && lprName && lprPhoneRaw.length===9 && lpu);
}
function vfSelectPharm(r) {
  ST.visit.target = r;
  hideEl('vf-pharm-res'); hideEl('vf-new-pharm-block');
  document.getElementById('vf-pharm-q').value = r.legalName;
  document.getElementById('vf-pharm-sel').innerHTML =
    `<div class="alert alert-ok">✅ <b>${r.legalName}</b> · INN: ${r.inn}</div>`;
  showEl('vf-pharm-sel');
  showEl('vf-branch-block');
  hideEl('vf-branch-known'); showEl('vf-branch-ask');
  const isNew=!!r._isNew;
  ST.visit.vals.branchNo = isNew?(r.branch||''):'';
  const branchInp=document.getElementById('vf-branch-no'); if(branchInp) branchInp.value=isNew?(r.branch||''):'';
  const tumanSel=document.getElementById('vf-pharm-tuman'); if(tumanSel) tumanSel.value=isNew?(r.district||''):'';
  ST.visit.vals.pharmTuman = isNew?(r.district||''):'';
  // Yangi qo'shilgan dorixonada ЛПР ma'lumoti allaqachon bo'lsa — qayta so'ramaymiz
  const lprNameInp=document.getElementById('vf-pharm-lpr-name'); if(lprNameInp) lprNameInp.value=isNew?(r.lprName||''):'';
  const lprPhoneInp=document.getElementById('vf-pharm-lpr-phone'); if(lprPhoneInp) lprPhoneInp.value=isNew?(r.lprPhone||'').replace('+998',''):'';
  const lpuInp=document.getElementById('vf-pharm-lpu'); if(lpuInp) lpuInp.value=isNew?(r.lpuObject||''):'';
  vfCheckBranchReady();
}


function vfConfirmNewPharm() {
  const inn = (document.getElementById('np-inn')?.value||'').replace(/\D/g,'');
  const name = (document.getElementById('np-name')?.value||'').trim();
  const dist = (document.getElementById('np-dist')?.value||'').trim();
  const branchVal = (document.getElementById('np-branch')?.value||'').trim();
  const lprName = (document.getElementById('np-lpr-name')?.value||'').trim();
  const lprPhoneRaw = (document.getElementById('np-lpr-phone')?.value||'').replace(/\D/g,'');
  if (inn.length !== 9) { alert('INN aynan 9 ta raqam bo\'lishi kerak!'); return; }
  if (!name) { alert('Dorixona Yuridik Nomini kiriting!'); return; }
  if (branchVal==='') { alert('Filial raqamini kiriting (yo\'q bo\'lsa 0 yozing)!'); return; }
  if (lprPhoneRaw && lprPhoneRaw.length !== 9) { alert('ЛПР telefon aynan 9 ta raqamdan iborat bo\'lishi kerak!'); return; }
  const lprPhone = lprPhoneRaw ? '+998'+lprPhoneRaw : '';

  const region = (document.getElementById('np-region')?.value||ST.user.region||'').trim();
  const newP = { id:'NEW-'+Date.now(), region, district:dist, inn, legalName:name, branch:branchVal, lprName, lprPhone, _isNew:true };

  showModal('Ma\'lumotni tekshiring',
    `<div class="irow"><span class="irow-l">Mintaqa</span><span class="irow-v">${region}</span></div>
     <div class="irow"><span class="irow-l">Tuman</span><span class="irow-v">${dist}</span></div>
     <div class="irow"><span class="irow-l">INN</span><span class="irow-v">${inn}</span></div>
     <div class="irow"><span class="irow-l">Yuridik Nomi</span><span class="irow-v">${name}</span></div>
     ${lprName?`<div class="irow"><span class="irow-l">ЛПР</span><span class="irow-v">${lprName}</span></div>`:''}
     ${lprPhone?`<div class="irow"><span class="irow-l">ЛПР tel</span><span class="irow-v">${lprPhone}</span></div>`:''}
     <p style="margin-top:10px;font-size:13px;color:var(--ok)">To'g'rimi?</p>`,
    `<button class="btn btn-o" onclick="closeModal()">← Tahrirlash</button>
     <button class="btn btn-ok" onclick='closeModal();vfFinalizeNewPharm(${JSON.stringify(newP).replace(/'/g,"&apos;")})'>Ha, to'g'ri</button>`);
}

async function vfFinalizeNewPharm(newP) {
  ST.pharmacies.push(newP); ST.visit.target = newP; ST.visit.newObjData = newP;
  ST.visit.vals.pharmTuman = newP.district||'';
  document.getElementById('vf-pharm-sel').innerHTML =
    `<div class="alert alert-ok">✅ <b>${newP.legalName}</b> (yangi) · ${newP.district}</div>`;
  showEl('vf-pharm-sel'); showEl('vf-branch-block');
  const tumanSel2=document.getElementById('vf-pharm-tuman'); if(tumanSel2) tumanSel2.value=newP.district||'';
  const branchVal = (newP.branch||'').toString().trim();
  if (branchVal) {
    // Filial raqami dorixona qo'shish shaklida allaqachon kiritilgan — qayta so'ramaymiz
    ST.visit.vals.branchNo = branchVal;
    document.getElementById('vf-branch-known').innerHTML = `✅ Filial raqami: <b>${branchVal}</b>`;
    showEl('vf-branch-known'); hideEl('vf-branch-ask');
  } else {
    // Bo'sh qoldirilgan — filial yo'q deb hisoblab, bazaga 0 sifatida yozamiz, qayta so'ramaymiz
    ST.visit.vals.branchNo = 0;
    hideEl('vf-branch-known'); hideEl('vf-branch-ask');
  }
  // ЛПР F.I.Sh/telefon dorixona qo'shish shaklida kiritilgan bo'lsa — Stage 2 maydonlariga o'tkazamiz
  const lprNameInp2=document.getElementById('vf-pharm-lpr-name'); if(lprNameInp2) lprNameInp2.value=newP.lprName||'';
  const lprPhoneInp2=document.getElementById('vf-pharm-lpr-phone'); if(lprPhoneInp2) lprPhoneInp2.value=(newP.lprPhone||'').replace('+998','');
  // ЛПУ (obyekt nomi) — yangi dorixona shaklida so'ralmagan, hali ham to'ldirilishi kerak
  vfCheckBranchReady(); // tugma FAQAT hamma maydon (jumladan ЛПУ) to'ldirilganda yoqiladi
  // Bazaga yuborish (INN + Yuridik Nomi)
  await apiPost({ action:'addNewPharmacy', ...newP, empName:ST.user.name });
}

// ── TIMER ───────────────────────────────────────────
function vfStartTimer() {
  if (!ST.visit.target) { alert('Ob\'ektni tanlang!'); return; }
  if(ST.visit.type==='pharmacy'){
    const lprPhoneRaw=(document.getElementById('vf-pharm-lpr-phone')?.value||'').replace(/\D/g,'');
    ST.visit._lprData={
      lprName:(document.getElementById('vf-pharm-lpr-name')?.value||'').trim(),
      lprPhone:lprPhoneRaw?('+998'+lprPhoneRaw):'',
      lpuObject:(document.getElementById('vf-pharm-lpu')?.value||'').trim(),
    };
  }
  ST.visit.timerStart = Date.now();
  vfShowStep(3);
  ST.visit.timerRef = setInterval(vfUpdateTimer, 1000);
  saveActiveVisitProgress();
}
// Tugallanmagan vizitni saqlaymiz — ilova yopilib qolsa ham vaqt to'g'ri hisoblanishi uchun (#15)
function saveActiveVisitProgress(){
  try{
    localStorage.setItem('ff_active_visit_'+ST.user.id, JSON.stringify({
      type:ST.visit.type, target:ST.visit.target, timerStart:ST.visit.timerStart,
      gpsStart:ST.visit.gpsStart, date:todayStr(),
      lprData:ST.visit._lprData||null, branchNo:ST.visit.vals?.branchNo||'', pharmTuman:ST.visit.vals?.pharmTuman||''
    }));
  }catch(e){}
}
function clearActiveVisitProgress(){
  try{ localStorage.removeItem('ff_active_visit_'+ST.user.id); }catch(e){}
}
function checkResumeActiveVisit(){
  try{
    const raw=localStorage.getItem('ff_active_visit_'+ST.user.id);
    if(!raw) return;
    const saved=JSON.parse(raw);
    if(saved.date!==todayStr()){ clearActiveVisitProgress(); return; }
    if(!confirm('Tugallanmagan vizit topildi ('+(saved.target?.name||saved.target?.legalName||'')+'). Davom etasizmi?')){
      clearActiveVisitProgress(); return;
    }
    ST.visit = { type:saved.type, target:saved.target, gpsStart:saved.gpsStart, gpsEnd:null,
      timerStart:saved.timerStart, timerRef:null,
      vals:{promoRequested:false,promaSumma:0,branchNo:saved.branchNo||'',pharmTuman:saved.pharmTuman||''},
      products:[], fotoData:null, _lprData:saved.lprData||null };
    const c=document.getElementById('visit-flow-container');
    c.innerHTML=visitFlowHTML(saved.type);
    c.scrollIntoView({behavior:'smooth'});
    vfShowStep(3);
    ST.visit.timerRef=setInterval(vfUpdateTimer,1000);
  }catch(e){}
}
function vfUpdateTimer() {
  const s = Math.floor((Date.now() - ST.visit.timerStart) / 1000);
  const el = document.getElementById('vf-timer-val');
  if (el) el.textContent = String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  const w = document.getElementById('vf-timer-warn');
  if (w) w.classList.toggle('hide', s >= MIN_VISIT_SEC);
}

async function vfSaveBranchToBase() {
  if (ST.visit.type !== 'pharmacy' || !ST.visit.target.rowNum) return;
  const branch = ST.visit.vals.branchNo;
  if (branch && branch !== ST.visit.target.branch) {
    await apiPost({ action:'saveBranchNo', rowNum:ST.visit.target.rowNum, branchNo:branch });
    ST.visit.target.branch = branch;
  }
}
