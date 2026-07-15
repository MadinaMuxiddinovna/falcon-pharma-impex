// ─── ADMIN VISIT TARIXI ──────────────────────────
function pageHistoryAdmin(){
  return `
  <div class="page" id="page-histadmin">
    <div class="card"><div class="card-h">Barcha vizitlar tarixi</div>
      <div class="card-b">
        <div class="frow" style="margin-bottom:12px">
          <div class="fg"><label>Hodim</label>
            <select id="hist-emp-sel">
              <option value="">— Barchasi —</option>
            </select>
          </div>
          <div class="fg"><label>Davr</label>
            <select id="hist-days-sel" onchange="renderAdminHistory()">
              <option value="1">Bugun</option>
              <option value="7" selected>1 hafta</option>
              <option value="30">1 oy</option>
            </select>
          </div>
        </div>
        <div id="admin-hist-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
      </div>
    </div>
  </div>`;
}

async function renderAdminHistory(){
  const days=document.getElementById('hist-days-sel')?.value||'7';
  const today=todayStr();
  const from=new Date();from.setDate(from.getDate()-Number(days));
  const fromStr=from.getFullYear()+'-'+String(from.getMonth()+1).padStart(2,'0')+'-'+String(from.getDate()).padStart(2,'0');
  // Barcha hodimlar vizitlarini olamiz (admin uchun role='admin' — barchasi ko'rinadi)
  const visits=await apiGet('getMyVisits',{empId:ST.user.id,from:fromStr,to:today,role:ST.user.role},false).catch(()=>[]);
  // Hodimlar ro'yxatini to'ldirish
  const empSel=document.getElementById('hist-emp-sel');
  if(empSel&&!empSel.dataset.filled&&visits.length){
    const uniq=[...new Map(visits.map(v=>[v.empId||'',v.empName||'']).filter(([id])=>id)).entries()];
    empSel.innerHTML='<option value="">— Barchasi —</option>'+
      uniq.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
    empSel.dataset.filled='1';empSel.onchange=renderAdminHistory;
  }
  const filterEmp=empSel?.value||'';
  const filtered=(visits||[]).filter(v=>!filterEmp||v.empId===filterEmp);
  const el=document.getElementById('admin-hist-list');if(!el)return;
  if(!filtered.length){el.innerHTML="<div class='alert alert-i'>Bu davr uchun vizit yoq</div>";return;}
  // Sanaga qarab guruhlash
  const byDate={};
  filtered.forEach(v=>{const d=v.date||today;if(!byDate[d])byDate[d]=[];byDate[d].push(v);});
  window._histData=byDate;
  el.innerHTML=Object.entries(byDate).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,vs])=>`
    <div style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:var(--primary);
        margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid var(--primary3)">
        ${date} — ${vs.length} ta vizit
      </div>
      ${vs.map((v,i)=>`
        <div class="vcard" onclick="showHistDetail('${date}',${i})" style="margin-bottom:6px;cursor:pointer">
          <div class="vcard-h">
            <span>${v.type==='doctor'?'🏥':'💊'} <b>${v.doctor||v.target||''}</b></span>
            <span class="bdg ${v.result==='ISHLAYDI'?'bdg-g':v.result==='QABUL QILMADI'?'bdg-r':'bdg-y'}">${v.result||'OK'}</span>
          </div>
          <div class="vcard-meta">
            ${v.empName?'👤 '+v.empName+' · ':''}
            ${v.mgrName?'👔 '+v.mgrName+' · ':''}
            ${v.type==='doctor'&&v.target?'🏢 '+v.target+' · ':''}
            ${v.specialty?v.specialty+' · ':''}
            ${v.startTime?'⏰ '+v.startTime+(v.endTime?' → '+v.endTime:''):''}
            ${v.durationMin?'· '+v.durationMin+' min':''}
          </div>
        </div>`).join('')}
    </div>`).join('');
}
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
      <div class="balance-num" id="mgr-bal-qolgan">—</div>
      <div class="balance-lbl">Balansingiz — bosib batafsil ko'rish</div>
    </div>`:''}
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-num" id="mgr-vis">—</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
      <div class="kpi-card"><div class="kpi-num" id="mgr-promo">—</div><div class="kpi-lbl">Kutilayotgan FCOIN</div></div>
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
      apiGet('getPromoQueue',{role:ST.user.role,empId:ST.user.id},false).catch(()=>[]),
      ST.user.role==='manager'?apiGet('getMgrBalance',{mgrId:ST.user.id},false).catch(()=>null):Promise.resolve(null),
    ]);
    if(bal){
      ST.mgrBalance=bal;
      const el=document.getElementById('mgr-bal-qolgan');
      if(el) el.textContent=fmtMoney(bal.qolgan||0);
      const rInfo=document.getElementById('mgr-region-info');
      if(rInfo){
        // Login paytida saqlangan districts dan olamiz (tez)
        const reg = ST.user.region||'';
        const dists = ST.user.districts && ST.user.districts.length
          ? ST.user.districts.join(', ')
          : (ST.user.district||'');
        rInfo.textContent = reg + (dists&&dists!==reg?' · '+dists:'');
        // Agar districts yo'q bo'lsa server dan olamiz
        if(!ST.user.districts||!ST.user.districts.length){
          apiGet('getMgrInfo',{mgrId:ST.user.id},false).then(info=>{
            if(info&&!info.error){
              const d=(info.districts&&info.districts.length)?info.districts.join(', '):(info.district||'');
              rInfo.textContent=(info.region||reg)+(d&&d!==reg?' · '+d:'');
              if(info.districts)ST.user.districts=info.districts;
            }
          }).catch(()=>{});
        }
      }
      const box=document.getElementById('mgr-bal-box');
      if(box) box.style.background=(bal.qolgan||0)<0
        ?'linear-gradient(135deg,#8b0000,#c0260a)'
        :'linear-gradient(135deg,#7a3ca0,#9b59d8)';
    }
    const total=Object.values(kpi).reduce((s,x)=>s+(x.total||0),0);
    const el1=document.getElementById('mgr-vis');if(el1)el1.textContent=total;
    const el2=document.getElementById('mgr-promo');
    if(el2)el2.textContent=(promos||[]).filter(p=>(p['Holati']||p.status||'')==='Kutilmoqda').length;
    // Cache tozalaymiz - yangi KPI uchun
    delete _apiCache['getKPI'+JSON.stringify({role:ST.user.role,empId:ST.user.id,date:todayStr()})];
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
  const journal=await apiGet('getMgrJournal',{mgrId:ST.user.id},false).catch(()=>[]);
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
    <div class="alert alert-i">Balans manfiy bo'lsa ham FCOIN berishingiz mumkin — admin keyinroq to'ldiradi.</div>
    <div class="card"><div class="card-h">FCOIN berish turi</div>
      <div class="card-b">
        <div class="rg">
          <div class="ropt" style="padding:16px;flex-direction:column;gap:4px;justify-content:center" onclick="pdSetType('DOKTOR')">
            <span style="font-size:24px">👨‍⚕️</span><b>DOKTOR</b>
            <span style="font-size:11px;color:var(--muted)">Mustaqil, MP shart emas</span>
          </div>
          <div class="ropt" style="padding:16px;flex-direction:column;gap:4px;justify-content:center" onclick="pdSetType('PROMA')">
            <span style="font-size:24px">🤝</span><b>FCOIN</b>
            <span style="font-size:11px;color:var(--muted)">MP yuborgan so'rov bo'yicha</span>
          </div>
        </div>
      </div>
    </div>
    <div id="pd-flow"></div>
  </div>`;
}

