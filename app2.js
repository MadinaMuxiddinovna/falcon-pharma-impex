// app2.js v8 — BOSH SAHIFA, REJA, KUN YAKUNI, MUROJAAT
// Tuzatishlar:
// - Bosh sahifa: region/rayon/guruh ko'rinadi
// - Kun yakuni: bugungi vizitlarni serverdan olib ko'rsatadi
// - Reja: obyekt qidirish (o'z tuman/regioni)
// - KPI: real vaqt bugungi hisobi

const UZ_KUNLAR=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
const UZ_OYLAR=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr'];
function uzDate(d){
  const dt=d?new Date(d+'T00:00:00'):new Date();
  return UZ_KUNLAR[dt.getDay()]+', '+dt.getDate()+' '+UZ_OYLAR[dt.getMonth()]+' '+dt.getFullYear();
}

function buildAllPages(){
  const role=ST.user.role;
  const c=document.getElementById('pages-container');
  let html='';
  if(role==='mp'){html+=pageHomeMP();html+=pagePlan();html+=pageEndDay('mp');html+=pageFeedback();}
  if(role==='ta'){html+=pageHomeTA();html+=pageEndDay('ta');html+=pageFeedback();}
  if(role==='manager'){html+=pageManagerDashboard();html+=pagePayDoctor();html+=pagePromoQueue();html+=pagePlanManager();html+=pageTeamKPI();html+=pageMap();}
  if(role==='admin'){html+=pageManagerDashboard();html+=pageAdminBalance();html+=pagePromoQueue();html+=pagePlanManager();html+=pageTeamKPI();html+=pageMap();html+=pageFeedbackInbox();}
  c.innerHTML=html;
}

