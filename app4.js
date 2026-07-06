// app4.js v10 — SO'ROVNOMA (Vrach va Dorixona)
// Tuzatishlar:
// - Natija: 5 variantdan faqat 1 tasi tanlanadi
// - Proma: faqat raqam kiritiladi, CHAP=O'TKAZIB, O'NG=SO'ROV
// - Probnik: 1 tanlash
// - Preparat soni MAJBURIY (0 bo'lmagan)
// - Foto: tez ishlashi uchun yuklanmoqda olib tashlandi

function renderVfStep3() {
  const isDoc = ST.visit.type==='doctor';
  document.getElementById('vfs3').innerHTML = `
    <div class="timer-box">
      <div>
        <div style="font-size:11px;opacity:.8">Vizit davom etmoqda</div>
        <div class="timer-val" id="vf-timer-val">00:00</div>
        <div class="timer-warn hide" id="vf-timer-warn">Minimal 5 daqiqa kerak</div>
      </div>
      <div style="text-align:right;font-size:12px;opacity:.85">
        ${isDoc ? (ST.visit.target.name||'') : (ST.visit.target.legalName||'')}
      </div>
    </div>
    ${isDoc ? renderDoctorForm() : renderPharmacyFormStage1()}
    <div class="card" style="margin-top:14px">
      <div class="card-h">Izoh</div>
      <div class="card-b">
        <textarea id="vf-comment" rows="3" placeholder="Izoh qoldiring..."></textarea>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn btn-o" onclick="vfBackToStep2()">← Orqaga</button>
      <button class="btn btn-p btn-lg" onclick="vfGoToFoto()">Yakunlash qismiga o'tish ✅</button>
    </div>`;
}

function vfBackToStep2() {
  if (!confirm('Orqaga qaytsangiz vizit vaqti to\'xtaydi. Davom etasizmi?')) return;
  clearInterval(ST.visit.timerRef); vfShowStep(2);
}

