// ╔════════════════════════════════════════════════════════════════╗
// ║  app4.js v7 — SO'ROVNOMA: Vrach va Dorixona (BRON + QOLDIQ)    ║
// ║  Tuzatishlar:                                                   ║
// ║  - "OYLAMOQDA" → "O'YLAMOQDA" (imlo to'g'ri)                  ║
// ║  - "PROMO" sarlavhasi → faqat "PROMA"                          ║
// ║  - O'tkazib yuborishda bazaga "0" tushadi                       ║
// ║  - "Siz pul bermaysiz" ogohlantirishni olib tashlash            ║
// ║  - "Menejerga so'rov yuborish" matni                            ║
// ║  - Bron: narxlar ko'rinadi, summasi chiqadi                     ║
// ║  - Bron: faqat tanlangan preparatlar, 0 qolsa ham o'tadi        ║
// ║  - 2-bosqichda bron qayta kiritilmaydi — faqat qoldiq           ║
// ║  - Komentariya: "Izoh qoldiring" (majburiy so'zi olib tashlandi)║
// ║  - "Vizit muvaffaqiyatli saqlandi!" → "tugatildi!"              ║
// ╚════════════════════════════════════════════════════════════════╝

function renderVfStep3() {
  const isDoc=ST.visit.type==='doctor';
  document.getElementById('vfs3').innerHTML=`
    <div class="timer-box">
      <div>
        <div style="font-size:11px;opacity:.8">Vizit davom etmoqda</div>
        <div class="timer-val" id="vf-timer-val">00:00</div>
        <div class="timer-warn hide" id="vf-timer-warn">Minimal 5 daqiqa kerak</div>
      </div>
      <div style="text-align:right;font-size:12px;opacity:.85">
        ${isDoc?(ST.visit.target.name||''):(ST.visit.target.legalName||'')}
      </div>
    </div>
    ${isDoc ? renderDoctorForm() : renderPharmacyFormStage1()}
    <div class="card" style="margin-top:14px">
      <div class="card-h">Izoh</div>
      <div class="card-b">
        <!-- "Majburiy" so'zi olib tashlandi, shunchaki placeholder bilan -->
        <textarea id="vf-comment" rows="3" placeholder="Izoh qoldiring..."></textarea>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn btn-o" onclick="vfBackToStep2()">← Orqaga</button>
      <button class="btn btn-p btn-lg" onclick="vfGoToFoto()">Foto bosqichiga o'tish 📸</button>
    </div>`;
}

function vfBackToStep2() {
  if(!confirm('Orqaga qaytsangiz vizit vaqti to\'xtaydi. Davom etasizmi?')) return;
  clearInterval(ST.visit.timerRef); vfShowStep(2);
}

