/* =================================================================
   PLC SİMÜLATÖRÜ — Siemens LAD Ladder Diagram, Scan cycle
   ================================================================= */

/* =================================================================
   PLC SİMÜLATÖRÜ — Siemens LAD tarzı
   Program yapısı:
   PLC = {
     networks: [
       {
         id: 'n1',
         branches: [  // OR şubeleri (her şube AND ile birleşen elemanlar)
           [ {type:'NO',addr:'I0.0'}, {type:'NC',addr:'I0.1'} ],  // I0.0 AND NOT I0.1
           [ {type:'NO',addr:'Q0.0'} ]   // OR Q0.0 (mühürleme)
         ],
         output: {type:'OUT', addr:'Q0.0'}  // → Q0.0
       }
     ]
   }
   ================================================================= */
let PLC_PROGRAM = { networks: [] };
let PLC_STATE = {
  I: new Array(8).fill(false),   // I0.0–I0.7
  Q: new Array(8).fill(false),   // Q0.0–Q0.7
  M: new Array(8).fill(false),   // M0.0–M0.7
  T: {},  // {1: {running, done, startTime, preset}}
  C: {},  // {1: {value, done, preset}}
  running: false
};
let PLC_TICK_INTERVAL = null;
let PALETTE_PICK = null;  // Seçili palet elemanı
let DROP_TARGET = null;   // Branch içine eklenecek hedef
let ADDR_CALLBACK = null; // Adres seçildikten sonra çağrılacak

function openPLC(){
  switchTab('plc');
  if(!PLC_PROGRAM.networks.length) addNetwork();
  renderPLC();
  renderPLCPanel();
  // Mobilde sağ paneli varsayılan kapalı (alanı boşalt, sahneye yer kalsın)
  if(window.innerWidth<900){
    const p=document.getElementById('plcPanelSide');
    if(p)p.classList.add('collapsed');
  }
}

function addNetwork(){
  PLC_PROGRAM.networks.push({
    id: 'n'+(PLC_PROGRAM.networks.length+1),
    branches: [[]],
    output: null
  });
  renderPLC();
}

function removeNetwork(idx){
  if(!confirm('Network silinsin mi?'))return;
  PLC_PROGRAM.networks.splice(idx,1);
  renderPLC();
}

function resetPLC(){
  if(confirm('Tüm program silinsin mi?')){
    PLC_PROGRAM = { networks: [] };
    addNetwork();
  }
}

function pickPaletteElem(t){
  PALETTE_PICK = (PALETTE_PICK===t)? null : t;
  document.querySelectorAll('.pal-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.elem===PALETTE_PICK);
  });
  if(PALETTE_PICK){
    toast(`${PALETTE_PICK} seçildi — bir Network içine tıkla`, 'good');
  }
}

function renderPLC(){
  const area = document.getElementById('ladderArea');
  area.innerHTML='';
  if(!PLC_PROGRAM.networks.length){
    area.innerHTML='<div class="net-empty-hint" onclick="addNetwork()">+ İlk network\'ü ekle</div>';
    return;
  }
  PLC_PROGRAM.networks.forEach((net,nIdx)=>{
    const netEl=document.createElement('div');
    netEl.className='net';
    netEl.innerHTML=`
      <div class="net-head">
        <span><span class="net-num">Network ${nIdx+1}</span> ${net.comment?' · '+net.comment:''}</span>
        <div class="net-actions plc-edit-only">
          <button onclick="removeNetwork(${nIdx})">SİL</button>
        </div>
      </div>
      <div class="net-body">
        <div class="net-row">
          <div class="lrail"></div>
          <div class="net-elems" id="elems-${nIdx}"></div>
          <div class="net-out-wrap" id="out-${nIdx}"></div>
          <div class="rrail"></div>
        </div>
      </div>
    `;
    area.appendChild(netEl);
    renderNetElems(nIdx);
    renderNetOut(nIdx);
  });
}

function renderNetElems(nIdx){
  const net = PLC_PROGRAM.networks[nIdx];
  const wrap = document.getElementById(`elems-${nIdx}`);
  wrap.innerHTML='';

  // Boş network
  if(net.branches[0].length===0 && net.branches.length===1){
    const ph = document.createElement('div');
    ph.className='net-empty-hint plc-edit-only';
    ph.textContent='+ Buraya koşul eleman ekle (palet\'ten seç ve tıkla)';
    ph.style.flex='1';
    ph.onclick=()=>addElemToBranch(nIdx,0);
    wrap.appendChild(ph);
    // OR şube butonu
    addOrBranchBtn(wrap, nIdx);
    return;
  }

  // SVG overlay (tüm tel çizimleri için)
  const svgWrap=document.createElement('div');
  svgWrap.className='ladder-rungs';
  svgWrap.innerHTML=`<svg class="rung-svg" preserveAspectRatio="none"></svg>`;
  wrap.appendChild(svgWrap);

  // Branch container
  const bWrap=document.createElement('div');
  bWrap.className=net.branches.length>1 ? 'branches multi' : 'branches single';

  net.branches.forEach((br,bIdx)=>{
    const row=document.createElement('div');
    row.className='branch-row';
    row.dataset.branch=bIdx;
    if(br.length===0 && net.branches.length>1){
      const empty=document.createElement('div');
      empty.className='net-empty-hint plc-edit-only';
      empty.style.cssText='min-width:120px;font-size:10px;padding:8px';
      empty.textContent='(boş şube)';
      empty.onclick=()=>addElemToBranch(nIdx,bIdx);
      row.appendChild(empty);
    } else {
      br.forEach((el,eIdx)=>row.appendChild(createElemEl(el,nIdx,bIdx,eIdx)));
    }
    // "+Ekle" butonu (satır sonu)
    const add=document.createElement('button');
    add.className='net-empty-hint plc-edit-only';
    add.style.cssText='min-width:80px;font-size:10px;padding:6px 8px;margin-left:6px';
    add.textContent='+ Ekle';
    add.onclick=()=>addElemToBranch(nIdx,bIdx);
    row.appendChild(add);
    // Branch sil butonu (1'den fazla branch varsa)
    if(net.branches.length>1){
      const del=document.createElement('button');
      del.className='plc-edit-only';
      del.style.cssText='background:transparent;border:1px solid var(--danger);color:var(--danger);font-size:10px;padding:4px 8px;border-radius:4px;cursor:pointer;margin-left:4px;align-self:center';
      del.textContent='×';
      del.title='Şubeyi sil';
      del.onclick=()=>{
        if(net.branches.length<=1)return;
        net.branches.splice(bIdx,1);
        renderNetElems(nIdx);
      };
      row.appendChild(del);
    }
    bWrap.appendChild(row);
  });

  wrap.appendChild(bWrap);
  addOrBranchBtn(wrap, nIdx);

  // SVG çiz (rung connections)
  setTimeout(()=>drawRungLines(nIdx, wrap, bWrap, net),0);
}