// ────────────────────────────────────────
// MP BOSH SAHIFA
// ────────────────────────────────────────
function pageHomeMP(){
  return `
  <div class="page active" id="page-home">
    <div class="card"><div class="card-b" style="text-align:center;padding:24px 17px">
      <div id="home-date" style="font-size:13px;color:var(--muted);margin-bottom:4px"></div>
      <div id="home-name" style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:4px"></div>
      <!-- Region/rayon/guruh -->
      <div id="home-meta" style="font-size:12px;color:var(--muted);margin-bottom:14px"></div>
      <div class="kpi-grid" style="margin-bottom:0">
        <div class="kpi-card"><div class="kpi-num" id="home-done">0</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
        <div class="kpi-card"><div class="kpi-num" id="home-plan">0</div><div class="kpi-lbl">Bugungi reja</div></div>
      </div>
    </div></div>
    <div class="card"><div class="card-h">Yangi vizit boshlash</div>
      <div class="card-b">
        <div class="alert alert-i">Vizit turini tanlang. Adashib boshqasini tanlasangiz — "Orqaga" tugmasini bosing.</div>
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
function warnPharmacyForMP(){
  showModal('Diqqat!','<p style="font-size:14px">Med. Vakil odatda vrach vizit qiladi. Dorixona vizitini boshlashni xohlaysizmi?</p>',
    '<button class="btn btn-o" onclick="closeModal()">Bekor qilish</button> <button class="btn btn-p" onclick="closeModal();startVisitFlow(\'pharmacy\')">Ha, davom etish</button>');
}

// ────────────────────────────────────────
// TA BOSH SAHIFA
// ────────────────────────────────────────
function pageHomeTA(){
  return `
  <div class="page active" id="page-home">
    <div class="card"><div class="card-b" style="text-align:center;padding:24px 17px">
      <div id="home-date" style="font-size:13px;color:var(--muted);margin-bottom:4px"></div>
      <div id="home-name" style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:4px"></div>
      <div id="home-meta" style="font-size:12px;color:var(--muted);margin-bottom:14px"></div>
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

async function renderHome(){
  const dateEl=document.getElementById('home-date');if(!dateEl)return;
  dateEl.textContent=uzDate();
  document.getElementById('home-name').textContent=ST.user.name;
  // Region/rayon/guruh meta
  const metaParts=[];
  if(ST.user.region) metaParts.push(ST.user.region);
  if(ST.user.district) metaParts.push(ST.user.district);
  if(ST.user.group) metaParts.push('Guruh: '+ST.user.group);
  document.getElementById('home-meta').textContent=metaParts.join(' · ');

  // Bugungi vizitlarni serverdan olish (tez, parallel)
  try {
    const dayVisits = await apiGet('getDayVisits',{empId:ST.user.id,date:todayStr()}).catch(()=>[]);
    ST.todayVisits = dayVisits || [];
  } catch(e){}

  const done=ST.todayVisits.length;
  document.getElementById('home-done').textContent=done;
  if(ST.user.role==='mp'){
    document.getElementById('home-plan').textContent=ST.plans.filter(p=>p['Vizit sanasi']===todayStr()||p.date===todayStr()).length;
  } else if(ST.user.role==='ta'){
    document.getElementById('home-pct').textContent=Math.min(Math.round(done/25*100),100)+'%';
  }
}

// ────────────────────────────────────────
// REJA SAHIFASI
// Tuzatishlar:
// - Obyekt qidirish: o'z tumani/regioni bo'yicha filtrlash
// - Reja list: alohida sana bo'yicha guruhlanib chiqadi
// - Tasdiqlanganini o'zgartirish mumkin emas
// ────────────────────────────────────────
function pagePlan(){
  return `
  <div class="page" id="page-plan">
    <div class="card"><div class="card-h">Mening VISIT rejam</div>
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
    <!-- YANGI REJA FORMA -->
    <div class="card hide" id="add-plan-card">
      <div class="card-h">Obiekt bo'yicha yangi reja</div>
      <div class="card-b">
        <div class="fg"><label>Sana <span class="req">*</span></label>
          <input type="date" id="ap-date" value="${todayStr()}" /></div>
        <div class="fg">
          <label>Ish joyi (obyekt) — o'z tuman/regioning bo'yicha <span class="req">*</span></label>
          <div class="search-wrap">
            <input id="ap-search" placeholder="2-3 harf kiriting..." oninput="apSearchObject(this.value)" />
          </div>
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
function setPlanFilter(el,f){
  document.querySelectorAll('#page-plan .frow3 .ropt').forEach(e=>e.classList.remove('on'));
  el.classList.add('on'); planFilter=f; renderPlans();
}
function toggleAddPlanForm(){
  document.getElementById('add-plan-card').classList.toggle('hide');
  apTarget=null;const inp=document.getElementById('ap-search');if(inp)inp.value='';
  hideEl('ap-selected');hideEl('ap-search-res');
}

// Obyekt qidirish — faqat o'z region/tumani bo'yicha
function apSearchObject(q){
  q=q.trim();if(q.length<2){hideEl('ap-search-res');return;}
  const ql=q.toLowerCase();
  const myRegion=(ST.user.region||'').toUpperCase();
  const myDistrict=(ST.user.district||'').toUpperCase();
  // Avval o'z tuman/regionidan, keyin barchadan
  const objMap=new Map();
  ST.doctors.forEach(d=>{
    const matchQ=(d.object||'').toLowerCase().includes(ql)||(d.name||'').toLowerCase().includes(ql);
    if(!matchQ) return;
    const isMyRegion=(d.region||'').toUpperCase().includes(myRegion.slice(0,5));
    const isMyDistrict=(d.district||'').toUpperCase().includes(myDistrict.slice(0,4));
    const priority=isMyDistrict?0:(isMyRegion?1:2);
    if(!objMap.has(d.object)||objMap.get(d.object).priority>priority){
      objMap.set(d.object,{object:d.object,region:d.region,district:d.district,priority});
    }
  });
  const res=[...objMap.values()].sort((a,b)=>a.priority-b.priority).slice(0,10);
  const box=document.getElementById('ap-search-res');
  if(!res.length){box.innerHTML='<div class="sitem"><span class="sitem-meta">Topilmadi</span></div>';}
  else{
    box.innerHTML=res.map(r=>`<div class="sitem" onclick='apSelectObject(${JSON.stringify(r)})'>
      <span class="sitem-name">${r.object}</span>
      <span class="sitem-meta">${r.district||''} · ${r.region||''}${r.priority===0?' ⭐':''}</span>
    </div>`).join('');
  }
  showEl('ap-search-res');
}
function apSelectObject(obj){
  apTarget=obj;hideEl('ap-search-res');
  document.getElementById('ap-search').value=obj.object;
  document.getElementById('ap-selected').innerHTML='✅ '+obj.object+(obj.district?' · '+obj.district:'');
  showEl('ap-selected');
}

function renderPlans(){
  const el=document.getElementById('plan-list');if(!el)return;
  const today=todayStr();let from=today,to=today;
  if(planFilter==='week'){const w=new Date();w.setDate(w.getDate()+7);to=w.toISOString().split('T')[0];}
  if(planFilter==='month'){const m=new Date();m.setMonth(m.getMonth()+1);to=m.toISOString().split('T')[0];}
  // Plan field names (server dan keladigan nomlar)
  const list=ST.plans.filter(p=>{
    const pDate=p['Vizit sanasi']||p.date||'';
    return pDate>=from&&pDate<=to;
  });
  if(!list.length){el.innerHTML='<div class="alert alert-i">Bu davr uchun reja yo\'q</div>';return;}
  // Sanaga qarab guruhlash
  const byDate={};
  list.forEach(p=>{
    const d=p['Vizit sanasi']||p.date||'';
    if(!byDate[d])byDate[d]=[];byDate[d].push(p);
  });
  el.innerHTML=Object.entries(byDate).sort().map(([date,plans])=>`
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;
        letter-spacing:.5px;margin-bottom:6px;padding:5px 0;border-bottom:1px solid var(--border)">
        ${uzDate(date)}
      </div>
      ${plans.map(p=>{
        const status=p['Holati']||p.status||'';
        const obj=p['Obyekt nomi']||p.targetName||'';
        const confirmed=status==='Tasdiqlangan';
        return `<div class="vcard">
          <div class="vcard-h"><span class="vcard-name">${obj}</span>
            <span class="bdg ${confirmed?'bdg-g':status==='Rad etildi'?'bdg-r':'bdg-y'}">${status}</span>
          </div>
          ${confirmed?'<div class="vcard-meta" style="color:var(--ok);font-size:11px">✅ Tasdiqlangan — o\'zgartirish mumkin emas</div>':''}
        </div>`;
      }).join('')}
    </div>`).join('');
}

async function savePlan(){
  if(!apTarget){alert('Ish joyini tanlang!');return;}
  const date=v('ap-date');if(!date){alert('Sanani kiriting!');return;}
  showOv('Menejerga yuborilmoqda...');
  const plan={action:'addPlan',empId:ST.user.id,empName:ST.user.name,mgrId:ST.user.mgrId||'',
    type:'doctor',targetName:apTarget.object,targetObject:apTarget.object,
    date,goal:'Vizit',status:'Kutilmoqda',createdAt:new Date().toISOString()};
  await apiPost(plan);
  // Local cache yangilash (server formatida)
  ST.plans.push({'Hodim ID':ST.user.id,'Hodim Ismi':ST.user.name,'Vizit sanasi':date,
    'Obyekt nomi':apTarget.object,'Ish joyi':apTarget.object,'Holati':'Kutilmoqda',
    date,targetName:apTarget.object,status:'Kutilmoqda'});
  hideOv();toggleAddPlanForm();renderPlans();
  showModal('Menejerga yuborildi','<p>Rejangiiz menejeringizga yuborildi.</p>',
    '<button class="btn btn-p" onclick="closeModal()">OK</button>');
}

// ────────────────────────────────────────
// KUN YAKUNI
// Tuzatishlar:
// - Bugungi vizitlarni serverdan oladi (sahifa ochilganda)
// - Sana va vaqt ko'rsatiladi
// - Kunlik/haftalik/oylik ro'yxat (hozir kunlik)
// ────────────────────────────────────────
function pageEndDay(role){
  return `
  <div class="page" id="page-endday">
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-num" id="ed-done">0</div><div class="kpi-lbl">Bajarilgan vizit</div></div>
      <div class="kpi-card"><div class="kpi-num" id="ed-pct">0%</div><div class="kpi-lbl">Bajarilgan %</div></div>
    </div>
    <div class="card"><div class="card-h">Bugungi vizitlar ro'yxati — ${uzDate()}</div>
      <div class="card-b" id="ed-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
    <div class="card"><div class="card-b">
      <div class="alert alert-w">Kunni yakunlasangiz, hisobotingiz yuboriladi.</div>
      <button class="btn btn-ok btn-bl btn-lg" onclick="confirmEndDay()">Kunni yakunlash</button>
    </div></div>
  </div>`;
}

async function renderEndDay(){
  // Serverdan bugungi vizitlarni olish
  showOv('Yuklanmoqda...');
  try{
    const dayVisits=await apiGet('getDayVisits',{empId:ST.user.id,date:todayStr()}).catch(()=>[]);
    ST.todayVisits=dayVisits||[];
  }catch(e){}
  hideOv();

  const done=ST.todayVisits.length;
  const norm=ST.user.role==='ta'?25:12;
  document.getElementById('ed-done').textContent=done;
  document.getElementById('ed-pct').textContent=Math.min(Math.round(done/norm*100),999)+'%';

  const el=document.getElementById('ed-list');if(!el)return;
  if(!done){el.innerHTML='<div class="alert alert-i">Bugun hali vizit yo\'q</div>';return;}

  // Vizitlar ro'yxatini sana va vaqt bilan
  el.innerHTML=ST.todayVisits.map(vis=>`
    <div class="irow">
      <span class="irow-l">
        ${vis.type==='doctor'?'🏥':'💊'}
        <b>${vis.type==='doctor'?(vis.doctor||vis.target):(vis.target)}</b>
        ${vis.type==='doctor'&&vis.target?'<br><span style="font-size:11px;color:var(--muted)">'+vis.target+'</span>':''}
      </span>
      <span class="irow-v">
        <span class="bdg bdg-g">${vis.result||'Bajarildi'}</span>
        <div style="font-size:11px;color:var(--muted)">${vis.time||''}</div>
      </span>
    </div>`).join('');
}

function confirmEndDay(){
  showModal('Kunni yakunlash',
    '<p style="font-size:14px;line-height:1.6">Kunni yakunlaysizmi?</p>',
    '<button class="btn btn-p" onclick="closeModal()">Davom etish</button> <button class="btn btn-ok" onclick="closeModal();doEndDay()">Ha, yakunlash</button>');
}
async function doEndDay(){
  showOv('Yakunlanmoqda...');
  await apiPost({action:'endDay',empId:ST.user.id,empName:ST.user.name,role:ST.user.role,date:todayStr()});
  hideOv();
  showModal('Kun yakunlandi','<p>Hisobotingiz yuborildi. Yaxshi dam oling!</p>',
    '<button class="btn btn-p" onclick="closeModal()">OK</button>');
}

// ────────────────────────────────────────
// MUROJAAT
// ────────────────────────────────────────
function pageFeedback(){
  return `
  <div class="page" id="page-feedback">
    <div class="card"><div class="card-h">Taklif va Shikoyat</div>
      <div class="card-b">
        <div class="alert alert-i">Taklif va Shikoyatingiz Anonim tarzda yuboriladi!</div>
        <div class="fg"><label>Tur</label>
          <div class="rg">
            <div class="ropt on" onclick="setFbType(this,'Taklif')">Taklif</div>
            <div class="ropt" onclick="setFbType(this,'Shikoyat')">Shikoyat</div>
          </div></div>
        <div class="fg"><label>Xabar <span class="req">*</span></label>
          <textarea id="fb-msg" rows="4" placeholder="Fikringizni yozing..."></textarea></div>
        <button class="btn btn-p btn-bl btn-lg" onclick="submitFb()">Yuborish</button>
        <div id="fb-result" class="hide" style="margin-top:14px"></div>
      </div></div>
  </div>`;
}
let fbType='Taklif';
function setFbType(el,t){document.querySelectorAll('#page-feedback .rg .ropt').forEach(e=>e.classList.remove('on'));el.classList.add('on');fbType=t;}
async function submitFb(){
  const msg=v('fb-msg').trim();if(!msg){alert('Xabar matnini kiriting!');return;}
  showOv('Yuborilmoqda...');
  await apiPost({action:'submitFeedback',empId:ST.user.id,empName:ST.user.name,message:msg,type:fbType});
  hideOv();document.getElementById('fb-msg').value='';
  document.getElementById('fb-result').innerHTML='<div class="alert alert-ok">Xabaringiz yuborildi!</div>';
  showEl('fb-result');
}