// ════════════════════════════════════════════════════════════════
// VRACH SO'ROVNOMASI
// ════════════════════════════════════════════════════════════════
function renderDoctorForm() {
  return `
  <div class="card">
    <div class="card-h">Vizit maqsadi</div>
    <div class="card-b">
      <div class="rg">
        <div class="ropt" onclick="vfSelectR(this,'goal','TANISHUV')">TANISHUV</div>
        <div class="ropt" onclick="vfSelectR(this,'goal','PREPATNI ESLATISH')">PREPATNI ESLATISH</div>
        <div class="ropt" onclick="vfSelectR(this,'goal','KELISHUV')">KELISHUV</div>
        <div class="ropt" onclick="vfSelectR(this,'goal','BOSHQA')">BOSHQA</div>
      </div>
      <div class="fg hide" id="vf-goal-other-block" style="margin-top:8px">
        <input id="vf-goal-other" placeholder="Maqsadni yozing..." />
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h">Tavsiya etilgan preparatlar</div>
    <div class="card-b">
      <div class="alert alert-i">Preparatni tanlang. Soni ko'rsatish shart emas.</div>
      <div id="vf-products-list"></div>
      <button class="btn btn-o" style="margin-top:8px" onclick="vfAddProductRow()">+ Preparat qo'shish</button>
    </div>
  </div>

  <div class="card">
    <div class="card-h">Probnik (sampel)</div>
    <div class="card-b">
      <div class="rg">
        <div class="ropt" onclick="vfSelectR(this,'sample','Ha')">Probnik so'raldi</div>
        <div class="ropt" onclick="vfSelectR(this,'sample','Yo\\'q')">So'ralmadi</div>
      </div>
      <!-- Probnik so'raldi: 25 dan tanlash -->
      <div id="vf-probnik-preps" class="hide" style="margin-top:10px">
        <div class="alert alert-i">Qaysi preparatdan probnik so'raldi?</div>
        <div id="vf-probnik-list"></div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h">Natija</div>
    <div class="card-b">
      <div class="rg">
        <div class="ropt" onclick="vfSelectR(this,'result','ISHLAYDI')">ISHLAYDI</div>
        <div class="ropt" onclick="vfSelectR(this,'result','INFO')">INFO</div>
        <!-- "OYLAMOQDA" → "O'YLAMOQDA" (imlo to'g'ri) -->
        <div class="ropt" onclick="vfSelectR(this,'result','O\\'YLAMOQDA')">O'YLAMOQDA</div>
        <div class="ropt" onclick="vfSelectR(this,'result','QABUL QILMADI')">QABUL QILMADI</div>
      </div>
      <div class="rg" style="margin-top:7px">
        <div class="ropt" style="grid-column:span 2" onclick="vfSelectR(this,'result','BOSHQA')">BOSHQA</div>
      </div>
      <div class="fg hide" id="vf-result-other-block" style="margin-top:8px">
        <input id="vf-result-other" placeholder="Natijani yozing..." />
      </div>
    </div>
  </div>

  <div class="card">
    <!-- "PROMO" → "PROMA" (to'g'irlandi) -->
    <div class="card-h">PROMA</div>
    <div class="card-b">
      <div class="rg">
        <div class="ropt" onclick="vfPromoToggle(false)">O'TKAZIB YUBORISH</div>
        <!-- "2x visit" matni to'g'rilandi -->
        <div class="ropt" onclick="vfPromoToggle(true)">Menejerga so'rov yuborish</div>
      </div>
      <div id="vf-promo-block" class="hide" style="margin-top:10px">
        <!-- "Siz pul bermaysiz" olib tashlandi -->
        <div class="fg">
          <label>Izoh (ixtiyoriy)</label>
          <input id="vf-promo-note" placeholder="Proma sababi..." />
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h">Keyingi vizit sanasi</div>
    <div class="card-b">
      <input type="date" id="vf-next-date" value="${nextWeekStr()}" />
      <div style="font-size:12px;color:var(--muted);margin-top:6px">Avtomatik 1 hafta keyingi sana — kerak bo'lsa o'zgartiring</div>
    </div>
  </div>`;
}

function nextWeekStr(){const d=new Date();d.setDate(d.getDate()+7);return d.toISOString().split('T')[0];}

// Preparatlar tanlash (soni ixtiyoriy)
function vfAddProductRow() {
  if(ST.visit.products.length>=25){alert('Barcha preparatlar qo\'shilgan');return;}
  ST.visit.products.push({name:'',qty:''});
  renderProductRows();
}
function renderProductRows() {
  const el=document.getElementById('vf-products-list'); if(!el) return;
  el.innerHTML=ST.visit.products.map((p,i)=>`
    <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
      <select style="flex:1" onchange="vfUpdateProduct(${i},'name',this.value)">
        <option value="">— Preparat tanlang —</option>
        ${PREPS.map(pr=>'<option value="'+pr+'" '+(p.name===pr?'selected':'')+'>'+pr+'</option>').join('')}
      </select>
      <input type="number" min="0" max="100" placeholder="Soni" value="${p.qty||''}" style="width:70px"
        oninput="vfUpdateProduct(${i},'qty',this.value)" />
      <button class="btn btn-r" style="padding:8px 11px" onclick="vfRemoveProduct(${i})">✕</button>
    </div>`).join('');
}
function vfUpdateProduct(i,key,val){ST.visit.products[i][key]=val;}
function vfRemoveProduct(i){ST.visit.products.splice(i,1);renderProductRows();}

function vfSelectR(el,key,val) {
  el.closest('.rg').querySelectorAll('.ropt').forEach(r=>r.classList.remove('on'));
  el.classList.add('on'); ST.visit.vals[key]=val;
  if(key==='goal') tgl('vf-goal-other-block',val==='BOSHQA');
  if(key==='result') tgl('vf-result-other-block',val==='BOSHQA');
  if(key==='sample') {
    tgl('vf-probnik-preps',val==='Ha');
    if(val==='Ha') renderProbnikList();
  }
}