function addOrBranchBtn(wrap, nIdx){
  const net=PLC_PROGRAM.networks[nIdx];
  const orBtn=document.createElement('button');
  orBtn.className='net-empty-hint plc-edit-only';
  orBtn.style.cssText='min-width:140px;font-size:10px;padding:6px 10px;margin-top:6px;display:block';
  orBtn.textContent='+ Paralel (OR) Şube';
  orBtn.onclick=()=>{net.branches.push([]);renderNetElems(nIdx);};
  wrap.appendChild(orBtn);
}

/* Ladder rung tel çizimi — SVG overlay
   - Her branch satırında: sol rail'e elemanın merkezine kadar yatay tel
   - Birden çok elemansa, aralarında yatay tel
   - Branch'in sonunda: son elemandan sağ rail'e kadar yatay tel
   - Birden çok branch varsa: tüm branch'lerin başlangıçları sol rail'de dikey birleşir
   - Birden çok branch sonunda: sağ rail'de dikey birleşir
   - AKTIF tel: yeşil + akan animasyon; PASİF tel: gri */
function drawRungLines(nIdx, wrap, bWrap, net){
  const svg = wrap.querySelector('.rung-svg');
  if(!svg)return;
  const wrapRect = wrap.getBoundingClientRect();
  svg.setAttribute('width', wrapRect.width);
  svg.setAttribute('height', wrapRect.height);
  svg.setAttribute('viewBox', `0 0 ${wrapRect.width} ${wrapRect.height}`);
  svg.innerHTML='';

  if(net.branches.length===0)return;

  const branchRows = bWrap.querySelectorAll('.branch-row');
  const wrapLeft = wrapRect.left;
  const wrapTop = wrapRect.top;

  // Branch'lerin orta y-değerleri ve eleman pozisyonları
  const branchInfo = [];
  branchRows.forEach((row,bIdx)=>{
    const rowRect = row.getBoundingClientRect();
    const cy = rowRect.top - wrapTop + rowRect.height/2;
    const elems = row.querySelectorAll('.elem');
    const elemCenters = [];
    elems.forEach(el=>{
      const r = el.getBoundingClientRect();
      elemCenters.push({
        cx: r.left - wrapLeft + r.width/2,
        leftX: r.left - wrapLeft,
        rightX: r.right - wrapLeft,
        active: el.classList.contains('active')
      });
    });
    branchInfo.push({cy, elems:elemCenters, branch:net.branches[bIdx]});
  });

  // Sol rail x = 0, sağ rail x = wrapRect.width
  const leftX = 2;
  const rightX = wrapRect.width - 2;

  // Network'ün rung durumu (canlı/değil)
  const rungActive = PLC_STATE.running && evalNetwork(net);

  // Yardımcı: bir branch'in tamamen iletken olup olmadığı
  function isBranchConducting(branch){
    if(!PLC_STATE.running) return false;
    if(branch.length===0)return false;
    return branch.every(el=>{
      const v = readAddr(el.addr);
      return el.type==='NO' ? v : !v;
    });
  }

  branchInfo.forEach((bi,bIdx)=>{
    const branch = bi.branch;
    const branchOn = isBranchConducting(branch);
    // Branch içi yatay teller (sol rail → ilk eleman → diğer elemanlar → sağ rail)
    if(bi.elems.length===0){
      // Boş branch - sol rail'den sağ rail'e direkt
      drawSegment(svg, leftX, bi.cy, rightX, bi.cy, false);
      return;
    }
    // Sol rail → ilk elemanın sol kenarı
    // İlk elemanın iletken olup olmadığı: bu ilk elemandan önceki tüm elemanlar iletken olmalı (hep iletken çünkü bu branch'in başlangıcı)
    // Daha doğrusu: i. elemanın "öncesi" iletken ise, ona giren tel canlı
    let prefixOn = true; // branch başlangıcı her zaman iletken (sol rail'e bağlı)
    // Tellerin parçalara ayrılması:
    //   - Sol rail → eleman[0].leftX  (active = prefixOn (her zaman true) AND rung'ın "branch'in başı canlı")
    //   - eleman[i].rightX → eleman[i+1].leftX  (active = branch[0..i] hepsi iletken)
    //   - eleman[son].rightX → sağ rail  (active = tüm branch iletken)

    drawSegment(svg, leftX, bi.cy, bi.elems[0].leftX, bi.cy, prefixOn /* her zaman canlı */);

    for(let i=0;i<bi.elems.length-1;i++){
      // i. eleman iletken mi?
      const el_i = branch[i];
      const elActive_i = readAddr(el_i.addr) === (el_i.type==='NO');
      prefixOn = prefixOn && elActive_i;
      drawSegment(svg, bi.elems[i].rightX, bi.cy, bi.elems[i+1].leftX, bi.cy, prefixOn && PLC_STATE.running);
    }

    // Son eleman → sağ rail
    const lastEl = branch[bi.elems.length-1];
    const lastActive = readAddr(lastEl.addr) === (lastEl.type==='NO');
    prefixOn = prefixOn && lastActive;
    drawSegment(svg, bi.elems[bi.elems.length-1].rightX, bi.cy, rightX, bi.cy, prefixOn && PLC_STATE.running);
  });

  // Branch'ler arası dikey birleştirme (sol rail tarafı ve sağ rail tarafı)
  if(branchInfo.length>1){
    const minY = branchInfo[0].cy;
    const maxY = branchInfo[branchInfo.length-1].cy;
    // Sol kenar dikey tel — her zaman canlı (sol rail her zaman gerilimde)
    drawSegment(svg, leftX, minY, leftX, maxY, PLC_STATE.running);
    // Sağ kenar dikey tel — branch'lerden en az biri iletken ise canlı
    const anyBranchOn = branchInfo.some((bi,bIdx)=>isBranchConducting(net.branches[bIdx]));
    drawSegment(svg, rightX, minY, rightX, maxY, anyBranchOn && PLC_STATE.running);
  }
}

