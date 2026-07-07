// app5_map.js v9 — XARITA (Yandex Maps)
// Bu fayl app4_manager.js dagi renderMapPage() ni qo'llab-quvvatlaydi

function pageMap() {
  return `
  <div class="page" id="page-map">
    <div class="card">
      <div class="card-h">Vizit lokatsiyalari xaritasi</div>
      <div class="card-b">
        <div class="frow" style="margin-bottom:12px">
          <div class="fg"><label>Hodim</label>
            <select id="map-emp"><option value="">— Barchasi —</option></select>
          </div>
          <div class="fg"><label>Davr</label>
            <select id="map-days" onchange="renderMapPage()">
              <option value="1">Bugun</option>
              <option value="7" selected>1 hafta</option>
              <option value="30">1 oy</option>
            </select>
          </div>
        </div>
        <div id="ymap-container" style="width:100%;height:480px;border-radius:12px;overflow:hidden;border:1px solid var(--border);background:#e8f0fe;display:flex;align-items:center;justify-content:center">
          <div style="text-align:center;color:var(--muted)">Yuklanmoqda...</div>
        </div>
        <div id="map-list" style="margin-top:14px"></div>
      </div>
    </div>
  </div>`;
}

async function renderMapPage() {
  const days = document.getElementById('map-days')?.value || '7';
  const locs = await apiGet('getLocations',{empId:ST.user.id,role:ST.user.role,days},false).catch(()=>[]);
  const validLocs = (locs||[]).filter(l=>l.lat&&l.lng);

  // Hodim filtri
  const empSel = document.getElementById('map-emp');
  if(empSel && !empSel.dataset.filled && validLocs.length) {
    const uniq = [...new Map(validLocs.map(l=>[l.empId,l.empName])).entries()];
    empSel.innerHTML = '<option value="">— Barchasi —</option>' +
      uniq.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
    empSel.dataset.filled = '1';
    empSel.onchange = renderMapPage;
  }
  const filterEmp = empSel?.value || '';
  const filtered = validLocs.filter(l=>!filterEmp||l.empId===filterEmp);

  const container = document.getElementById('ymap-container');
  if(!filtered.length) {
    if(container) container.innerHTML = '<div class="alert alert-i" style="margin:16px">Bu davr uchun lokatsiya yo\'q</div>';
    const ml = document.getElementById('map-list');
    if(ml) ml.innerHTML = '';
    return;
  }

  // Yandex Maps iframe
  const first = filtered[0];
  const pts = filtered.slice(0,10)
    .map((l,i)=>`pt=${l.lng},${l.lat},pm2${l.type==='Vrach viziti'?'rd':'gm'}m${i+1}`)
    .join('~');
  if(container) {
    container.innerHTML = `<iframe
      src="https://yandex.uz/map-widget/v1/?ll=${first.lng}%2C${first.lat}&z=13&lang=ru_RU&${pts}&l=map"
      width="100%" height="480" frameborder="0" allowfullscreen style="display:block;border:none"></iframe>`;
  }

  // Ro'yxat
  const ml = document.getElementById('map-list');
  if(ml) {
    ml.innerHTML = filtered.slice(0,30).map(l=>`
      <div class="irow">
        <span class="irow-l">${l.type==='Vrach viziti'?'🔴':'🟢'} ${l.empName} → ${l.target||''}</span>
        <span class="irow-v">
          <a href="https://yandex.uz/maps/?ll=${l.lng}%2C${l.lat}&z=16&pt=${l.lng},${l.lat},pm2rdm1"
            target="_blank" class="bdg bdg-b" style="text-decoration:none">${l.date}${l.time?' · '+l.time:''}</a>
        </span>
      </div>`).join('');
  }
}
