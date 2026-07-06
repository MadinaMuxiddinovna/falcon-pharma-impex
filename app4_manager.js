// app4_manager.js FINAL
// Tuzatishlar:
// - Rejalar/Promo: matn chiqadi (server ustun nomlari bilan mos)
// - Admin: KPI, Rejalar, Promo — ma'lumotlar ko'rinadi (stikersiz)
// - Promo: menejer uchun MP yuborgan so'rovlar + rad/tasdiqlash
// - Murojaatlar: faqat xabarlar ro'yxati (ogohlantirish yo'q)
// - Balans: menejer o'z minusini ko'radi
// - Admin menejer tanlash: to'g'ri yuklanadi
// - 👔 stikeri o'chirildi

// ─── MENEJER/ADMIN DASHBOARD ────────────────────────
function pageManagerDashboard(){
  const isMgr=ST.user.role==='manager';
  return `
  <div class="page active" id="page-mgr">
    ${isMgr?`
    <div style="text-align:center;padding:8px 0 4px">
      <div style="font-size:12px;color:var(--muted)">Menejer</div>
      <div style="font-size:16px;font-weight:700;color:var(--primary)" id="mgr-region-info"></div>
    </div>
    <div class="balance-box" id="mgr-bal-box" onclick="showMgrJournal()" style="cursor:pointer">
      <div class="balance-num" id="mgr-bal-qolgan">— so'm</div>
      <div class="balance-lbl">Balansingiz — bosib batafsil ko'rish</div>
    </div>`:''}
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-num" id="mgr-vis">—</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
      <div class="kpi-card"><div class="kpi-num" id="mgr-promo">—</div><div class="kpi-lbl">Kutilayotgan proma</div></div>
    </div>
    <div class="card"><div class="card-h">Jamoa holati (bugun)</div>
      <div class="card-b" id="mgr-team"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
  </div>`;
}

async function renderMgrDashboard(){
  try{
    const[kpi,promos,bal]=await Promise.all([
      apiGet('getKPI',{role:ST.user.role,empId:ST.user.id,date:todayStr()},false).catch(()=>({})),
      apiGet('getPromoQueue',{role:ST.user.role,empId:ST.user.id}).catch(()=>[]),
      ST.user.role==='manager'?apiGet('getMgrBalance',{mgrId:ST.user.id}).catch(()=>null):Promise.resolve(null),
    ]);
    if(bal){
      ST.mgrBalance=bal;
      const el=document.getElementById('mgr-bal-qolgan');
      if(el) el.textContent=fmtMoney(bal.qolgan||0);
      const rInfo=document.getElementById('mgr-region-info');
      if(rInfo) rInfo.textContent=(ST.user.region||'')+(ST.user.district?' · '+ST.user.district:'');
      const box=document.getElementById('mgr-bal-box');
      if(box) box.style.background=(bal.qolgan||0)<0
        ?'linear-gradient(135deg,#8b0000,#c0260a)'
        :'linear-gradient(135deg,#7a3ca0,#9b59d8)';
    }
    const total=Object.values(kpi).reduce((s,x)=>s+(x.total||0),0);
    const el1=document.getElementById('mgr-vis');if(el1)el1.textContent=total;
    const el2=document.getElementById('mgr-promo');
    if(el2)el2.textContent=(promos||[]).filter(p=>(p['Holati']||p.status||'')==='Kutilmoqda').length;
    const teamEl=document.getElementById('mgr-team');
    if(teamEl){
      const entries=Object.entries(kpi);
      teamEl.innerHTML=entries.length
        ?entries.map(([id,s])=>`
          <div class="vcard">
            <div class="vcard-h"><span class="vcard-name">${s.empName||id}</span>
              <span class="bdg ${(s.pct||0)>=80?'bdg-g':(s.pct||0)>=50?'bdg-y':'bdg-r'}">${s.pct||0}%</span>
            </div>
            <div class="vcard-meta">Vrach: ${s.doctorV||0} · Dorixona: ${s.pharmV||0} · Ijobiy: ${s.positive||0} · Shubhali: ${s.shubhali||0}</div>
          </div>`).join('')
        :'<div class="alert alert-i">Bugun hali ma\'lumot yo\'q</div>';
    }
  }catch(e){}
}

