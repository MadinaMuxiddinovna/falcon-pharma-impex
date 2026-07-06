// app2.js v11 — BOSH SAHIFA, TARIX, REJA, KUN YAKUNI, MUROJAAT
// YANGI: Tarix sahifasi — kunlik/haftalik/oylik vizitlar ro'yxati
// Kun yakuni: ishlagan soat aniq hisobi, oflayn kafolatli

const UZ_K=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
const UZ_O=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr'];
function uzDate(d){const dt=d?new Date(d+'T00:00:00'):new Date();return UZ_K[dt.getDay()]+', '+dt.getDate()+' '+UZ_O[dt.getMonth()]+' '+dt.getFullYear();}
function uzDateShort(d){const dt=d?new Date(d+'T00:00:00'):new Date();return UZ_K[dt.getDay()].slice(0,3)+', '+dt.getDate()+' '+UZ_O[dt.getMonth()].slice(0,3);}

function buildAllPages(){
  const role=ST.user.role,c=document.getElementById('pages-container');
  let html='';
  if(role==='mp'){html+=pageHomeMP();html+=pageHistory();html+=pagePlan();html+=pageEndDay('mp');html+=pageFeedback();}
  if(role==='ta'){html+=pageHomeTA();html+=pageHistory();html+=pageEndDay('ta');html+=pageFeedback();}
  if(role==='manager'){html+=pageManagerDashboard();html+=pagePayDoctor();html+=pagePromoQueue();html+=pagePlanManager();html+=pageTeamKPI();html+=pageMap();}
  if(role==='admin'){html+=pageManagerDashboard();html+=pageAdminBalance();html+=pagePromoQueue();html+=pagePlanManager();html+=pageTeamKPI();html+=pageMap();html+=pageFeedbackInbox();}
  c.innerHTML=html;
}

// ── MP BOSH SAHIFA ───────────────────────────────────
function pageHomeMP(){return `
  <div class="page active" id="page-home">
    <div class="card"><div class="card-b" style="text-align:center;padding:20px 17px">
      <div id="home-date" style="font-size:13px;color:var(--muted);margin-bottom:2px"></div>
      <div id="home-name" style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:2px"></div>
      <div id="home-meta" style="font-size:11.5px;color:var(--muted);margin-bottom:12px"></div>
      <div class="kpi-grid" style="margin-bottom:0">
        <div class="kpi-card"><div class="kpi-num" id="home-done">0</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
        <div class="kpi-card"><div class="kpi-num" id="home-plan">0</div><div class="kpi-lbl">Bugungi reja</div></div>
      </div>
    </div></div>
    <div class="card"><div class="card-h">Yangi vizit boshlash</div>
      <div class="card-b">
        <div class="alert alert-i" style="font-size:12px">Vizit turini tanlang.</div>
        <div class="rg">
          <div class="ropt" style="padding:16px;flex-direction:column;gap:4px;justify-content:center" onclick="startVisitFlow('doctor')">
            <span style="font-size:26px">🏥</span><span style="font-weight:700;font-size:13px">VRACH VIZITI</span>
          </div>
          <div class="ropt" style="padding:16px;flex-direction:column;gap:4px;justify-content:center" onclick="warnPharmacyForMP()">
            <span style="font-size:26px">💊</span><span style="font-weight:700;font-size:13px">DORIXONA</span>
          </div>
        </div>
      </div>
    </div>
    <div id="visit-flow-container"></div>
  </div>`;}

function warnPharmacyForMP(){
  showModal('Diqqat!','<p>Med. Vakil odatda vrach vizit qiladi. Dorixona vizitini boshlashni xohlaysizmi?</p>',
    '<button class="btn btn-o" onclick="closeModal()">Bekor</button> <button class="btn btn-p" onclick="closeModal();startVisitFlow(\'pharmacy\')">Ha</button>');
}

// ── TA BOSH SAHIFA ───────────────────────────────────
function pageHomeTA(){return `
  <div class="page active" id="page-home">
    <div class="card"><div class="card-b" style="text-align:center;padding:20px 17px">
      <div id="home-date" style="font-size:13px;color:var(--muted);margin-bottom:2px"></div>
      <div id="home-name" style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:2px"></div>
      <div id="home-meta" style="font-size:11.5px;color:var(--muted);margin-bottom:12px"></div>
      <div class="kpi-grid" style="margin-bottom:0">
        <div class="kpi-card"><div class="kpi-num" id="home-done">0</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
        <div class="kpi-card"><div class="kpi-num" id="home-pct">0%</div><div class="kpi-lbl">Bajarilgan %</div></div>
      </div>
    </div></div>
    <div class="card"><div class="card-h">Yangi dorixona viziti</div>
      <div class="card-b"><button class="btn btn-p btn-bl btn-lg" onclick="startVisitFlow('pharmacy')">Boshlash</button></div>
    </div>
    <div id="visit-flow-container"></div>
  </div>`;}