function drawSegment(svg, x1, y1, x2, y2, live){
  const ns='http://www.w3.org/2000/svg';
  // Bg (kalın gri) — her zaman görünür
  const bg = document.createElementNS(ns,'line');
  bg.setAttribute('x1',x1);bg.setAttribute('y1',y1);
  bg.setAttribute('x2',x2);bg.setAttribute('y2',y2);
  bg.setAttribute('stroke','#5b6675');
  bg.setAttribute('stroke-width','2.5');
  bg.setAttribute('stroke-linecap','round');
  svg.appendChild(bg);
  if(live){
    // Canlı yeşil + animasyon
    const fg = document.createElementNS(ns,'line');
    fg.setAttribute('x1',x1);fg.setAttribute('y1',y1);
    fg.setAttribute('x2',x2);fg.setAttribute('y2',y2);
    fg.setAttribute('stroke','#27d07a');
    fg.setAttribute('stroke-width','3');
    fg.setAttribute('stroke-linecap','round');
    fg.setAttribute('class','rung-live');
    svg.appendChild(fg);
  }
}

function createElemEl(elData,nIdx,bIdx,eIdx){
  const el=document.createElement('div');
  el.className='elem';
  const active = isElemActive(elData);
  if(active)el.classList.add('active');
  let visual = '';
  switch(elData.type){
    case 'NO': visual='⊣ ⊢'; break;
    case 'NC': visual='⊣/⊢'; break;
    case 'OUT': visual='( )'; break;
    case 'SET': visual='(S)'; break;
    case 'RST': visual='(R)'; break;
    case 'TON': visual='⏱TON'; break;
    case 'TOF': visual='⏱TOF'; break;
    case 'CTU': visual='№CTU'; break;
  }
  el.innerHTML=`
    <button class="elem-del" onclick="event.stopPropagation();delElem(${nIdx},${bIdx},${eIdx})">×</button>
    <div class="elem-vis">${visual}</div>
    <div class="elem-addr">${elData.addr||'?'}</div>
    ${elData.comment?`<div class="elem-comment">${elData.comment}</div>`:''}
    ${(elData.type==='TON'||elData.type==='TOF')?`<div class="elem-comment">${elData.preset||5000}ms</div>`:''}
    ${(elData.type==='CTU')?`<div class="elem-comment">PV=${elData.preset||5}</div>`:''}
  `;
  if(!PLC_STATE.running) el.onclick=()=>editElem(nIdx,bIdx,eIdx);
  return el;
}

function renderNetOut(nIdx){
  const net=PLC_PROGRAM.networks[nIdx];
  const wrap=document.getElementById(`out-${nIdx}`);
  if(!wrap)return;
  wrap.innerHTML='';
  const isEdit = !PLC_STATE.running;
  if(!net.output){
    if(isEdit){
      const ph=document.createElement('button');
      ph.className='net-empty-hint';
      ph.style.minWidth='100px';
      ph.textContent='+ Çıkış';
      ph.onclick=()=>addOutput(nIdx);
      wrap.appendChild(ph);
    }
    return;
  }
  const out=net.output;
  const active = PLC_STATE.running && PLC_STATE.Q[parseInt(out.addr.split('.')[1])||0];
  const el=document.createElement('div');
  el.className='net-out '+(active?'active':'');
  let visual='( )';
  if(out.type==='SET')visual='(S)';
  else if(out.type==='RST')visual='(R)';
  else if(out.type==='TON')visual='⏱TON';
  else if(out.type==='TOF')visual='⏱TOF';
  else if(out.type==='CTU')visual='№CTU';
  // Sil butonu sadece düzenle modunda
  const delBtnHtml = isEdit
    ? `<button class="elem-del" style="display:block" onclick="event.stopPropagation();PLC_PROGRAM.networks[${nIdx}].output=null;renderPLC()">×</button>`
    : '';
  el.innerHTML=`
    ${delBtnHtml}
    <div class="elem-vis">${visual}</div>
    <div class="elem-addr">${out.addr}</div>
    ${out.comment?`<div class="elem-comment">${out.comment}</div>`:''}
    ${(out.type==='TON'||out.type==='TOF')?`<div class="elem-comment">${out.preset||5000}ms</div>`:''}
  `;
  if(isEdit) el.onclick=()=>editOutput(nIdx);
  wrap.appendChild(el);
}