async function showMgrJournal(){
  const journal=await apiGet('getMgrJournal',{mgrId:ST.user.id}).catch(()=>[]);
  const list=(journal||[]).reverse().slice(0,50);
  const bal=ST.mgrBalance||{jami:0,sarflangan:0,qolgan:0};
  showModal('Balans jurnali',
    `<div style="font-size:12px;color:var(--muted);margin-bottom:10px">
      Jami kirim: <b style="color:var(--ok)">${fmtMoney(bal.jami||0)}</b> ·
      Sarflangan: <b style="color:var(--danger)">${fmtMoney(bal.sarflangan||0)}</b> ·
      Qolgan: <b style="color:${(bal.qolgan||0)<0?'var(--danger)':'var(--primary)'}">${fmtMoney(bal.qolgan||0)}</b>
    </div>
    ${list.length?list.map(j=>`
      <div class="irow">
        <span class="irow-l" style="font-size:12px">
          <b style="color:${j['Harakat']==='CHIQIM'?'var(--danger)':'var(--ok)'}">${j['Harakat']==='CHIQIM'?'Chiqim':'Kirim'}</b><br>
          <span style="font-size:11px">${j['Vaqt va sana']||''}</span><br>
          <span style="font-size:11px;color:var(--muted)">${j['Izoh']||''}</span>
        </span>
        <span class="irow-v" style="color:${j['Harakat']==='CHIQIM'?'var(--danger)':'var(--ok)'}">
          ${j['Harakat']==='CHIQIM'?'−':'+'}${fmtMoney(j["Miqdor (so'm)"]||0)}
        </span>
      </div>`).join('')
    :'<div class="alert alert-i">Jurnal bo\'sh</div>'}`,
    '<button class="btn btn-p" onclick="closeModal()">Yopish</button>');
}

// ─── PUL BERISH ──────────────────────────────────────
function pagePayDoctor(){
  return `
  <div class="page" id="page-paydoctor">
    <div class="balance-box" id="pd-bal-box">
      <div class="balance-num" id="pd-bal">— so'm</div>
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
            <span style="font-size:11px;color:var(--muted)">MP yuborgan so'rov bo'yicha</span>
          </div>
        </div>
      </div>
    </div>
    <div id="pd-flow"></div>
  </div>`;
}

async function renderPayDoctorPage(){
  const bal=await apiGet('getMgrBalance',{mgrId:ST.user.id}).catch(()=>({jami:0,sarflangan:0,qolgan:0}));
  ST.mgrBalance=bal;
  const el=document.getElementById('pd-bal');
  const box=document.getElementById('pd-bal-box');
  if(el) el.textContent=fmtMoney(bal.qolgan||0);
  if(box) box.style.background=(bal.qolgan||0)<0
    ?'linear-gradient(135deg,#8b0000,#c0260a)'
    :'linear-gradient(135deg,#7a3ca0,#9b59d8)';
}

function pdSetType(type){
  ST.mgrPay={type,target:null,mpForPromo:null};
  if(type==='PROMA'){
    pdShowPromaFlow();
  } else {
    pdShowDoctorFlow();
  }
}

// DOKTOR puli
function pdShowDoctorFlow(){
  document.getElementById('pd-flow').innerHTML=`
    <div class="card" style="border:2px solid #7a3ca0">
      <div class="card-h" style="background:#7a3ca0">👨‍⚕️ Doktor puli
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
        <button class="btn btn-pu btn-bl btn-lg" onclick="pdConfirmPay()">To'lovni tasdiqlash</button>
      </div>
    </div>`;
}

