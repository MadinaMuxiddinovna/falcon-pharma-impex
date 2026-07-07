// -----------------------------------------------------------
// TEST MA'LUMOTLARINI TOZALASH (Admin ishlatadi)
// Faqat GET bilan chaqiriladi: ?action=clearTestData&confirm=FALCON2025
// Xavfsizlik: confirm kalit so'z kerak
// -----------------------------------------------------------
function clearTestData(confirmKey) {
  if (confirmKey !== 'FALCON2025') {
    return {error: 'Notogri kalit'};
  }
  var ss = SpreadsheetApp.openById(VISIT_SHEET_ID);
  var cleared = [];
  var tabNames = [OUT_TABS.VISITS_MP, OUT_TABS.VISITS_TA, OUT_TABS.KPI_LOG, OUT_TABS.LOCATIONS];
  for (var t = 0; t < tabNames.length; t++) {
    var sh = ss.getSheetByName(tabNames[t]);
    if (!sh) { cleared.push(tabNames[t] + ': topilmadi'); continue; }
    var lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.deleteRows(2, lastRow - 1);
      cleared.push(tabNames[t] + ': ' + (lastRow - 1) + ' ta ochirildi');
    } else {
      cleared.push(tabNames[t] + ': bosh');
    }
  }
  return {status: 'ok', cleared: cleared};
}

function clearEmpData(empId, confirmKey) {
  if (confirmKey !== 'FALCON2025') { return {error: 'Notogri kalit'}; }
  if (!empId) { return {error: 'empId kerak'}; }
  var ss = SpreadsheetApp.openById(VISIT_SHEET_ID);
  var cleared = [];
  var mpSh = ss.getSheetByName(OUT_TABS.VISITS_MP);
  if (mpSh) {
    var rows = mpSh.getDataRange().getValues();
    var hdr = rows[0];
    var empIdx = -1;
    for (var h = 0; h < hdr.length; h++) { if (hdr[h] === 'Med Vakili ID') { empIdx = h; break; } }
    var del1 = [];
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][empIdx] || '') === empId) del1.push(i + 1);
    }
    for (var d = 0; d < del1.length; d++) { mpSh.deleteRow(del1[d]); }
    cleared.push('Vizitlar_MP: ' + del1.length + ' ta');
  }
  var taSh = ss.getSheetByName(OUT_TABS.VISITS_TA);
  if (taSh) {
    var rows2 = taSh.getDataRange().getValues();
    var hdr2 = rows2[0];
    var empIdx2 = -1;
    for (var h2 = 0; h2 < hdr2.length; h2++) { if (hdr2[h2] === 'Agent ID') { empIdx2 = h2; break; } }
    var del2 = [];
    for (var i2 = rows2.length - 1; i2 >= 1; i2--) {
      if (String(rows2[i2][empIdx2] || '') === empId) del2.push(i2 + 1);
    }
    for (var d2 = 0; d2 < del2.length; d2++) { taSh.deleteRow(del2[d2]); }
    cleared.push('Vizitlar_TA: ' + del2.length + ' ta');
  }
  return {status: 'ok', empId: empId, cleared: cleared};
}


// BARCHA HODIMLAR (parolsiz - faqat nom, rol, region)
function getEmployeesPublic(){
  const emps=loadEmployees();
  const out={};
  Object.keys(emps).forEach(id=>{
    out[id]={name:emps[id].name,role:emps[id].role,
      region:emps[id].region,district:emps[id].district,
      group:emps[id].group,mgrId:emps[id].mgrId};
  });
  return out;
}


// MENEJER MA'LUMOTI — ID bo'yicha ism, region, rayonlar
function getMgrInfo(mgrId) {
  if (!mgrId) return {error: 'mgrId kerak'};
  const emps = loadEmployees();
  const mgr = emps[mgrId];
  if (!mgr) return {error: 'Topilmadi: ' + mgrId};
  // Bazadan menejer rayonlarini to'playmiz
  let districts = [];
  let region = mgr.region || '';
  try {
    const ss = SpreadsheetApp.openById(DB_SHEET_ID);
    const mpSh = ss.getSheetByName(TABS.EMPLOYEES);
    if (mpSh) {
      const rows = mpSh.getDataRange().getValues();
      const mgrName = (mgr.name||'').toLowerCase();
      const distSet = new Set();
      for (let i=1;i<rows.length;i++) {
        const rowMgr = String(rows[i][1]||'').toLowerCase();
        if (rowMgr && (rowMgr === mgrName || mgrName.startsWith(rowMgr.split(' ')[0]))) {
          const dist = String(rows[i][5]||'').trim(); // F = Rayon
          if (dist) distSet.add(dist);
          if (!region) region = String(rows[i][4]||''); // E = REGION
        }
      }
      districts = [...distSet];
    }
  } catch(e) { Logger.log('getMgrInfo districts: '+e); }
  return {
    mgrId, name: mgr.name, role: mgr.role,
    region, district: mgr.district || districts.join(', '),
    districts, // Barcha rayonlar massivi
    group: mgr.group
  };
}


// MUROJAATLAR ro'yxati (admin uchun)
function getFeedbacks(){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.FEEDBACK);if(!sh)return[];
  const rows=sh.getDataRange().getValues();if(rows.length<2)return[];
  const hdr=rows[0];const out=[];
  for(let i=1;i<rows.length;i++){if(!rows[i][0])continue;
    const item={};hdr.forEach((h,j)=>item[h]=rows[i][j]);out.push(item);}
  return out.reverse().slice(0,50); // Oxirgi 50 ta
}

// -----------------------------------------------------------════
// FALCON PHARMA IMPEX — VIZIT TIZIMI v11
// Apps Script — VISIT MA'LUMOTLARI Sheets ga qo'ying
// Tuzatishlar:
// - #ERROR! yo'qoldi (Holati ustuni plain text)
// - Foto olib tashlandi (Drive xato beradi)
// - Balans jurnali: KIRIM/CHIQIM aniq
// - getMyVisits: shaxsiy tarix
// - endDay: ishlagan vaqt
// -----------------------------------------------------------════