// ── VRACH SO'ROVNOMASI ──────────────────────────────
function renderDoctorForm() {
  return `
  <div class="card">
    <div class="card-h">Vizit maqsadi <span style="font-size:11px;opacity:.7">(1 tanlang)</span></div>
    <div class="card-b">
      <div class="rg" id="rg-goal">
        <div class="ropt" onclick="vfPickOne(this,'rg-goal','goal','TANISHUV')">TANISHUV</div>
        <div class="ropt" onclick="vfPickOne(this,'rg-goal','goal','PREPARAT ESLATISH')">PREPARAT ESLATISH</div>
        <div class="ropt" onclick="vfPickOne(this,'rg-goal','goal','KELISHUV')">KELISHUV</div>
        <div class="ropt" onclick="vfPickOne(this,'rg-goal','goal','BOSHQA')">BOSHQA</div>
      </div>
      <div class="fg hide" id="vf-goal-other-block" style="margin-top:8px">
        <input id="vf-goal-other" placeholder="Maqsadni yozing..." />
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h">Tavsiya etilgan preparatlar <span style="font-size:11px;opacity:.7">(soni majburiy)</span></div>
    <div class="card-b">
      <div class="alert alert-i">Har bir preparatning sonini kiriting (0 dan katta).</div>
      <div id="vf-products-list"></div>
      <button class="btn btn-o" style="margin-top:8px" onclick="vfAddProductRow()">+ Preparat qo'shish</button>
    </div>
  </div>

  <div class="card">
    <div class="card-h">Probnik <span style="font-size:11px;opacity:.7">(1 tanlang)</span></div>
    <div class="card-b">
      <div style="display:flex;gap:10px">
        <div id="prob-yes" onclick="vfPickProbnik('Ha')"
          style="flex:1;padding:11px;border-radius:9px;border:2px solid #dde3ef;
            background:#f8fafd;font-size:13px;font-weight:600;cursor:pointer;
            text-align:center;user-select:none;transition:.15s">
          So'raldi
        </div>
        <div id="prob-no" onclick="vfPickProbnik('No')"
          style="flex:1;padding:11px;border-radius:9px;border:2px solid #dde3ef;
            background:#f8fafd;font-size:13px;font-weight:600;cursor:pointer;
            text-align:center;user-select:none;transition:.15s">
          So'ralmadi
        </div>
      </div>
      <div id="vf-probnik-preps" class="hide" style="margin-top:10px;max-height:300px;overflow-y:auto">
        <div class="alert alert-i" style="font-size:12px">Qaysi preparatdan probnik so'raldi?</div>
        <div id="vf-probnik-list"></div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h">Natija <span style="font-size:11px;opacity:.7">(faqat 1 tanlang)</span></div>
    <div class="card-b">
      <!-- 5 variant, faqat 1 tanlanadi — boshqasi avtomatik bekor bo'ladi -->
      <div id="rg-result" style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
        <div class="ropt" onclick="vfPickOne(this,'rg-result','result','ISHLAYDI')">✅ ISHLAYDI</div>
        <div class="ropt" onclick="vfPickOne(this,'rg-result','result','INFO')">ℹ️ INFO</div>
        <div class="ropt" onclick="vfPickOne(this,'rg-result','result','O\\'YLAMOQDA')">🤔 O'YLAMOQDA</div>
        <div class="ropt" onclick="vfPickOne(this,'rg-result','result','QABUL QILMADI')">❌ QABUL QILMADI</div>
        <div class="ropt" style="grid-column:span 2" onclick="vfPickOne(this,'rg-result','result','BOSHQA')">✏️ BOSHQA (izoh yozing)</div>
      </div>
      <div class="fg hide" id="vf-result-other-block" style="margin-top:8px">
        <input id="vf-result-other" placeholder="Natijani yozing..." />
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h">PROMA</div>
    <div class="card-b">
      <!-- CHAP = O'tkazib yuborish, O'NG = Menejerga so'rov -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" id="rg-promo">
        <div class="ropt on" onclick="vfPickProma(this,false)" id="proma-skip"
          style="flex-direction:column;padding:14px;justify-content:center;text-align:center">
          <div style="font-size:20px">⏭️</div>
          <b>O'TKAZIB YUBORISH</b>
        </div>
        <div class="ropt" onclick="vfPickProma(this,true)" id="proma-send"
          style="flex-direction:column;padding:14px;justify-content:center;text-align:center">
          <div style="font-size:20px">💰</div>
          <b>Menejerga so'rov</b>
        </div>
      </div>
      <!-- Faqat raqam kiritish, max 9999999 -->
      <div id="vf-promo-sum-block" class="hide" style="margin-top:10px">
        <label style="font-size:12px;color:var(--muted);margin-bottom:6px;display:block">
          PROMA SUMMASI (so'm) — faqat raqam
        </label>
        <input id="vf-promo-summa" type="number" min="0" max="9999999"
          placeholder="Masalan: 200000"
          oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,7)"
          style="font-size:18px;font-weight:700;text-align:center" />
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h">Keyingi vizit sanasi</div>
    <div class="card-b">
      <input type="date" id="vf-next-date" value="${nextWeekStr()}" />
    </div>
  </div>`;
}

function nextWeekStr(){const d=new Date();d.setDate(d.getDate()+7);return d.toISOString().split('T')[0];}

// Faqat 1 tanlash — boshqalari bekor bo'ladi
function vfPickOne(el, containerId, key, val) {
  const container = document.getElementById(containerId);
  if(container) container.querySelectorAll('.ropt').forEach(r=>r.classList.remove('on'));
  el.classList.add('on');
  ST.visit.vals[key] = val;
  if(key==='goal') tgl('vf-goal-other-block', val==='BOSHQA');
  if(key==='result') tgl('vf-result-other-block', val==='BOSHQA');
}

