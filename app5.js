// app5.js v11 — VIZIT YAKUNLASH (FOTO YO'Q)
// Foto olib tashlandi — Drive xatosi yo'qoladi, tez ishlaydi

// ── QADAM 4: YAKUNLASH (foto yo'q) ──────────────────
function renderVfStep4() {
  document.getElementById('vfs4').innerHTML = `
    <div class="card" style="border:2px solid var(--ok)">
      <div class="card-h" style="background:var(--ok)">✅ Vizitni yakunlash</div>
      <div class="card-b">
        <div class="alert alert-ok">
          Barcha ma'lumotlar kiritildi. Vizitni yakunlang.
        </div>
        <div class="irow"><span class="irow-l">Vrach / Dorixona</span>
          <span class="irow-v" style="font-weight:700">
            ${ST.visit.type==='doctor'?(ST.visit.target?.name||''):(ST.visit.target?.legalName||'')}
          </span></div>
        <div class="irow"><span class="irow-l">Ish joyi</span>
          <span class="irow-v">${ST.visit.type==='doctor'?(ST.visit.target?.object||''):(ST.visit.target?.legalName||'')}</span></div>
        ${ST.visit.type==='doctor'?`
        <div class="irow"><span class="irow-l">Maqsad</span><span class="irow-v">${ST.visit.vals.goal||'—'}</span></div>
        <div class="irow"><span class="irow-l">Natija</span>
          <span class="irow-v"><span class="bdg ${ST.visit.vals.result==='ISHLAYDI'?'bdg-g':'bdg-y'}">${ST.visit.vals.result||'—'}</span></span></div>
        <div class="irow"><span class="irow-l">Proma</span>
          <span class="irow-v">${ST.visit.vals.promoRequested?fmtMoney(ST.visit.vals.promaSumma||0):'Yo\'q'}</span></div>
        `:''}
        <div class="irow"><span class="irow-l">Vaqt</span>
          <span class="irow-v" id="vf-cur-time">${nowTimeStr()}</span></div>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn btn-o" onclick="vfShowStep(3)">← Orqaga</button>
      <button class="btn btn-ok btn-lg" id="vf-finish-btn" onclick="vfFinishVisit()">
        Vizitni saqlash ✅
      </button>
    </div>`;
  // Vaqtni real yangilab turish
  setInterval(()=>{const el=document.getElementById('vf-cur-time');if(el)el.textContent=nowTimeStr();},1000);
}