const DB_SHEET_ID    = '1cimvRWTPKdCSaXOf65p1kHpV8vKTTEf9D16gE_KatEs';
const VISIT_SHEET_ID = '1suagqXDxWA3OyTHxqenykNfyu1v-VDt-SSQc9sogYdk';
const TABS = {DOCTORS:'ВРАЧИ',PHARMACIES:'АПТЕКИ ПО ФИЛИАЛАМ',EMPLOYEES:'Мед Представитель'};
const OUT = VISIT_SHEET_ID;
const OUT_TABS = {
  VISITS_MP:'Vizitlar_MP', VISITS_TA:'Vizitlar_TA', PLANS:'Rejalar_MP',
  PROMO:'Promo_Sorovlar', MGR_PAYMENTS:'Menejer_Tolovlari',
  MGR_BALANCE:'Menejer_Balans', MGR_JOURNAL:'Balans_Jurnali',
  NEW_DOCTORS:'Yangi_Vrachlar', NEW_PHARM:'Yangi_Aptekalar',
  FEEDBACK:'Murojaatlar', KPI_LOG:'KPI_Log', LOCATIONS:'Lokatsiyalar', LOGIN:'Hodimlar_Login',
};
const ADMIN_EMAIL = 'sizning.email@gmail.com'; // ★ O'ZGARTIRING
const KPI_NORM_MP=12, KPI_NORM_TA=25, MIN_VISIT_SEC=300;

const PREPS=[
  'ФДП - Ментор 5гр №1','ФДП - Ментор 10гр №1','Фдп-Sinopharm 10г (флаконы)',
  'Ментофер 100мг/5мл №5','Л-ЦИНАТ 5мг №10','БЕРРИМУН Сироп 100мл №1',
  'ГРОВЭЛЛ Сироп 120мл №1','КАЛМИСОН Сироп 150мл №1','КАРВИЛИКС Сироп 120мл №1',
  'СОЛАРВИТ Капли 10мл №1','СОНВИЛ Капли 50мл №1','ФРУТАВИЛ Капли 50мл №1',
  'ДОЛАТИХИН Капсула №60','ЗЕРАПРОСТ Капсула №30','НИТИРОЛ Таблетка №30',
  'НЕФИТОР Таблетка №30','ПОГЕНИЛ Таблетка №30','ТИРОФОРТ Таблетка №30',
  'ОЯВИС Капсулы №60','МЕНАПОЛ Капсулы №60','ИММУНОФОР Капсулы №20',
  'BioAmicus REUTERI 10мл','BioAmicus COMPLETE 10мл','BioAmicus VITAMIN D3 10мл',
  'BioAmicus OMEGA-3 30мл',
];
const PRICES=[168038.06,235828.91,238663.53,250196.48,175125.36,145600,123200,145600,
  162400,112000,123200,134400,364000,160160,129920,135520,135520,147840,
  160160,246400,147840,168000,168000,145600,140000];

// ROUTING
function doGet(e){
  const a=(e.parameter.action||'ping').trim();let r;
  try{switch(a){
    case 'getDoctors':    r=getDoctors();break;
    case 'getPharmacies': r=getPharmacies();break;
    case 'checkLoginGet': r=checkLogin({id:e.parameter.id,pass:e.parameter.pass});break;
    case 'getPlans':      r=getPlans(e.parameter.empId,e.parameter.role);break;
    case 'getKPI':        r=getKPI(e.parameter.empId,e.parameter.role,e.parameter.date);break;
    case 'getPromoQueue': r=getPromoQueue(e.parameter.empId,e.parameter.role);break;
    case 'getMgrBalance': r=getMgrBalance(e.parameter.mgrId);break;
    case 'getMgrJournal': r=getMgrJournal(e.parameter.mgrId);break;
    case 'getLocations':  r=getLocations(e.parameter.empId,e.parameter.role,e.parameter.days);break;
    case 'getDayVisits':  r=getDayVisits(e.parameter.empId,e.parameter.date);break;
    case 'getMyVisits':   r=getMyVisits(e.parameter.empId,e.parameter.from,e.parameter.to,e.parameter.role);break;
    case 'getAllBalances': r=getAllBalances();break;
    case 'getFeedbacks':   r=getFeedbacks();break;
    case 'getMgrInfo':     r=getMgrInfo(e.parameter.mgrId);break;
    case 'getEmployees':   r=getEmployeesPublic();break;
    case 'clearTestData': r=clearTestData(e.parameter.confirmKey);break;
    case 'clearEmpData':  r=clearEmpData(e.parameter.empId,e.parameter.confirmKey);break;
    default:r={status:'ok',v:'11.0'};
  }}catch(err){r={error:err.message};Logger.log('doGet '+a+': '+err);}
  return out(r);
}
function doPost(e){
  let d;try{d=JSON.parse(e.postData.contents);}catch(err){return out({error:'JSON: '+err.message});}
  let r;try{switch(d.action){
    case 'checkLogin':     r=checkLogin(d);break;
    case 'addVisitMP':     r=addVisitMP(d);break;
    case 'addVisitTA':     r=addVisitTA(d);break;
    case 'addPlan':        r=addPlan(d);break;
    case 'updatePlan':     r=updatePlanStatus(d);break;
    case 'requestPromo':   r=requestPromo(d);break;
    case 'decidePromo':    r=decidePromo(d);break;
    case 'mgrPayDoctor':   r=mgrPayDoctor(d);break;
    case 'addMgrBalance':  r=addMgrBalance(d);break;
    case 'addNewDoctor':   r=addNewDoctor(d);break;
    case 'addNewPharmacy': r=addNewPharmacy(d);break;
    case 'saveBranchNo':   r=saveBranchNo(d);break;
    case 'submitFeedback': r=submitFeedback(d);break;
    case 'endDay':         r=endDay(d);break;
    default:r={error:'Noma\'lum: '+d.action};
  }}catch(err){r={error:err.message};Logger.log('doPost '+d.action+': '+err);}
  return out(r);
}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}

// VRACHLAR
function getDoctors(){
  const sh=SpreadsheetApp.openById(DB_SHEET_ID).getSheetByName(TABS.DOCTORS);
  if(!sh)return{error:'ВРАЧИ topilmadi'};
  const rows=sh.getDataRange().getValues();const res=[];
  for(let i=1;i<rows.length;i++){const r=rows[i];if(!r[1])continue;
    res.push({id:'V'+(i+1),region:String(r[0]||''),name:String(r[1]||''),
      object:String(r[2]||''),specialty:String(r[3]||''),district:String(r[4]||''),
      phone:String(r[5]||''),category:String(r[6]||''),status:String(r[7]||'')});}
  return res;
}