function addElemToBranch(nIdx,bIdx){
  if(!PALETTE_PICK){
    toast('Önce paletten bir eleman seç (NO/NC/OUT/SET/RST/TON...)','bad');
    return;
  }
  // OUT, SET, RST, TON, TOF, CTU çıkıştır — branch'e değil net.output'a eklenir
  const isOutputType = ['OUT','SET','RST','TON','TOF','CTU'].includes(PALETTE_PICK);
  if(isOutputType){
    pickAddress(PALETTE_PICK, (addr,comment,preset)=>{
      PLC_PROGRAM.networks[nIdx].output={type:PALETTE_PICK,addr,comment,preset};
      renderPLC();
      pickPaletteElem(PALETTE_PICK); // toggle off
    });
  } else {
    pickAddress(PALETTE_PICK, (addr,comment)=>{
      PLC_PROGRAM.networks[nIdx].branches[bIdx].push({type:PALETTE_PICK,addr,comment});
      renderPLC();
      pickPaletteElem(PALETTE_PICK);
    });
  }
}

function addOutput(nIdx){
  if(!PALETTE_PICK || !['OUT','SET','RST','TON','TOF','CTU'].includes(PALETTE_PICK)){
    toast('Önce paletten OUT/SET/RST/TON/TOF/CTU seç','bad');
    return;
  }
  pickAddress(PALETTE_PICK, (addr,comment,preset)=>{
    PLC_PROGRAM.networks[nIdx].output={type:PALETTE_PICK,addr,comment,preset};
    renderPLC();
    pickPaletteElem(PALETTE_PICK);
  });
}

function delElem(nIdx,bIdx,eIdx){
  PLC_PROGRAM.networks[nIdx].branches[bIdx].splice(eIdx,1);
  // Boş branch ve birden fazla varsa sil
  if(PLC_PROGRAM.networks[nIdx].branches[bIdx].length===0 && PLC_PROGRAM.networks[nIdx].branches.length>1){
    PLC_PROGRAM.networks[nIdx].branches.splice(bIdx,1);
  }
  renderPLC();
}

function editElem(nIdx,bIdx,eIdx){
  const el=PLC_PROGRAM.networks[nIdx].branches[bIdx][eIdx];
  pickAddress(el.type, (addr,comment)=>{
    el.addr=addr;el.comment=comment;
    renderPLC();
  }, el.addr, el.comment);
}
function editOutput(nIdx){
  const out=PLC_PROGRAM.networks[nIdx].output;
  pickAddress(out.type, (addr,comment,preset)=>{
    out.addr=addr;out.comment=comment;
    if(preset!==undefined)out.preset=preset;
    renderPLC();
  }, out.addr, out.comment, out.preset);
}

/* === Adres seçici === */
function pickAddress(elemType, callback, currentAddr, currentComment, currentPreset){
  ADDR_CALLBACK=callback;
  const modal=document.getElementById('addrModal');
  const tabs=document.getElementById('addrTabs');
  const grid=document.getElementById('addrGrid');
  const timeBox=document.getElementById('addrTimeBox');
  document.getElementById('addrComment').value=currentComment||'';
  document.getElementById('addrTimeVal').value=currentPreset||5000;

  // Hangi adres tipleri uygun?
  let validPrefixes=[];
  if(elemType==='NO'||elemType==='NC'){
    validPrefixes=['I','Q','M','T','C']; // kontak: giriş, çıkış geri besleme, memory, timer done, counter done
  } else if(elemType==='OUT'){
    validPrefixes=['Q','M'];
  } else if(elemType==='SET'||elemType==='RST'){
    validPrefixes=['Q','M'];
  } else if(elemType==='TON'||elemType==='TOF'){
    validPrefixes=['T'];
    timeBox.style.display='block';
  } else if(elemType==='CTU'){
    validPrefixes=['C'];
    timeBox.style.display='block';
  }
  if(elemType!=='TON'&&elemType!=='TOF'&&elemType!=='CTU')timeBox.style.display='none';

  tabs.innerHTML=validPrefixes.map(p=>`<button onclick="renderAddrGrid('${p}',this)">${p}</button>`).join('');
  if(tabs.firstChild)tabs.firstChild.classList.add('active');
  renderAddrGrid(validPrefixes[0]);
  modal.classList.add('show');
}

