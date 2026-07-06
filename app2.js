// app2.js v12
// - Bosh sahifa: KUN BOSHLASH tugmasi bu yerda (yakunlash sahifasida emas)
// - Menejer: region ko'rsatiladi, "Menejer" yoziladi (stikersiz)
// - Kun yakuni: to'liq KPI + vizitlar ro'yxati
// - Agent/MP: vizit soni to'g'ri saqlanadi

const UZ_K=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
const UZ_O=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr'];
function uzDate(d){const dt=d?new Date(d+'T00:00:00'):new Date();return UZ_K[dt.getDay()]+', '+dt.getDate()+' '+UZ_O[dt.getMonth()]+' '+dt.getFullYear();}
function uzDateShort(d){const dt=d?new Date(d+'T00:00:00'):new Date();return UZ_K[dt.getDay()].slice(0,3)+' '+dt.getDate()+' '+UZ_O[dt.getMonth()].slice(0,3);}

function buildAllPages(){
  const role=ST.user.role,c=document.getElementById('pages-container');
  let html='';
  if(role==='mp'){html+=pageHomeMP();html+=pageHistory();html+=pagePlan();html+=pageEndDay('mp');html+=pageFeedback();}
  if(role==='ta'){html+=pageHomeTA();html+=pageHistory();html+=pageEndDay('ta');html+=pageFeedback();}
  if(role==='manager'){html+=pageManagerDashboard();html+=pagePayDoctor();html+=pagePromoQueue();html+=pagePlanManager();html+=pageTeamKPI();html+=pageMap();}
  if(role==='admin'){html+=pageManagerDashboard();html+=pageAdminBalance();html+=pagePromoQueue();html+=pagePlanManager();html+=pageTeamKPI();html+=pageMap();html+=pageFeedbackInbox();}
  c.innerHTML=html;
}

// ── MP BOSH SAHIFA — Kun boshlash tugmasi shu yerda ──
function pageHomeMP(){return `
  <div class="page active" id="page-home">
    <!-- Kun boshlash / Yakunlangan xulosa -->
    <div class="card" id="home-worktime-card">
      <div class="card-b" style="padding:14px">
        <!-- Yakunlangan holat -->
        <div id="home-wt-done" class="hide">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">Kun yakunlandi</div>
          <div style="font-size:15px;font-weight:700;color:var(--ok)" id="home-wt-summary"></div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px" id="home-wt-kpi-sum"></div>
        </div>
        <!-- Ishlayotgan holat -->
        <div id="home-wt-running">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div>
              <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px">Ishlagan vaqt</div>
              <div style="font-size:24px;font-weight:800;font-family:monospace;color:var(--primary)" id="home-wt-elapsed">--:--:--</div>
              <div style="font-size:11px;color:var(--muted)" id="home-wt-range"></div>
            </div>
            <button class="btn btn-p" id="home-wt-btn" onclick="wtStart()">Ish kunini boshlash</button>
          </div>
        </div>
      </div>
    </div>
    <div class="card"><div class="card-b" style="text-align:center;padding:16px">
      <div id="home-date" style="font-size:13px;color:var(--muted);margin-bottom:2px"></div>
      <div id="home-name" style="font-size:19px;font-weight:800;color:var(--primary);margin-bottom:2px"></div>
      <div id="home-meta" style="font-size:11.5px;color:var(--muted);margin-bottom:12px"></div>
      <div class="kpi-grid" style="margin-bottom:0">
        <div class="kpi-card"><div class="kpi-num" id="home-done">0</div><div class="kpi-lbl">Bugungi vizitlar</div></div>
        <div class="kpi-card"><div class="kpi-num" id="home-plan">0</div><div class="kpi-lbl">Bugungi reja</div></div>
      </div>
    </div></div>
    <div class="card"><div class="card-h">Yangi vizit boshlash</div>
      <div class="card-b">
        <div class="rg">
          <div class="ropt" style="padding:16px;flex-direction:column;gap:4px;justify-content:center" onclick="startVisitFlow('doctor')">
            <span style="font-size:26px">🏥</span><b style="font-size:13px">VRACH VIZITI</b>
          </div>
          <div class="ropt" style="padding:16px;flex-direction:column;gap:4px;justify-content:center" onclick="warnPharmacyForMP()">
            <span style="font-size:26px">💊</span><b style="font-size:13px">DORIXONA</b>
          </div>
        </div>
      </div>
    </div>
    <div id="visit-flow-container"></div>
  </div>`;}