function renderHome(){
  const dateEl=document.getElementById('home-date');if(!dateEl)return;
  dateEl.textContent=uzDate();
  document.getElementById('home-name').textContent=ST.user.name;
  // Menejer + region + rayon
  const meta=[];
  if(ST.user.mgrId){const mn=_LOGIN_CACHE[ST.user.mgrId]?.name;if(mn)meta.push('👔 '+mn);}
  if(ST.user.region) meta.push(ST.user.region);
  if(ST.user.district) meta.push(ST.user.district);
  const metaEl=document.getElementById('home-meta');if(metaEl)metaEl.textContent=meta.join(' · ');
  const done=ST.todayVisits.length;
  const doneEl=document.getElementById('home-done');if(doneEl)doneEl.textContent=done;
  if(ST.user.role==='mp'){
    const today=todayStr();
    const pl=ST.plans.filter(p=>(p['Vizit sanasi']||p.date||'')===today).length;
    const planEl=document.getElementById('home-plan');if(planEl)planEl.textContent=pl;
  } else {
    const pct=Math.min(Math.round(done/25*100),100);
    const pEl=document.getElementById('home-pct');if(pEl)pEl.textContent=pct+'%';
  }
}

// ── TARIX SAHIFASI — YANGI ───────────────────────────
// Kunlik/haftalik/oylik vizitlar ro'yxati
function pageHistory(){return `
  <div class="page" id="page-history">
    <div class="card"><div class="card-h">Mening vizitlarim tarixi</div>
      <div class="card-b">
        <div class="frow3" style="margin-bottom:14px">
          <div class="ropt on" onclick="setHistFilter(this,'day')">Kunlik</div>
          <div class="ropt" onclick="setHistFilter(this,'week')">Haftalik</div>
          <div class="ropt" onclick="setHistFilter(this,'month')">Oylik</div>
        </div>
        <div id="hist-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
      </div>
    </div>
  </div>`;}

let histFilter='day';
function setHistFilter(el,f){
  document.querySelectorAll('#page-history .frow3 .ropt').forEach(e=>e.classList.remove('on'));
  el.classList.add('on');histFilter=f;renderHistory();
}

async function renderHistory(){
  const el=document.getElementById('hist-list');if(!el)return;
  el.innerHTML='<div class="alert alert-i" style="display:flex;align-items:center;gap:8px"><span class="spin" style="width:18px;height:18px;border-width:2px;flex-shrink:0"></span>Yuklanmoqda...</div>';
  const today=todayStr();
  let from=today;
  if(histFilter==='week'){const w=new Date();w.setDate(w.getDate()-7);from=w.toISOString().split('T')[0];}
  if(histFilter==='month'){const m=new Date();m.setMonth(m.getMonth()-1);from=m.toISOString().split('T')[0];}
  // Serverdan olamiz
  let visits=[];
  try{
    const res=await apiGet('getMyVisits',{empId:ST.user.id,from,to:today},false).catch(()=>null);
    if(res&&!res.error) visits=res;
  }catch(e){}
  // Lokal cache dan ham qo'shamiz (oflayn vizitlar)
  const localVis=JSON.parse(localStorage.getItem('ff_vis_cache_'+ST.user.id)||'[]');
  // Sanaga qarab guruhlash
  const byDate={};
  visits.forEach(v=>{
    const d=v.date||v['Vizit sanasi']||'';
    if(d&&d>=from){if(!byDate[d])byDate[d]=[];byDate[d].push(v);}
  });
  // Lokal vizitlarni ham qo'shamiz
  localVis.forEach(v=>{
    const d=v.date||todayStr();
    if(!byDate[d])byDate[d]=[];
    const already=byDate[d].some(x=>x.ref===v.ref);
    if(!already)byDate[d].push({...v,_local:true});
  });
  if(!Object.keys(byDate).length){el.innerHTML='<div class="alert alert-i">Bu davr uchun vizit yo\'q</div>';return;}
  el.innerHTML=Object.entries(byDate).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,vs])=>`
    <div style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;
        margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid var(--primary3)">
        ${uzDate(date)} · ${vs.length} ta vizit
      </div>
      ${vs.map((v,i)=>{
        const target=v.target||v['Ish joyi (obyekt)']||v['Dorixona Yuridik Nomi']||'';
        const doctor=v.doctor||v['Vrach F.I.Sh']||'';
        const result=v.result||v['Natija']||'';
        const startTime=v.time||v['Vizit boshlandi (vaqt)']||'';
        const endTime=v['Vizit tugadi (vaqt)']||'';
        const dur=v.durationSec||v['Davomiylik (daqiqa)']||0;
        const durStr=dur?(typeof dur==='number'&&dur>100?Math.round(dur/60)+' min':dur+' min'):'';
        return `<div class="vcard" onclick="showHistDetail(${i},'${date}')" style="cursor:pointer">
          <div class="vcard-h">
            <span>${v.type==='doctor'||v['Med Vakili ID']?'🏥':'💊'} <b>${doctor||target}</b></span>
            <span class="bdg ${result==='ISHLAYDI'?'bdg-g':result==='QABUL QILMADI'?'bdg-r':'bdg-y'}">${result||'OK'}</span>
          </div>
          <div class="vcard-meta">
            ${target?'🏢 '+target+' · ':''}
            ${startTime?'⏰ '+startTime:''} ${endTime?'→ '+endTime:''}
            ${durStr?'· ⌛ '+durStr:''}
            ${v._local?'· <span class="bdg bdg-y">Oflayn</span>':''}
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');
  // Detali ko'rsatish funksiyasi
  window._histData=byDate;
}

