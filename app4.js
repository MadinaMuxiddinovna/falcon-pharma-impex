// ╔════════════════════════════════════════════════════════════════╗
// ║  app4.js — SO'ROVNOMA (qadam 3): Vrach + Dorixona (Bron→Qoldiq)  ║
// ╚════════════════════════════════════════════════════════════════╝

function renderVfStep3() {
  const isDoc = ST.visit.type==='doctor';
  document.getElementById('vfs3').innerHTML = `
    <div class="timer-box">
      <div><div style="font-size:11px;opacity:.8">Vizit davom etmoqda</div>
        <div class="timer-val" id="vf-timer-val">00:00</div>
        <div class="timer-warn hide" id="vf-timer-warn">⚠️ Minimal 5 daqiqa kerak</div></div>
      <div style="text-align:right;font-size:12px;opacity:.85">${isDoc?ST.visit.target.name:ST.visit.target.legalName}</div>
    </div>
    ${isDoc ? renderDoctorForm() : renderPharmacyFormStage1()}
    <div class="card" style="margin-top:14px">
      <div class="card-h">💬 Komentariya <span style="font-weight:400;font-size:11px;opacity:.8">(majburiy)</span></div>
      <div class="card-b"><textarea id="vf-comment" rows="3" placeholder="Vizit haqida..."></textarea></div></div>
    <div class="btn-row">
      <button class="btn btn-o" onclick="vfBackToStep2()">← Orqaga</button>
      <button class="btn btn-p btn-lg" onclick="vfGoToFoto()">Foto bosqichiga o'tish 📸</button></div>`;
}

function vfBackToStep2() {
  if (!confirm('Orqaga qaytsangiz vizit vaqti to\'xtaydi. Davom etasizmi?')) return;
  clearInterval(ST.visit.timerRef); vfShowStep(2);
}

// ════════════════════════════════════════════════════════════════
// VRACH FORMASI
// ════════════════════════════════════════════════════════════════
function renderDoctorForm() {
  return `
  <div class="card"><div class="card-h">🎯 Vizit maqsadi</div><div class="card-b">
    <div class="rg">
      <div class="ropt" onclick="vfSelectR(this,'goal','TANISHUV')">👋 TANISHUV</div>
      <div class="ropt" onclick="vfSelectR(this,'goal','PREPATNI ESLATISH')">🔔 PREPATNI ESLATISH</div>
      <div class="ropt" onclick="vfSelectR(this,'goal','KELISHUV')">🤝 KELISHUV</div>
      <div class="ropt" onclick="vfSelectR(this,'goal','BOSHQA')">✏️ BOSHQA</div></div>
    <div class="fg hide" id="vf-goal-other-block" style="margin-top:8px"><input id="vf-goal-other" placeholder="Maqsadni yozing..." /></div>
  </div></div>

  <div class="card"><div class="card-h">💊 Tavsiya etilgan preparatlar</div><div class="card-b">
    <div class="alert alert-i">Preparatni tanlang, nechta upakovka tavsiya qilinganini kiriting (0-10)</div>
    <div id="vf-products-list"></div>
    <button class="btn btn-o" style="margin-top:8px" onclick="vfAddProductRow()">+ Preparat qo'shish</button>
  </div></div>

  <div class="card"><div class="card-h">🧪 Probnik</div><div class="card-b">
    <div class="rg">
      <div class="ropt" onclick="vfSelectR(this,'sample','Ha')">✅ Probnik so'raldi</div>
      <div class="ropt" onclick="vfSelectR(this,'sample','Yo\\'q')">❌ So'ralmadi</div></div>
  </div></div>

  <div class="card"><div class="card-h">📊 Natija</div><div class="card-b">
    <div class="rg">
      <div class="ropt" onclick="vfSelectR(this,'result','ISHLAYDI')">✅ ISHLAYDI</div>
      <div class="ropt" onclick="vfSelectR(this,'result','INFO')">ℹ️ INFO</div>
      <div class="ropt" onclick="vfSelectR(this,'result','OYLAMOQDA')">🤔 OYLAMOQDA</div>
      <div class="ropt" onclick="vfSelectR(this,'result','QABUL QILMADI')">❌ QABUL QILMADI</div></div>
    <div class="rg" style="margin-top:7px"><div class="ropt" style="grid-column:span 2" onclick="vfSelectR(this,'result','BOSHQA')">✏️ BOSHQA</div></div>
    <div class="fg hide" id="vf-result-other-block" style="margin-top:8px"><input id="vf-result-other" placeholder="Natijani yozing..." /></div>
  </div></div>

  <div class="card"><div class="card-h">🎁 PROMO (faqat so'rov — pulni menejer beradi)</div><div class="card-b">
    <div class="rg">
      <div class="ropt" onclick="vfPromoToggle(false)">⏭️ O'TKAZIB YUBORISH</div>
      <div class="ropt" onclick="vfPromoToggle(true)">🎁 PROMO SO'RASH (2x vizit)</div></div>
    <div id="vf-promo-block" class="hide" style="margin-top:10px">
      <div class="alert alert-w">⚠️ Siz pul bermaysiz! Bu faqat so'rov — menejerga yuboriladi, u keyinroq vrachga shaxsan boradi va pul beradi.</div>
      <div class="fg"><label>Izoh (nima uchun promo kerak)</label><input id="vf-promo-note" placeholder="Sabab..." /></div>
    </div>
  </div></div>

  <div class="card"><div class="card-h">📅 Keyingi vizit</div><div class="card-b">
    <input type="date" id="vf-next-date" value="${nextWeekStr()}" />
    <div style="font-size:12px;color:var(--muted);margin-top:6px">⏰ Avtomatik 1 hafta keyingi sana — kerak bo'lsa o'zgartiring</div>
  </div></div>`;
}
function nextWeekStr(){const d=new Date();d.setDate(d.getDate()+7);return d.toISOString().split('T')[0];}