async function renderPayDoctorPage(){
  const bal=await apiGet('getMgrBalance',{mgrId:ST.user.id},false).catch(()=>({jami:0,sarflangan:0,qolgan:0}));
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
  const promos=await apiGet('getPromoQueue',{role:'manager',empId:ST.user.id},false).catch(()=>[]);
  const pending=(promos||[]).filter(p=>(p['Holati']||'')==='Kutilmoqda');
  document.getElementById('pd-flow').innerHTML=`
    <div class="card" style="border:2px solid #7a3ca0">
      <div class="card-h" style="background:#7a3ca0">🤝 FCOIN (MP yuborgan so'rovlar)
        <button onclick="document.getElementById('pd-flow').innerHTML=''"
          style="margin-left:auto;padding:4px 10px;border:1.5px solid #fff;background:#fff;color:#7a3ca0;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">✕</button>
      </div>
      <div class="card-b">
        ${!pending.length
          ?'<div class="alert alert-i">Kutilayotgan FCOIN so\'rovlar yo\'q</div>'
          :pending.map(p=>`
            <div class="vcard" style="cursor:pointer" onclick="pdSelectPromo(${p._row})" id="promo-card-${p._row}">
              <div class="vcard-h">
                <span class="vcard-name">${p['Vrach FISh']||p['Vrach F.I.Sh']||''}</span>
                <span class="bdg bdg-y">Kutilmoqda</span>
              </div>
              <div class="vcard-meta">
                Med Vakil: ${p['Hodim Ismi']||''} · ${p['Ish joyi']||''} ·
                So'ralgan: <b>${fmtCoin(p["Proma summasi (so'm)"]||0)}</b>
              </div>
            </div>`).join('')}
        <div id="pd-promo-selected" class="hide" style="margin-top:12px">
          <div id="pd-promo-info" class="alert alert-ok"></div>
          <div class="fg" style="margin-top:10px"><label>To'lov summasi <span class="req">*</span></label>
            <input id="pd-promo-summa" type="number" min="0" placeholder="200000" /></div>
          <div class="fg"><label>Izoh <span class="req">*</span></label>
            <input id="pd-promo-comment" placeholder="FCOIN uchun..." /></div>
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
  if(!ST.mgrPay.promoData){alert('FCOIN so\'rovini tanlang!');return;}
  const summa=Number(document.getElementById('pd-promo-summa')?.value)||0;
  if(!summa){alert('Summani kiriting!');return;}
  const comment=(document.getElementById('pd-promo-comment')?.value||'Proma tolovi').trim();
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
  // Optimistik balans — darhol ko'rsatamiz (#14)
  const optimisticBal=(ST.mgrBalance?.qolgan||0)-summa;
  updateBalanceUI(optimisticBal);
  showModal("To'lov amalga oshirildi",
    `<p>${p['Vrach FISh']||''} ga <b>${fmtMoney(summa)}</b> berildi.<br>Yangi balans: <b id="pd-modal-bal" style="color:${optimisticBal<0?'var(--danger)':'var(--ok)'}">${fmtMoney(optimisticBal)}</b></p>`,
    '<button class="btn btn-p" onclick="closeModal();document.getElementById(\'pd-flow\').innerHTML=\'\'">OK</button>');
  const resp=await apiPost({action:'mgrPayDoctor',mgrId:ST.user.id,mgrName:ST.user.name,
    type:'PROMA',date:todayStr(),doctorName:p['Vrach FISh']||'',
    doctorSpec:'',doctorObject:p['Ish joyi']||'',doctorDistrict:'',doctorPhone:'',
    mpId:p['Hodim ID']||'',mpName:p['Hodim Ismi']||'',summa,comment});
  // Promo holati yangilash (fon rejimida) — menejer GPS bilan (#13)
  if(p._row){
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos=>apiPost({action:'decidePromo',row:p._row,approved:true,lat:pos.coords.latitude,lng:pos.coords.longitude,mgrId:ST.user.id,mgrName:ST.user.name,mgrDistrict:ST.user.district||''}).catch(()=>{}),
        ()=>apiPost({action:'decidePromo',row:p._row,approved:true,mgrId:ST.user.id,mgrName:ST.user.name,mgrDistrict:ST.user.district||''}).catch(()=>{}),
        {enableHighAccuracy:true,timeout:4000}
      );
    } else {
      apiPost({action:'decidePromo',row:p._row,approved:true,mgrId:ST.user.id,mgrName:ST.user.name,mgrDistrict:ST.user.district||''}).catch(()=>{});
    }
  }
  if(resp.error){alert('Xato: '+resp.error);return;}
  const newBal=resp.newBalance;
  if(newBal!==undefined){
    updateBalanceUI(newBal);
    const modalBal=document.getElementById('pd-modal-bal');
    if(modalBal){modalBal.textContent=fmtMoney(newBal);modalBal.style.color=newBal<0?'var(--danger)':'var(--ok)';}
  }
}

function pdSearchDoc(q){
  q=q.trim();if(q.length<2){hideEl('pd-doc-res');return;}
  const ql=q.toLowerCase();
  const res=ST.doctors.filter(r=>(r.name||'').toLowerCase().includes(ql)).slice(0,8);
  window._pdDocRes=res;
  const box=document.getElementById('pd-doc-res');
  box.innerHTML=res.length
    ?res.map((r,i)=>`<div class="sitem" onclick="pdSelectDocByIdx(${i})">
        <span class="sitem-name">${r.name}</span>
        <span class="sitem-meta">${r.specialty||''} · ${r.object||''}</span></div>`).join('')
    :'<div class="sitem"><span class="sitem-meta">Topilmadi</span></div>';
  showEl('pd-doc-res');
}
function pdSelectDocByIdx(i){
  const r=(window._pdDocRes||[])[i];
  if(r) pdSelectDoc(r);
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
  const t=ST.mgrPay.target;
  // Optimistik balans — darhol hisoblab ko'rsatamiz (#14), server javobi kelganda aniqlashtiramiz
  const optimisticBal=(ST.mgrBalance?.qolgan||0)-summa;
  updateBalanceUI(optimisticBal);
  showModal("To'lov amalga oshirildi",
    `<p>${t.name} ga <b>${fmtMoney(summa)}</b> berildi.<br>Yangi balans: <b id="pd-modal-bal" style="color:${optimisticBal<0?'var(--danger)':'var(--ok)'}">${fmtMoney(optimisticBal)}</b></p>`,
    '<button class="btn btn-p" onclick="closeModal();document.getElementById(\'pd-flow\').innerHTML=\'\'">OK</button>');
  const resp=await apiPost({action:'mgrPayDoctor',mgrId:ST.user.id,mgrName:ST.user.name,
    type:'DOKTOR',date:todayStr(),doctorName:t.name,doctorSpec:t.specialty||'',
    doctorObject:t.object||'',doctorDistrict:t.district||'',doctorPhone:t.phone||'',
    mpId:'',mpName:'',summa,comment});
  if(resp.error){alert('Xato: '+resp.error);return;}
  const newBal=resp.newBalance;
  if(newBal!==undefined){
    updateBalanceUI(newBal);
    const modalBal=document.getElementById('pd-modal-bal');
    if(modalBal){modalBal.textContent=fmtMoney(newBal);modalBal.style.color=newBal<0?'var(--danger)':'var(--ok)';}
  }
}
function updateBalanceUI(newBal){
  ST.mgrBalance=ST.mgrBalance||{};ST.mgrBalance.qolgan=newBal;
  const el=document.getElementById('pd-bal');if(el)el.textContent=fmtMoney(newBal);
  const box=document.getElementById('pd-bal-box');
  if(box)box.style.background=newBal<0?'linear-gradient(135deg,#8b0000,#c0260a)':'linear-gradient(135deg,#7a3ca0,#9b59d8)';
  const el2=document.getElementById('mgr-bal-qolgan');if(el2)el2.textContent=fmtNum(newBal);
  const box2=document.getElementById('mgr-bal-box');
  if(box2)box2.style.background=newBal<0?'linear-gradient(135deg,#8b0000,#c0260a)':'linear-gradient(135deg,#7a3ca0,#9b59d8)';
}

// ─── PROMO — MENEJER uchun rad/tasdiqlash, ADMIN faqat ko'radi ───
function pagePromoQueue(){
  return `
  <div class="page" id="page-promo">
    <div class="card">
      <div class="card-h">FCOIN so'rovlari</div>
      <div class="card-b" id="promo-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
  </div>`;
}
async function renderPromoQueue(){
  const promos=await apiGet('getPromoQueue',{role:ST.user.role,empId:ST.user.id},false).catch(()=>[]);
  ST.promoQueue=promos||[];
  const el=document.getElementById('promo-list');if(!el)return;
  if(!ST.promoQueue.length){el.innerHTML='<div class="alert alert-i">FCOIN so\'rovlar yo\'q</div>';return;}
  const isAdmin=ST.user.role==='admin';
  el.innerHTML=ST.promoQueue.map(p=>{
    const status=p['Holati']||'';
    // Server dan kelgan barcha mumkin bo'lgan ustun nomlarini tekshiramiz
    // AppsScript HDR_PROMO: ['Proma ID','Hodim ID','Hodim Ismi','Menejer ID','Vrach FISh','Ish joyi','Sana','Proma summasi (so\'m)','Holati','Yaratilgan vaqt']
    // HDR_PROMO: Proma ID|Hodim ID|Hodim Ismi|Menejer ID|Vrach F.I.Sh|Ish joyi|Sana|Proma summasi (so'm)|Holati|Yaratilgan vaqt
    const vrach = p['Vrach F.I.Sh'] || p['Vrach FISh'] || p.doctorName || '—';
    const mp    = p['Hodim Ismi']   || p.empName        || '';
    const joyi  = p['Ish joyi']     || p.doctorObject   || '';
    const sana  = String(p['Sana']  || p.date           || '').replace('T',' ').slice(0,16);
    // "Proma summasi (so'm)" — apostrofli - ikki xil usulda tekshiramiz
    let summa = 0;
    for(const key of Object.keys(p)){
      if(key.toLowerCase().includes('summa')||key.toLowerCase().includes('proma')){
        const v=Number(p[key]);if(v>0){summa=v;break;}
      }
    }
    const closed=status==='Tasdiqlandi'||status==='Rad etildi';
    return `<div class="vcard">
      <div class="vcard-h">
        <span class="vcard-name">${vrach}</span>
        <span class="bdg ${status==='Tasdiqlandi'?'bdg-g':status==='Rad etildi'?'bdg-r':'bdg-y'}">${status}</span>
      </div>
      <div class="vcard-meta">
        ${mp?'Med Vakil: <b>'+mp+'</b><br>':''}
        ${joyi?'Ish joyi: '+joyi+'<br>':''}
        ${sana?'Sana: '+sana:''}
      </div>
      ${summa>0?`<div style="font-size:14px;font-weight:700;color:var(--ok);margin-top:4px">
        FCOIN summasi: ${fmtCoin(summa)}
      </div>`:''}
      ${!closed&&!isAdmin?`<div class="btn-row" style="margin-top:8px" data-promo-row="${p._row}">
        <button class="btn btn-r" style="padding:5px 12px;font-size:12px" onclick="promoDecide(${p._row},false)">Rad etish</button>
        <button class="btn btn-ok" style="padding:5px 12px;font-size:12px" onclick="promoDecide(${p._row},true)">Tasdiqlash</button>
      </div>`:''}
    </div>`;
  }).join('');
}
function promoDecide(row,approved){
  const status=approved?'Tasdiqlandi':'Rad etildi';
  // Optimistik UI — darhol ko'rsatamiz, server fonda yozadi (#12,#13)
  const btnRow=document.querySelector('[data-promo-row="'+row+'"]');
  const card=btnRow?btnRow.closest('.vcard'):null;
  if(card){
    const bdg=card.querySelector('.bdg');
    if(bdg){bdg.textContent=status;bdg.className='bdg '+(approved?'bdg-g':'bdg-r');}
    if(btnRow)btnRow.innerHTML='<span style="font-size:11px;color:var(--muted)">Saqlandi</span>';
  }
  const p=ST.promoQueue.find(x=>x._row===row);
  if(p){p['Holati']=status;}
  if(approved&&navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      pos=>apiPost({action:'decidePromo',row,approved,lat:pos.coords.latitude,lng:pos.coords.longitude,mgrId:ST.user.id,mgrName:ST.user.name,mgrDistrict:ST.user.district||''}).catch(()=>{}),
      ()=>apiPost({action:'decidePromo',row,approved,mgrId:ST.user.id,mgrName:ST.user.name,mgrDistrict:ST.user.district||''}).catch(()=>{}),
      {enableHighAccuracy:true,timeout:4000}
    );
  } else {
    apiPost({action:'decidePromo',row,approved,mgrId:ST.user.id,mgrName:ST.user.name,mgrDistrict:ST.user.district||''}).catch(()=>{});
  }
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
  const plans=await apiGet('getPlans',{empId:ST.user.id,role:ST.user.role},false).catch(()=>[]);
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
        return `<div class="vcard" data-plan-row="${p._row}">
          <div class="vcard-h"><span class="vcard-name">${obj}</span>
            <span class="bdg ${status==='Tasdiqlangan'?'bdg-g':status==='Rad etildi'?'bdg-r':'bdg-y'}">${status}</span>
          </div>
          <div class="vcard-meta">${date}${maqsad?' · '+maqsad:''}</div>
          ${!isAdmin&&status==='Kutilmoqda'?`<div class="btn-row" style="margin-top:6px">
            <button class="btn btn-r" style="padding:4px 10px;font-size:12px" data-emp="${empName.replace(/"/g,'&quot;')}" data-obj="${obj.replace(/"/g,'&quot;')}" onclick="planMgrConfirmReject(${p._row},this.dataset.emp,this.dataset.obj)">Rad</button>
            <button class="btn btn-ok" style="padding:4px 10px;font-size:12px" onclick="planMgrDecide(${p._row},true)">Tasdiqlash</button>
          </div>`:''}
        </div>`;
      }).join('')}
    </div>`).join('');
  if(ST.user.role==='manager'&&ST.user.isSuperManager) renderSubTeamPlansReadOnly();
}
async function renderSubTeamPlansReadOnly(){
  const el2=document.getElementById('plan-mgr-list');if(!el2)return;
  const subPlans=await apiGet('getSubTeamPlans',{mgrId:ST.user.id},false).catch(()=>[]);
  if(!subPlans.length)return;
  const byEmp2={};
  subPlans.forEach(p=>{
    const name=p['Hodim Ismi']||'Noma\'lum';
    if(!byEmp2[name])byEmp2[name]=[];byEmp2[name].push(p);
  });
  const readOnlyHtml=`
    <div class="card-h" style="margin-top:16px;border-radius:8px">Boshqa menejerlar MP'lari (faqat ko'rish)</div>
    <div style="margin-top:10px">
    ${Object.entries(byEmp2).map(([empName,pList])=>`
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px">${empName}</div>
        ${pList.map(p=>{
          const obj=p['Obyekt nomi']||'';
          const status=p['Holati']||'';
          const decidedBy=p['Qaror qilgan Menejer Ismi']||'';
          const decidedAt=p['Qaror vaqti']||'';
          return `<div class="vcard" style="margin-bottom:6px">
            <div class="vcard-h"><span class="vcard-name">${obj}</span>
              <span class="bdg ${status==='Tasdiqlangan'?'bdg-g':status==='Rad etildi'?'bdg-r':'bdg-y'}">${status}</span></div>
            <div class="vcard-meta">${p['Vizit sanasi']||''}${decidedBy?' · '+decidedBy+(decidedAt?' ('+decidedAt+')':''):''}</div>
          </div>`;
        }).join('')}
      </div>`).join('')}
    </div>`;
  el2.insertAdjacentHTML('beforeend',readOnlyHtml);
}
function planMgrConfirmReject(row,empName,obj){
  if(confirm(empName+' — '+obj+'\n\nUshbu rejani rad etmoqchimisiz?')){
    planMgrDecide(row,false);
  }
}
async function planMgrDecide(row,approved){
  const status=approved?'Tasdiqlangan':'Rad etildi';
  // Optimistik UI: darhol ko'rsatamiz, server fonda yuklanadi
  const card=document.querySelector('[data-plan-row="'+row+'"]');
  if(card){
    const bdg=card.querySelector('.bdg');
    if(bdg){bdg.textContent=status;bdg.className='bdg '+(approved?'bdg-g':'bdg-r');}
    const btns=card.querySelector('.btn-row');
    if(btns)btns.innerHTML='<span style="font-size:11px;color:var(--muted)">Saqlandi</span>';
  }
  // ST.plans da ham yangilaymiz
  const p=ST.plans.find(x=>x._row===row);
  if(p){p['Holati']=status;p.status=status;}
  apiPost({action:'updatePlan',row,status,mgrId:ST.user.id,mgrName:ST.user.name,mgrDistrict:ST.user.district||''}).catch(()=>{});
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
  // Har doim yangi ma'lumot — KPI srazu ko'rinishi kerak (#10)
  const effRole=(ST.user.role==='ta'&&ST.user.isTeamLead)?'manager':ST.user.role;
  const kpi=await apiGet('getKPI',{role:effRole,empId:ST.user.id,date},false).catch(()=>({}));
  const el=document.getElementById('kpi-team');if(!el)return;
  const entries=Object.entries(kpi);
  if(!entries.length){el.innerHTML='<div class="alert alert-i">Bu sana uchun ma\'lumot yo\'q</div>';el.className='';return;}
  el.className='';
  const isAgentTeam=(ST.user.role==='ta'&&ST.user.isTeamLead);
  function calcHours(st,en){
    if(!st||!en)return '—';
    const[sh,sm,ss]=st.split(':').map(Number),[eh,em,es]=en.split(':').map(Number);
    const mins=(eh*60+em)-(sh*60+sm);
    return mins>0?Math.round(mins/60*10)/10:'—';
  }
  el.innerHTML=`<div style="overflow-x:auto">
    <table class="stbl">
      <thead><tr><th>F.I.Sh</th><th>Boshlandi</th><th>Tugadi</th><th>Soat</th>${isAgentTeam?'':'<th>Vrach</th>'}<th>Dorixona</th><th>%</th></tr></thead>
      <tbody>
        ${entries.map(([id,s])=>`
        <tr>
          <td><b>${s.empName||id}</b></td>
          <td>${s.startTime||'—'}</td>
          <td>${s.endTime||'—'}</td>
          <td>${calcHours(s.startTime,s.endTime)}</td>
          ${isAgentTeam?'':'<td>'+(s.doctorV||0)+'</td>'}
          <td>${s.pharmV||0}</td>
          <td><span class="bdg ${(s.pct||0)>=80?'bdg-g':(s.pct||0)>=50?'bdg-y':'bdg-r'}">${s.pct||0}%</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// ─── ADMIN BALANS ────────────────────────────────────
// ── BOSH MENEJER: qo'l ostidagi menejerlar balansi (#8) ──
function pageMgrBalanceOverview(){return `
  <div class="page" id="page-mgrbalanceoverview">
    <div class="card">
      <div class="card-h">Menejerlar balansi</div>
      <div class="card-b" id="mgr-balance-overview-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
  </div>`;
}
async function renderMgrBalanceOverview(){
  const el=document.getElementById('mgr-balance-overview-list');if(!el)return;
  const data=await apiGet('getManagerBalanceOverview',{mgrId:ST.user.id},false).catch(()=>[]);
  window._mgrBalOverview=data;
  if(!data.length){el.innerHTML='<div class="alert alert-i">Qo\'l ostingizda menejer topilmadi</div>';return;}
  el.innerHTML=data.map((m,i)=>`
    <div class="vcard" onclick="showMgrBalanceDetail(${i})" style="cursor:pointer;margin-bottom:10px">
      <div class="vcard-h"><span class="vcard-name">${m.mgrName}</span>
        <span class="bdg ${m.qolgan>=0?'bdg-g':'bdg-r'}">${fmtNum(m.qolgan)}</span></div>
      <div class="vcard-meta">Jami berilgan: ${fmtNum(m.jami)} · Sarflangan: ${fmtNum(m.sarflangan)}</div>
    </div>`).join('');
}
function showMgrBalanceDetail(i){
  const m=(window._mgrBalOverview||[])[i];if(!m)return;
  const journalHtml=(m.journal||[]).slice().reverse().slice(0,30).map(j=>{
    const amt=j["Miqdor (so'm)"]||0;
    return '<div class="irow" style="font-size:12.5px">'
      +'<span class="irow-l">'+(j['Harakat']||'')+' — '+(j['Izoh']||'')+'</span>'
      +'<span class="irow-v">'+fmtNum(amt)+'<br><span style="font-size:11px;color:var(--muted)">'+(j['Vaqt va sana']||'')+'</span></span>'
      +'</div>';
  }).join('');
  showModal(m.mgrName+' — balans tarixi',`
    <div class="irow"><span class="irow-l">Jami berilgan</span><span class="irow-v">${fmtNum(m.jami)}</span></div>
    <div class="irow"><span class="irow-l">Sarflangan</span><span class="irow-v">${fmtNum(m.sarflangan)}</span></div>
    <div class="irow"><span class="irow-l"><b>Qolgan</b></span><span class="irow-v" style="font-weight:800">${fmtNum(m.qolgan)}</span></div>
    <div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase">So'nggi harakatlar</div>
    ${journalHtml||'<div class="alert alert-i" style="margin-top:6px">Tarix yo\'q</div>'}
  `,'<button class="btn btn-p" onclick="closeModal()">Yopish</button>');
}
function pageAdminJournal(){return `
  <div class="page" id="page-adminjournal">
    <div class="card">
      <div class="card-h">Admin jurnali — menejerlarga berilgan mablag'lar</div>
      <div class="card-b">
        <div class="fg"><label>Oy</label>
          <input type="month" id="aj-month" value="${todayStr().slice(0,7)}" onchange="renderAdminJournal()" />
        </div>
        <div id="aj-summary" style="margin:10px 0"></div>
        <div style="overflow-x:auto">
          <table class="stbl">
            <thead><tr><th>Sana</th><th>Jami berilgan (so'm)</th></tr></thead>
            <tbody id="aj-byday-tbody"></tbody>
          </table>
        </div>
        <div class="card-h" style="margin-top:16px;border-radius:8px">Barcha yozuvlar</div>
        <div id="aj-entries" style="margin-top:8px"></div>
      </div>
    </div>
  </div>`;
}
async function renderAdminJournal(){
  const month=document.getElementById('aj-month')?.value||todayStr().slice(0,7);
  const data=await apiGet('getAdminJournal',{month},false).catch(()=>({entries:[],byDay:[],total:0}));
  const sEl=document.getElementById('aj-summary');
  if(sEl)sEl.innerHTML=`<div class="kpi-grid"><div class="kpi-card" style="grid-column:span 2">
    <div class="kpi-num">${fmtMoney(data.total||0)}</div><div class="kpi-lbl">Shu oyda jami berilgan</div>
  </div></div>`;
  const tb=document.getElementById('aj-byday-tbody');
  if(tb)tb.innerHTML=(data.byDay||[]).length?data.byDay.map(d=>`
    <tr><td>${uzDateShort(d.date)}</td><td><b>${fmtMoney(d.summa)}</b></td></tr>
  `).join(''):'<tr><td colspan="2" style="text-align:center;color:var(--muted)">Bu oyda ma\'lumot yo\'q</td></tr>';
  const eEl=document.getElementById('aj-entries');
  if(eEl)eEl.innerHTML=(data.entries||[]).length?data.entries.map(e=>`
    <div class="irow">
      <span class="irow-l">${e.mgrName||e.mgrId} <span style="color:var(--muted);font-size:11px">${e.comment?'· '+e.comment:''}</span></span>
      <span class="irow-v">${fmtMoney(e.summa)}<br><span style="font-size:11px;color:var(--muted)">${uzDateShort(e.date)} ${e.time}</span></span>
    </div>`).join(''):'<div class="alert alert-i">Yozuv yo\'q</div>';
}
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
  const bals=await apiGet('getAllBalances',{},false).catch(()=>[]);
  // Menejerlarni server dan olamiz
  const empData=await apiGet('getEmployees',{},false).catch(()=>({}));
  const mgrList=Object.entries(empData||{}).filter(([id,u])=>u.role==='manager');
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
    <div class="card"><div class="card-h">Vizit lokatsiyalari va tuman qamrovi xaritasi</div>
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
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px;font-size:12px;align-items:center">
          <span>🔴 MP - vrach</span>
          <span>🟢 MP - dorixona</span>
          <span>🔵 Agent - dorixona</span>
          <span>🟠 Menejer</span>
          <span style="margin-left:auto">Tuman qamrovi:
            <span style="background:#c0260a33;border:1px solid #c0260a;padding:1px 7px;border-radius:4px">kam</span>
            <span style="background:#b56f0033;border:1px solid #b56f00;padding:1px 7px;border-radius:4px">o'rtacha</span>
            <span style="background:#0f6e5633;border:1px solid #0f6e56;padding:1px 7px;border-radius:4px">yaxshi</span>
          </span>
        </div>
        <div id="leaflet-map" style="width:100%;height:480px;border-radius:12px;overflow:hidden;border:1px solid var(--border)"></div>
        <div id="map-list" style="margin-top:14px"></div>
      </div>
    </div>
  </div>`;
}

let _leafletMap=null,_leafletGeoLayer=null,_leafletMarkers=null;
function normDistrictJS(s){
  return String(s||'').toLowerCase()
    .replace(/tumani|tuman|district|rayoni|rayon/g,'')
    .replace(/['''ʼ`]/g,'')
    .replace(/\s+/g,'')
    .trim();
}
async function renderMapPage(){
  const days=document.getElementById('map-days')?.value||'7';
  const [locs,coverage]=await Promise.all([
    apiGet('getLocations',{empId:ST.user.id,role:(ST.user.role==='ta'&&ST.user.isTeamLead)?'manager':ST.user.role,days},false).catch(()=>[]),
    apiGet('getDistrictCoverage',{days},false).catch(()=>({}))
  ]);
  const validLocs=(locs||[]).filter(l=>l.lat&&l.lng);
  const empSel=document.getElementById('map-emp');
  if(empSel&&!empSel.dataset.filled&&validLocs.length){
    const uniq=[...new Map(validLocs.map(l=>[l.empId,l.empName])).entries()];
    empSel.innerHTML='<option value="">— Barchasi —</option>'+uniq.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
    empSel.dataset.filled='1';empSel.onchange=renderMapPage;
  }
  const filterEmp=empSel?.value||'';
  const filtered=validLocs.filter(l=>!filterEmp||l.empId===filterEmp);

  if(typeof L==='undefined'){
    const c=document.getElementById('leaflet-map');
    if(c)c.innerHTML='<div class="alert alert-r" style="margin:16px">Leaflet kutubxonasi yuklanmadi (index.html tekshiring)</div>';
    return;
  }
  if(!_leafletMap){
    _leafletMap=L.map('leaflet-map').setView([41.31,69.28],11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap',maxZoom:18
    }).addTo(_leafletMap);
    _leafletGeoLayer=L.layerGroup().addTo(_leafletMap);
    _leafletMarkers=L.layerGroup().addTo(_leafletMap);
  }

  // Tuman poligonlari — qamrov foiziga qarab ranglanadi
  _leafletGeoLayer.clearLayers();
  try{
    if(!window._tashkentGeoJSON){
      window._tashkentGeoJSON=await fetch('./tashkent_tumanlar.geojson').then(r=>r.json());
    }
    L.geoJSON(window._tashkentGeoJSON,{
      style:(feature)=>{
        const key=normDistrictJS(feature.properties.ADM2_UZ);
        const cov=coverage[key];
        const pct=cov?cov.pct:0;
        const color=!cov?'#8899aa':pct>=70?'#0f6e56':pct>=30?'#b56f00':'#c0260a';
        return {color:color,weight:2,fillColor:color,fillOpacity:cov?0.28:0.06};
      },
      onEachFeature:(feature,layer)=>{
        const name=feature.properties.ADM2_UZ;
        const key=normDistrictJS(name);
        const cov=coverage[key];
        const info=cov?(cov.visited+' / '+cov.total+' ta obyekt qamrab olingan ('+cov.pct+'%)'):"Ma'lumot yo'q";
        layer.bindPopup('<b>'+name+'</b><br>'+info);
      }
    }).addTo(_leafletGeoLayer);
  }catch(e){ console.error('GeoJSON yuklashda xato:',e); }

  // Individual vizit nuqtalari
  _leafletMarkers.clearLayers();
  filtered.slice(0,200).forEach(l=>{
    let color;
    if(l.type==='Vrach viziti'||l.type==='doctor'){
      color=(l.role==='manager')?'#e67e22':'#e74c3c';
    } else {
      color=(l.role==='ta'||l.role==='agent')?'#2980b9':'#27ae60';
    }
    const m=L.circleMarker([l.lat,l.lng],{radius:7,color:'#fff',weight:1,fillColor:color,fillOpacity:0.9});
    m.bindPopup('<b>'+l.empName+'</b><br>'+(l.target||'')+'<br>'+fmtLocDateTime(l.date,l.time));
    m.addTo(_leafletMarkers);
  });
  if(filtered.length) _leafletMap.setView([filtered[0].lat,filtered[0].lng],12);

  const ml=document.getElementById('map-list');
  if(ml)ml.innerHTML=filtered.slice(0,30).map(l=>{
    let color;
    if(l.type==='Vrach viziti'||l.type==='doctor'){
      color=(l.role==='manager')?'or':'rd';
    } else {
      color=(l.role==='ta'||l.role==='agent')?'bl':'gm';
    }
    return `
    <div class="irow">
      <span class="irow-l">${l.type==='Vrach viziti'?'🔴':'🟢'} ${l.empName} → ${l.target||''}</span>
      <span class="irow-v"><a href="https://yandex.uz/maps/?ll=${l.lng}%2C${l.lat}&z=16&pt=${l.lng},${l.lat},pm2${color}m1" target="_blank" class="bdg bdg-b" style="text-decoration:none">${fmtLocDateTime(l.date,l.time)}</a></span>
    </div>`;
  }).join('');
}

// Backend'dan sana/vaqt turli formatda kelishi mumkin (masalan xom ISO: 2026-07-05T19:00:00.000Z) —
// bu yerda ularni Toshkent vaqtida o'qilishi oson formatga keltiramiz
function fmtLocDateTime(dateVal,timeVal){
  const raw=String(dateVal||'');
  if(raw.includes('T')){
    const d=new Date(raw);
    if(!isNaN(d.getTime())){
      const dateStr=d.toLocaleDateString('uz-UZ',{timeZone:'Asia/Tashkent'});
      const timeStr=timeVal||d.toLocaleTimeString('uz-UZ',{timeZone:'Asia/Tashkent',hour:'2-digit',minute:'2-digit'});
      return dateStr+' · '+timeStr;
    }
  }
  return raw+(timeVal?' · '+timeVal:'');
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
      <div class="vcard-meta">
        ${(f['Vaqt va sana']||f.date||f['Vaqt']||'')}</div>
      <div style="font-size:13px;margin-top:6px;color:var(--text);padding:8px;background:#f8fafd;border-radius:6px;border-left:3px solid var(--primary3)">
        ${f.message||f['Xabar matni']||f['Xabar']||'—'}
      </div>
    </div>`).join('');
}