// PROMA puli — MP yuborgan so'rovlar ro'yxatidan
async function pdShowPromaFlow(){
  const promos=await apiGet('getPromoQueue',{role:'manager',empId:ST.user.id}).catch(()=>[]);
  const pending=(promos||[]).filter(p=>(p['Holati']||'')==='Kutilmoqda');
  document.getElementById('pd-flow').innerHTML=`
    <div class="card" style="border:2px solid #7a3ca0">
      <div class="card-h" style="background:#7a3ca0">🤝 Proma (MP yuborgan so'rovlar)
        <button onclick="document.getElementById('pd-flow').innerHTML=''"
          style="margin-left:auto;padding:4px 10px;border:1.5px solid #fff;background:#fff;color:#7a3ca0;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">✕</button>
      </div>
      <div class="card-b">
        ${!pending.length
          ?'<div class="alert alert-i">Kutilayotgan proma so\'rovlar yo\'q</div>'
          :pending.map(p=>`
            <div class="vcard" style="cursor:pointer" onclick="pdSelectPromo(${p._row})" id="promo-card-${p._row}">
              <div class="vcard-h">
                <span class="vcard-name">${p['Vrach FISh']||p['Vrach F.I.Sh']||''}</span>
                <span class="bdg bdg-y">Kutilmoqda</span>
              </div>
              <div class="vcard-meta">
                Med Vakil: ${p['Hodim Ismi']||''} · ${p['Ish joyi']||''} ·
                So'ralgan: <b>${fmtMoney(p["Proma summasi (so'm)"]||0)}</b>
              </div>
            </div>`).join('')}
        <div id="pd-promo-selected" class="hide" style="margin-top:12px">
          <div id="pd-promo-info" class="alert alert-ok"></div>
          <div class="fg" style="margin-top:10px"><label>To'lov summasi <span class="req">*</span></label>
            <input id="pd-promo-summa" type="number" min="0" placeholder="200000" /></div>
          <div class="fg"><label>Izoh <span class="req">*</span></label>
            <input id="pd-promo-comment" placeholder="Proma uchun..." /></div>
          <button class="btn btn-pu btn-bl btn-lg" onclick="pdConfirmPromaPay()">To'lovni tasdiqlash</button>
        </div>
      </div>
    </div>`;
  window._pdPromos=pending;
}

function pdSelectPromo(row){
  const p=window._pdPromos?.find(x=>x._row===row);if(!p)return;
  ST.mgrPay.promoData=p;
  // Tanlangan promani highlight qilish
  document.querySelectorAll('[id^=promo-card-]').forEach(el=>el.style.border='');
  const card=document.getElementById('promo-card-'+row);
  if(card) card.style.border='2px solid var(--primary3)';
  const info=document.getElementById('pd-promo-info');
  if(info) info.innerHTML=`Tanlandi: <b>${p['Vrach FISh']||''}</b> · ${p['Ish joyi']||''} · MP: ${p['Hodim Ismi']||''}`;
  const summaEl=document.getElementById('pd-promo-summa');
  if(summaEl) summaEl.value=p["Proma summasi (so'm)"]||'';
  showEl('pd-promo-selected');
}

async function pdConfirmPromaPay(){
  if(!ST.mgrPay.promoData){alert('Proma so\'rovini tanlang!');return;}
  const summa=Number(document.getElementById('pd-promo-summa')?.value)||0;
  if(!summa){alert('Summani kiriting!');return;}
  const comment=(document.getElementById('pd-promo-comment')?.value||'').trim();
  if(!comment){alert('Izoh kiriting!');return;}
  const p=ST.mgrPay.promoData;
  const bal=ST.mgrBalance||{qolgan:0};
  showModal('Tasdiqlash',
    `<div class="irow"><span class="irow-l">Vrach</span><span class="irow-v">${p['Vrach FISh']||''}</span></div>
     <div class="irow"><span class="irow-l">Ish joyi</span><span class="irow-v">${p['Ish joyi']||''}</span></div>
     <div class="irow"><span class="irow-l">Med Vakil</span><span class="irow-v">${p['Hodim Ismi']||''}</span></div>
     <div class="irow"><span class="irow-l">Summa</span><span class="irow-v" style="color:var(--ok);font-size:17px">${fmtMoney(summa)}</span></div>
     ${(bal.qolgan||0)<summa?'<div class="alert alert-w">Balans yetarli emas — minus bo\'ladi.</div>':''}`,
    `<button class="btn btn-o" onclick="closeModal()">Bekor</button>
     <button class="btn btn-pu" onclick="closeModal();pdFinalizePromaPay(${summa},'${comment}')">Tasdiqlash</button>`);
}