function vfAddProductRow() {
  if (ST.visit.products.length>=25) { alert('Hammasi qo\'shilgan'); return; }
  ST.visit.products.push({name:'',qty:0});
  renderProductRows();
}
function renderProductRows() {
  const el = document.getElementById('vf-products-list'); if(!el)return;
  el.innerHTML = ST.visit.products.map((p,i)=>`
    <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
      <select style="flex:1" onchange="vfUpdateProduct(${i},'name',this.value)">
        <option value="">— Preparat —</option>
        ${PREPS.map(pr=>`<option value="${pr}" ${p.name===pr?'selected':''}>${pr}</option>`).join('')}</select>
      <input type="number" min="0" max="10" placeholder="0-10" value="${p.qty||''}" style="width:64px" oninput="vfUpdateProduct(${i},'qty',this.value)" />
      <button class="btn btn-r" style="padding:8px 11px" onclick="vfRemoveProduct(${i})">✕</button></div>`).join('');
}
function vfUpdateProduct(i,key,val){ ST.visit.products[i][key]=key==='qty'?Math.min(10,Math.max(0,Number(val)||0)):val; }
function vfRemoveProduct(i){ ST.visit.products.splice(i,1); renderProductRows(); }
function vfPromoToggle(want) {
  document.querySelectorAll('#vfs3 .card:nth-last-child(2) .ropt').forEach(e=>e.classList.remove('on'));
  event.currentTarget.classList.add('on');
  ST.visit.vals.promoRequested = want;
  tgl('vf-promo-block', want);
}