// DORIXONALAR
function getPharmacies(){
  const sh=SpreadsheetApp.openById(DB_SHEET_ID).getSheetByName(TABS.PHARMACIES);
  if(!sh)return{error:'АПТЕКИ ПО ФИЛИАЛАМ topilmadi'};
  const rows=sh.getDataRange().getValues();const res=[];
  for(let i=1;i<rows.length;i++){
    const r=rows[i];const raw=String(r[3]||'');if(!raw)continue;
    const parts=raw.split('|');
    const inn=(parts[0]||'').trim().replace(/\D/g,'');
    const legalName=(parts[1]||'').trim().replace(/^["«]+|["»]+$/g,'');
    if(!inn)continue;
    res.push({id:'P'+(i+1),rowNum:i+1,region:String(r[1]||''),district:String(r[2]||''),inn,legalName,raw,branch:String(r[4]||'')});}
  return res;
}
function saveBranchNo(d){
  const sh=SpreadsheetApp.openById(DB_SHEET_ID).getSheetByName(TABS.PHARMACIES);
  if(!sh)return{error:'topilmadi'};
  sh.getRange(d.rowNum,5).setValue(d.branchNo);return{status:'ok'};
}

// HODIMLAR — 60s script-cache bilan (tezlik uchun, #9)
function loadEmployees(){
  try{
    const cache=CacheService.getScriptCache();
    const cached=cache.get('emp_cache_v1');
    if(cached)return JSON.parse(cached);
  }catch(e){}
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.LOGIN);
  if(!sh)return{};
  const rows=sh.getDataRange().getValues();const out={};
  for(let i=1;i<rows.length;i++){const r=rows[i];if(!r[0])continue;
    out[String(r[0]).trim()]={name:String(r[1]||''),role:String(r[2]||'mp').toLowerCase(),
      pass:String(r[3]||''),region:String(r[4]||''),mgrId:String(r[5]||''),
      district:String(r[6]||''),group:String(r[7]||'')};}
  try{CacheService.getScriptCache().put('emp_cache_v1',JSON.stringify(out),60);}catch(e){}
  return out;
}
// Yangi hodim qo'shilganda yoki parol o'zgarganda cache ni tozalash uchun chaqiring
function clearEmployeeCache(){
  try{CacheService.getScriptCache().remove('emp_cache_v1');}catch(e){}
}
function genPass(){const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';let p='';for(let i=0;i<8;i++)p+=c[Math.floor(Math.random()*c.length)];return p;}
function checkLogin(d){
  const emps=loadEmployees();
  const emp=emps[String(d.id||'').trim().toUpperCase()];
  if(!emp||emp.pass!==d.pass)return{status:'error'};
  // Menejer ismini ham qaytaramiz
  let mgrName='';
  if(emp.mgrId){
    const mgr=emps[emp.mgrId];
    if(mgr)mgrName=mgr.name;
  }
  // Region/rayon bazadan olish (Мед Представитель tabidan)
  // Tab ustunlari: A=№, B=Menejer, C=MP ismi, D=Guruh, E=REGION, F=Rayon, G=Tel
  let district=emp.district||'';
  let region=emp.region||'';
  let mgrNameFromDB='';
  try{
    const ss=SpreadsheetApp.openById(DB_SHEET_ID);
    const mpSh=ss.getSheetByName(TABS.EMPLOYEES);
    if(mpSh){
      const rows=mpSh.getDataRange().getValues();
      // MP ismining birinchi so'zi (Familiya) bilan qidirish
      const empFirst=(emp.name||'').split(' ')[0].toLowerCase();
      for(let i=1;i<rows.length;i++){
        // C ustun (index 2) = MP ismi (merged cell - Google Scripts da ham index 2)
        const mpName=String(rows[i][2]||'').toLowerCase();
        if(mpName.startsWith(empFirst)||empFirst===mpName.split(' ')[0]){
          region=String(rows[i][4]||region);   // E = REGION
          district=String(rows[i][5]||district); // F = Rayon
          mgrNameFromDB=String(rows[i][1]||'');   // B = Menejer FIO
          break;
        }
      }
    }
  }catch(e){Logger.log('District fetch: '+e);}
  if(!mgrName && mgrNameFromDB) mgrName=mgrNameFromDB;
  // Menejer bo'lsa - uning barcha MP rayonlarini to'playmiz
  let mgrDistricts=[];
  if((emp.role||'').toLowerCase()==='manager'){
    try{
      const ss2=SpreadsheetApp.openById(DB_SHEET_ID);
      const mpSh2=ss2.getSheetByName(TABS.EMPLOYEES);
      if(mpSh2){
        const rows2=mpSh2.getDataRange().getValues();
        const myName=(emp.name||'').toLowerCase();
        const distSet=new Set();
        for(let i=1;i<rows2.length;i++){
          const rowMgr=String(rows2[i][1]||'').toLowerCase();
          if(rowMgr&&myName.includes(rowMgr.split(' ')[0])){
            const d=String(rows2[i][5]||'').trim(); // F = Rayon
            if(d)distSet.add(d);
          }
        }
        mgrDistricts=[...distSet];
      }
    }catch(e){}
    if(mgrDistricts.length)district=mgrDistricts.join(', ');
  }
  return{status:'ok',name:emp.name,role:emp.role,region:region||emp.region,
    mgrId:emp.mgrId,mgrName:mgrName,district:district,
    districts:mgrDistricts,group:emp.group};
}

// MP VIZITI — FOTO YO'Q
const HDR_MP=[
  'Yozilgan vaqt','Vizit sanasi','Med Vakili ID','Med Vakili Ismi','Mintaqa','Menejer ID',
  'Vrach F.I.Sh','Mutaxassisligi','Ish joyi (obyekt)','Tumani','Kategoriyasi','Telefon raqami',
  'Vizit maqsadi','Maqsad qo\'shimcha',
  'Preparat 1','Soni 1','Preparat 2','Soni 2','Preparat 3','Soni 3',
  'Preparat 4','Soni 4','Preparat 5','Soni 5',
  'Probnik berildi','Natija','Natija qo\'shimcha',
  'Proma summasi (so\'m)','Keyingi vizit sanasi','Izoh',
  'Vizit boshlandi (vaqt)','Vizit tugadi (vaqt)','Davomiylik (daqiqa)',
  'GPS Kenglik','GPS Uzunlik','GPS Aniqlik (m)',
  'Vizit holati','Havola ID',
];
function addVisitMP(d){
  const sh=getOrCreate(OUT,OUT_TABS.VISITS_MP,HDR_MP,'#0e2248');
  const durSec=Number(d.durationSec)||0;
  const durMin=Math.round(durSec/60*10)/10;
  const acc=Number(d.gpsAcc)||9999;
  const gs=d.gpsStart||{},ge=d.gpsEnd||{};
  const lat=ge.lat||gs.lat||'',lng=ge.lng||gs.lng||'';
  const reasons=[];
  if(durSec<MIN_VISIT_SEC)reasons.push('Vaqt qisqa: '+Math.round(durSec)+'s (<300s)');
  if(acc>500)reasons.push('GPS aniq emas: '+acc+'m (>500m)');
  if(gs.lat&&ge.lat){const dist=haversine(gs.lat,gs.lng,ge.lat,ge.lng);if(dist>300)reasons.push('Joy farqi: '+Math.round(dist)+'m');}
  const fake=reasons.length>0;
  const prods=(d.products||[]).slice(0,5);while(prods.length<5)prods.push({name:'',qty:''});
  const now=Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss');
  const row=[
    now,d.date,d.empId,d.empName,d.region||'',d.mgrId||'',
    d.doctorName,d.doctorSpec,d.doctorObject,d.doctorDistrict,d.doctorCategory,d.doctorPhone,
    d.goal,d.goalOther||'',
    prods[0].name,prods[0].qty||'',prods[1].name,prods[1].qty||'',prods[2].name,prods[2].qty||'',
    prods[3].name,prods[3].qty||'',prods[4].name,prods[4].qty||'',
    d.sampleRequested?'Ha':'Yo\'q',d.result,d.resultOther||'',
    d.promoRequested?Number(d.promaSumma)||0:0,
    d.nextVisitDate||'',d.comment||'',
    d.visitStartTime||'',d.visitEndTime||'',durMin,
    lat,lng,acc,
    fake?'Shubhali: '+reasons.join('; '):"To'g'ri",
    d.ref,
  ];
  sh.appendRow(row);const lr=sh.getLastRow();
  // Ranglar: natijaga qarab
  const colors={'ISHLAYDI':'#d4f5e8','QABUL QILMADI':'#fde0dc',"O'YLAMOQDA":'#fff3cd','INFO':'#e3eefc'};
  sh.getRange(lr,1,1,row.length).setBackground(fake?'#ffd6d6':(colors[d.result]||'#ffffff'));
  if(fake)sh.getRange(lr,1).setNote('SHUBHALI:\n'+reasons.join('\n'));
  // Davomiylik ustuniga rang
  if(durSec<MIN_VISIT_SEC){
    const c=HDR_MP.indexOf('Davomiylik (daqiqa)')+1;
    sh.getRange(lr,c).setBackground('#ff4d4d').setFontColor('#fff').setFontWeight('bold');
  }
  if(lat)logLocation(d.empId,d.empName,'mp','Vrach viziti',d.doctorName,lat,lng,d.date);
  // Reja: MP kiritgan "Keyingi vizit sanasi" bo'yicha, aks holda +7 kun
  let nextDate=d.nextVisitDate||'';
  if(!nextDate){const nw=new Date();nw.setDate(nw.getDate()+7);nextDate=Utilities.formatDate(nw,'Asia/Tashkent','yyyy-MM-dd');}
  addPlan({empId:d.empId,empName:d.empName,mgrId:d.mgrId||'',type:'doctor',
    targetName:d.doctorObject,targetObject:d.doctorObject,
    date:nextDate,
    goal:'Takroriy vizit',status:'Tasdiqlangan',createdAt:new Date().toISOString()});
  logKPI(d.empId,d.empName,d.date,'Vrach viziti',d.result,fake);
  return{status:'ok',ref:d.ref,fake};
}

// TA VIZITI — FOTO YO'Q
function buildHdrTA(){
  const base=['Yozilgan vaqt','Vizit sanasi','Agent ID','Agent Ismi','Mintaqa','Tumani',
    'Dorixona INN','Dorixona Yuridik Nomi','Filial raqami','Yangi dorixona'];
  const cols=[];PREPS.forEach(p=>{cols.push(p+' (bron)');cols.push(p+' (qoldiq)');cols.push(p+' (summa so\'m)');});
  return base.concat(cols,['Izoh','Vizit boshlandi (vaqt)','Vizit tugadi (vaqt)',
    'Davomiylik (daqiqa)','GPS Kenglik','GPS Uzunlik','GPS Aniqlik (m)',
    'Vizit holati','Jami summa (so\'m)','Havola ID']);
}
function addVisitTA(d){
  const HDR=buildHdrTA();
  const sh=getOrCreate(OUT,OUT_TABS.VISITS_TA,HDR,'#0f6e56');
  const durSec=Number(d.durationSec)||0,durMin=Math.round(durSec/60*10)/10,acc=Number(d.gpsAcc)||9999;
  const gs=d.gpsStart||{},ge=d.gpsEnd||{};const lat=ge.lat||gs.lat||'',lng=ge.lng||gs.lng||'';
  const reasons=[];
  if(durSec<MIN_VISIT_SEC)reasons.push('Vaqt qisqa: '+Math.round(durSec)+'s');
  if(acc>500)reasons.push('GPS aniq emas: '+acc+'m');
  if(gs.lat&&ge.lat){const dist=haversine(gs.lat,gs.lng,ge.lat,ge.lng);if(dist>300)reasons.push('Joy farqi: '+Math.round(dist)+'m');}
  const fake=reasons.length>0;
  const bronMap={},stockMap={};
  (d.bron||[]).forEach(s=>bronMap[s.prep]=Number(s.qty)||0);
  (d.stock||[]).forEach(s=>stockMap[s.prep]=Number(s.qty)||0);
  let total=0;const cells=[];
  PREPS.forEach((p,i)=>{const b=bronMap[p]||0,q=stockMap[p]||0,s=(b+q)*PRICES[i];total+=s;cells.push(b,q,s);});
  const now=Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss');
  const row=[now,d.date,d.empId,d.empName,d.region||'',d.district||'',
    d.pharmInn,d.pharmName,d.branchNo,d.isNewPharmacy?'Ha':"Yo'q"
  ].concat(cells,[d.comment||'',d.visitStartTime||'',d.visitEndTime||'',durMin,lat,lng,acc,
    fake?'Shubhali: '+reasons.join('; '):"To'g'ri",total,d.ref]);
  sh.appendRow(row);const lr=sh.getLastRow();
  sh.getRange(lr,1,1,row.length).setBackground(fake?'#ffd6d6':'#f0fff8');
  if(fake)sh.getRange(lr,1).setNote('SHUBHALI:\n'+reasons.join('\n'));
  if(lat)logLocation(d.empId,d.empName,'ta','Dorixona viziti',d.pharmName,lat,lng,d.date);
  logKPI(d.empId,d.empName,d.date,'Dorixona viziti','Vizit',fake);
  return{status:'ok',ref:d.ref,fake,total};
}

// YANGI VRACH
function addNewDoctor(d){
  const sh=getOrCreate(OUT,OUT_TABS.NEW_DOCTORS,
    ['Mintaqa','Familiya','Ismi','Sharifi','Ish joyi (obyekt)','Mutaxassisligi',
     'Tumani','Telefon raqami','Kategoriya','Holati','Qo\'shgan hodim','Qo\'shilgan vaqt'],'#0f6e56');
  sh.appendRow([d.region,d.familiya||'',d.ism||'',d.sharif||'',d.object,d.specialty,
    d.district,d.phone,d.category||'',d.status||'Active',d.empName,
    Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss')]);
  return{status:'ok'};
}

// YANGI DORIXONA
function addNewPharmacy(d){
  const inn=String(d.inn||'').replace(/\D/g,'');
  if(inn.length!==9)return{error:'INN aynan 9 ta raqam bo\'lishi kerak'};
  const sh=getOrCreate(OUT,OUT_TABS.NEW_PHARM,
    ['Mintaqa','Tumani','INN (9 raqam)','Dorixona Yuridik Nomi','Filial','Qo\'shgan hodim','Vaqt'],'#0f6e56');
  sh.appendRow([d.region,d.district,inn,d.legalName,d.branchNo||'',d.empName,
    Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss')]);
  try{
    const dbsh=SpreadsheetApp.openById(DB_SHEET_ID).getSheetByName(TABS.PHARMACIES);
    if(dbsh)dbsh.appendRow([dbsh.getLastRow(),d.region.toUpperCase(),d.district.toUpperCase(),inn+' | '+d.legalName,d.branchNo||'']);
  }catch(e){Logger.log('DB append: '+e);}
  return{status:'ok'};
}

// REJA
const HDR_PLAN=['Hodim ID','Hodim Ismi','Menejer ID','Turi','Obyekt nomi','Ish joyi','Vizit sanasi','Maqsad','Holati','Yaratilgan vaqt'];
function addPlan(d){
  const sh=getOrCreate(OUT,OUT_TABS.PLANS,HDR_PLAN,'#0e2248');
  sh.appendRow([d.empId,d.empName,d.mgrId||'',d.type,d.targetName,d.targetObject||'',d.date,d.goal,d.status||'Kutilmoqda',
    Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss')]);
  return{status:'ok'};
}
function getPlans(empId,role){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.PLANS);if(!sh)return[];
  const rows=sh.getDataRange().getValues();if(rows.length<2)return[];
  const hdr=rows[0];const out=[];
  for(let i=1;i<rows.length;i++){const r=rows[i];if(!r[0])continue;
    const item={};hdr.forEach((h,j)=>{
      // Sana ustunlarini string ga o'giramiz (Date obyektiga aylanib qolgan bo'lsa ham)
      if(h.includes('sana')||h.includes('Sana')||h.includes('vaqt')){
        item[h]=r[j]?asDateStr(r[j]):r[j];
      } else {
        item[h]=r[j];
      }
    });item._row=i+1;
    // date field ham qo'shamiz
    item.date=asDateStr(item['Vizit sanasi']);
    if(role==='mp'&&item['Hodim ID']!==empId)continue;
    if(role==='manager'&&item['Menejer ID']!==empId)continue;
    out.push(item);}
  return out;
}
function updatePlanStatus(d){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.PLANS);if(!sh)return{error:'topilmadi'};
  sh.getRange(d.row,HDR_PLAN.indexOf('Holati')+1).setValue(d.status);
  if(d.newDate)sh.getRange(d.row,HDR_PLAN.indexOf('Vizit sanasi')+1).setValue(d.newDate);
  return{status:'ok'};
}

// PROMO
const HDR_PROMO=['Proma ID','Hodim ID','Hodim Ismi','Menejer ID','Vrach F.I.Sh','Ish joyi','Sana','Proma summasi (so\'m)','Holati','Yaratilgan vaqt'];
function requestPromo(d){
  const sh=getOrCreate(OUT,OUT_TABS.PROMO,HDR_PROMO,'#b56f00');
  const id='PROMO-'+Date.now();
  const promoTime=Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss');
  sh.appendRow([id,d.empId,d.empName,d.mgrId||'',d.doctorName,d.doctorObject||'',promoTime,Number(d.promaSumma)||0,'Kutilmoqda',promoTime]);
  sh.getRange(sh.getLastRow(),1,1,HDR_PROMO.length).setBackground('#fff3cd');
  return{status:'ok',promoId:id};
}
function getPromoQueue(empId,role){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.PROMO);if(!sh)return[];
  const rows=sh.getDataRange().getValues();if(rows.length<2)return[];
  const hdr=rows[0];const out=[];
  for(let i=1;i<rows.length;i++){const r=rows[i];if(!r[0])continue;
    const item={};hdr.forEach((h,j)=>{
      if(h==='Sana'||h==='Yaratilgan vaqt'){ item[h]=asDateTimeStr(r[j]); }
      else { item[h]=r[j]; }
    });item._row=i+1;
    if(role==='manager'&&item['Menejer ID']!==empId)continue;
    if(role==='mp'&&item['Hodim ID']!==empId)continue;
    out.push(item);}
  return out;
}
function decidePromo(d){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.PROMO);if(!sh)return{error:'topilmadi'};
  sh.getRange(d.row,HDR_PROMO.indexOf('Holati')+1).setValue(d.approved?'Tasdiqlandi':'Rad etildi');
  sh.getRange(d.row,1,1,HDR_PROMO.length).setBackground(d.approved?'#d4f5e8':'#fde0dc');
  return{status:'ok'};
}

// MENEJER BALANS — #ERROR! yo'q: KIRIM/CHIQIM matni bilan
const HDR_JOURNAL=['Vaqt va sana','Sana','Menejer ID','Menejer Ismi','Harakat','Miqdor (so\'m)','Izoh'];
const HDR_BAL=['Menejer ID','Menejer Ismi','Jami kirim (so\'m)','Jami chiqim (so\'m)','Qolgan balans (so\'m)','Oxirgi yangilanish'];

function addMgrBalance(d){
  const amount=Number(d.summa)||0;if(amount<=0)return{error:'Summa 0 dan katta bo\'lishi kerak'};
  const jSh=getOrCreate(OUT,OUT_TABS.MGR_JOURNAL,HDR_JOURNAL,'#7a3ca0');
  const now=Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss');
  const date=d.date||now.split(' ')[0];
  // ★ "KIRIM" — hech qanday + belgisi yo'q (Formula parse error yo'qoladi)
  jSh.appendRow([now,date,d.mgrId,d.mgrName,'KIRIM',amount,d.comment||'Admin tomonidan']);
  jSh.getRange(jSh.getLastRow(),1,1,HDR_JOURNAL.length).setBackground('#d4f5e8');
  _updateBalance(d.mgrId,d.mgrName,amount,0);
  return{status:'ok'};
}
function _updateBalance(mgrId,mgrName,income,expense){
  const sh=getOrCreate(OUT,OUT_TABS.MGR_BALANCE,HDR_BAL,'#1a3c6e');
  const rows=sh.getDataRange().getValues();let row=-1;
  for(let i=1;i<rows.length;i++)if(rows[i][0]===mgrId){row=i+1;break;}
  const now=Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss');
  if(row>0){
    const cur=rows[row-1];
    const newIn=Number(cur[2]||0)+income,newOut=Number(cur[3]||0)+expense,newBal=newIn-newOut;
    sh.getRange(row,3).setValue(newIn);sh.getRange(row,4).setValue(newOut);
    sh.getRange(row,5).setValue(newBal);sh.getRange(row,6).setValue(now);
    sh.getRange(row,5).setBackground(newBal<0?'#ffd6d6':'#d4f5e8');
  }else{
    sh.appendRow([mgrId,mgrName,income,expense,income-expense,now]);
    sh.getRange(sh.getLastRow(),5).setBackground(income-expense<0?'#ffd6d6':'#d4f5e8');
  }
}
function getMgrBalance(mgrId){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.MGR_BALANCE);if(!sh)return{jami:0,sarflangan:0,qolgan:0};
  const rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++)if(rows[i][0]===mgrId)return{jami:rows[i][2],sarflangan:rows[i][3],qolgan:rows[i][4]};
  return{jami:0,sarflangan:0,qolgan:0};
}
function getAllBalances(){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.MGR_BALANCE);if(!sh)return[];
  const rows=sh.getDataRange().getValues();const out=[];
  for(let i=1;i<rows.length;i++)if(rows[i][0])out.push({mgrId:rows[i][0],mgrName:rows[i][1],jami:rows[i][2],sarflangan:rows[i][3],qolgan:rows[i][4]});
  return out;
}
function getMgrJournal(mgrId){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.MGR_JOURNAL);if(!sh)return[];
  const rows=sh.getDataRange().getValues();const hdr=rows[0];const out=[];
  for(let i=1;i<rows.length;i++){if(!rows[i][0])continue;if(mgrId&&rows[i][2]!==mgrId)continue;
    const item={};hdr.forEach((h,j)=>{item[h]=(h==='Vaqt va sana')?asDateTimeStr(rows[i][j]):rows[i][j];});out.push(item);}
  return out;
}