// ── VIZIT YAKUNLASH ─────────────────────────────────
async function vfFinishVisit() {
  const btn = document.getElementById('vf-finish-btn');
  if (btn) { btn.disabled=true; btn.textContent='Saqlanmoqda...'; }

  // GPS oxirgi koordinata — 5 soniya kutib, xato bo'lsa davom etamiz
  await new Promise(resolve=>{
    const t=setTimeout(resolve,5000);
    navigator.geolocation.getCurrentPosition(
      pos=>{ST.visit.gpsEnd={lat:pos.coords.latitude,lng:pos.coords.longitude,acc:Math.round(pos.coords.accuracy)};clearTimeout(t);resolve();},
      ()=>{clearTimeout(t);resolve();},
      {enableHighAccuracy:true,timeout:4500}
    );
  });

  await vfSaveBranchToBase();
  const duration=Math.floor((Date.now()-ST.visit.timerStart)/1000);
  const ref='FF-'+Date.now();
  const isDoc=ST.visit.type==='doctor';

  // MA'LUMOTLARNI TO'PLAB YUBORAMIZ — foto yo'q
  let payload;
  if(isDoc){
    payload={
      action:'addVisitMP', ref, date:todayStr(),
      empId:ST.user.id, empName:ST.user.name,
      region:ST.user.region||'', mgrId:ST.user.mgrId||'',
      doctorName:ST.visit.target.name, doctorSpec:ST.visit.target.specialty,
      doctorObject:ST.visit.target.object, doctorDistrict:ST.visit.target.district,
      doctorCategory:ST.visit.target.category, doctorPhone:ST.visit.target.phone,
      goal:ST.visit.vals.goal||'', goalOther:(document.getElementById('vf-goal-other')?.value||''),
      products:ST.visit.products.filter(p=>p.name&&p.qty>0),
      sampleRequested:ST.visit.vals.sample==='Ha',
      result:ST.visit.vals.result||'', resultOther:(document.getElementById('vf-result-other')?.value||''),
      promoRequested:!!ST.visit.vals.promoRequested,
      promaSumma:ST.visit.vals.promaSumma||0,
      nextVisitDate:(document.getElementById('vf-next-date')?.value||''),
      comment:(document.getElementById('vf-comment')?.value||''),
      visitStartTime:nowTimeFromTs(ST.visit.timerStart),
      visitEndTime:nowTimeStr(), durationSec:duration,
      gpsStart:ST.visit.gpsStart, gpsEnd:ST.visit.gpsEnd,
      gpsAcc:ST.visit.gpsEnd?.acc||ST.visit.gpsStart?.acc||9999,
      // FOTO YO'Q
    };
  } else {
    const{bron,stock}=getBronAndStockData();
    payload={
      action:'addVisitTA', ref, date:todayStr(),
      empId:ST.user.id, empName:ST.user.name,
      region:ST.visit.target.region||ST.user.region||'',
      district:ST.visit.target.district||ST.user.district||'',
      pharmInn:ST.visit.target.inn, pharmName:ST.visit.target.legalName,
      branchNo:ST.visit.vals.branchNo||"Yo'q",
      isNewPharmacy:!!ST.visit.target._isNew,
      bron, stock,
      comment:(document.getElementById('vf-comment')?.value||''),
      visitStartTime:nowTimeFromTs(ST.visit.timerStart),
      visitEndTime:nowTimeStr(), durationSec:duration,
      gpsStart:ST.visit.gpsStart, gpsEnd:ST.visit.gpsEnd,
      gpsAcc:ST.visit.gpsEnd?.acc||ST.visit.gpsStart?.acc||9999,
      // FOTO YO'Q
    };
  }

  const resp=await apiPost(payload);

  // Proma so'rov
  if(isDoc&&ST.visit.vals.promoRequested&&ST.visit.vals.promaSumma>0){
    await apiPost({
      action:'requestPromo', empId:ST.user.id, empName:ST.user.name,
      mgrId:ST.user.mgrId||'', doctorName:ST.visit.target.name,
      doctorObject:ST.visit.target.object, date:todayStr(),
      promaSumma:ST.visit.vals.promaSumma,
    });
  }

  // Lokal ro'yxatni yangilaymiz
  ST.todayVisits.push({
    ref, type:ST.visit.type,
    target:isDoc?ST.visit.target.object:ST.visit.target.legalName,
    doctor:isDoc?ST.visit.target.name:'',
    result:ST.visit.vals.result||'OK', time:nowTimeStr(),
    date:todayStr(), offline:!navigator.onLine,
  });
  localStorage.setItem('ff_vis_cache_'+ST.user.id, JSON.stringify(ST.todayVisits));

  if(btn){btn.disabled=false;btn.textContent='Vizitni saqlash ✅';}
  // Bosh sahifani darhol yangilaymiz (KPI srazu ko'rinadi)
  renderHome();
  vfShowStep(5);
  renderVfStep5(resp,isDoc,duration,!navigator.onLine);
}

function renderVfStep5(resp,isDoc,duration,isOffline){
  document.getElementById('vfs5').innerHTML=`
    <div class="success-scr">
      <div class="success-icon">${isOffline?'📴':'✅'}</div>
      <div class="success-title">Vizit muvaffaqiyatli saqlandi!</div>
      <div class="success-sub">
        Ma'lumotlaringiz qabul qilindi!
      </div>
      <div class="alert alert-ok" style="text-align:left;margin-top:12px">
        Boshlangan: <b>${nowTimeFromTs(ST.visit.timerStart||Date.now())}</b> →
        Tugadi: <b>${new Date().toLocaleTimeString('uz-UZ')}</b><br>
        Davomiylik: <b>${Math.floor(duration/60)} daqiqa ${duration%60} soniya</b><br>
        Bugungi vizitlar: <b>${ST.todayVisits.length} ta</b>
      </div>
      <div class="btn-row" style="justify-content:center;margin-top:16px">
        <button class="btn btn-p btn-lg" onclick="startVisitFlow('${ST.visit.type||'doctor'}')">
          Keyingi vizit →
        </button>
        <button class="btn btn-o" onclick="endVisitFlow()">Bosh sahifa</button>
      </div>
    </div>`;
}

function endVisitFlow(){
  document.getElementById('visit-flow-container').innerHTML='';
  renderHome();
}