function showHistDetail(idx,date){
  const vs=window._histData?.[date];if(!vs||!vs[idx])return;
  const v=vs[idx];
  const doctor=v.doctor||v['Vrach F.I.Sh']||'';
  const target=v.target||v['Ish joyi (obyekt)']||v['Dorixona Yuridik Nomi']||'';
  const spec=v['Mutaxassisligi']||'';
  const tuman=v['Tumani']||'';
  const result=v.result||v['Natija']||'';
  const startTime=v.time||v['Vizit boshlandi (vaqt)']||'';
  const endTime=v['Vizit tugadi (vaqt)']||'';
  const dur=v.durationSec||v['Davomiylik (daqiqa)']||0;
  const proma=v['Proma summasi (so\'m)']||0;
  showModal('Vizit batafsil',`
    <div class="irow"><span class="irow-l">Sana</span><span class="irow-v">${uzDate(date)}</span></div>
    ${doctor?`<div class="irow"><span class="irow-l">Vrach</span><span class="irow-v">${doctor}</span></div>`:''}
    ${spec?`<div class="irow"><span class="irow-l">Mutaxassisligi</span><span class="irow-v">${spec}</span></div>`:''}
    <div class="irow"><span class="irow-l">Ish joyi</span><span class="irow-v">${target}</span></div>
    ${tuman?`<div class="irow"><span class="irow-l">Tuman</span><span class="irow-v">${tuman}</span></div>`:''}
    <div class="irow"><span class="irow-l">Natija</span><span class="irow-v"><span class="bdg ${result==='ISHLAYDI'?'bdg-g':'bdg-y'}">${result}</span></span></div>
    ${startTime?`<div class="irow"><span class="irow-l">Boshlandi</span><span class="irow-v">${startTime}</span></div>`:''}
    ${endTime?`<div class="irow"><span class="irow-l">Tugadi</span><span class="irow-v">${endTime}</span></div>`:''}
    ${dur?`<div class="irow"><span class="irow-l">Davomiylik</span><span class="irow-v">${typeof dur==='number'&&dur>100?Math.round(dur/60)+' min':dur+' min'}</span></div>`:''}
    ${proma>0?`<div class="irow"><span class="irow-l">Proma</span><span class="irow-v">${fmtMoney(proma)}</span></div>`:''}
  `,'<button class="btn btn-p" onclick="closeModal()">Yopish</button>');
}