// Probnik tanlash — So'raldi bosilganda 25 preparat chiqadi
function vfPickProbnik(val) {
  const yes = document.getElementById('prob-yes');
  const no  = document.getElementById('prob-no');
  // Avval ikkalasini NORMAL holatga qaytaramiz
  [yes, no].forEach(el => {
    if(!el) return;
    el.style.background = '#f8fafd';
    el.style.border = '2px solid #dde3ef';
    el.style.color = 'inherit';
  });
  // Tanlanganni ACTIVE qilamiz
  const picked = val === 'Ha' ? yes : no;
  if(picked) {
    picked.style.background = '#dce8f7';
    picked.style.border = '2px solid #2557a7';
    picked.style.color = '#1a3a72';
  }
  ST.visit.vals.sample = (val === 'Ha') ? 'Ha' : "Yo'q";
  const block = document.getElementById('vf-probnik-preps');
  if (val === 'Ha') {
    if(block) block.classList.remove('hide');
    renderProbnikList25();
  } else {
    if(block) block.classList.add('hide');
    ST.visit.vals.probnikPreps = [];
  }
}
function renderProbnikList25() {
  const el = document.getElementById('vf-probnik-list'); if(!el) return;
  // Barcha 25 preparat
  el.innerHTML = PREPS.map((p,i) => `
    <div class="ropt" style="margin-bottom:5px;font-size:12px;padding:7px 10px"
      onclick="vfToggleProbnik25(this,'${p.replace(/'/g,"\'")}')">
      ${p}
    </div>`).join('');
}
function vfToggleProbnik25(el, prep) {
  el.classList.toggle('on');
  if (!ST.visit.vals.probnikPreps) ST.visit.vals.probnikPreps = [];
  if (el.classList.contains('on')) {
    ST.visit.vals.probnikPreps.push(prep);
  } else {
    ST.visit.vals.probnikPreps = ST.visit.vals.probnikPreps.filter(p=>p!==prep);
  }
}

// Proma tanlash
function vfPickProma(el, want) {
  document.querySelectorAll('#rg-promo .ropt').forEach(r=>r.classList.remove('on'));
  el.classList.add('on');
  ST.visit.vals.promoRequested = want;
  tgl('vf-promo-sum-block', want);
  if(!want) {
    const inp = document.getElementById('vf-promo-summa');
    if(inp) inp.value='';
    ST.visit.vals.promaSumma = 0;
  }
}

// Preparat qo'shish/o'chirish
function vfAddProductRow() {
  if(ST.visit.products.length>=25){alert('Barcha preparatlar qo\'shilgan');return;}
  ST.visit.products.push({name:'',qty:0});
  renderProductRows();
}
function renderProductRows() {
  const el=document.getElementById('vf-products-list');if(!el)return;
  el.innerHTML=ST.visit.products.map((p,i)=>`
    <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
      <select style="flex:1" onchange="vfUpdateProduct(${i},'name',this.value)">
        <option value="">— Preparat tanlang —</option>
        ${PREPS.map(pr=>`<option value="${pr}"${p.name===pr?' selected':''}>${pr}</option>`).join('')}
      </select>
      <!-- Soni MAJBURIY, 0 bo'lmasin -->
      <input type="number" min="1" max="999" placeholder="Soni*" value="${p.qty||''}"
        style="width:72px;border-color:${!p.qty?'var(--accent)':'var(--border)'}"
        oninput="vfUpdateProduct(${i},'qty',this.value);this.style.borderColor=this.value>0?'var(--border)':'var(--accent)'" />
      <button class="btn btn-o" style="padding:8px 11px;border-color:var(--border)" onclick="vfRemoveProduct(${i})">✕</button>
    </div>`).join('');
}
function vfUpdateProduct(i,key,val){
  ST.visit.products[i][key]=key==='qty'?Math.max(0,Number(val)||0):val;
}
function vfRemoveProduct(i){ST.visit.products.splice(i,1);renderProductRows();}