async function pdFinalizePromaPay(summa,comment){
  const p=ST.mgrPay.promoData;
  showOv('Amalga oshirilmoqda...');
  const resp=await apiPost({action:'mgrPayDoctor',mgrId:ST.user.id,mgrName:ST.user.name,
    type:'PROMA',date:todayStr(),doctorName:p['Vrach FISh']||'',
    doctorSpec:'',doctorObject:p['Ish joyi']||'',doctorDistrict:'',doctorPhone:'',
    mpId:p['Hodim ID']||'',mpName:p['Hodim Ismi']||'',summa,comment});
  // Promo holati yangilash
  if(p._row) await apiPost({action:'decidePromo',row:p._row,approved:true});
  hideOv();
  if(resp.error){alert('Xato: '+resp.error);return;}
  const newBal=resp.newBalance;
  if(newBal!==undefined){
    ST.mgrBalance.qolgan=newBal;
    const el=document.getElementById('pd-bal');if(el)el.textContent=fmtMoney(newBal);
    const box=document.getElementById('pd-bal-box');
    if(box)box.style.background=newBal<0?'linear-gradient(135deg,#8b0000,#c0260a)':'linear-gradient(135deg,#7a3ca0,#9b59d8)';
  }
  showModal("To'lov amalga oshirildi",
    `<p>${p['Vrach FISh']||''} ga <b>${fmtMoney(summa)}</b> berildi.<br>Yangi balans: <b style="color:${(newBal||0)<0?'var(--danger)':'var(--ok)'}">${fmtMoney(newBal||0)}</b></p>`,
    '<button class="btn btn-p" onclick="closeModal();document.getElementById(\'pd-flow\').innerHTML=\'\'">OK</button>');
}

function pdSearchDoc(q){
  q=q.trim();if(q.length<2){hideEl('pd-doc-res');return;}
  const ql=q.toLowerCase();
  const res=ST.doctors.filter(r=>(r.name||'').toLowerCase().includes(ql)).slice(0,8);
  const box=document.getElementById('pd-doc-res');
  box.innerHTML=res.length
    ?res.map(r=>`<div class="sitem" onclick='pdSelectDoc(${JSON.stringify(r)})'>
        <span class="sitem-name">${r.name}</span>
        <span class="sitem-meta">${r.specialty||''} · ${r.object||''}</span></div>`).join('')
    :'<div class="sitem"><span class="sitem-meta">Topilmadi</span></div>';
  showEl('pd-doc-res');
}
function pdSelectDoc(r){
  ST.mgrPay.target=r;hideEl('pd-doc-res');
  document.getElementById('pd-doc-q').value=r.name;
  document.getElementById('pd-doc-sel').innerHTML='✅ <b>'+r.name+'</b> · '+r.specialty+' · '+r.object;
  showEl('pd-doc-sel');
}
async function pdConfirmPay(){
  if(!ST.mgrPay?.target){alert('Vrachni tanlang!');return;}
  const summa=Number(v('pd-summa'))||0;if(!summa){alert('Summani kiriting!');return;}
  const comment=v('pd-comment').trim();if(!comment){alert('Izoh kiriting!');return;}
  const t=ST.mgrPay.target;
  const bal=ST.mgrBalance||{qolgan:0};
  showModal('Tasdiqlash',
    `<div class="irow"><span class="irow-l">Vrach</span><span class="irow-v">${t.name}</span></div>
     <div class="irow"><span class="irow-l">Ish joyi</span><span class="irow-v">${t.object||''}</span></div>
     <div class="irow"><span class="irow-l">Summa</span><span class="irow-v" style="color:var(--ok);font-size:17px">${fmtMoney(summa)}</span></div>
     ${(bal.qolgan||0)<summa?'<div class="alert alert-w">Balans yetarli emas — minus bo\'ladi.</div>':''}`,
    `<button class="btn btn-o" onclick="closeModal()">Bekor</button>
     <button class="btn btn-pu" onclick="closeModal();pdFinalizePay(${summa},'${comment}')">Tasdiqlash</button>`);
}
async function pdFinalizePay(summa,comment){
  showOv('Amalga oshirilmoqda...');
  const t=ST.mgrPay.target;
  const resp=await apiPost({action:'mgrPayDoctor',mgrId:ST.user.id,mgrName:ST.user.name,
    type:'DOKTOR',date:todayStr(),doctorName:t.name,doctorSpec:t.specialty||'',
    doctorObject:t.object||'',doctorDistrict:t.district||'',doctorPhone:t.phone||'',
    mpId:'',mpName:'',summa,comment});
  hideOv();
  if(resp.error){alert('Xato: '+resp.error);return;}
  const newBal=resp.newBalance;
  if(newBal!==undefined){
    ST.mgrBalance.qolgan=newBal;
    const el=document.getElementById('pd-bal');if(el)el.textContent=fmtMoney(newBal);
    const box=document.getElementById('pd-bal-box');
    if(box)box.style.background=newBal<0?'linear-gradient(135deg,#8b0000,#c0260a)':'linear-gradient(135deg,#7a3ca0,#9b59d8)';
  }
  showModal("To'lov amalga oshirildi",
    `<p>${t.name} ga <b>${fmtMoney(summa)}</b> berildi.<br>Yangi balans: <b style="color:${(newBal||0)<0?'var(--danger)':'var(--ok)'}">${fmtMoney(newBal||0)}</b></p>`,
    '<button class="btn btn-p" onclick="closeModal();document.getElementById(\'pd-flow\').innerHTML=\'\'">OK</button>');
}