// MENEJER VRACH PULI
const HDR_PAY=['Vaqt','Sana','Menejer ID','Menejer Ismi','To\'lov turi','Vrach F.I.Sh','Mutaxassisligi','Ish joyi','Tumani','Telefon','MP ID','MP Ismi','Summa (so\'m)','Izoh','Vizit holati','Havola ID'];
function mgrPayDoctor(d){
  const sh=getOrCreate(OUT,OUT_TABS.MGR_PAYMENTS,HDR_PAY,'#7a3ca0');
  const summa=Number(d.summa)||0;
  const ref='PAY-'+Date.now();
  const now=Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss');
  const holat="To'g'ri";
  sh.appendRow([now,d.date,d.mgrId,d.mgrName,d.type||'DOKTOR',
    d.doctorName,d.doctorSpec||'',d.doctorObject||'',d.doctorDistrict||'',d.doctorPhone||'',
    d.mpId||'',d.mpName||'',summa,d.comment||'',holat,ref]);
  sh.getRange(sh.getLastRow(),1,1,HDR_PAY.length).setBackground('#d4f5e8');
  _updateBalance(d.mgrId,d.mgrName,0,summa);
  // CHIQIM — belgisiz matn
  const jSh=getOrCreate(OUT,OUT_TABS.MGR_JOURNAL,HDR_JOURNAL,'#7a3ca0');
  jSh.appendRow([now,d.date,d.mgrId,d.mgrName,'CHIQIM',summa,d.doctorName+' | '+d.doctorObject+' | '+(d.comment||'')]);
  jSh.getRange(jSh.getLastRow(),1,1,HDR_JOURNAL.length).setBackground('#fde0dc');
  logKPI(d.mgrId,d.mgrName,d.date,"Menejer to'lov",d.type||'DOKTOR',false);
  return{status:'ok',ref,holat,newBalance:getMgrBalance(d.mgrId).qolgan};
}

