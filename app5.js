// ╔════════════════════════════════════════════════════════════════╗
// ║  app5.js v7 — FOTO, YAKUNLASH, VIZIT OXIRI                     ║
// ║  Tuzatishlar:                                                   ║
// ║  - "saqlandi" → "tugatildi!" (muvaffaqiyat matni)              ║
// ║  - O'tkazib yuborilgan promada bazaga "0" tushadi               ║
// ║  - Yakunlash ekrani toza                                        ║
// ╚════════════════════════════════════════════════════════════════╝

// ── QADAM 4: FOTO (faqat kamera) ──────────────────────────────
function renderVfStep4() {
  document.getElementById('vfs4').innerHTML=`
    <div class="alert alert-r">Faqat KAMERA orqali rasm oling! Galereyadan tanlash bloklangan.</div>
    <div class="foto-box" onclick="vfTakeFoto()">
      <div id="vf-foto-ph">
        <div style="font-size:42px">📷</div>
        <div style="margin-top:8px;font-weight:600">Kamerani ochish uchun bosing</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">
          ${ST.visit.type==='doctor'?'Vrach xonasi':'Dorixona ichidan yoki tashqaridan'}
        </div>
      </div>
      <img id="vf-foto-img" class="hide" alt="vizit foto" />
    </div>
    <input type="file" id="vf-foto-input" accept="image/*" capture="environment" class="hide" onchange="vfOnFoto(event)" />
    <button class="btn btn-p btn-bl" style="margin-top:12px" onclick="vfTakeFoto()">📷 Kamera</button>
    <div class="btn-row">
      <button class="btn btn-o" onclick="vfShowStep(3)">← Orqaga</button>
      <button class="btn btn-ok btn-lg" onclick="vfFinishVisit()">Vizitni yakunlash ✅</button>
    </div>`;
}

function vfTakeFoto(){document.getElementById('vf-foto-input').click();}