// ─── PROMO — MENEJER uchun rad/tasdiqlash, ADMIN faqat ko'radi ───
function pagePromoQueue(){
  return `
  <div class="page" id="page-promo">
    <div class="card">
      <div class="card-h">Proma so'rovlari</div>
      <div class="card-b" id="promo-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
  </div>`;
}
async function renderPromoQueue(){
  const promos=await apiGet('getPromoQueue',{role:ST.user.role,empId:ST.user.id}).catch(()=>[]);
  ST.promoQueue=promos||[];
  const el=document.getElementById('promo-list');if(!el)return;
  if(!ST.promoQueue.length){el.innerHTML='<div class="alert alert-i">Proma so\'rovlar yo\'q</div>';return;}
  const isAdmin=ST.user.role==='admin';
  el.innerHTML=ST.promoQueue.map(p=>{
    const status=p['Holati']||'';
    const vrach=p['Vrach FISh']||p['Vrach F.I.Sh']||'Noma\'lum vrach';
    const mp=p['Hodim Ismi']||'';
    const joyi=p['Ish joyi']||'';
    const sana=p['Sana']||'';
    const summa=p["Proma summasi (so'm)"]||0;
    const closed=status==='Tasdiqlandi'||status==='Rad etildi';
    return `<div class="vcard">
      <div class="vcard-h">
        <span class="vcard-name">${vrach}</span>
        <span class="bdg ${status==='Tasdiqlandi'?'bdg-g':status==='Rad etildi'?'bdg-r':'bdg-y'}">${status}</span>
      </div>
      <div class="vcard-meta">
        Med Vakil: ${mp} · ${joyi} · ${sana}
        ${summa?'<br>Summa: <b>'+fmtMoney(summa)+'</b>':''}
      </div>
      ${!closed&&!isAdmin?`<div class="btn-row" style="margin-top:8px">
        <button class="btn btn-r" style="padding:5px 12px;font-size:12px" onclick="promoDecide(${p._row},false)">Rad etish</button>
        <button class="btn btn-ok" style="padding:5px 12px;font-size:12px" onclick="promoDecide(${p._row},true)">Tasdiqlash</button>
      </div>`:''}
    </div>`;
  }).join('');
}
async function promoDecide(row,approved){
  await apiPost({action:'decidePromo',row,approved});renderPromoQueue();
}