// BUGUNGI VIZITLAR
function getDayVisits(empId,date){
  const today=date||Utilities.formatDate(new Date(),'Asia/Tashkent','yyyy-MM-dd');
  const res=[];
  const mpSh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.VISITS_MP);
  if(mpSh){const rows=mpSh.getDataRange().getValues();const hdr=rows[0];
    const empIdx=hdr.indexOf('Med Vakili ID'),dateIdx=hdr.indexOf('Vizit sanasi');
    for(let i=1;i<rows.length;i++){const r=rows[i];
      if(String(r[empIdx])!==empId)continue;
      const d=asDateStr(r[dateIdx]);
      if(d!==today)continue;
      res.push({type:'doctor',target:String(r[hdr.indexOf('Ish joyi (obyekt)')]||''),
        doctor:String(r[hdr.indexOf('Vrach F.I.Sh')]||''),
        result:String(r[hdr.indexOf('Natija')]||''),
        time:asTimeStr(r[hdr.indexOf('Vizit boshlandi (vaqt)')])});
    }
  }
  const taSh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.VISITS_TA);
  if(taSh){const rows=taSh.getDataRange().getValues();const hdr=rows[0];
    const empIdx=hdr.indexOf('Agent ID'),dateIdx=hdr.indexOf('Vizit sanasi');
    for(let i=1;i<rows.length;i++){const r=rows[i];
      if(String(r[empIdx])!==empId)continue;
      const d=asDateStr(r[dateIdx]);
      if(d!==today)continue;
      res.push({type:'pharmacy',target:String(r[hdr.indexOf('Dorixona Yuridik Nomi')]||''),
        result:'Vizit',time:asTimeStr(r[hdr.indexOf('Vizit boshlandi (vaqt)')])});
    }
  }
  return res;
}