// ── TA BOSH SAHIFA ───────────────────────────────────
function pageHomeTA(){return `
  <div class="page active" id="page-home">
    <div class="card" id="home-worktime-card">
      <div class="card-b" style="padding:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px">Ishlagan vaqt</div>
            <div style="font-size:24px;font-weight:800;font-family:monospace;color:var(--primary)" id="home-wt-elapsed">--:--:--</div>
            <div style="font-size:11px;color:var(--muted)" id="home-wt-range"></div>
          </div>
          <button class="btn btn-p" id="home-wt-btn" onclick="wtStart()">Ish kunini boshlash</button>
        </div>
      </div>
    </div>
    <div class="card"><div class="card-b" style="text-align:center;padding:16px">
      <div id="home-date" style="font-size:13px;color:var(--muted);margin-bottom:2px"></div>
      <div id="home-name" style="font-size:19px;font-weight:800;color:var(--primary);margin-bottom:2px"></div>
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

function warnPharmacyForMP(){
  showModal('Diqqat!','<p>Med. Vakil odatda vrach vizit qiladi. Dorixona vizitini boshlashni xohlaysizmi?</p>',
    '<button class="btn btn-o" onclick="closeModal()">Bekor</button> <button class="btn btn-p" onclick="closeModal();startVisitFlow(\'pharmacy\')">Ha</button>');
}

// Ish vaqti boshqaruvi
let _wtInterval=null;
function wtStart(){
  const key='ff_wt_'+ST.user.id+'_'+todayStr();
  // Bugun allaqachon yakunlangan bo'lsa - qayta boshlay olmaydi
  if(localStorage.getItem('ff_endday_'+ST.user.id)===todayStr()){
    alert('Bugungi kun allaqachon yakunlangan!');return;
  }
  if(!localStorage.getItem(key)) localStorage.setItem(key,new Date().toISOString());
  startWtTicker();
  const btn=document.getElementById('home-wt-btn');
  if(btn){btn.textContent='Ishlayabdi...';btn.disabled=true;}
}
function startWtTicker(){
  const key='ff_wt_'+ST.user.id+'_'+todayStr();
  const startStr=localStorage.getItem(key);if(!startStr)return;
  // Bugun yakunlangan bo'lsa ticker ishlamasin
  if(localStorage.getItem('ff_endday_'+ST.user.id)===todayStr()){
    clearInterval(_wtInterval);_wtInterval=null;return;
  }
  const startTs=new Date(startStr).getTime();
  clearInterval(_wtInterval);
  const tick=()=>{
    const sec=Math.floor((Date.now()-startTs)/1000);
    const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    const el=document.getElementById('home-wt-elapsed');
    if(el)el.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    const r=document.getElementById('home-wt-range');
    if(r)r.textContent=new Date(startStr).toLocaleTimeString('uz-UZ')+' dan beri';
    const btn=document.getElementById('home-wt-btn');
    if(btn){btn.textContent='Ishlayabdi...';btn.disabled=true;}
  };
  tick();_wtInterval=setInterval(tick,1000);
}

function renderHome(){
  const dateEl=document.getElementById('home-date');if(!dateEl)return;
  dateEl.textContent=uzDate();
  document.getElementById('home-name').textContent=ST.user.name;
  // Meta: Menejer FIO + rayon + region
  const meta=[];
  if(ST.user.mgrId){
    const mgrDisplay=ST.user.mgrName||ST.user.mgrId;
    meta.push('Menejer: '+mgrDisplay);
  }
  if(ST.user.district)meta.push(ST.user.district);  // Rayon avval
  if(ST.user.region)meta.push(ST.user.region);
  const metaEl=document.getElementById('home-meta');if(metaEl)metaEl.textContent=meta.join(' · ');
  // Ish vaqti: yakunlangan yoki ishlayotgan
  const key='ff_wt_'+ST.user.id+'_'+todayStr();
  const endedToday=localStorage.getItem('ff_endday_'+ST.user.id)===todayStr();
  const runningEl=document.getElementById('home-wt-running');
  const doneEl=document.getElementById('home-wt-done');
  if(endedToday){
    // Yakunlangan: xulosa ko'rsatamiz
    if(runningEl)runningEl.classList.add('hide');
    if(doneEl){doneEl.classList.remove('hide');}
    clearInterval(_wtInterval);_wtInterval=null;
    // Ishlagan vaqt xulosasi
    const startStr=localStorage.getItem(key);
    if(startStr){
      const durSec=Math.floor((new Date(localStorage.getItem('ff_endday_time_'+ST.user.id)||Date.now())-new Date(startStr))/1000);
      const h=Math.floor(durSec/3600),m=Math.floor((durSec%3600)/60);
      const sumEl=document.getElementById('home-wt-summary');
      if(sumEl)sumEl.textContent='Ishlagan vaqt: '+h+' soat '+m+' daqiqa';
    }
    const kpiEl=document.getElementById('home-wt-kpi-sum');
    const done2=ST.todayVisits.filter(v=>!v.date||v.date===todayStr()).length;
    if(kpiEl)kpiEl.textContent='Bugungi vizitlar: '+done2+' ta';
  } else {
    // Ishlayotgan yoki boshlanmagan
    if(runningEl)runningEl.classList.remove('hide');
    if(doneEl)doneEl.classList.add('hide');
    if(localStorage.getItem(key))startWtTicker();
  }
  // Vizit soni
  const done=ST.todayVisits.filter(v=>v.date===todayStr()||!v.date).length;
  const doneElHome=document.getElementById('home-done');if(doneElHome)doneElHome.textContent=done;
  if(ST.user.role==='mp'){
    const pl=ST.plans.filter(p=>(p['Vizit sanasi']||p.date||'')===todayStr()).length;
    const planEl=document.getElementById('home-plan');if(planEl)planEl.textContent=pl;
  } else {
    const pct=Math.min(Math.round(done/25*100),100);
    const pEl=document.getElementById('home-pct');if(pEl)pEl.textContent=pct+'%';
  }
}

// ── TARIX ───────────────────────────────────────────
function pageHistory(){return `
  <div class="page" id="page-history">
    <div class="card"><div class="card-h">Mening vizitlarim tarixi</div>
      <div class="card-b">
        <div class="frow3" style="margin-bottom:14px">
          <div class="ropt on" onclick="setHistFilter(this,'day')">Bugun</div>
          <div class="ropt" onclick="setHistFilter(this,'week')">Hafta</div>
          <div class="ropt" onclick="setHistFilter(this,'month')">Oy</div>
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
  el.innerHTML='<div class="alert alert-i">Yuklanmoqda...</div>';
  const today=todayStr();let from=today;
  if(histFilter==='week'){const w=new Date();w.setDate(w.getDate()-7);from=w.toISOString().split('T')[0];}
  if(histFilter==='month'){const m=new Date();m.setMonth(m.getMonth()-1);from=m.toISOString().split('T')[0];}
  let visits=[];
  try{
    const res=await apiGet('getMyVisits',{empId:ST.user.id,from,to:today},false).catch(()=>null);
    if(res&&!res.error&&Array.isArray(res))visits=res;
  }catch(e){}
  // Lokal (oflayn) vizitlarni ham qo'shamiz
  const localVis=JSON.parse(localStorage.getItem('ff_vis_cache_'+ST.user.id)||'[]');
  localVis.filter(v=>(v.date||today)>=from).forEach(v=>{
    if(!visits.some(x=>x.ref===v.ref))visits.push({...v,_local:true});
  });
  if(!visits.length){el.innerHTML='<div class="alert alert-i">Bu davr uchun vizit yo\'q</div>';return;}
  // Sanaga qarab guruhlash
  const byDate={};
  visits.forEach(v=>{const d=v.date||today;if(!byDate[d])byDate[d]=[];byDate[d].push(v);});
  window._histData=byDate;
  el.innerHTML=Object.entries(byDate).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,vs])=>`
    <div style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:var(--primary);
        margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid var(--primary3)">
        ${uzDate(date)} — ${vs.length} ta vizit
      </div>
      ${vs.map((v,i)=>{
        const doc=v.doctor||v['Vrach F.I.Sh']||'';
        const target=v.target||v['Ish joyi (obyekt)']||v['Dorixona Yuridik Nomi']||'';
        const res=v.result||v['Natija']||'';
        const t1=v.time||v.startTime||v['Vizit boshlandi (vaqt)']||'';
        const t2=v.endTime||v['Vizit tugadi (vaqt)']||'';
        const dur=v.durationSec||v.durationMin||0;
        const durStr=dur?(typeof dur==='number'&&dur>200?Math.round(dur/60)+' min':Math.round(dur)+' min'):'';
        return `<div class="vcard" onclick="showHistDetail('${date}',${i})" style="cursor:pointer">
          <div class="vcard-h">
            <span>${v.type==='doctor'||v['Med Vakili ID']?'🏥':'💊'} <b>${doc||target}</b></span>
            <span class="bdg ${res==='ISHLAYDI'?'bdg-g':res==='QABUL QILMADI'?'bdg-r':'bdg-y'}">${res||'OK'}</span>
          </div>
          <div class="vcard-meta">
            ${doc&&target?'🏢 '+target+' · ':''}
            ${t1?'⏰ '+t1:''} ${t2?'→'+t2:''} ${durStr?'⌛'+durStr:''}
            ${v._local?'<span class="bdg bdg-y" style="margin-left:4px">Oflayn</span>':''}
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');
}