// ─── REJALAR — ADMIN ko'radi, MENEJER tasdiqlaydi ───
function pagePlanManager(){
  const isAdmin=ST.user.role==='admin';
  return `
  <div class="page" id="page-planmgr">
    <div class="card">
      <div class="card-h">Med Vakili rejalari${isAdmin?' (Ko\'rish)':' (Tasdiqlash)'}</div>
      <div class="card-b" id="plan-mgr-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
  </div>`;
}
async function renderPlansManagerView(){
  const plans=await apiGet('getPlans',{empId:ST.user.id,role:ST.user.role}).catch(()=>[]);
  ST.plans=plans||[];
  const el=document.getElementById('plan-mgr-list');if(!el)return;
  const validPlans=ST.plans.filter(p=>{
    const obj=p['Obyekt nomi']||p.targetName||'';
    const date=p['Vizit sanasi']||p.date||'';
    return obj&&obj!=='undefined'&&obj!=='NaN'&&date&&date!=='undefined';
  });
  if(!validPlans.length){el.innerHTML='<div class="alert alert-i">Rejalar yo\'q</div>';return;}
  const isAdmin=ST.user.role==='admin';
  // Hodim bo'yicha guruhlash
  const byEmp={};
  validPlans.forEach(p=>{
    const name=p['Hodim Ismi']||p.empName||'Noma\'lum';
    if(!byEmp[name])byEmp[name]=[];byEmp[name].push(p);
  });
  el.innerHTML=Object.entries(byEmp).map(([empName,pList])=>`
    <div style="margin-bottom:18px">
      <div style="font-size:12px;font-weight:700;color:var(--primary);
        margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid var(--primary3)">
        ${empName}
      </div>
      ${pList.map(p=>{
        const status=p['Holati']||p.status||'';
        const obj=p['Obyekt nomi']||p.targetName||'';
        const date=p['Vizit sanasi']||p.date||'';
        const maqsad=p['Maqsad']||p.goal||'';
        return `<div class="vcard">
          <div class="vcard-h"><span class="vcard-name">${obj}</span>
            <span class="bdg ${status==='Tasdiqlangan'?'bdg-g':status==='Rad etildi'?'bdg-r':'bdg-y'}">${status}</span>
          </div>
          <div class="vcard-meta">${date}${maqsad?' · '+maqsad:''}</div>
          ${!isAdmin&&status==='Kutilmoqda'?`<div class="btn-row" style="margin-top:6px">
            <button class="btn btn-r" style="padding:4px 10px;font-size:12px" onclick="planMgrDecide(${p._row},false)">Rad</button>
            <button class="btn btn-ok" style="padding:4px 10px;font-size:12px" onclick="planMgrDecide(${p._row},true)">Tasdiqlash</button>
          </div>`:''}
        </div>`;
      }).join('')}
    </div>`).join('');
}
async function planMgrDecide(row,approved){
  await apiPost({action:'updatePlan',row,status:approved?'Tasdiqlangan':'Rad etildi'});
  renderPlansManagerView();
}

// ─── JAMOA KPI ───────────────────────────────────────
function pageTeamKPI(){
  return `
  <div class="page" id="page-kpi">
    <div class="card"><div class="card-h">Jamoa KPI</div>
      <div class="card-b">
        <div class="fg"><label>Sana</label>
          <input type="date" id="kpi-date" value="${todayStr()}" onchange="renderTeamKPI()" /></div>
        <div id="kpi-team" class="alert alert-i">Yuklanmoqda...</div>
      </div>
    </div>
  </div>`;
}
async function renderTeamKPI(){
  const date=v('kpi-date')||todayStr();
  // Cache ishlatamiz - tezroq (fon rejimida yangilanadi)
  const kpi=await apiGet('getKPI',{role:ST.user.role,empId:ST.user.id,date},true).catch(()=>({}));
  // Cache ni tozalaymiz - keyingi chaqiruvda yangi ma'lumot olsinlar
  delete _apiCache['getKPI'+JSON.stringify({role:ST.user.role,empId:ST.user.id,date})];
  const el=document.getElementById('kpi-team');if(!el)return;
  const entries=Object.entries(kpi);
  if(!entries.length){el.innerHTML='<div class="alert alert-i">Bu sana uchun ma\'lumot yo\'q</div>';el.className='';return;}
  el.className='';
  el.innerHTML=entries.map(([id,s])=>`
    <div class="vcard">
      <div class="vcard-h"><span class="vcard-name">${s.empName||id}</span>
        <span class="bdg ${(s.pct||0)>=80?'bdg-g':(s.pct||0)>=50?'bdg-y':'bdg-r'}">${s.pct||0}%</span>
      </div>
      <div class="vcard-meta">
        Vrach viziti: ${s.doctorV||0} · Dorixona viziti: ${s.pharmV||0} ·
        Ijobiy natija: ${s.positive||0} · Shubhali: ${s.shubhali||0}
      </div>
    </div>`).join('');
}

// ─── ADMIN BALANS ────────────────────────────────────
function pageAdminBalance(){
  return `
  <div class="page" id="page-adminbalance">
    <div class="card"><div class="card-h">Menejerlarga mablag' ajratish</div>
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
    <div class="card"><div class="card-h">Menejerlar balansi</div>
      <div class="card-b" id="ab-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
  </div>`;
}