function renderAddrGrid(prefix, btn){
  const grid=document.getElementById('addrGrid');
  const tabs=document.getElementById('addrTabs');
  if(btn){tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===btn));}
  let addrs=[];
  if(prefix==='I'||prefix==='Q'||prefix==='M'){
    // I0.0–I0.7
    for(let i=0;i<8;i++)addrs.push(`${prefix}0.${i}`);
  } else if(prefix==='T'){
    for(let i=1;i<=8;i++)addrs.push(`T${i}`);
  } else if(prefix==='C'){
    for(let i=1;i<=4;i++)addrs.push(`C${i}`);
  }
  grid.innerHTML=addrs.map(a=>`<button onclick="selectAddr('${a}')">${a}</button>`).join('');
}

function selectAddr(addr){
  document.querySelectorAll('#addrGrid button').forEach(b=>{
    b.style.background=(b.textContent===addr)?'var(--accent)':'';
    b.style.color=(b.textContent===addr)?'#000':'';
  });
  window.__PICK_ADDR=addr;
}

function confirmAddr(){
  const addr=window.__PICK_ADDR;
  if(!addr){toast('Adres seç','bad');return;}
  const comment=document.getElementById('addrComment').value.trim();
  const presetVal=parseInt(document.getElementById('addrTimeVal').value)||5000;
  closeAddr();
  if(ADDR_CALLBACK)ADDR_CALLBACK(addr,comment,presetVal);
  ADDR_CALLBACK=null;
}
function closeAddr(){
  document.getElementById('addrModal').classList.remove('show');
  window.__PICK_ADDR=null;
}

/* === PLC PANELİ (sanal giriş/çıkış) === */
function renderPLCPanel(){
  const inputs=document.getElementById('plcInputs');
  const outputs=document.getElementById('plcOutputs');
  const mems=document.getElementById('plcMems');
  const timers=document.getElementById('plcTimers');
  inputs.innerHTML='';outputs.innerHTML='';mems.innerHTML='';

  for(let i=0;i<8;i++){
    const idiv=document.createElement('div');
    idiv.className='iobit btn-style '+(PLC_STATE.I[i]?'on':'');
    idiv.innerHTML=`<span class="bv">${PLC_STATE.I[i]?'1':'0'}</span>I0.${i}`;
    // Buton gibi davransın: basılı tut → 1, bırak → 0
    const press=(e)=>{e.preventDefault();PLC_STATE.I[i]=true;renderPLCPanel();};
    const release=(e)=>{e.preventDefault();PLC_STATE.I[i]=false;renderPLCPanel();};
    idiv.addEventListener('mousedown',press);
    idiv.addEventListener('mouseup',release);
    idiv.addEventListener('mouseleave',release);
    idiv.addEventListener('touchstart',press,{passive:false});
    idiv.addEventListener('touchend',release,{passive:false});
    // Çift tık: kalıcı aç/kapa (anahtar gibi)
    idiv.addEventListener('dblclick',()=>{PLC_STATE.I[i]=!PLC_STATE.I[i];renderPLCPanel();});
    inputs.appendChild(idiv);

    const odiv=document.createElement('div');
    odiv.className='iobit '+(PLC_STATE.Q[i]?'on':'');
    odiv.innerHTML=`<span class="bv">${PLC_STATE.Q[i]?'1':'0'}</span>Q0.${i}`;
    outputs.appendChild(odiv);

    const mdiv=document.createElement('div');
    mdiv.className='iobit '+(PLC_STATE.M[i]?'on':'');
    mdiv.innerHTML=`<span class="bv">${PLC_STATE.M[i]?'1':'0'}</span>M0.${i}`;
    mems.appendChild(mdiv);
  }

  // Timer & sayaç durumları
  let tStr='';
  Object.keys(PLC_STATE.T).forEach(k=>{
    const t=PLC_STATE.T[k];
    const remain = t.running ? Math.max(0,t.preset-(Date.now()-t.startTime)) : 0;
    tStr+=`<div>T${k}: ${t.done?'<span style="color:var(--live)">●DONE</span>':t.running?`<span style="color:var(--accent)">${(remain/1000).toFixed(1)}s</span>`:'—'}</div>`;
  });
  Object.keys(PLC_STATE.C).forEach(k=>{
    const c=PLC_STATE.C[k];
    tStr+=`<div>C${k}: ${c.value||0}/${c.preset||0} ${c.done?'<span style="color:var(--live)">●DONE</span>':''}</div>`;
  });
  if(!tStr)tStr='— bekliyor —';
  timers.innerHTML=tStr;
}

/* === PLC ÇALIŞMA / SCAN === */
function togglePLC(){
  PLC_STATE.running = !PLC_STATE.running;
  const btn=document.getElementById('plcRunBtn');
  const main=document.querySelector('.plc-main');
  if(PLC_STATE.running){
    btn.textContent='■ Dur';
    btn.classList.remove('ghost');btn.classList.add('danger');
    btn.style.background='var(--danger)';btn.style.color='#fff';
    if(main)main.classList.add('plc-running');
    // PLC durumunu sıfırla
    PLC_STATE.Q=PLC_STATE.Q.map(()=>false);
    PLC_STATE.M=PLC_STATE.M.map(()=>false);
    PLC_STATE.T={};PLC_STATE.C={};
    PLC_TICK_INTERVAL=setInterval(plcScan,100); // 100ms scan cycle
    toast('▶ PLC çalışıyor — girişlere bas','good');
    PALETTE_PICK=null;
    document.querySelectorAll('.pal-btn').forEach(b=>b.classList.remove('active'));
  } else {
    btn.textContent='▶ Çalıştır';
    btn.style.background='';btn.style.color='';
    btn.className='btn sm';
    if(main)main.classList.remove('plc-running');
    clearInterval(PLC_TICK_INTERVAL);PLC_TICK_INTERVAL=null;
    PLC_STATE.Q=PLC_STATE.Q.map(()=>false);
    PLC_STATE.M=PLC_STATE.M.map(()=>false);
    PLC_STATE.T={};PLC_STATE.C={};
    toast('■ PLC durdu — düzenleyebilirsin','good');
    document.querySelectorAll('.plc-edit-only').forEach(e=>e.classList.remove('hidden'));
  }
  renderPLC();renderPLCPanel();
}