function vfOnFoto(e) {
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');
      const MAX=1280; let w=img.width,h=img.height;
      if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
      if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      ST.visit.fotoData=canvas.toDataURL('image/jpeg',0.72);
      document.getElementById('vf-foto-img').src=ST.visit.fotoData;
      document.getElementById('vf-foto-img').classList.remove('hide');
      document.getElementById('vf-foto-ph').classList.add('hide');
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ── VIZITNI YAKUNLASH ─────────────────────────────────────────
async function vfFinishVisit() {
  if(!ST.visit.fotoData){alert('Rasm olish majburiy!');return;}

  // End GPS
  await new Promise(resolve=>{
    navigator.geolocation.getCurrentPosition(
      pos=>{ST.visit.gpsEnd={lat:pos.coords.latitude,lng:pos.coords.longitude,acc:Math.round(pos.coords.accuracy)};resolve();},
      ()=>resolve(),{enableHighAccuracy:true,timeout:10000});
  });

  await vfSaveBranchToBase();
  showOv('Vizit saqlanmoqda...');

  const duration=Math.floor((Date.now()-ST.visit.timerStart)/1000);
  const ref='FF-'+Date.now();
  const isDoc=ST.visit.type==='doctor';

  let promoId='';
  if(isDoc&&ST.visit.vals.promoRequested) {
    const pr=await apiPost({action:'requestPromo',empId:ST.user.id,empName:ST.user.name,
      mgrId:ST.user.mgrId||'',doctorName:ST.visit.target.name,
      doctorObject:ST.visit.target.object,date:todayStr(),izoh:v('vf-promo-note')});
    promoId=pr.promoId||'';
  }

  let resp;
  if(isDoc) {
    resp=await apiPost({
      action:'addVisitMP',ref,date:todayStr(),empId:ST.user.id,empName:ST.user.name,
      region:ST.user.region,mgrId:ST.user.mgrId||'',
      doctorName:ST.visit.target.name,doctorSpec:ST.visit.target.specialty,
      doctorObject:ST.visit.target.object,doctorDistrict:ST.visit.target.district,
      doctorCategory:ST.visit.target.category,doctorPhone:ST.visit.target.phone,
      goal:ST.visit.vals.goal,goalOther:v('vf-goal-other'),
      products:ST.visit.products.filter(p=>p.name),
      sampleRequested:ST.visit.vals.sample==='Ha',
      probnikPreps:ST.visit.vals.probnikPreps||[],
      result:ST.visit.vals.result,resultOther:v('vf-result-other'),
      // O'tkazib yuborilganda promoRequested=false, bazaga 0 tushadi
      promoRequested:!!ST.visit.vals.promoRequested,
      promoId,
      nextVisitDate:v('vf-next-date'),comment:v('vf-comment'),
      visitStartTime:nowTimeFromTs(ST.visit.timerStart),visitEndTime:nowTimeStr(),durationSec:duration,
      gpsStart:ST.visit.gpsStart,gpsEnd:ST.visit.gpsEnd,
      gpsAcc:ST.visit.gpsEnd?.acc||ST.visit.gpsStart?.acc||9999,
      fotoBase64:ST.visit.fotoData,
    });
  } else {
    const {bron,stock}=getBronAndStockData();
    resp=await apiPost({
      action:'addVisitTA',ref,date:todayStr(),empId:ST.user.id,empName:ST.user.name,
      region:ST.visit.target.region,district:ST.visit.target.district,
      pharmInn:ST.visit.target.inn,pharmName:ST.visit.target.legalName,
      branchNo:ST.visit.vals.branchNo||'Yo\'q',isNewPharmacy:!!ST.visit.target._isNew,
      bron,stock,comment:v('vf-comment'),
      visitStartTime:nowTimeFromTs(ST.visit.timerStart),visitEndTime:nowTimeStr(),durationSec:duration,
      gpsStart:ST.visit.gpsStart,gpsEnd:ST.visit.gpsEnd,
      gpsAcc:ST.visit.gpsEnd?.acc||ST.visit.gpsStart?.acc||9999,
      fotoBase64:ST.visit.fotoData,
    });
  }

  ST.todayVisits.push({ref,type:ST.visit.type,target:isDoc?ST.visit.target.name:ST.visit.target.legalName,result:ST.visit.vals.result||'OK'});
  hideOv();
  vfShowStep(5);
  renderVfStep5(resp,isDoc,duration);
}

function renderVfStep5(resp,isDoc,duration) {
  const fake=resp?.fake;
  document.getElementById('vfs5').innerHTML=`
    <div class="success-scr">
      <div class="success-icon">${fake?'⚠️':'✅'}</div>
      <!-- "saqlandi" → "tugatildi!" (to'g'irlandi) -->
      <div class="success-title" style="${fake?'color:var(--danger)':''}">
        Vizit muvaffaqiyatli tugatildi!
      </div>
      <div class="success-sub">
        ${navigator.onLine?'Ma\'lumotlar bazaga yuborildi':'Oflayn saqlandi — internet kelganda yuboriladi'}
      </div>
      <div class="alert alert-ok" style="text-align:left">
        Davomiylik: ${Math.floor(duration/60)} daqiqa ${duration%60} soniya<br>
        Vaqt: ${new Date().toLocaleTimeString('uz-UZ')}
      </div>
      ${isDoc?'<div class="alert alert-i">Bu vrachga 1 haftadan keyin avtomatik reja tushirildi.</div>':''}
      <div class="btn-row" style="justify-content:center;margin-top:16px">
        <button class="btn btn-p btn-lg" onclick="vfNextVisit()">Keyingi vizit →</button>
        <button class="btn btn-o" onclick="document.getElementById('visit-flow-container').innerHTML='';renderHome()">Bosh sahifa</button>
      </div>
    </div>`;
}
function vfNextVisit(){startVisitFlow(ST.visit.type);}
