// ╔════════════════════════════════════════════════════════════════╗
// ║  app2.js v7 — BOSH SAHIFA, REJA, KUN YAKUNI, MUROJAAT          ║
// ║  Tuzatishlar:                                                   ║
// ║  - Sana o'zbekcha (WED→Chorshanba, M07→Iyul)                   ║
// ║  - Stiker yo'q greeting da, faqat FIO                           ║
// ║  - Reja: "Mening VISIT rejam", "Obyekt bo'yicha yangi reja"     ║
// ║  - Reja: Obyekt (ish joyi) qidirish, vrach FIO emas             ║
// ║  - Kun yakuni: "Bajarilgan % hisobi" (25 ta=100% emas)          ║
// ║  - Murojaat: "Anonim tarzda yuboriladi!" matni                  ║
// ╚════════════════════════════════════════════════════════════════╝

// ── O'ZBEKCHA SANA (WED, THU inglizcha chiqmasin) ──────────────
const UZ_KUNLAR = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
const UZ_OYLAR  = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr'];
function uzDate(d) {
  const dt = d ? new Date(d + 'T00:00:00') : new Date();
  return UZ_KUNLAR[dt.getDay()] + ', ' + dt.getDate() + ' ' + UZ_OYLAR[dt.getMonth()] + ' ' + dt.getFullYear();
}