// SHAXSIY TARIX
function getMyVisits(empId,from,to,role){
  const today=Utilities.formatDate(new Date(),'Asia/Tashkent','yyyy-MM-dd');
  const toDate=to||today,fromDate=from||today;
  const result=[];
  // Menejer bo'lsa - o'z MP larini ham kiritamiz; Admin bo'lsa - barchasini
  const emps=loadEmployees();
  const emp=emps[empId]||{};
  const isMgr=(role||emp.role||'').toLowerCase()==='manager';
  const isAdmin=(role||emp.role||'').toLowerCase()==='admin';
  let empIds=[empId];
  if(isAdmin){
    empIds=Object.keys(emps);
  } else if(isMgr){
    Object.keys(emps).forEach(function(id){
      if(emps[id].mgrId===empId)empIds.push(id);
    });
  }
  // MP vizitlari
  const mpSh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.VISITS_MP);
  if(mpSh){const rows=mpSh.getDataRange().getValues();const hdr=rows[0];
    const empIdx=hdr.indexOf('Med Vakili ID'),dateIdx=hdr.indexOf('Vizit sanasi');
    if(empIdx>=0&&dateIdx>=0){for(let i=1;i<rows.length;i++){const r=rows[i];
      if(empIds!==null&&!empIds.includes(String(r[empIdx]||'')))continue;
      const d=asDateStr(r[dateIdx]);
      if(d<fromDate||d>toDate)continue;
      const g=idx=>String(r[hdr.indexOf(idx)]||'');
      const vEmpId=g('Med Vakili ID');
      const vEmp=emps[vEmpId]||{};
      const vMgr=emps[vEmp.mgrId]||{};
      result.push({date:d,type:'doctor',
        empId:vEmpId,empName:g('Med Vakili Ismi'),
        mgrId:vEmp.mgrId||'',mgrName:vMgr.name||'',
        doctor:g('Vrach F.I.Sh'),target:g('Ish joyi (obyekt)'),
        specialty:g('Mutaxassisligi'),district:g('Tumani'),
        result:g('Natija'),resultOther:g("Natija qo'shimcha"),
        startTime:asTimeStr(r[hdr.indexOf('Vizit boshlandi (vaqt)')]),endTime:asTimeStr(r[hdr.indexOf('Vizit tugadi (vaqt)')]),
        durationMin:g('Davomiylik (daqiqa)'),promoSumma:g("Proma summasi (so'm)"),
        writtenAt:g('Yozilgan vaqt'),
        ref:g('Havola ID')});
    }}
  }
  // TA vizitlari
  const taSh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.VISITS_TA);
  if(taSh){const rows=taSh.getDataRange().getValues();const hdr=rows[0];
    const empIdx=hdr.indexOf('Agent ID'),dateIdx=hdr.indexOf('Vizit sanasi');
    if(empIdx>=0&&dateIdx>=0){for(let i=1;i<rows.length;i++){const r=rows[i];
      if(empIds!==null&&!empIds.includes(String(r[empIdx]||'')))continue;
      const d=asDateStr(r[dateIdx]);
      if(d<fromDate||d>toDate)continue;
      const g=idx=>String(r[hdr.indexOf(idx)]||'');
      const vEmpId=g('Agent ID');
      const vEmp=emps[vEmpId]||{};
      const vMgr=emps[vEmp.mgrId]||{};
      result.push({date:d,type:'pharmacy',
        empId:vEmpId,empName:g('Agent Ismi'),
        mgrId:vEmp.mgrId||'',mgrName:vMgr.name||'',
        target:g('Dorixona Yuridik Nomi'),inn:g('Dorixona INN'),
        branchNo:g('Filial raqami'),
        result:'Vizit',startTime:asTimeStr(r[hdr.indexOf('Vizit boshlandi (vaqt)')]),
        endTime:asTimeStr(r[hdr.indexOf('Vizit tugadi (vaqt)')]),durationMin:g('Davomiylik (daqiqa)'),
        writtenAt:g('Yozilgan vaqt'),
        ref:g('Havola ID')});
    }}
  }
  return result.sort((a,b)=>a.date.localeCompare(b.date));
}