// ── REJA SAHIFASI ────────────────────────────────────
function pagePlan(){return `
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
    <div class="card hide" id="add-plan-card">
      <div class="card-h">Obyekt bo'yicha yangi reja</div>
      <div class="card-b">
        <div class="fg"><label>Sana <span class="req">*</span></label>
          <input type="date" id="ap-date" value="${todayStr()}" /></div>
        <div class="fg">
          <label>Ish joyi — o'z tumaning bo'yicha <span class="req">*</span></label>
          <div class="search-wrap"><input id="ap-search" placeholder="2-3 harf kiriting..." oninput="apSearchObject(this.value)" /></div>
          <div id="ap-search-res" class="slist hide"></div>
        </div>
        <div id="ap-selected" class="alert alert-ok hide"></div>
        <div class="btn-row">
          <button class="btn btn-o" onclick="toggleAddPlanForm()">Bekor qilish</button>
          <button class="btn btn-p" onclick="savePlan()">Menejerga yuborish</button>
        </div>
      </div>
    </div>
  </div>`;}

let planFilter='day',apTarget=null;
function setPlanFilter(el,f){
  document.querySelectorAll('#page-plan .frow3 .ropt').forEach(e=>e.classList.remove('on'));
  el.classList.add('on');planFilter=f;renderPlans();
}
function toggleAddPlanForm(){
  document.getElementById('add-plan-card').classList.toggle('hide');
  apTarget=null;const inp=document.getElementById('ap-search');if(inp)inp.value='';
  hideEl('ap-selected');hideEl('ap-search-res');
}
function apSearchObject(q){
  q=q.trim();if(q.length<2){hideEl('ap-search-res');return;}
  const ql=q.toLowerCase(),myD=(ST.user.district||'').toLowerCase(),myR=(ST.user.region||'').toLowerCase();
  const objMap=new Map();
  ST.doctors.forEach(d=>{
    const ok=(d.object||'').toLowerCase().includes(ql)||(d.name||'').toLowerCase().includes(ql);
    if(!ok)return;
    const pri=(d.district||'').toLowerCase().includes(myD.slice(0,4))?0:(d.region||'').toLowerCase().includes(myR.slice(0,5))?1:2;
    if(!objMap.has(d.object)||objMap.get(d.object).pri>pri)
      objMap.set(d.object,{object:d.object,region:d.region,district:d.district,pri});
  });
  const res=[...objMap.values()].sort((a,b)=>a.pri-b.pri).slice(0,10);
  const box=document.getElementById('ap-search-res');
  box.innerHTML=res.length
    ? res.map(r=>`<div class="sitem" onclick='apSelectObject(${JSON.stringify(r)})'>
        <span class="sitem-name">${r.object}</span>
        <span class="sitem-meta">${r.district||''} · ${r.region||''}${r.pri===0?' ⭐':''}</span>
      </div>`).join('')
    : '<div class="sitem"><span class="sitem-meta">Topilmadi</span></div>';
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
  const list=ST.plans.filter(p=>{
    const d=p['Vizit sanasi']||p.date||'';
    return d&&d!=='undefined'&&d!=='NaN'&&d>=from&&d<=to;
  });
  if(!list.length){el.innerHTML='<div class="alert alert-i">Bu davr uchun reja yo\'q</div>';return;}
  const byDate={};
  list.forEach(p=>{const d=p['Vizit sanasi']||p.date||'';if(!byDate[d])byDate[d]=[];byDate[d].push(p);});
  el.innerHTML=Object.entries(byDate).sort().map(([date,plans])=>`
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;
        letter-spacing:.5px;margin-bottom:6px;padding:5px 0;border-bottom:1px solid var(--border)">
        ${uzDateShort(date)} · ${date}
      </div>
      ${plans.map(p=>{
        const status=p['Holati']||p.status||'';
        const obj=p['Obyekt nomi']||p.targetName||'';
        if(!obj||obj==='undefined'||obj==='NaN')return '';
        return `<div class="vcard">
          <div class="vcard-h"><span class="vcard-name">${obj}</span>
            <span class="bdg ${status==='Tasdiqlangan'?'bdg-g':status==='Rad etildi'?'bdg-r':'bdg-y'}">${status}</span>
          </div></div>`;
      }).join('')}
    </div>`).join('');
}
async function savePlan(){
  if(!apTarget){alert('Ish joyini tanlang!');return;}
  const date=v('ap-date');if(!date){alert('Sanani kiriting!');return;}
  await apiPost({action:'addPlan',empId:ST.user.id,empName:ST.user.name,mgrId:ST.user.mgrId||'',
    type:'doctor',targetName:apTarget.object,targetObject:apTarget.object,
    date,goal:'Vizit',status:'Kutilmoqda',createdAt:new Date().toISOString()});
  ST.plans.push({'Vizit sanasi':date,'Obyekt nomi':apTarget.object,'Holati':'Kutilmoqda'});
  toggleAddPlanForm();renderPlans();
  showModal('Yuborildi','<p>Rejangiiz menejeringizga yuborildi.</p>','<button class="btn btn-p" onclick="closeModal()">OK</button>');
}