// ════════════════════════════════════════════════════════════════
// SAHIFALARNI QURISH
// ════════════════════════════════════════════════════════════════
function buildAllPages() {
  const role = ST.user.role;
  const c = document.getElementById('pages-container');
  let html = '';
  if (role==='mp')  { html += pageHomeMP(); html += pagePlan(); html += pageEndDay('mp'); html += pageFeedback(); }
  if (role==='ta')  { html += pageHomeTA(); html += pageEndDay('ta'); html += pageFeedback(); }
  if (role==='manager') {
    html += pageManagerDashboard(); html += pagePayDoctor(); html += pagePromoQueue();
    html += pagePlanManager(); html += pageTeamKPI(); html += pageMap();
  }
  if (role==='admin') {
    html += pageManagerDashboard(); html += pageAdminBalance(); html += pagePromoQueue();
    html += pagePlanManager(); html += pageTeamKPI(); html += pageMap(); html += pageFeedbackInbox();
  }
  c.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════
// MP BOSH SAHIFA
// ════════════════════════════════════════════════════════════════
function pageHomeMP() {
  return `
  <div class="page active" id="page-home">
    <div class="card"><div class="card-b" style="text-align:center;padding:24px 17px">
      <div id="home-date" style="font-size:13px;color:var(--muted);margin-bottom:6px"></div>
      <div id="home-name" style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:16px"></div>
      <div class="kpi-grid" style="margin-bottom:0">
        <div class="kpi-card"><div class="kpi-num" id="home-done">0</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
        <div class="kpi-card"><div class="kpi-num" id="home-plan">0</div><div class="kpi-lbl">Bugungi reja</div></div>
      </div>
    </div></div>
    <div class="card">
      <div class="card-h">Yangi vizit boshlash</div>
      <div class="card-b">
        <div class="alert alert-i">Vizit turini tanlang. Adashib boshqasini tanlasangiz — orqaga qaytib qayta tanlay olasiz.</div>
        <div class="rg">
          <div class="ropt" style="padding:18px;flex-direction:column;gap:6px;justify-content:center" onclick="startVisitFlow('doctor')">
            <span style="font-size:28px">🏥</span><span style="font-weight:700">VRACH VIZITI</span>
          </div>
          <div class="ropt" style="padding:18px;flex-direction:column;gap:6px;justify-content:center" onclick="warnPharmacyForMP()">
            <span style="font-size:28px">💊</span><span style="font-weight:700">DORIXONA</span>
          </div>
        </div>
      </div>
    </div>
    <div id="visit-flow-container"></div>
  </div>`;
}
function warnPharmacyForMP() {
  showModal('Diqqat!','<p style="font-size:14px">Med. Vakil odatda vrach vizit qiladi. Dorixona vizitini boshlashni xohlaysizmi?</p>',
    '<button class="btn btn-o" onclick="closeModal()">Bekor qilish</button> <button class="btn btn-p" onclick="closeModal();startVisitFlow(\'pharmacy\')">Ha, davom etish</button>');
}

// ════════════════════════════════════════════════════════════════
// TA BOSH SAHIFA
// ════════════════════════════════════════════════════════════════
function pageHomeTA() {
  return `
  <div class="page active" id="page-home">
    <div class="card"><div class="card-b" style="text-align:center;padding:24px 17px">
      <div id="home-date" style="font-size:13px;color:var(--muted);margin-bottom:6px"></div>
      <div id="home-name" style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:16px"></div>
      <div class="kpi-grid" style="margin-bottom:0">
        <div class="kpi-card"><div class="kpi-num" id="home-done">0</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
        <div class="kpi-card"><div class="kpi-num" id="home-pct">0%</div><div class="kpi-lbl">Bajarilgan %</div></div>
      </div>
    </div></div>
    <div class="card"><div class="card-h">Yangi dorixona vizitini boshlash</div>
      <div class="card-b"><button class="btn btn-p btn-bl btn-lg" onclick="startVisitFlow('pharmacy')">Boshlash</button></div>
    </div>
    <div id="visit-flow-container"></div>
  </div>`;
}

function renderHome() {
  const dateEl = document.getElementById('home-date'); if (!dateEl) return;
  // O'zbekcha sana — stikersiz, inglizcha yo'q
  dateEl.textContent = uzDate();
  // Faqat FIO — emoji yo'q
  document.getElementById('home-name').textContent = ST.user.name;
  const done = ST.todayVisits.length;
  document.getElementById('home-done').textContent = done;
  if (ST.user.role==='mp') {
    document.getElementById('home-plan').textContent = ST.plans.filter(p=>p.date===todayStr()).length;
  } else if (ST.user.role==='ta') {
    document.getElementById('home-pct').textContent = Math.min(Math.round(done/25*100),100)+'%';
  }
}

// ════════════════════════════════════════════════════════════════
// REJA SAHIFASI
// ════════════════════════════════════════════════════════════════
function pagePlan() {
  return `
  <div class="page" id="page-plan">
    <div class="card">
      <div class="card-h">Mening VISIT rejam</div>
      <div class="card-b">
        <div class="frow3" style="margin-bottom:14px">
          <div class="ropt on" onclick="setPlanFilter(this,'day')">Kunlik</div>
          <div class="ropt" onclick="setPlanFilter(this,'week')">Haftalik</div>
          <div class="ropt" onclick="setPlanFilter(this,'month')">Oylik</div>
        </div>
        <div id="plan-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
        <button class="btn btn-p btn-bl" style="margin-top:12px" onclick="toggleAddPlanForm()">+ Yangi reja qo'shish</button>
      </div>
    </div>
    <div class="card hide" id="add-plan-card">
      <div class="card-h">Obyekt bo'yicha yangi reja</div>
      <div class="card-b">
        <div class="fg"><label>Sana <span class="req">*</span></label>
          <input type="date" id="ap-date" value="${todayStr()}" /></div>
        <div class="fg">
          <!-- ISH JOYI = obyekt nomi qidiruvi (vrach FIO emas!) -->
          <label>Ish joyi (obyekt) <span class="req">*</span></label>
          <div class="search-wrap"><input id="ap-search" placeholder="Masalan: 8-Oilaviy, Dialab..." oninput="apSearchObject(this.value)" /></div>
          <div id="ap-search-res" class="slist hide"></div>
        </div>
        <div id="ap-selected" class="alert alert-ok hide"></div>
        <div class="btn-row">
          <button class="btn btn-o" onclick="toggleAddPlanForm()">Bekor qilish</button>
          <button class="btn btn-p" onclick="savePlan()">Menejerga yuborish</button>
        </div>
      </div>
    </div>
  </div>`;
}

let planFilter='day', apTarget=null;
function setPlanFilter(el,f) {
  document.querySelectorAll('#page-plan .frow3 .ropt').forEach(e=>e.classList.remove('on'));
  el.classList.add('on'); planFilter=f; renderPlans();
}
function toggleAddPlanForm() {
  document.getElementById('add-plan-card').classList.toggle('hide');
  apTarget=null;
  const inp=document.getElementById('ap-search'); if(inp) inp.value='';
  hideEl('ap-selected'); hideEl('ap-search-res');
}

// Obyekt (ish joyi) qidirish — faqat unikal obyekt nomlari
function apSearchObject(q) {
  q=q.trim(); if(q.length<2){hideEl('ap-search-res');return;}
  const ql=q.toLowerCase();
  const objMap=new Map();
  ST.doctors.forEach(d=>{
    if((d.object||'').toLowerCase().includes(ql)) {
      objMap.set(d.object,{object:d.object,region:d.region,district:d.district});
    }
  });
  const res=[...objMap.values()].slice(0,10);
  const box=document.getElementById('ap-search-res');
  box.innerHTML=res.length
    ? res.map(r=>`<div class="sitem" onclick='apSelectObject(${JSON.stringify(r)})'>
        <span class="sitem-name">${r.object}</span>
        <span class="sitem-meta">${r.region||''} · ${r.district||''}</span></div>`).join('')
    : '<div class="sitem"><span class="sitem-meta">Topilmadi</span></div>';
  showEl('ap-search-res');
}
function apSelectObject(obj) {
  apTarget=obj; hideEl('ap-search-res');
  document.getElementById('ap-search').value=obj.object;
  document.getElementById('ap-selected').innerHTML='✅ '+obj.object+' · '+(obj.district||'');
  showEl('ap-selected');
}

// Rejalarni sanaga qarab guruhlangan list ko'rinishida chiqarish
function renderPlans() {
  const el=document.getElementById('plan-list'); if(!el) return;
  const today=todayStr();
  let from=today, to=today;
  if(planFilter==='week') { const w=new Date(); w.setDate(w.getDate()+7); to=w.toISOString().split('T')[0]; }
  if(planFilter==='month') { const m=new Date(); m.setMonth(m.getMonth()+1); to=m.toISOString().split('T')[0]; }
  const list=ST.plans.filter(p=>p.date>=from&&p.date<=to);
  if(!list.length){el.innerHTML='<div class="alert alert-i">Bu davr uchun reja yo\'q</div>';return;}
  const byDate={};
  list.forEach(p=>{if(!byDate[p.date])byDate[p.date]=[];byDate[p.date].push(p);});
  el.innerHTML=Object.entries(byDate).sort().map(([date,plans])=>`
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;
                  letter-spacing:.5px;margin-bottom:6px;padding:5px 0;border-bottom:1px solid var(--border)">
        ${uzDate(date)}
      </div>
      ${plans.map(p=>`<div class="vcard">
        <div class="vcard-h"><span class="vcard-name">${p.targetName}</span>
          <span class="bdg ${p.status==='Tasdiqlangan'?'bdg-g':p.status==='Rad etildi'?'bdg-r':'bdg-y'}">${p.status}</span>
        </div><div class="vcard-meta">${p.targetObject||''}</div></div>`).join('')}
    </div>`).join('');
}

async function savePlan() {
  if(!apTarget){alert('Ish joyini tanlang!');return;}
  const date=v('ap-date'); if(!date){alert('Sanani kiriting!');return;}
  showOv('Menejerga yuborilmoqda...');
  const plan={action:'addPlan',empId:ST.user.id,empName:ST.user.name,mgrId:ST.user.mgrId||'',
    type:'doctor',targetName:apTarget.object,targetObject:apTarget.object,
    date,goal:'Vizit',status:'Kutilmoqda',createdAt:new Date().toISOString()};
  await apiPost(plan);
  ST.plans.push(plan);
  hideOv(); toggleAddPlanForm(); renderPlans();
  showModal('Menejerga yuborildi',
    '<p>Rejangiiz menejeringizga yuborildi. U tasdiqlagach, "Tasdiqlangan" belgisi chiqadi.</p>',
    '<button class="btn btn-p" onclick="closeModal()">OK</button>');
}

// ════════════════════════════════════════════════════════════════
// KUN YAKUNI — "Bajarilgan % hisobi" (to'g'irlandi)
// ════════════════════════════════════════════════════════════════
function pageEndDay(role) {
  return `
  <div class="page" id="page-endday">
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-num" id="ed-done">0</div><div class="kpi-lbl">Bajarilgan vizit</div></div>
      <div class="kpi-card"><div class="kpi-num" id="ed-pct">0%</div><div class="kpi-lbl">Bajarilgan % hisobi</div></div>
    </div>
    <div class="card"><div class="card-h">Bugungi vizitlar ro'yxati</div>
      <div class="card-b" id="ed-list"><div class="alert alert-i">Bugun hali vizit yo'q</div></div></div>
    <div class="card"><div class="card-b">
      <button class="btn btn-ok btn-bl btn-lg" onclick="confirmEndDay()">Kunni yakunlash</button>
    </div></div>
  </div>`;
}
function renderEndDay() {
  const done=ST.todayVisits.length;
  const norm=ST.user.role==='ta'?25:12;
  document.getElementById('ed-done').textContent=done;
  document.getElementById('ed-pct').textContent=Math.min(Math.round(done/norm*100),999)+'%';
  const el=document.getElementById('ed-list'); if(!el) return;
  el.innerHTML=done?ST.todayVisits.map(vis=>`
    <div class="irow"><span class="irow-l">${vis.type==='doctor'?'🏥':'💊'} ${vis.target}</span>
    <span class="irow-v"><span class="bdg bdg-g">${vis.result||'Bajarildi'}</span></span></div>`).join('')
    :'<div class="alert alert-i">Bugun hali vizit yo\'q</div>';
}
function confirmEndDay() {
  showModal('Kunni yakunlash',
    '<p style="font-size:14px;line-height:1.6">Kunni yakunlaysizmi? Hali vizit qilish kerak bo\'lsa "Davom etish" ni bosing.</p>',
    '<button class="btn btn-p" onclick="closeModal()">Davom etish</button> <button class="btn btn-ok" onclick="closeModal();doEndDay()">Ha, yakunlash</button>');
}
async function doEndDay() {
  showOv('Yakunlanmoqda...');
  await apiPost({action:'endDay',empId:ST.user.id,empName:ST.user.name,role:ST.user.role,date:todayStr()});
  hideOv();
  showModal('Kun yakunlandi','<p>Hisobotingiz yuborildi. Yaxshi dam oling!</p>',
    '<button class="btn btn-p" onclick="closeModal()">OK</button>');
}

// ════════════════════════════════════════════════════════════════
// MUROJAAT — "Anonim tarzda yuboriladi!" (to'g'irlandi)
// ════════════════════════════════════════════════════════════════
function pageFeedback() {
  return `
  <div class="page" id="page-feedback">
    <div class="card"><div class="card-h">Taklif va Shikoyat</div>
      <div class="card-b">
        <div class="alert alert-i">Taklif va Shikoyatingiz Anonim tarzda yuboriladi!</div>
        <div class="fg"><label>Tur</label>
          <div class="rg">
            <div class="ropt on" onclick="setFbType(this,'Taklif')">Taklif</div>
            <div class="ropt" onclick="setFbType(this,'Shikoyat')">Shikoyat</div>
          </div>
        </div>
        <div class="fg"><label>Xabar <span class="req">*</span></label>
          <textarea id="fb-msg" rows="4" placeholder="Fikringizni yozing..."></textarea></div>
        <button class="btn btn-p btn-bl btn-lg" onclick="submitFb()">Yuborish</button>
        <div id="fb-result" class="hide" style="margin-top:14px"></div>
      </div>
    </div>
  </div>`;
}
let fbType='Taklif';
function setFbType(el,t){
  document.querySelectorAll('#page-feedback .rg .ropt').forEach(e=>e.classList.remove('on'));
  el.classList.add('on'); fbType=t;
}
async function submitFb() {
  const msg=v('fb-msg').trim(); if(!msg){alert('Xabar matnini kiriting!');return;}
  showOv('Yuborilmoqda...');
  await apiPost({action:'submitFeedback',empId:ST.user.id,empName:ST.user.name,message:msg,type:fbType});
  hideOv(); document.getElementById('fb-msg').value='';
  const r=document.getElementById('fb-result');
  r.innerHTML='<div class="alert alert-ok">Xabaringiz yuborildi!</div>';
  r.classList.remove('hide');
}