// ════════════════════════════════════════════════════════════════
// DORIXONA FORMASI — 2 BOSQICHLI: BRON → QOLDIQ
// Sizning so'zlaringiz: "Preparat bron qilish va Har bir preparat
// qoldig'ini ko'rsating chiqishi kerak ... qoldiq alohida bron
// alohida agar 1-bron orqaga qaytib qoldiq ham kiritadigan bolishi
// kerak xuddi menyuday davom etish kerak tasdiqlash"
// ════════════════════════════════════════════════════════════════
let pharmStage = 1; // 1=bron, 2=qoldiq

function renderPharmacyFormStage1() {
  pharmStage = 1;
  return `
  <div class="card" id="pharm-stage-card">
    <div class="card-h">
      <span id="pharm-stage-title">1️⃣ Preparat BRON qilish</span>
      <span class="bdg bdg-y" style="margin-left:auto" id="pharm-stage-badge">Bosqich 1/2</span>
    </div>
    <div class="card-b">
      <div class="alert alert-i" id="pharm-stage-alert">Aptekaga qancha preparat <b>bron qilinganini</b> kiriting (kelishilgan, lekin hali yetkazilmagan miqdor)</div>
      <table class="stbl">
        <thead><tr><th>#</th><th>Preparat</th><th id="pharm-col3-h">Bron</th><th id="pharm-col4-h" class="hide">Qoldiq</th><th>Summa</th></tr></thead>
        <tbody id="vf-stock-tbody"></tbody>
      </table>
      <div style="text-align:right;margin-top:10px;font-weight:800;font-size:15px;color:var(--ok)">
        Jami: <span id="vf-stock-total">0 so'm</span></div>
      <div class="btn-row">
        <button class="btn btn-o hide" id="pharm-back-btn" onclick="vfPharmBackStage()">← Bron bosqichiga qaytish</button>
        <button class="btn btn-p" id="pharm-next-btn" onclick="vfPharmNextStage()">Qoldiqni kiritish →</button>
      </div>
    </div>
  </div>`;
}

function buildStockTableRows() {
  const tbody = document.getElementById('vf-stock-tbody'); if(!tbody)return;
  tbody.innerHTML = PREPS.map((p,i)=>`
    <tr>
      <td style="color:var(--muted)">${i+1}</td>
      <td style="font-size:10.5px">${p}</td>
      <td><input type="number" min="0" placeholder="0" id="vf-bron-${i}" oninput="vfUpdateStockSum()" /></td>
      <td class="hide" id="vf-qty-cell-${i}"><input type="number" min="0" placeholder="0" id="vf-st-${i}" oninput="vfUpdateStockSum()" /></td>
      <td class="sum-cell" id="vf-sum-${i}">0</td>
    </tr>`).join('');
}

function vfPharmNextStage() {
  pharmStage = 2;
  document.getElementById('pharm-stage-title').textContent = '2️⃣ QOLDIQ kiritish';
  document.getElementById('pharm-stage-badge').textContent = 'Bosqich 2/2';
  document.getElementById('pharm-stage-badge').className = 'bdg bdg-g';
  document.getElementById('pharm-stage-alert').innerHTML = 'Aptekada hozir <b>qancha qoldiq</b> borligini kiriting (haqiqiy mavjud miqdor)';
  document.getElementById('pharm-col4-h').classList.remove('hide');
  PREPS.forEach((p,i) => document.getElementById('vf-qty-cell-'+i).classList.remove('hide'));
  document.getElementById('pharm-back-btn').classList.remove('hide');
  document.getElementById('pharm-next-btn').textContent = 'Tasdiqlash ✅';
  document.getElementById('pharm-next-btn').onclick = vfPharmConfirmStock;
}
function vfPharmBackStage() {
  pharmStage = 1;
  document.getElementById('pharm-stage-title').textContent = '1️⃣ Preparat BRON qilish';
  document.getElementById('pharm-stage-badge').textContent = 'Bosqich 1/2';
  document.getElementById('pharm-stage-badge').className = 'bdg bdg-y';
  document.getElementById('pharm-stage-alert').innerHTML = 'Aptekaga qancha preparat <b>bron qilinganini</b> kiriting';
  document.getElementById('pharm-back-btn').classList.add('hide');
  document.getElementById('pharm-next-btn').textContent = 'Qoldiqni kiritish →';
  document.getElementById('pharm-next-btn').onclick = vfPharmNextStage;
}
function vfPharmConfirmStock() {
  showModal('Tasdiqlash', `<p style="font-size:14px;line-height:1.6">Bron va qoldiq ma'lumotlari to'g'rimi? Tasdiqlasangiz keyingi bosqichga (Komentariya) o'tasiz.</p>`,
    `<button class="btn btn-o" onclick="closeModal()">↩️ Qayta ko'rish</button>
     <button class="btn btn-ok" onclick="closeModal()">✅ Tasdiqlash</button>`);
}