function renderProbnikList() {
  const el=document.getElementById('vf-probnik-list'); if(!el) return;
  el.innerHTML=PREPS.map((p,i)=>`
    <div class="ropt" style="margin-bottom:4px;font-size:12px" onclick="vfToggleProbnik(this,'${p}')">
      ${p}
    </div>`).join('');
}
function vfToggleProbnik(el,prep) {
  el.classList.toggle('on');
  if(!ST.visit.vals.probnikPreps) ST.visit.vals.probnikPreps=[];
  if(el.classList.contains('on')) { ST.visit.vals.probnikPreps.push(prep); }
  else { ST.visit.vals.probnikPreps=ST.visit.vals.probnikPreps.filter(p=>p!==prep); }
}

function vfPromoToggle(want) {
  document.querySelectorAll('#vfs3 .card:nth-last-child(2) .rg .ropt').forEach(e=>e.classList.remove('on'));
  event.currentTarget.classList.add('on');
  ST.visit.vals.promoRequested=want;
  tgl('vf-promo-block',want);
}

// ════════════════════════════════════════════════════════════════
// DORIXONA: BRON + QOLDIQ (2 bosqich)
// Bron: narxlar ko'rinadi, tanlash majburiy emas
// 2-bosqich: faqat qoldiq (bron qayta kiritilmaydi)
// ════════════════════════════════════════════════════════════════
let pharmStage=1, bronData={};