function showHistDetail(date,idx){
  const v=window._histData?.[date]?.[idx];if(!v)return;
  const doc=v.doctor||v['Vrach F.I.Sh']||'';
  const target=v.target||v['Ish joyi (obyekt)']||v['Dorixona Yuridik Nomi']||'';
  const res=v.result||v['Natija']||'';
  const t1=v.time||v.startTime||v['Vizit boshlandi (vaqt)']||'';
  const t2=v.endTime||v['Vizit tugadi (vaqt)']||'';
  const dur=v.durationSec||v.durationMin||0;
  const durStr=dur?(typeof dur==='number'&&dur>200?Math.round(dur/60):Math.round(dur))+' daqiqa':'';
  showModal('Vizit batafsil',`
    <div class="irow"><span class="irow-l">Sana</span><span class="irow-v">${uzDate(date)}</span></div>
    ${doc?`<div class="irow"><span class="irow-l">Vrach</span><span class="irow-v">${doc}</span></div>`:''}
    ${v.specialty||v['Mutaxassisligi']?`<div class="irow"><span class="irow-l">Mutaxassis</span><span class="irow-v">${v.specialty||v['Mutaxassisligi']}</span></div>`:''}
    <div class="irow"><span class="irow-l">Ish joyi</span><span class="irow-v">${target}</span></div>
    ${v.district||v['Tumani']?`<div class="irow"><span class="irow-l">Tuman</span><span class="irow-v">${v.district||v['Tumani']}</span></div>`:''}
    <div class="irow"><span class="irow-l">Natija</span><span class="irow-v"><span class="bdg ${res==='ISHLAYDI'?'bdg-g':'bdg-y'}">${res}</span></span></div>
    ${t1?`<div class="irow"><span class="irow-l">Boshlandi</span><span class="irow-v">${t1}</span></div>`:''}
    ${t2?`<div class="irow"><span class="irow-l">Tugadi</span><span class="irow-v">${t2}</span></div>`:''}
    ${durStr?`<div class="irow"><span class="irow-l">Davomiylik</span><span class="irow-v">${durStr}</span></div>`:''}
    ${(v.promoSumma||v["Proma summasi (so'm)"])>0?`<div class="irow"><span class="irow-l">Proma</span><span class="irow-v">${fmtMoney(v.promoSumma||v["Proma summasi (so'm)"]||0)}</span></div>`:''}
  `,'<button class="btn btn-p" onclick="closeModal()">Yopish</button>');
}