function submitFeedback(d){
  const sh=getOrCreate(OUT,OUT_TABS.FEEDBACK,['Vaqt va sana','Hodim ID','Hodim Ismi','Xabar matni','Turi'],'#4a35a0');
  sh.appendRow([Utilities.formatDate(new Date(),'Asia/Tashkent','dd.MM.yyyy HH:mm:ss'),d.empId,d.empName,d.message,d.type||'Umumiy']);
  return{status:'ok'};
}

// KPI LOG
function logKPI(empId,empName,date,visitTuri,natija,isShubhali){
  const sh=getOrCreate(OUT,OUT_TABS.KPI_LOG,
    ['Sana','Hodim ID','Hodim Ismi','Vizit turi','Natija','Vizit holati','Vaqt'],'#0e2248');
  sh.appendRow([date,empId,empName,visitTuri,natija||'',isShubhali?'Shubhali':"To'g'ri",
    Utilities.formatDate(new Date(),'Asia/Tashkent','HH:mm:ss')]);
}
function getKPI(empId,role,dateFilter){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.KPI_LOG);if(!sh)return{};
  const rows=sh.getDataRange().getValues();
  const target=dateFilter||Utilities.formatDate(new Date(),'Asia/Tashkent','yyyy-MM-dd');
  const sum={};
  // Menejer bo'lsa faqat o'z jamoasini (o'ziga bo'ysunuvchi MP/agentlarni) ko'radi
  let teamIds=null;
  if(role==='manager'){
    const emps=loadEmployees();
    teamIds=new Set();
    Object.keys(emps).forEach(function(id){ if(emps[id].mgrId===empId) teamIds.add(id); });
  }
  for(let i=1;i<rows.length;i++){
    const date=asDateStr(rows[i][0]),eId=String(rows[i][1]),eName=String(rows[i][2]),
          type=String(rows[i][3]),natija=String(rows[i][4]),holat=String(rows[i][5]);
    if(date!==target)continue;
    if(role==='manager'&&!teamIds.has(eId))continue;
    if(role!=='admin'&&role!=='manager'&&eId!==empId)continue;
    if(!sum[eId])sum[eId]={empName:eName,doctorV:0,pharmV:0,total:0,positive:0,shubhali:0};
    if(type==='Vrach viziti'){sum[eId].doctorV++;sum[eId].total++;}
    if(type==='Dorixona viziti'){sum[eId].pharmV++;sum[eId].total++;}
    if(natija==='ISHLAYDI')sum[eId].positive++;
    if(holat==='Shubhali')sum[eId].shubhali++;
  }
  Object.keys(sum).forEach(id=>{const s=sum[id];
    s.pct=s.doctorV>0?Math.round(s.doctorV/KPI_NORM_MP*100):(s.pharmV>0?Math.round(s.pharmV/KPI_NORM_TA*100):0);});
  return sum;
}