function renderPharmacyFormStage1() {
  pharmStage=1; bronData={};
  return `
  <div class="card" id="pharm-stage-card">
    <div class="card-h">
      <span id="pharm-stage-title">Bosqich 1: Preparat BRON</span>
      <span class="bdg bdg-y" style="margin-left:auto">1 / 2</span>
    </div>
    <div class="card-b">
      <div class="alert alert-i">Aptekaga bron qilingan (kelishilgan, lekin hali yetkazilmagan) preparatlar sonini kiriting. <b>0</b> qoldirish mumkin.</div>
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

function buildBronTable() {
  const tbody=document.getElementById('vf-bron-tbody'); if(!tbody) return;
  tbody.innerHTML=PREPS.map((p,i)=>`
    <tr>
      <td style="color:var(--muted);font-size:11px">${i+1}</td>
      <td style="font-size:11px">${p}</td>
      <td><input type="number" min="0" placeholder="0" id="vf-bron-${i}" oninput="vfUpdateBronSum()" /></td>
      <td style="font-size:11px;color:var(--muted)">${fmtMoney(PRICES[p]||0)}</td>
      <td class="sum-cell" id="vf-bron-sum-${i}">0</td>
    </tr>`).join('');
}

function vfUpdateBronSum() {
  let total=0;
  PREPS.forEach((p,i)=>{
    const qty=Number(document.getElementById('vf-bron-'+i)?.value)||0;
    const sum=qty*(PRICES[p]||0);
    const sumEl=document.getElementById('vf-bron-sum-'+i);
    if(sumEl) sumEl.textContent=sum?fmtMoney(sum):'0';
    total+=sum;
  });
  const t=document.getElementById('vf-bron-total');
  if(t) t.textContent=fmtMoney(total);
}

function vfPharmGoStage2() {
  // Bron ma'lumotlarini saqlash
  PREPS.forEach((p,i)=>{ bronData[p]=Number(document.getElementById('vf-bron-'+i)?.value)||0; });
  // 2-bosqich: faqat qoldiq (bron qayta ko'rsatilmaydi)
  document.getElementById('pharm-stage-card').innerHTML=`
    <div class="card-h">
      <span>Bosqich 2: Qoldiq kiritish</span>
      <span class="bdg bdg-g" style="margin-left:auto">2 / 2</span>
    </div>
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

function vfPharmBackStage() {
  // Bron bosqichiga qaytish
  const card=document.getElementById('pharm-stage-card');
  card.innerHTML='<div class="card-h"><span id="pharm-stage-title">Bosqich 1: Preparat BRON</span><span class="bdg bdg-y" style="margin-left:auto">1 / 2</span></div><div class="card-b"><div class="alert alert-i">Bron sonini kiriting. 0 qoldirish mumkin.</div><table class="stbl"><thead><tr><th>#</th><th>Preparat</th><th>Bron</th><th>Narxi</th><th>Summa</th></tr></thead><tbody id="vf-bron-tbody"></tbody></table><div style="text-align:right;margin-top:10px;font-weight:800;font-size:15px;color:var(--ok)">Jami bron: <span id="vf-bron-total">0 so\'m</span></div><div class="btn-row"><button class="btn btn-p" onclick="vfPharmGoStage2()">Qoldiqni kiritish →</button></div></div>';
  buildBronTable();
  // Avvalgi bron qiymatlarini tiklash
  PREPS.forEach((p,i)=>{ const inp=document.getElementById('vf-bron-'+i); if(inp&&bronData[p]) inp.value=bronData[p]; });
  vfUpdateBronSum();
}

function buildStockTableRows() {
  const tbody=document.getElementById('vf-stock-tbody'); if(!tbody) return;
  tbody.innerHTML=PREPS.map((p,i)=>`
    <tr>
      <td style="color:var(--muted);font-size:11px">${i+1}</td>
      <td style="font-size:11px">${p}</td>
      <td><input type="number" min="0" placeholder="0" id="vf-st-${i}" oninput="vfUpdateStockSum()" /></td>
      <td style="font-size:11px;color:var(--muted)">${fmtMoney(PRICES[p]||0)}</td>
      <td class="sum-cell" id="vf-sum-${i}">0</td>
    </tr>`).join('');
}

function vfUpdateStockSum() {
  let total=0;
  PREPS.forEach((p,i)=>{
    const qty=Number(document.getElementById('vf-st-'+i)?.value)||0;
    const sum=qty*(PRICES[p]||0);
    const sumEl=document.getElementById('vf-sum-'+i);
    if(sumEl) sumEl.textContent=sum?fmtMoney(sum):'0';
    total+=sum;
  });
  const t=document.getElementById('vf-stock-total');
  if(t) t.textContent=fmtMoney(total);
}

function getBronAndStockData() {
  const bron=PREPS.map((p,i)=>({prep:p,qty:Number(document.getElementById('vf-bron-'+i)?.value)||0}));
  const stock=PREPS.map((p,i)=>({prep:p,qty:Number(document.getElementById('vf-st-'+i)?.value)||0}));
  return {bron,stock};
}

// Foto bosqichiga o'tish (validatsiya)
function vfGoToFoto() {
  if(!v('vf-comment').trim()){alert('Izoh qoldiring!');return;}
  if(ST.visit.type==='doctor') {
    if(!ST.visit.vals.goal){alert('Vizit maqsadini tanlang!');return;}
    if(ST.visit.vals.goal==='BOSHQA'&&!v('vf-goal-other').trim()){alert('Maqsadni yozing!');return;}
    if(!ST.visit.vals.result){alert('Natijani tanlang!');return;}
    // Preparat soni majburiy
    const hasProds=ST.visit.products.some(p=>p.name&&(Number(p.qty)||0)>0);
    if(!hasProds){alert('Kamida 1 ta preparat va sonini kiriting!');return;}
    if(ST.visit.vals.result==='BOSHQA'&&!v('vf-result-other').trim()){alert('Natijani yozing!');return;}
    if(ST.visit.vals.sample===undefined){alert('Probnik bo\'yicha tanlov qiling!');return;}
    // O'tkazib yuborish: promoRequested undefined bo'lsa ham o'tadi
    if(ST.visit.vals.promoRequested===undefined) ST.visit.vals.promoRequested=false;
  } else {
    // Dorixona: kamida qoldiq bosqichi tugagan bo'lishi kerak
    if(!document.getElementById('vf-stock-tbody')){
      alert('Avval qoldiq bosqichini tugatib "Qoldiqni kiritish →" tugmasini bosing!');return;
    }
  }
  const elapsed=Math.floor((Date.now()-ST.visit.timerStart)/1000);
  if(elapsed<MIN_VISIT_SEC) {
    showModal('Vizit juda qisqa!',
      '<p style="font-size:14px;line-height:1.6">Faqat <b>'+elapsed+'</b> soniya o\'tdi. Minimal <b>5 daqiqa</b> kerak. Bu shubhali deb belgilanishi mumkin.</p>',
      '<button class="btn btn-o" onclick="closeModal()">Kutaman</button> <button class="btn btn-r" onclick="closeModal();vfShowStep(4)">Baribir davom etish</button>');
    return;
  }
  clearInterval(ST.visit.timerRef);
  vfShowStep(4);
}