// ── KUN YAKUNI ───────────────────────────────────────
// Ishlagan soat: ish boshlanganda localStorage ga saqlanadi
// Oflayn ham ishlaydi — sana qayta hisoblanmaydi
function pageEndDay(role){return `
  <div class="page" id="page-endday">
    <!-- Ishlangan soat -->
    <div class="card" id="worktime-card"><div class="card-b">
      <div id="worktime-display" style="text-align:center;padding:10px 0">
        <div style="font-size:28px;font-weight:800;color:var(--primary)" id="wt-elapsed">00:00:00</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">Ishlagan vaqt</div>
        <div style="font-size:12px;color:var(--muted)" id="wt-range"></div>
      </div>
      <div id="wt-start-block">
        <button class="btn btn-p btn-bl" onclick="wtStart()" id="wt-start-btn">Ish kunini boshlash 🚀</button>
      </div>
    </div></div>
    <!-- KPI -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-num" id="ed-pct">0%</div>
        <div class="kpi-lbl">Bajarilgan %</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px" id="ed-done-small">0 ta vizit</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num" id="ed-done">0</div>
        <div class="kpi-lbl">Bajarilgan vizit</div>
      </div>
    </div>
    <!-- Vizitlar ro'yxati -->
    <div class="card"><div class="card-h" id="ed-list-title">Bugungi vizitlar</div>
      <div class="card-b" id="ed-list"><div class="alert alert-i">Yuklanmoqda...</div></div>
    </div>
    <!-- Kun yakunlash -->
    <div class="card"><div class="card-b">
      <div id="ed-already-done" class="alert alert-ok hide">✅ Bugungi kun yakunlangan.</div>
      <button class="btn btn-ok btn-bl btn-lg" id="ed-btn" onclick="confirmEndDay()">Kunni yakunlash 🏁</button>
    </div></div>
  </div>`;}

// Ish vaqti timer
let _wtInterval=null;
function wtStart(){
  const key='ff_wt_start_'+ST.user.id+'_'+todayStr();
  const existing=localStorage.getItem(key);
  if(!existing){
    const now=new Date().toISOString();
    localStorage.setItem(key,now);
  }
  document.getElementById('wt-start-btn').style.display='none';
  startWtTicker();
}

function startWtTicker(){
  const key='ff_wt_start_'+ST.user.id+'_'+todayStr();
  const startStr=localStorage.getItem(key);
  if(!startStr)return;
  const startTs=new Date(startStr).getTime();
  clearInterval(_wtInterval);
  _wtInterval=setInterval(()=>{
    const elapsed=Math.floor((Date.now()-startTs)/1000);
    const h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60),s=elapsed%60;
    const el=document.getElementById('wt-elapsed');
    if(el)el.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    const range=document.getElementById('wt-range');
    if(range)range.textContent=new Date(startStr).toLocaleTimeString('uz-UZ')+' → '+new Date().toLocaleTimeString('uz-UZ');
  },1000);
  // Start tugmasini yashirish
  const btn=document.getElementById('wt-start-btn');if(btn)btn.style.display='none';
}