// Yakunlash qismiga o'tish — validatsiya
function vfGoToFoto() {
  const comment=(document.getElementById('vf-comment')?.value||'').trim();
  if(!comment){alert('Izoh qoldiring!');return;}

  if(ST.visit.type==='doctor') {
    if(!ST.visit.vals.goal){alert('Vizit maqsadini tanlang!');return;}
    if(ST.visit.vals.goal==='BOSHQA'&&!(document.getElementById('vf-goal-other')?.value||'').trim()){
      alert('Maqsadni yozing!');return;
    }
    if(!ST.visit.vals.sample){alert('Probnik bo\'yicha tanlov qiling (So\'raldi / So\'ralmadi)!');return;}
    if(ST.visit.vals.sample==='Ha'&&(!ST.visit.vals.probnikPreps||ST.visit.vals.probnikPreps.length===0)){
      alert('Qaysi preparatdan probnik so\'ralganligi tanlang!');return;
    }
    if(!ST.visit.vals.result){alert('Natijani tanlang!');return;}
    if(ST.visit.vals.result==='BOSHQA'&&!(document.getElementById('vf-result-other')?.value||'').trim()){
      alert('Natijani yozing!');return;
    }
    // Preparat soni tekshiruv
    if(ST.visit.products.length>0){
      const badProd=ST.visit.products.find(p=>p.name&&(!p.qty||Number(p.qty)<=0));
      if(badProd){alert('"'+badProd.name+'" preparatining sonini kiriting (0 bo\'lmasin)!');return;}
    }
    // Proma summa tekshiruv
    if(ST.visit.vals.promoRequested) {
      const sum=Number(document.getElementById('vf-promo-summa')?.value)||0;
      if(!sum){alert('Proma summasi kiriting!');return;}
      ST.visit.vals.promaSumma=sum;
    } else {
      ST.visit.vals.promaSumma=0;
    }
  } else {
    // Dorixona — qoldiq bosqichi tugagan bo'lishi kerak
    if(!document.getElementById('vf-stock-tbody')){
      alert('Avval qoldiq bosqichini tugatib "Qoldiqni kiritish" tugmasini bosing!');return;
    }
  }

  const elapsed=Math.floor((Date.now()-ST.visit.timerStart)/1000);
  if(elapsed<MIN_VISIT_SEC){
    showModal('Vizit juda qisqa',
      `<p style="font-size:14px;line-height:1.6">Faqat <b>${elapsed}</b> soniya o'tdi. Minimal <b>5 daqiqa</b> kerak.<br>Baribir davom etish mumkin — lekin shubhali deb belgilanadi.</p>`,
      '<button class="btn btn-o" onclick="closeModal()">Kutaman</button> <button class="btn btn-r" onclick="closeModal();vfShowStep(4)">Davom etish</button>');
    return;
  }
  clearInterval(ST.visit.timerRef);
  vfShowStep(4); // 4 = yakunlash (foto yo'q)
}

// ── DORIXONA: BRON + QOLDIQ ─────────────────────────
let pharmStage=1, bronData={};

function renderPharmacyFormStage1(){
  pharmStage=1;bronData={};
  return `
  <div class="card" id="pharm-stage-card">
    <div class="card-h">
      <span id="pharm-stage-title">Bosqich 1: Preparat BRON</span>
      <span class="bdg bdg-y" style="margin-left:auto">1 / 2</span>
    </div>
    <div class="card-b">
      <div class="alert alert-i">Aptekaga bron qilingan (kelishilgan) preparatlar sonini kiriting. 0 qoldirishingiz mumkin.</div>
      <table class="stbl">
        <thead><tr><th>#</th><th>Preparat</th><th>Bron</th><th>Narxi</th><th>Summa</th></tr></thead>
        <tbody id="vf-bron-tbody"></tbody>
      </table>
      <div style="text-align:right;margin-top:10px;font-weight:800;font-size:15px;color:var(--ok)">
        Jami bron: <span id="vf-bron-total">0 so'm</span>
      </div>
      <div class="btn-row">
        <button class="btn btn-p" onclick="vfPharmGoStage2()">Qoldiqni kiritish →</button>
      </div>
    </div>
  </div>`;
}

function buildBronTable(){
  const tbody=document.getElementById('vf-bron-tbody');if(!tbody)return;
  tbody.innerHTML=PREPS.map((p,i)=>`
    <tr>
      <td style="color:var(--muted);font-size:11px">${i+1}</td>
      <td style="font-size:11px">${p}</td>
      <td><input type="number" min="0" placeholder="0" id="vf-bron-${i}" oninput="vfUpdateBronSum()" /></td>
      <td style="font-size:11px;color:var(--muted)">${fmtMoney(PRICES[p]||0)}</td>
      <td class="sum-cell" id="vf-bron-sum-${i}">0</td>
    </tr>`).join('');
}