async function renderAdminBalance(){
  const[emps,bals]=await Promise.all([
    apiGet('getDoctors',{}).catch(()=>null), // Hodimlar uchun checkLogin ishlatamiz
    apiGet('getAllBalances',{}).catch(()=>[]),
  ]);
  // Menejerlarni _USER_INFO dan olamiz
  const mgrList=Object.entries(_LOGIN_CACHE||{}).filter(([id,u])=>u.role==='manager');
  const sel=document.getElementById('ab-mgr');
  if(sel) sel.innerHTML='<option value="">— Tanlang —</option>'+
    mgrList.map(([id,u])=>`<option value="${id}|${u.name}">${u.name} (${id})</option>`).join('');
  const el=document.getElementById('ab-list');if(!el)return;
  el.innerHTML=(bals||[]).length
    ?(bals||[]).map(b=>`
      <div class="vcard" onclick="showMgrJournalAdmin('${b.mgrId}')" style="cursor:pointer">
        <div class="vcard-h"><span class="vcard-name">${b.mgrName}</span>
          <span class="bdg ${(b.qolgan||0)<0?'bdg-r':'bdg-p'}" style="white-space:nowrap">
            ${(b.qolgan||0)<0?'−':''}${fmtMoney(Math.abs(b.qolgan||0))} qoldi
          </span>
        </div>
        <div class="vcard-meta">Jami kirim: ${fmtMoney(b.jami||0)} · Sarflangan: ${fmtMoney(b.sarflangan||0)}</div>
        <div style="font-size:11px;color:var(--ok);margin-top:4px">Bosib batafsil ko'rish</div>
      </div>`).join('')
    :'<div class="alert alert-i">Hali balans ajratilmagan</div>';
}

function abResetForm(){
  const s=document.getElementById('ab-summa');if(s)s.value='';
  const c=document.getElementById('ab-comment');if(c)c.value='';
}
async function abSave(){
  const sel=v('ab-mgr');if(!sel){alert('Menejerni tanlang!');return;}
  const parts=sel.split('|');const mgrId=parts[0],mgrName=parts.slice(1).join('|');
  const summa=Number(v('ab-summa'))||0;if(!summa){alert('Summani kiriting!');return;}
  const resp=await apiPost({action:'addMgrBalance',mgrId,mgrName,summa,date:todayStr(),comment:v('ab-comment')||'Admin tomonidan'});
  if(resp.error){alert('Xato: '+resp.error);return;}
  showModal('Saqlandi',`<p>${mgrName} ga ${fmtMoney(summa)} qo'shildi.</p>`,
    '<button class="btn btn-p" onclick="closeModal()">OK</button>');
  renderAdminBalance();
}
async function showMgrJournalAdmin(mgrId){
  const journal=await apiGet('getMgrJournal',{mgrId},false).catch(()=>[]);
  const list=(journal||[]).reverse().slice(0,30);
  showModal('Balans jurnali',
    list.length?list.map(j=>`
      <div class="irow">
        <span class="irow-l" style="font-size:12px">
          <b style="color:${j['Harakat']==='CHIQIM'?'var(--danger)':'var(--ok)'}">${j['Harakat']==='CHIQIM'?'Chiqim':'Kirim'}</b>
          <br><span style="font-size:11px">${j['Vaqt va sana']||''}</span>
          <br><span style="font-size:11px;color:var(--muted)">${j['Izoh']||''}</span>
        </span>
        <span class="irow-v" style="color:${j['Harakat']==='CHIQIM'?'var(--danger)':'var(--ok)'}">
          ${j['Harakat']==='CHIQIM'?'−':'+'}${fmtMoney(j["Miqdor (so'm)"]||0)}
        </span>
      </div>`).join('')
    :'<div class="alert alert-i">Jurnal bo\'sh</div>',
    '<button class="btn btn-p" onclick="closeModal()">Yopish</button>');
}