async function renderEndDay(){
  const titleEl=document.getElementById('ed-list-title');
  if(titleEl)titleEl.textContent='Bugungi vizitlar — '+uzDate();

  // Ish vaqti tickerni boshlash (agar avval boshlangan bo'lsa)
  const key='ff_wt_start_'+ST.user.id+'_'+todayStr();
  if(localStorage.getItem(key)) startWtTicker();

  // Bugungi vizitlarni serverdan olamiz — overlay ko'rsatmasdan
  try{
    const dv=await apiGet('getDayVisits',{empId:ST.user.id,date:todayStr()},false).catch(()=>null);
    if(dv&&!dv.error) ST.todayVisits=dv;
  }catch(e){}

  const done=ST.todayVisits.length;
  const norm=ST.user.role==='ta'?25:12;
  const pct=norm>0?Math.min(Math.round(done/norm*100),999):0;
  const doneEl=document.getElementById('ed-done');if(doneEl)doneEl.textContent=done;
  const pctEl=document.getElementById('ed-pct');if(pctEl)pctEl.textContent=pct+'%';
  const smallEl=document.getElementById('ed-done-small');if(smallEl)smallEl.textContent=done+' ta vizit';

  const el=document.getElementById('ed-list');if(!el)return;
  el.innerHTML=done
    ? ST.todayVisits.map(vis=>`
        <div class="irow">
          <span class="irow-l">${vis.type==='doctor'?'🏥':'💊'}
            <b>${vis.type==='doctor'?(vis.doctor||vis.target):vis.target}</b>
            ${vis.time?'<br><span style="font-size:11px;color:var(--muted)">⏰ '+vis.time+'</span>':''}
          </span>
          <span class="irow-v"><span class="bdg ${vis.result==='ISHLAYDI'?'bdg-g':'bdg-y'}">${vis.result||'OK'}</span></span>
        </div>`).join('')
    : '<div class="alert alert-i">Bugun hali vizit yo\'q</div>';

  // 1 kunda 1 marta yakunlash
  const lastEnd=localStorage.getItem('ff_endday_'+ST.user.id);
  const alreadyDone=lastEnd===todayStr();
  const btn=document.getElementById('ed-btn');
  const alreadyEl=document.getElementById('ed-already-done');
  if(alreadyDone){if(btn)btn.style.display='none';if(alreadyEl)alreadyEl.classList.remove('hide');}
  else{if(btn)btn.style.display='';if(alreadyEl)alreadyEl.classList.add('hide');}
}

function confirmEndDay(){
  if(localStorage.getItem('ff_endday_'+ST.user.id)===todayStr()){alert('Bugun kun allaqachon yakunlangan!');return;}
  showModal('Kunni yakunlash','<p>Kunni yakunlaysizmi?</p>',
    '<button class="btn btn-p" onclick="closeModal()">Davom etish</button> <button class="btn btn-ok" onclick="closeModal();doEndDay()">Ha, yakunlash</button>');
}

async function doEndDay(){
  if(localStorage.getItem('ff_endday_'+ST.user.id)===todayStr()){alert('Allaqachon yakunlangan!');return;}
  // Ishlagan vaqtni hisoblash
  const wtKey='ff_wt_start_'+ST.user.id+'_'+todayStr();
  const startStr=localStorage.getItem(wtKey);
  const endStr=new Date().toISOString();
  let durationSec=0,startTime='',endTime=nowTimeStr();
  if(startStr){
    durationSec=Math.floor((Date.now()-new Date(startStr).getTime())/1000);
    startTime=new Date(startStr).toLocaleTimeString('uz-UZ');
  }
  const h=Math.floor(durationSec/3600),m=Math.floor((durationSec%3600)/60);
  const durStr=(h?h+' soat ':'')+m+' daqiqa';
  clearInterval(_wtInterval);
  await apiPost({action:'endDay',empId:ST.user.id,empName:ST.user.name,
    role:ST.user.role,date:todayStr(),
    startTime,endTime,durationSec,
    visitCount:ST.todayVisits.length});
  localStorage.setItem('ff_endday_'+ST.user.id,todayStr());
  showModal('Kun yakunlandi',
    `<p>Ish kuni yakunlandi!<br>
    Ishlangan vaqt: <b>${durStr}</b><br>
    Qilingan vizitlar: <b>${ST.todayVisits.length} ta</b></p>`,
    '<button class="btn btn-p" onclick="closeModal();renderEndDay()">OK</button>');
}

// ── MUROJAAT ────────────────────────────────────────
function pageFeedback(){return `
  <div class="page" id="page-feedback">
    <div class="card"><div class="card-h">Taklif va Shikoyat</div>
      <div class="card-b">
        <div class="alert alert-i">Anonim tarzda yuboriladi!</div>
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
  </div>`;}
let fbType='Taklif';
function setFbType(el,t){document.querySelectorAll('#page-feedback .rg .ropt').forEach(e=>e.classList.remove('on'));el.classList.add('on');fbType=t;}
async function submitFb(){
  const msg=(document.getElementById('fb-msg')?.value||'').trim();
  if(!msg){alert('Xabar matnini kiriting!');return;}
  await apiPost({action:'submitFeedback',empId:ST.user.id,empName:ST.user.name,message:msg,type:fbType});
  if(document.getElementById('fb-msg'))document.getElementById('fb-msg').value='';
  const r=document.getElementById('fb-result');
  if(r){r.innerHTML='<div class="alert alert-ok">Xabaringiz yuborildi!</div>';r.classList.remove('hide');}
}