// KUN YAKUNI — ishlagan vaqt bilan
function endDay(d){
  logKPI(d.empId,d.empName,d.date,'Kun yakuni','Yakunlandi',false);
  if(d.durationSec||d.startTime){
    const sh=getOrCreate(OUT,OUT_TABS.KPI_LOG,['Sana','Hodim ID','Hodim Ismi','Vizit turi','Natija','Vizit holati','Vaqt'],'#0e2248');
    const durMin=Math.round((Number(d.durationSec)||0)/60);
    const info='Ish kuni: '+(d.startTime||'?')+' - '+(d.endTime||'?')+' = '+durMin+' daqiqa | Visit: '+d.visitCount+' ta';
    sh.appendRow([d.date,d.empId,d.empName,'Ish kuni yakuni',info,"To'g'ri",
      Utilities.formatDate(new Date(),'Asia/Tashkent','HH:mm:ss')]);
  }
  return{status:'ok'};
}

// LOKATSIYA
function logLocation(empId,empName,rol,vizitTuri,obyekt,lat,lng,date){
  const sh=getOrCreate(OUT,OUT_TABS.LOCATIONS,['Sana','Hodim ID','Hodim Ismi','Roli','Vizit turi','Obyekt nomi','GPS Kenglik','GPS Uzunlik','Vaqt'],'#4a35a0');
  const timeStr=Utilities.formatDate(new Date(),'Asia/Tashkent','HH:mm:ss');
  sh.appendRow([date,empId,empName,rol,vizitTuri,obyekt,lat,lng,timeStr]);
}
function getLocations(empId,role,days){
  const sh=SpreadsheetApp.openById(OUT).getSheetByName(OUT_TABS.LOCATIONS);if(!sh)return[];
  const rows=sh.getDataRange().getValues();
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-(Number(days)||30));
  const cutoffStr=Utilities.formatDate(cutoff,'Asia/Tashkent','yyyy-MM-dd');
  let teamIds=null;
  if(role==='manager'){
    const emps=loadEmployees();
    teamIds=new Set();
    Object.keys(emps).forEach(function(id){ if(emps[id].mgrId===empId) teamIds.add(id); });
  }
  const out=[];
  for(let i=1;i<rows.length;i++){const r=rows[i];
    const d=asDateStr(r[0]);
    if(!d||d<cutoffStr)continue;
    if(role==='manager'&&!teamIds.has(String(r[1]||'')))continue;
    if(role!=='admin'&&role!=='manager'&&r[1]!==empId)continue;
    out.push({date:d,empId:r[1],empName:r[2],role:r[3],type:r[4],target:r[5],lat:r[6],lng:r[7],time:asTimeStr(r[8])});}
  return out;
}

// YORDAMCHI
function getOrCreate(ssId,tabName,headers,color){
  const ss=SpreadsheetApp.openById(ssId);let sh=ss.getSheetByName(tabName);
  if(!sh){
    sh=ss.insertSheet(tabName);sh.appendRow(headers);styleHdr(sh,headers.length,color);
    lockDateColumnsAsText(sh,headers);
  }
  return sh;
}
// Sarlavhasida "sana"/"vaqt" so'zi bor har qanday ustunni "Plain text" formatga
// qulflaymiz — aks holda Google Sheets bunday matnlarni avtomatik sana/vaqtga
// aylantirib qo'yadi va keyinchalik String() bilan solishtirish ishlamay qoladi.
function lockDateColumnsAsText(sh,headers){
  try{
    for(let c=0;c<headers.length;c++){
      const h=String(headers[c]||'').toLowerCase();
      if(h.indexOf('sana')>=0||h.indexOf('vaqt')>=0){
        sh.getRange(2,c+1,Math.max(sh.getMaxRows()-1,1000),1).setNumberFormat('@');
      }
    }
  }catch(e){Logger.log('lockDateColumnsAsText: '+e);}
}
// Katak Date obyektiga aylanib qolgan bo'lsa ham to'g'ri "yyyy-MM-dd" qaytaradi
function asDateStr(v){
  if(v instanceof Date) return Utilities.formatDate(v,'Asia/Tashkent','yyyy-MM-dd');
  let s=String(v||'').trim();
  if(!s) return '';
  if(s.indexOf('T')>=0) return s.slice(0,10);
  if(s.indexOf('.')>=0){
    const p=s.split(' ')[0].split('.');
    if(p.length===3) return p[2].slice(0,4)+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0');
  }
  return s.slice(0,10);
}
// Katak Date obyektiga aylanib qolgan bo'lsa ham "HH:mm:ss" qaytaradi
function asTimeStr(v){
  if(v instanceof Date) return Utilities.formatDate(v,'Asia/Tashkent','HH:mm:ss');
  return String(v||'');
}
// To'liq sana+vaqt (masalan Promo "Sana"/"Yaratilgan vaqt" ustunlari uchun)
function asDateTimeStr(v){
  if(v instanceof Date) return Utilities.formatDate(v,'Asia/Tashkent','dd.MM.yyyy HH:mm:ss');
  return String(v||'');
}
function styleHdr(sh,n,bg){
  sh.getRange(1,1,1,n).setBackground(bg||'#0e2248').setFontColor('#fff').setFontWeight('bold').setFontSize(10);
  sh.setFrozenRows(1);try{sh.autoResizeColumns(1,Math.min(n,40));}catch(e){}
}
function haversine(lat1,lon1,lat2,lon2){
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