// ─── XARITA ─────────────────────────────────────────
function pageMap(){
  return `
  <div class="page" id="page-map">
    <div class="card"><div class="card-h">Vizit lokatsiyalari xaritasi</div>
      <div class="card-b">
        <div class="frow" style="margin-bottom:12px">
          <div class="fg"><label>Hodim</label>
            <select id="map-emp"><option value="">— Barchasi —</option></select></div>
          <div class="fg"><label>Davr</label>
            <select id="map-days" onchange="renderMapPage()">
              <option value="1">Bugun</option><option value="7" selected>1 hafta</option>
              <option value="30">1 oy</option>
            </select></div>
        </div>
        <div id="ymap-container" style="width:100%;height:480px;border-radius:12px;overflow:hidden;border:1px solid var(--border)">
          <div class="alert alert-i">Yuklanmoqda...</div>
        </div>
        <div id="map-list" style="margin-top:14px"></div>
      </div>
    </div>
  </div>`;
}
async function renderMapPage(){
  const days=document.getElementById('map-days')?.value||'7';
  const locs=await apiGet('getLocations',{empId:ST.user.id,role:ST.user.role,days},false).catch(()=>[]);
  const validLocs=(locs||[]).filter(l=>l.lat&&l.lng);
  const empSel=document.getElementById('map-emp');
  if(empSel&&!empSel.dataset.filled&&validLocs.length){
    const uniq=[...new Map(validLocs.map(l=>[l.empId,l.empName])).entries()];
    empSel.innerHTML='<option value="">— Barchasi —</option>'+uniq.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
    empSel.dataset.filled='1';empSel.onchange=renderMapPage;
  }
  const filterEmp=empSel?.value||'';
  const filtered=validLocs.filter(l=>!filterEmp||l.empId===filterEmp);
  const container=document.getElementById('ymap-container');
  if(!filtered.length){if(container)container.innerHTML='<div class="alert alert-i" style="margin:16px">Bu davr uchun lokatsiya yo\'q</div>';return;}
  const first=filtered[0];
  const pts=filtered.slice(0,10).map((l,i)=>`pt=${l.lng},${l.lat},pm2${l.type==='Vrach viziti'?'rd':'gm'}m${i+1}`).join('~');
  if(container)container.innerHTML=`<iframe src="https://yandex.uz/map-widget/v1/?ll=${first.lng}%2C${first.lat}&z=13&lang=ru_RU&${pts}&l=map" width="100%" height="480" frameborder="0" allowfullscreen style="display:block;border:none"></iframe>`;
  const ml=document.getElementById('map-list');
  if(ml)ml.innerHTML=filtered.slice(0,30).map(l=>`
    <div class="irow">
      <span class="irow-l">${l.type==='Vrach viziti'?'🔴':'🟢'} ${l.empName} → ${l.target||''}</span>
      <span class="irow-v"><a href="https://yandex.uz/maps/?ll=${l.lng}%2C${l.lat}&z=16&pt=${l.lng},${l.lat},pm2rdm1" target="_blank" class="bdg bdg-b" style="text-decoration:none">${l.date}</a></span>
    </div>`).join('');
}

// ─── MUROJAATLAR (ADMIN) — xabarlar ro'yxati ────────
function pageFeedbackInbox(){
  return `
  <div class="page" id="page-feedbackbox">
    <div class="card"><div class="card-h">Hodimlar murojaatlari</div>
      <div class="card-b" id="fb-inbox"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
  </div>`;
}
async function renderFeedbackInbox(){
  const el=document.getElementById('fb-inbox');if(!el)return;
  const feedbacks=await apiGet('getFeedbacks',{},false).catch(()=>null);
  if(!feedbacks||feedbacks.error||!feedbacks.length){
    el.innerHTML='<div class="alert alert-i">Murojaatlar yo\'q yoki yuklanmadi (Google Sheets → Murojaatlar sahifasida ko\'rish mumkin)</div>';
    return;
  }
  el.innerHTML=feedbacks.reverse().map(f=>`
    <div class="vcard">
      <div class="vcard-h">
        <span class="vcard-name">${f.empName||f['Hodim Ismi']||'Noma\'lum'}</span>
        <span class="bdg ${f.type==='Shikoyat'?'bdg-r':'bdg-b'}">${f.type||f['Turi']||'Taklif'}</span>
      </div>
      <div class="vcard-meta">${f.date||f['Vaqt va sana']||''}</div>
      <div style="font-size:13px;margin-top:6px;color:var(--text)">${f.message||f['Xabar matni']||''}</div>
    </div>`).join('');
}