function readAddr(addr){
  if(!addr)return false;
  const m=addr.match(/^([IQMTC])(\d+)\.?(\d+)?$/);
  if(!m)return false;
  const p=m[1], i=parseInt(m[2]||0), b=parseInt(m[3]||0);
  if(p==='I')return !!PLC_STATE.I[b];
  if(p==='Q')return !!PLC_STATE.Q[b];
  if(p==='M')return !!PLC_STATE.M[b];
  if(p==='T'){const tNum=parseInt(addr.slice(1));return PLC_STATE.T[tNum]?.done===true;}
  if(p==='C'){const cNum=parseInt(addr.slice(1));return PLC_STATE.C[cNum]?.done===true;}
  return false;
}

function writeAddr(addr, value){
  const m=addr.match(/^([QM])(\d+)\.?(\d+)?$/);
  if(!m)return;
  const p=m[1], b=parseInt(m[3]||0);
  if(p==='Q')PLC_STATE.Q[b]=value;
  if(p==='M')PLC_STATE.M[b]=value;
}

function evalBranch(branch){
  // AND mantığı: hepsi true ise true
  if(branch.length===0)return false;
  return branch.every(el=>{
    const v=readAddr(el.addr);
    return el.type==='NO' ? v : !v;
  });
}

function evalNetwork(net){
  // OR mantığı: en az bir branch true ise true
  return net.branches.some(b=>evalBranch(b));
}

function plcScan(){
  // Önce eski timer/counter durumlarını koru, değişiklik tetikleyici (rising edge) için
  const prevQ=[...PLC_STATE.Q], prevM=[...PLC_STATE.M];

  PLC_PROGRAM.networks.forEach(net=>{
    if(!net.output)return;
    const rung = evalNetwork(net);
    const out=net.output;

    if(out.type==='OUT'){
      writeAddr(out.addr, rung);
    } else if(out.type==='SET'){
      if(rung)writeAddr(out.addr, true);
    } else if(out.type==='RST'){
      if(rung)writeAddr(out.addr, false);
    } else if(out.type==='TON'){
      const tNum=parseInt(out.addr.slice(1));
      if(!PLC_STATE.T[tNum])PLC_STATE.T[tNum]={running:false,done:false,preset:out.preset||5000};
      const t=PLC_STATE.T[tNum];
      if(rung){
        if(!t.running){t.running=true;t.startTime=Date.now();t.done=false;}
        if(Date.now()-t.startTime >= t.preset){t.done=true;}
      } else {
        t.running=false;t.done=false;
      }
    } else if(out.type==='TOF'){
      const tNum=parseInt(out.addr.slice(1));
      if(!PLC_STATE.T[tNum])PLC_STATE.T[tNum]={running:false,done:false,preset:out.preset||5000,trigger:false};
      const t=PLC_STATE.T[tNum];
      if(rung){
        // TOF: rung true → çıkış hemen 1, gecikmesiz
        t.done=true;t.running=false;t.trigger=true;
      } else if(t.trigger){
        // Düşen kenar → süre başlasın
        if(!t.running){t.running=true;t.startTime=Date.now();}
        if(Date.now()-t.startTime >= t.preset){t.done=false;t.running=false;t.trigger=false;}
      }
    } else if(out.type==='CTU'){
      const cNum=parseInt(out.addr.slice(1));
      if(!PLC_STATE.C[cNum])PLC_STATE.C[cNum]={value:0,done:false,preset:out.preset||5,lastRung:false};
      const c=PLC_STATE.C[cNum];
      // Rising edge sayar
      if(rung && !c.lastRung){c.value++;}
      c.lastRung=rung;
      c.done = c.value>=c.preset;
    }
  });

  // Görsel güncelle
  if(prevQ.join(',')!==PLC_STATE.Q.join(',') || prevM.join(',')!==PLC_STATE.M.join(',')) {
    // Sadece değişti ise re-render (performans)
  }
  renderPLCPanel();
  // Network'lerin aktif durumlarını ekranda güncelle
  document.querySelectorAll('.net').forEach((el,i)=>{
    const rung=evalNetwork(PLC_PROGRAM.networks[i]);
    el.classList.toggle('active',rung);
  });
  // Elemanları aktif/değil olarak güncelle
  document.querySelectorAll('.elem').forEach(el=>{
    // re-render etmek pahalı, sadece sınıf güncelle
  });
  // Pratik: render tekrar et (her 100ms — kabul edilebilir)
  // Ama tüm render pahalı; sadece active sınıfları güncelle
  updateElemActiveStates();
}

function isElemActive(elData){
  if(!PLC_STATE.running)return false;
  if(elData.type==='NO')return readAddr(elData.addr);
  if(elData.type==='NC')return !readAddr(elData.addr);
  return false;
}