function vfUpdateBronSum(){
  let total=0;
  PREPS.forEach((p,i)=>{
    const qty=Number(document.getElementById('vf-bron-'+i)?.value)||0;
    const sum=qty*(PRICES[p]||0);
    const s=document.getElementById('vf-bron-sum-'+i);if(s)s.textContent=sum?fmtMoney(sum):'0';
    total+=sum;
  });
  const t=document.getElementById('vf-bron-total');if(t)t.textContent=fmtMoney(total);
}

function vfPharmGoStage2(){
  PREPS.forEach((p,i)=>{bronData[p]=Number(document.getElementById('vf-bron-'+i)?.value)||0;});
  const card=document.getElementById('pharm-stage-card');
  card.innerHTML=`
    <div class="card-h"><span>Bosqich 2: Qoldiq kiritish</span>
      <span class="bdg bdg-g" style="margin-left:auto">2 / 2</span></div>
    <div class="card-b">
      <div class="alert alert-i">Aptekada hozirgi <b>qoldiq</b> sonini kiriting.</div>
      <table class="stbl">
        <thead><tr><th>#</th><th>Preparat</th><th>Qoldiq</th><th>Narxi</th><th>Summa</th></tr></thead>
        <tbody id="vf-stock-tbody"></tbody>
      </table>
      <div style="text-align:right;margin-top:10px;font-weight:800;font-size:15px;color:var(--ok)">
        Jami qoldiq: <span id="vf-stock-total">0 so'm</span>
      </div>
      <div class="btn-row">
        <button class="btn btn-o" onclick="vfPharmBackStage()">← Bron bosqichiga qaytish</button>
      </div>
    </div>`;
  buildStockTableRows();
}

function vfPharmBackStage(){
  const card=document.getElementById('pharm-stage-card');
  card.innerHTML=`
    <div class="card-h"><span id="pharm-stage-title">Bosqich 1: Preparat BRON</span>
      <span class="bdg bdg-y" style="margin-left:auto">1 / 2</span></div>
    <div class="card-b">
      <div class="alert alert-i">Bron sonini kiriting. 0 qoldirish mumkin.</div>
      <table class="stbl">
        <thead><tr><th>#</th><th>Preparat</th><th>Bron</th><th>Narxi</th><th>Summa</th></tr></thead>
        <tbody id="vf-bron-tbody"></tbody>
      </table>
      <div style="text-align:right;margin-top:10px;font-weight:800;font-size:15px;color:var(--ok)">
        Jami bron: <span id="vf-bron-total">0 so'm</span>
      </div>
      <div class="btn-row">
        <button class="btn btn-p" onclick="vfPharmGoStage2()">Qoldiqni kiritish →</button>
      </div>
    </div>`;
  buildBronTable();
  PREPS.forEach((p,i)=>{const inp=document.getElementById('vf-bron-'+i);if(inp&&bronData[p])inp.value=bronData[p];});
  vfUpdateBronSum();
}

function buildStockTableRows(){
  const tbody=document.getElementById('vf-stock-tbody');if(!tbody)return;
  tbody.innerHTML=PREPS.map((p,i)=>`
    <tr>
      <td style="color:var(--muted);font-size:11px">${i+1}</td>
      <td style="font-size:11px">${p}</td>
      <td><input type="number" min="0" placeholder="0" id="vf-st-${i}" oninput="vfUpdateStockSum()" /></td>
      <td style="font-size:11px;color:var(--muted)">${fmtMoney(PRICES[p]||0)}</td>
      <td class="sum-cell" id="vf-sum-${i}">0</td>
    </tr>`).join('');
}

function vfUpdateStockSum(){
  let total=0;
  PREPS.forEach((p,i)=>{
    const qty=Number(document.getElementById('vf-st-'+i)?.value)||0;
    const sum=qty*(PRICES[p]||0);
    const s=document.getElementById('vf-sum-'+i);if(s)s.textContent=sum?fmtMoney(sum):'0';
    total+=sum;
  });
  const t=document.getElementById('vf-stock-total');if(t)t.textContent=fmtMoney(total);
}

function getBronAndStockData(){
  const bron=PREPS.map((p,i)=>({prep:p,qty:Number(document.getElementById('vf-bron-'+i)?.value)||0}));
  const stock=PREPS.map((p,i)=>({prep:p,qty:Number(document.getElementById('vf-st-'+i)?.value)||0}));
  return{bron,stock};
}