// ── REJA ────────────────────────────────────────────
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
        <button class="btn btn-p btn-bl" style="margin-top:12px" onclick="toggleAddPlanForm()">+ Yangi reja</button>
      </div>
    </div>
    <div class="card hide" id="add-plan-card">
      <div class="card-h">Yangi reja qo'shish</div>
      <div class="card-b">
        <div class="fg"><label>Sana <span class="req">*</span></label>
          <input type="date" id="ap-date" value="${todayStr()}" /></div>
        <div class="fg"><label>Ish joyi <span class="req">*</span></label>
          <div class="search-wrap"><input id="ap-search" placeholder="2-3 harf kiriting..." oninput="apSearchObject(this.value)" /></div>
          <div id="ap-search-res" class="slist hide"></div>
        </div>
        <div id="ap-selected" class="alert alert-ok hide"></div>
        <div class="btn-row">
          <button class="btn btn-o" onclick="toggleAddPlanForm()">Bekor</button>
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
    ?res.map(r=>`<div class="sitem" onclick='apSelectObject(${JSON.stringify(r)})'>
        <span class="sitem-name">${r.object}</span>
        <span class="sitem-meta">${r.district||''} · ${r.region||''}${r.pri===0?' ⭐':''}</span>
      </div>`).join('')
    :'<div class="sitem"><span class="sitem-meta">Topilmadi</span></div>';
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
    return d&&d!=='undefined'&&d>=from&&d<=to;
  });
  if(!list.length){el.innerHTML='<div class="alert alert-i">Bu davr uchun reja yo\'q</div>';return;}
  const byDate={};list.forEach(p=>{const d=p['Vizit sanasi']||p.date||'';if(!byDate[d])byDate[d]=[];byDate[d].push(p);});
  el.innerHTML=Object.entries(byDate).sort().map(([date,plans])=>`
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;
        letter-spacing:.5px;margin-bottom:6px;padding:5px 0;border-bottom:1px solid var(--border)">
        ${uzDateShort(date)} · ${date}
      </div>
      ${plans.map(p=>{
        const status=p['Holati']||p.status||'';
        const obj=p['Obyekt nomi']||p.targetName||'';
        if(!obj||obj==='undefined')return '';
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

// ── KUN YAKUNI — TO'LIQ KPI + VIZITLAR ──────────────
function pageEndDay(role){return `
  <div class="page" id="page-endday">
    <!-- KPI -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-num" id="ed-pct">0%</div>
        <div class="kpi-lbl">Bajarilgan %</div>
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
      <div id="ed-already-done" class="alert alert-ok hide">
        Bugungi kun yakunlangan.
        <div id="ed-summary" style="margin-top:6px;font-size:13px"></div>
      </div>
      <button class="btn btn-ok btn-bl btn-lg" id="ed-btn" onclick="confirmEndDay()">Kunni yakunlash</button>
    </div></div>
  </div>`;}

async function renderEndDay(){
  const titleEl=document.getElementById('ed-list-title');
  if(titleEl)titleEl.textContent='Bugungi vizitlar — '+uzDate();
  // Server dan bugungi vizitlarni olish
  try{
    const dv=await apiGet('getDayVisits',{empId:ST.user.id,date:todayStr()},false).catch(()=>null);
    if(dv&&!dv.error){
      // Lokal navbatdagi vizitlarni ham qo'shamiz
      const localQ=JSON.parse(localStorage.getItem('ff_q')||'[]');
      const combined=[...dv];
      localQ.filter(q=>q.action==='addVisitMP'||q.action==='addVisitTA').forEach(q=>{
        if(!combined.some(v=>v.ref===q.ref))
          combined.push({type:q.action==='addVisitMP'?'doctor':'pharmacy',target:q.doctorObject||q.pharmName||'',doctor:q.doctorName||'',result:q.result||'OK',time:q.visitStartTime||'',date:q.date,ref:q.ref,offline:true});
      });
      ST.todayVisits=combined;
      localStorage.setItem('ff_vis_cache_'+ST.user.id,JSON.stringify(combined));
    }
  }catch(e){}
  const done=ST.todayVisits.filter(v=>!v.date||v.date===todayStr()).length;
  const norm=ST.user.role==='ta'?25:12;
  const pct=norm>0?Math.min(Math.round(done/norm*100),999):0;
  const doneEl=document.getElementById('ed-done');if(doneEl)doneEl.textContent=done;
  const pctEl=document.getElementById('ed-pct');if(pctEl)pctEl.textContent=pct+'%';
  // Vizitlar ro'yxati
  const listEl=document.getElementById('ed-list');if(!listEl)return;
  listEl.innerHTML=done
    ?ST.todayVisits.filter(v=>!v.date||v.date===todayStr()).map(vis=>`
      <div class="irow">
        <span class="irow-l">${vis.type==='doctor'?'🏥':'💊'}
          <b>${vis.type==='doctor'?(vis.doctor||vis.target):vis.target}</b>
          ${vis.type==='doctor'&&vis.target?'<br><span style="font-size:11px;color:var(--muted)">'+vis.target+'</span>':''}
          ${vis.time?'<br><span style="font-size:11px;color:var(--muted)">⏰ '+vis.time+'</span>':''}
          ${vis.offline?'<span class="bdg bdg-y" style="margin-left:4px">Oflayn</span>':''}
        </span>
        <span class="irow-v"><span class="bdg ${vis.result==='ISHLAYDI'?'bdg-g':'bdg-y'}">${vis.result||'OK'}</span></span>
      </div>`).join('')
    :'<div class="alert alert-i">Bugun hali vizit yo\'q</div>';
  // 1 kunda 1 marta
  const lastEnd=localStorage.getItem('ff_endday_'+ST.user.id);
  const alreadyDone=lastEnd===todayStr();
  if(alreadyDone){ clearInterval(_wtInterval); _wtInterval=null; }
  const btn=document.getElementById('ed-btn');
  const alreadyEl=document.getElementById('ed-already-done');
  if(alreadyDone){
    if(btn)btn.style.display='none';
    if(alreadyEl){
      alreadyEl.classList.remove('hide');
      // Yakunlangan kun xulosasi
      const key='ff_wt_'+ST.user.id+'_'+todayStr();
      const startStr=localStorage.getItem(key);
      if(startStr){
        const durSec=Math.floor((new Date(lastEnd+'T23:59:59')-new Date(startStr))/1000);
        const h=Math.floor(durSec/3600),m=Math.floor((durSec%3600)/60);
        const sumEl=document.getElementById('ed-summary');
        if(sumEl)sumEl.innerHTML=`Ishlagan vaqt: <b>${h} soat ${m} daqiqa</b> · Vizitlar: <b>${done} ta</b>`;
      }
    }
  } else {
    if(btn)btn.style.display='';
    if(alreadyEl)alreadyEl.classList.add('hide');
  }
  // Home sahifasini ham yangilaymiz
  if(document.getElementById('page-home')?.classList.contains('active'))renderHome();
}

function confirmEndDay(){
  if(localStorage.getItem('ff_endday_'+ST.user.id)===todayStr()){
    alert('Bugungi kun allaqachon yakunlangan!');return;
  }
  showModal('Kunni yakunlash',
    '<p>Kunni yakunlaysizmi?</p>'+
    '<div class="fg" style="margin-top:10px"><label>Qaysi sanani yakunlaysiz?</label>'+
    '<input type="date" id="ed-end-date" value="'+todayStr()+'" style="margin-top:4px" /></div>',
    '<button class="btn btn-p" onclick="closeModal()">Davom etish</button> <button class="btn btn-ok" onclick="closeModal();doEndDay()">Ha, yakunlash</button>');
}
async function doEndDay(){
  if(localStorage.getItem('ff_endday_'+ST.user.id)===todayStr()){alert('Allaqachon yakunlangan!');return;}
  const key='ff_wt_'+ST.user.id+'_'+todayStr();
  const startStr=localStorage.getItem(key);
  const endStr=new Date().toISOString();
  const endTime=nowTimeStr();
  let durationSec=0,startTime='';
  if(startStr){
    durationSec=Math.floor((Date.now()-new Date(startStr).getTime())/1000);
    startTime=new Date(startStr).toLocaleTimeString('uz-UZ');
  }
  const h=Math.floor(durationSec/3600),m=Math.floor((durationSec%3600)/60);
  clearInterval(_wtInterval);
  await apiPost({action:'endDay',empId:ST.user.id,empName:ST.user.name,
    role:ST.user.role,date:document.getElementById('ed-end-date')?.value||todayStr(),startTime,endTime,durationSec,
    visitCount:ST.todayVisits.filter(v=>!v.date||v.date===todayStr()).length});
  // Yakunlangan sana va vaqtni saqlaymiz
  const endTs = new Date().toISOString();
  localStorage.setItem('ff_endday_'+ST.user.id, todayStr());
  localStorage.setItem('ff_endday_time_'+ST.user.id, endTs);
  clearInterval(_wtInterval); _wtInterval = null;
  showModal('Kun yakunlandi',
    `<p>Ish kuni yakunlandi!<br>
    Ishlangan vaqt: <b>${h} soat ${m} daqiqa</b><br>
    Qilingan vizitlar: <b>${ST.todayVisits.filter(v=>!v.date||v.date===todayStr()).length} ta</b></p>`,
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
  if(r){r.innerHTML='<div class="alert alert-ok">Yuborildi!</div>';r.classList.remove('hide');}
}