function updateElemActiveStates(){
  // Performans: DOM'ı yeniden inşa etme; sadece aktif sınıfları güncelle + SVG yeniden çiz
  if(!PLC_STATE.running)return;
  PLC_PROGRAM.networks.forEach((net,nIdx)=>{
    // Network aktif mi?
    const netEl = document.querySelectorAll('.net')[nIdx];
    if(netEl){
      const rungActive = evalNetwork(net);
      netEl.classList.toggle('active', rungActive);
    }
    // Eleman aktif durumları
    net.branches.forEach((br, bIdx)=>{
      br.forEach((elData, eIdx)=>{
        // DOM'daki eleman bul
        const wrap = document.getElementById('elems-'+nIdx);
        if(!wrap)return;
        const branchRow = wrap.querySelectorAll('.branch-row')[bIdx];
        if(!branchRow)return;
        const elDom = branchRow.querySelectorAll('.elem')[eIdx];
        if(elDom){
          elDom.classList.toggle('active', isElemActive(elData));
        }
      });
    });
    // Çıkış aktif?
    const outWrap = document.getElementById('out-'+nIdx);
    if(outWrap && net.output){
      const outEl = outWrap.querySelector('.net-out');
      if(outEl){
        // Çıkış aktivasyonu
        let active=false;
        if(net.output.type==='OUT'||net.output.type==='SET'||net.output.type==='RST'){
          const m=net.output.addr.match(/^([QM])(\d+)\.?(\d+)?$/);
          if(m){
            const p=m[1], b=parseInt(m[3]||0);
            if(p==='Q')active=PLC_STATE.Q[b];
            else if(p==='M')active=PLC_STATE.M[b];
          }
        } else if(net.output.type==='TON'||net.output.type==='TOF'){
          const tNum=parseInt(net.output.addr.slice(1));
          active = PLC_STATE.T[tNum]?.done;
        } else if(net.output.type==='CTU'){
          const cNum=parseInt(net.output.addr.slice(1));
          active = PLC_STATE.C[cNum]?.done;
        }
        outEl.classList.toggle('active', active);
      }
    }
    // SVG rung tellerini yenile
    const wrap = document.getElementById('elems-'+nIdx);
    const bWrap = wrap?.querySelector('.branches');
    if(wrap && bWrap){
      drawRungLines(nIdx, wrap, bWrap, net);
    }
  });
}

