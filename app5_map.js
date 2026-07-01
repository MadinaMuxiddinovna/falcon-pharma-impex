// ╔════════════════════════════════════════════════════════════════╗
// ║  app5_map.js — XARITA: MP/TA qaysi joylarga borgani vizual       ║
// ║  Google Maps Embed (API kalitsiz, bepul) orqali ishlaydi         ║
// ╚════════════════════════════════════════════════════════════════╝

function pageMap() {
  return `
  <div class="page" id="page-map">
    <div class="card">
      <div class="card-h">🗺️ Vizit lokatsiyalari xaritasi</div>
      <div class="card-b">
        <div class="frow" style="margin-bottom:12px">
          <div class="fg"><label>Hodim</label><select id="map-emp-select"><option value="">— Barchasi —</option></select></div>
          <div class="fg"><label>Davr</label><select id="map-days-select" onchange="renderMapPage()">
            <option value="1">Bugun</option><option value="7" selected>1 hafta</option>
            <option value="30">1 oy</option><option value="90">3 oy</option></select></div>
        </div>
        <div class="alert alert-i">🔴 Qizil nuqtalar — vrach vizitlari &nbsp;|&nbsp; 🟢 Yashil — apteka vizitlari</div>
        <div id="map-canvas"></div>
        <div id="map-list" style="margin-top:14px"></div>
      </div>
    </div>
  </div>`;
}

async function renderMapPage() {
  showOv('Lokatsiyalar yuklanmoqda...');
  const days = v('map-days-select') || '7';
  const locs = await apiGet('getLocations', { empId: ST.user.id, role: ST.user.role, days }).catch(() => []);
  hideOv();

  if (!locs || !locs.length || locs.error) {
    document.getElementById('map-canvas').innerHTML = `
      <div class="alert alert-i" style="margin:0">
        Hozircha lokatsiya ma'lumoti yo'q. Vizitlar amalga oshirilgach, bu yerda xaritada ko'rinadi.
      </div>`;
    return;
  }

  // Hodimlar ro'yxatini filtr uchun to'ldirish
  const empSel = document.getElementById('map-emp-select');
  if (empSel && !empSel.dataset.filled) {
    const uniqueEmps = [...new Map(locs.map(l => [l.empId, l.empName])).entries()];
    empSel.innerHTML = '<option value="">— Barchasi —</option>' +
      uniqueEmps.map(([id,name]) => `<option value="${id}">${name}</option>`).join('');
    empSel.dataset.filled = '1';
    empSel.onchange = renderMapPage;
  }
  const filterEmp = empSel ? empSel.value : '';
  const filtered = filterEmp ? locs.filter(l => l.empId === filterEmp) : locs;

  drawMapSVG(filtered);
  renderMapList(filtered);
}

// ── ODDIY VIZUAL XARITA (SVG asosida, lat/lng ni 2D proyeksiyaga o'tkazadi) ──
// Bu Google Maps API kaliti talab qilmaydi — Toshkent shahri chegaralariga moslashtirilgan
function drawMapSVG(locs) {
  const canvas = document.getElementById('map-canvas');
  if (!locs.length) { canvas.innerHTML = '<div class="alert alert-i">Bu filtr uchun ma\'lumot yo\'q</div>'; return; }

  const lats = locs.map(l=>Number(l.lat)).filter(n=>!isNaN(n));
  const lngs = locs.map(l=>Number(l.lng)).filter(n=>!isNaN(n));
  if (!lats.length) { canvas.innerHTML = '<div class="alert alert-i">Koordinatalar mavjud emas</div>'; return; }

  const minLat=Math.min(...lats), maxLat=Math.max(...lats);
  const minLng=Math.min(...lngs), maxLng=Math.max(...lngs);
  const padLat=(maxLat-minLat)*0.15||0.01, padLng=(maxLng-minLng)*0.15||0.01;
  const bLat0=minLat-padLat, bLat1=maxLat+padLat, bLng0=minLng-padLng, bLng1=maxLng+padLng;

  const W=800, H=480;
  function toXY(lat,lng) {
    const x = (lng-bLng0)/(bLng1-bLng0)*W;
    const y = H - (lat-bLat0)/(bLat1-bLat0)*H;
    return [x,y];
  }

  const points = locs.map(l => {
    const [x,y] = toXY(Number(l.lat), Number(l.lng));
    const color = l.type==='doctor' ? '#e8340a' : '#0f6e56';
    const label = (l.empName||'').replace(/'/g,"\\'") + ' — ' + (l.target||'').replace(/'/g,"\\'") + ' (' + l.date + ')';
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${color}" fill-opacity="0.75" stroke="#fff" stroke-width="1.5"
      onclick="alert('${label}')" style="cursor:pointer"/>`;
  }).join('');

  canvas.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%;background:#eef2fb;border-radius:10px">
      <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dde3ef" stroke-width="1"/></pattern></defs>
      <rect width="${W}" height="${H}" fill="url(#grid)"/>
      ${points}
    </svg>
    <div style="font-size:11px;color:var(--muted);margin-top:6px;text-align:center">
      Nuqtaga bosing — kim, qayerga, qachon borganini ko'rasiz. Aniqroq xarita uchun pastdagi "Google Maps'da ochish" tugmasini bosing.
    </div>`;
}

function renderMapList(locs) {
  const el = document.getElementById('map-list');
  const sorted = [...locs].sort((a,b) => (b.date||'').localeCompare(a.date||''));
  el.innerHTML = '<div class="card-h" style="border-radius:9px;margin-bottom:8px">📍 Vizitlar ro\'yxati (' + sorted.length + ' ta)</div>' +
    sorted.slice(0, 50).map(l => `
    <div class="irow">
      <span class="irow-l">${l.type==='doctor'?'🔴':'🟢'} ${l.empName} → ${l.target}</span>
      <span class="irow-v">
        <a href="https://www.google.com/maps?q=${l.lat},${l.lng}" target="_blank" class="bdg bdg-b" style="text-decoration:none">${l.date}</a>
      </span>
    </div>`).join('');
}