function vfUpdateStockSum() {
  let total=0;
  PREPS.forEach((p,i)=>{
    const qty = Number(document.getElementById('vf-st-'+i)?.value)||0;
    const sum = qty*PRICES[p];
    const sumEl = document.getElementById('vf-sum-'+i);
    if (sumEl) sumEl.textContent = sum?fmtMoney(sum):'0';
    total += sum;
  });
  const totalEl = document.getElementById('vf-stock-total');
  if (totalEl) totalEl.textContent = fmtMoney(total);
}
function getBronData() { return PREPS.map(p_i=>{}); } // placeholder, real version below
function getBronAndStockData() {
  const bron = PREPS.map((p,i)=>({prep:p, qty:Number(document.getElementById('vf-bron-'+i)?.value)||0}));
  const stock = PREPS.map((p,i)=>({prep:p, qty:Number(document.getElementById('vf-st-'+i)?.value)||0}));
  return {bron, stock};
}

function vfSelectR(el,key,val) {
  el.closest('.rg').querySelectorAll('.ropt').forEach(r=>r.classList.remove('on'));
  el.classList.add('on');
  ST.visit.vals[key]=val;
  if (key==='goal') tgl('vf-goal-other-block', val==='BOSHQA');
  if (key==='result') tgl('vf-result-other-block', val==='BOSHQA');
}

// ── FOTOGA O'TISH (validatsiya) ──
function vfGoToFoto() {
  if (!v('vf-comment').trim()) { alert('Komentariya majburiy!'); return; }
  if (ST.visit.type==='doctor') {
    if (!ST.visit.vals.goal) { alert('Vizit maqsadini tanlang!'); return; }
    if (ST.visit.vals.goal==='BOSHQA' && !v('vf-goal-other').trim()) { alert('Maqsadni yozing!'); return; }
    if (!ST.visit.vals.result) { alert('Natijani tanlang!'); return; }
    if (ST.visit.vals.result==='BOSHQA' && !v('vf-result-other').trim()) { alert('Natijani yozing!'); return; }
    if (ST.visit.vals.sample===undefined) { alert('Probnik bo\'yicha tanlang!'); return; }
    if (ST.visit.vals.promoRequested===undefined) { alert('Promo bo\'yicha tanlov qiling!'); return; }
  } else {
    if (pharmStage !== 2) { alert('Avval qoldiq bosqichini yakunlang!'); return; }
  }
  const elapsed = Math.floor((Date.now()-ST.visit.timerStart)/1000);
  if (elapsed < MIN_VISIT_SEC) {
    showModal('⚠️ Vizit juda qisqa',
      `<p style="font-size:14px;line-height:1.6">Faqat <b>${elapsed}</b> soniya o'tdi. Minimal <b>5 daqiqa</b> kerak. Bu shubhali deb belgilanadi.</p>`,
      `<button class="btn btn-o" onclick="closeModal()">Kutaman</button>
       <button class="btn btn-r" onclick="closeModal();vfShowStep(4)">Baribir davom etish</button>`);
    return;
  }
  clearInterval(ST.visit.timerRef);
  vfShowStep(4);
}