/* === HAZIR ÖRNEK PROGRAMLAR === */
const PLC_EXAMPLES = {
  empty: { networks: [{id:'n1',branches:[[]],output:null}] },

  lamp: {
    networks: [
      { id:'n1', comment:'Anlık Lamba — Buton basılı iken Q0.0 yanar',
        branches:[[{type:'NO',addr:'I0.0',comment:'Start'}]],
        output:{type:'OUT',addr:'Q0.0',comment:'Lamba'} }
    ]
  },

  seal: {
    networks: [
      { id:'n1', comment:'Mühürleme — Q0.0 kendi NO kontağıyla devam eder',
        branches:[
          [{type:'NO',addr:'I0.0',comment:'Start'}],
          [{type:'NO',addr:'Q0.0',comment:'Mühür'}]
        ],
        output:{type:'OUT',addr:'Q0.0',comment:'Motor'} }
    ]
  },

  seal_stop: {
    networks: [
      { id:'n1', comment:'Start-Stop-Mühürleme: (Start ∥ Q0.0) AND NOT Stop',
        branches:[
          [{type:'NO',addr:'I0.0',comment:'Start'},{type:'NC',addr:'I0.1',comment:'Stop'}],
          [{type:'NO',addr:'Q0.0',comment:'Mühür'},{type:'NC',addr:'I0.1',comment:'Stop'}]
        ],
        output:{type:'OUT',addr:'Q0.0',comment:'Motor'} }
    ]
  },

  setreset: {
    networks: [
      { id:'n1', comment:'Set: I0.0 basınca Q0.0 kalıcı 1',
        branches:[[{type:'NO',addr:'I0.0',comment:'Set Start'}]],
        output:{type:'SET',addr:'Q0.0',comment:'Motor SET'} },
      { id:'n2', comment:'Reset: I0.1 basınca Q0.0 kalıcı 0',
        branches:[[{type:'NO',addr:'I0.1',comment:'Reset Stop'}]],
        output:{type:'RST',addr:'Q0.0',comment:'Motor RST'} }
    ]
  },

  ton: {
    networks: [
      { id:'n1', comment:'TON: I0.0 5 saniye basılı kalırsa T1 done olur',
        branches:[[{type:'NO',addr:'I0.0',comment:'Tetik'}]],
        output:{type:'TON',addr:'T1',preset:5000,comment:'5sn Gecikme'} },
      { id:'n2', comment:'T1 done olunca lamba yanar',
        branches:[[{type:'NO',addr:'T1',comment:'T1 done'}]],
        output:{type:'OUT',addr:'Q0.0',comment:'Lamba'} }
    ]
  },

  tof: {
    networks: [
      { id:'n1', comment:'TOF: I0.0 bırakıldıktan 5sn sonra T1 söner',
        branches:[[{type:'NO',addr:'I0.0',comment:'Tetik'}]],
        output:{type:'TOF',addr:'T1',preset:5000,comment:'5sn Off-Delay'} },
      { id:'n2', comment:'T1 aktifken Q0.0 yanar',
        branches:[[{type:'NO',addr:'T1',comment:'T1 done'}]],
        output:{type:'OUT',addr:'Q0.0',comment:'Lamba'} }
    ]
  },

  blink: {
    networks: [
      { id:'n1', comment:'I0.0 basılıyken T1-T2 birbirini tetikler',
        branches:[[{type:'NO',addr:'I0.0',comment:'Run'},{type:'NC',addr:'T1',comment:'T1 NC'}]],
        output:{type:'TON',addr:'T2',preset:500,comment:'0.5sn'} },
      { id:'n2', comment:'T2 done olunca T1 başlar',
        branches:[[{type:'NO',addr:'I0.0',comment:'Run'},{type:'NO',addr:'T2',comment:'T2 done'}]],
        output:{type:'TON',addr:'T1',preset:500,comment:'0.5sn'} },
      { id:'n3', comment:'T1 done iken Q0.0 yanar (kare dalga)',
        branches:[[{type:'NO',addr:'I0.0',comment:'Run'},{type:'NC',addr:'T1',comment:'T1 NC'}]],
        output:{type:'OUT',addr:'Q0.0',comment:'Lamba'} }
    ]
  },

  forwardrev: {
    networks: [
      { id:'n1', comment:'İLERİ: (S1 ∥ Q0.0) AND NOT S2 AND NOT Q0.1',
        branches:[
          [{type:'NO',addr:'I0.0',comment:'İleri'},{type:'NC',addr:'I0.2',comment:'Stop'},{type:'NC',addr:'Q0.1',comment:'Kilit'}],
          [{type:'NO',addr:'Q0.0',comment:'Mühür'},{type:'NC',addr:'I0.2',comment:'Stop'},{type:'NC',addr:'Q0.1',comment:'Kilit'}]
        ],
        output:{type:'OUT',addr:'Q0.0',comment:'K1 İleri'} },
      { id:'n2', comment:'GERİ: (S3 ∥ Q0.1) AND NOT S2 AND NOT Q0.0',
        branches:[
          [{type:'NO',addr:'I0.1',comment:'Geri'},{type:'NC',addr:'I0.2',comment:'Stop'},{type:'NC',addr:'Q0.0',comment:'Kilit'}],
          [{type:'NO',addr:'Q0.1',comment:'Mühür'},{type:'NC',addr:'I0.2',comment:'Stop'},{type:'NC',addr:'Q0.0',comment:'Kilit'}]
        ],
        output:{type:'OUT',addr:'Q0.1',comment:'K2 Geri'} }
    ]
  },

  stardelta: {
    networks: [
      { id:'n1', comment:'K1 ana — Start ile çeker, mühürler',
        branches:[
          [{type:'NO',addr:'I0.0',comment:'Start'},{type:'NC',addr:'I0.1',comment:'Stop'}],
          [{type:'NO',addr:'Q0.0',comment:'Mühür'},{type:'NC',addr:'I0.1',comment:'Stop'}]
        ],
        output:{type:'OUT',addr:'Q0.0',comment:'K1 Ana'} },
      { id:'n2', comment:'K1 aktifken T1 5sn sayar',
        branches:[[{type:'NO',addr:'Q0.0',comment:'K1 aktif'}]],
        output:{type:'TON',addr:'T1',preset:5000,comment:'Y/Δ geçiş'} },
      { id:'n3', comment:'K2 Yıldız: K1 aktif + T1 done değil + K3 değil',
        branches:[[{type:'NO',addr:'Q0.0',comment:'K1'},{type:'NC',addr:'T1',comment:'<5sn'},{type:'NC',addr:'Q0.2',comment:'K3 kilit'}]],
        output:{type:'OUT',addr:'Q0.1',comment:'K2 Yıldız'} },
      { id:'n4', comment:'K3 Üçgen: K1 aktif + T1 done + K2 değil',
        branches:[[{type:'NO',addr:'Q0.0',comment:'K1'},{type:'NO',addr:'T1',comment:'T1 done'},{type:'NC',addr:'Q0.1',comment:'K2 kilit'}]],
        output:{type:'OUT',addr:'Q0.2',comment:'K3 Üçgen'} }
    ]
  },

  counter: {
    networks: [
      { id:'n1', comment:'I0.0 her basıldığında C1 sayar',
        branches:[[{type:'NO',addr:'I0.0',comment:'Tetik'}]],
        output:{type:'CTU',addr:'C1',preset:5,comment:'5 darbe'} },
      { id:'n2', comment:'C1 5\'e ulaşınca Q0.0 yanar',
        branches:[[{type:'NO',addr:'C1',comment:'C1 done'}]],
        output:{type:'OUT',addr:'Q0.0',comment:'Sonuç'} },
      { id:'n3', comment:'I0.1 ile sayacı sıfırla',
        branches:[[{type:'NO',addr:'I0.1',comment:'Reset'}]],
        output:{type:'RST',addr:'C1',comment:'Sıfırla'} }
    ]
  }
};

function loadPLCExample(key){
  if(!key)return;
  if(PLC_STATE.running)togglePLC();
  PLC_PROGRAM = JSON.parse(JSON.stringify(PLC_EXAMPLES[key]));
  // sayaç reset için CTU desteği ekle (basitleştirilmiş)
  // Network'lere id ata
  PLC_PROGRAM.networks.forEach((n,i)=>n.id='n'+(i+1));
  renderPLC();
  toast(`Örnek yüklendi: ${key}`,'good');
  document.getElementById('plcExamples').value='';
  // Stat tracking (PROFILE varsa)
  if(typeof PROFILE!=='undefined' && key!=='empty'){
    PROFILE.stats.plcExamplesRun = (PROFILE.stats.plcExamplesRun||0)+1;
    saveProfile(PROFILE);
    checkBadges();
  }
}