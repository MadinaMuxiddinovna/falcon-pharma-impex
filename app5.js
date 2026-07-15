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
        <div class="irow"><span class="irow-l">Maqsad</span><span class="irow-v">${ST.visit.vals.goal==='BOSHQA'?(document.getElementById('vf-goal-other')?.value||ST.visit.vals.goal):(ST.visit.vals.goal||'—')}</span></div>
        <div class="irow"><span class="irow-l">Natija</span>
          <span class="irow-v"><span class="bdg ${ST.visit.vals.result==='ISHLAYDI'?'bdg-g':'bdg-y'}">${ST.visit.vals.result==='BOSHQA'?(document.getElementById('vf-result-other')?.value||ST.visit.vals.result):(ST.visit.vals.result||'—')}</span></span></div>
        <div class="irow"><span class="irow-l">FCOIN</span>
          <span class="irow-v">${ST.visit.vals.promoRequested?fmtCoin(ST.visit.vals.promaSumma||0):'Yo\'q'}</span></div>
        `:`
        <div class="irow"><span class="irow-l">INN</span><span class="irow-v">${ST.visit.target?.inn||''}</span></div>
        <div class="irow"><span class="irow-l">Filial raqami</span><span class="irow-v">${ST.visit.vals.branchNo!==undefined&&ST.visit.vals.branchNo!==''?ST.visit.vals.branchNo:0}</span></div>
        ${(()=>{
          try{
            // ST.visit._pharmData da saqlanagan (step 3 dan)
            const pd=ST.visit._pharmData||getBronAndStockData();
            const {bron,stock}=pd;
            let stockSum=0,stockCnt=0,bronSum=0,bronCnt=0;
            (stock||[]).forEach(s=>{if(Number(s.qty)>0){stockCnt+=Number(s.qty);stockSum+=Number(s.qty)*(PRICES[s.prep]||0);}});
            (bron||[]).forEach(b=>{if(Number(b.qty)>0){bronCnt+=Number(b.qty);bronSum+=Number(b.qty)*(PRICES[b.prep]||0);}});
            // Har bir preparat bo'yicha qoldiq/bron sonini birlashtiramiz (nomi bilan)
            const byPrep={};
            (stock||[]).forEach(s=>{if(Number(s.qty)>0){byPrep[s.prep]=byPrep[s.prep]||{q:0,b:0};byPrep[s.prep].q=Number(s.qty);}});
            (bron||[]).forEach(b=>{if(Number(b.qty)>0){byPrep[b.prep]=byPrep[b.prep]||{q:0,b:0};byPrep[b.prep].b=Number(b.qty);}});
            let html='';
            const prepNames=Object.keys(byPrep);
            if(prepNames.length){
              html+='<div style="margin:10px 0 4px;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase">Preparatlar</div>';
              prepNames.forEach(prep=>{
                const it=byPrep[prep];
                const lineSum=(it.q+it.b)*(PRICES[prep]||0);
                html+='<div class="irow" style="font-size:12.5px"><span class="irow-l">'+prep+'</span>'
                  +'<span class="irow-v">Qoldiq: '+it.q+' · Bron: '+it.b+' · '+fmtMoney(lineSum)+'</span></div>';
              });
            }
            html+='<div class="irow" style="margin-top:8px"><span class="irow-l">Qoldiq</span><span class="irow-v"><b>'+stockCnt+' ta</b> · '+fmtMoney(stockSum)+'</span></div>';
            html+='<div class="irow"><span class="irow-l">Bron</span><span class="irow-v"><b>'+bronCnt+' ta</b> · '+fmtMoney(bronSum)+'</span></div>';
            html+='<div class="irow"><span class="irow-l"><b>Jami (Qoldiq + Bron)</b></span><span class="irow-v" style="font-weight:800;color:var(--ok)">'+fmtMoney(stockSum+bronSum)+'</span></div>';
            return html;
          }catch(e){ return ''; }
        })()}
        `}
        <div class="irow"><span class="irow-l">Sana</span><span class="irow-v">${uzDate(todayStr())}</span></div>
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

  // GPS oxirgi koordinata — avval aniq (satellite) usulda, indoor joylarda ishlamasa
  // tezroq (WiFi/uyali aloqa) usulga o'tamiz — bo'sh qoldirmaslik uchun
  await new Promise(resolve=>{
    let done=false;
    const finish=()=>{ if(!done){ done=true; resolve(); } };
    const t=setTimeout(()=>{
      // Aniq GPS topilmadi — tezroq, kam aniq usulni sinaymiz (indoor uchun yaxshiroq)
      navigator.geolocation.getCurrentPosition(
        pos=>{ST.visit.gpsEnd={lat:pos.coords.latitude,lng:pos.coords.longitude,acc:Math.round(pos.coords.accuracy)};finish();},
        ()=>finish(),
        {enableHighAccuracy:false,timeout:4000,maximumAge:60000}
      );
    },8000);
    navigator.geolocation.getCurrentPosition(
      pos=>{ST.visit.gpsEnd={lat:pos.coords.latitude,lng:pos.coords.longitude,acc:Math.round(pos.coords.accuracy)};clearTimeout(t);finish();},
      ()=>{}, // xato bo'lsa ham kutamiz — timeout orqali fallback ishga tushadi
      {enableHighAccuracy:true,timeout:8000}
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
      probnikPreps:(ST.visit.vals.probnikPreps||[]).join(', '),
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
    // Bron va qoldiq soni/summalarini hisoblaymiz
    let bronTotal=0,bronSum=0,stockTotal=0,stockSum=0;
    bron.forEach(b=>{if(b.qty>0){bronTotal+=b.qty;bronSum+=b.qty*(PRICES[b.prep]||0);}});
    stock.forEach(s=>{if(s.qty>0){stockTotal+=s.qty;stockSum+=s.qty*(PRICES[s.prep]||0);}});
    window._lastPharmResult={bronTotal,bronSum,stockTotal,stockSum};
    payload={
      action:'addVisitTA', ref, date:todayStr(),
      empId:ST.user.id, empName:ST.user.name,
      region:ST.visit.target.region||ST.user.region||'',
      district:ST.visit.target.district||ST.user.district||'',
      pharmInn:ST.visit.target.inn, pharmName:ST.visit.target.legalName,
      branchNo:(ST.visit.vals.branchNo!==undefined&&ST.visit.vals.branchNo!==null&&ST.visit.vals.branchNo!=='')?ST.visit.vals.branchNo:0,
      isNewPharmacy:!!ST.visit.target._isNew,
      bron, stock,
      lprName:(ST.visit._lprData?.lprName||''), lprPhone:(ST.visit._lprData?.lprPhone||''), lpuObject:(ST.visit._lprData?.lpuObject||''),
      comment:(document.getElementById('vf-comment')?.value||''),
      visitStartTime:nowTimeFromTs(ST.visit.timerStart),
      visitEndTime:nowTimeStr(), durationSec:duration,
      gpsStart:ST.visit.gpsStart, gpsEnd:ST.visit.gpsEnd,
      gpsAcc:ST.visit.gpsEnd?.acc||ST.visit.gpsStart?.acc||9999,
      // FOTO YO'Q
    };
  }

  const resp=await apiPost(payload);
  if(resp&&resp.error){
    if(btn){btn.disabled=false;btn.textContent='Vizitni saqlash ✅';}
    alert(resp.error);
    return;
  }

  // Proma so'rov
  if(isDoc&&ST.visit.vals.promoRequested&&ST.visit.vals.promaSumma>0){
    await apiPost({
      action:'requestPromo', empId:ST.user.id, empName:ST.user.name,
      mgrId:ST.user.mgrId||'', doctorName:ST.visit.target.name,
      doctorObject:ST.visit.target.object, date:todayStr(),
      promaSumma:ST.visit.vals.promaSumma,
      lat:(ST.visit.gpsEnd||ST.visit.gpsStart||{}).lat||'',
      lng:(ST.visit.gpsEnd||ST.visit.gpsStart||{}).lng||'',
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
  clearActiveVisitProgress();
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
        ${isDoc?'':('<br>Dorixona: <b>'+(ST.visit.target?.legalName||'')+'</b>'+'<br>INN: '+(ST.visit.target?.inn||''))}
        <br>Bugungi vizitlar: <b>${ST.todayVisits.length} ta</b>
      </div>
      ${!isDoc?`
      <div class="alert alert-ok" style="text-align:left;margin-top:8px;font-size:13px">
        <div><b>Dorixona:</b> ${ST.visit.target?.legalName||''}</div>
        ${window._lastPharmResult&&window._lastPharmResult.bronSum>0?
          '<div>Bron: <b>'+window._lastPharmResult.bronTotal+' ta</b> · '+fmtMoney(window._lastPharmResult.bronSum)+'</div>':''}
        ${window._lastPharmResult&&window._lastPharmResult.stockSum>0?
          '<div>Qoldiq: <b>'+window._lastPharmResult.stockTotal+' ta</b> · '+fmtMoney(window._lastPharmResult.stockSum)+'</div>':''}
      </div>`:''}
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
