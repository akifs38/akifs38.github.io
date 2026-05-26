/* =================================================================
   TEZGÂH — Görevler, simülasyon, tel çizimi, kontrol, sahne
   ================================================================= */

function renderTasks(){
  const cats=[...new Set(TASKS.map(t=>t.cat))];
  const root=document.getElementById('taskList');
  root.innerHTML='';
  cats.forEach(cat=>{
    const h=document.createElement('div');h.className='cat';h.textContent=cat;
    root.appendChild(h);
    const g=document.createElement('div');g.className='grid';
    TASKS.filter(t=>t.cat===cat).forEach(t=>{
      const done=completed.includes(t.id);
      // Level'a göre XP
      let xpAmount = 25;
      const lvlMatch = (t.level||'').match(/L(\d+)/);
      if(lvlMatch){
        const ln = parseInt(lvlMatch[1]);
        xpAmount = ln<=1 ? 25 : ln===2 ? 50 : ln===3 ? 75 : 100;
      }
      const d=document.createElement('div');d.className='tcard';
      const lvNum = (t.level||'').match(/L(\d)/);
      if(lvNum) d.setAttribute('data-level','L'+lvNum[1]);
      if(done) d.classList.add('done-card');
      d.onclick=()=>openTask(t.id);
      d.innerHTML=`${done?'<span class="done-tag">TAMAM</span>':''}
        <div class="lvl">${t.level}</div><h3>${t.title}</h3><p>${t.desc}</p>
        <div class="meta"><span class="pill">${t.components.length} eleman</span>
        <span class="pill">${t.solution.length} bağlantı</span></div>
        <span class="xp-tag">${done?'✓ ':'+'}${xpAmount} XP</span>`;
      g.appendChild(d);
    });
    root.appendChild(g);
  });
  // Yeni kullanıcı yönlendirmesi
  if(!completed.length) {
    const firstCard = root.querySelector('.tcard');
    if(firstCard) {
      const banner = document.createElement('div');
      banner.id = 'startBanner';
      banner.className = 'start-banner';
      banner.innerHTML = `<span>👋 İlk görevine başla — dokunmana yeter!</span>
        <button class="btn sm" onclick="document.querySelector('.tcard').click()">Başla →</button>`;
      root.insertBefore(banner, root.firstChild);
      firstCard.classList.add('first-task-pulse');
    }
  } else {
    const b = document.getElementById('startBanner');
    if(b) b.remove();
  }
}

/* =================================================================
   ELEMAN KÜTÜPHANESİ SAYFASI
   ================================================================= */
function renderLibrary(){
  const root=document.getElementById('libList');
  root.innerHTML='<div class="cat">Eleman Kütüphanesi</div><div class="grid" id="libGrid"></div>';
  const g=document.getElementById('libGrid');
  LIBRARY.forEach(item=>{
    const info=INFO[item.sym]||{title:item.name,desc:'Bilgi mevcut değil.'};
    const d=document.createElement('div');d.className='tcard';
    d.onclick=()=>showInfo(item.sym);
    d.innerHTML=`<div class="lvl">${item.code||''}</div>
      <div style="display:flex;align-items:center;gap:14px;margin:10px 0">
        <div style="width:60px;height:60px;background:#0a0d12;border-radius:6px;padding:6px;flex:none">
          ${SYM[item.sym]||''}
        </div>
        <h3 style="margin:0">${item.name}</h3>
      </div>
      <p>${(info.desc||'').slice(0,90)}…</p>
      <div class="meta"><span class="pill">Detay için tıkla →</span></div>`;
    g.appendChild(d);
  });
}

/* =================================================================
   BİLGİ MODAL
   ================================================================= */
function showInfo(infoKey){
  const i=INFO[infoKey];
  if(!i){toast('Bu eleman için bilgi kartı henüz hazırlanmadı','bad');return;}
  document.getElementById('infoTitle').textContent=i.title;
  const body=document.getElementById('infoBody');
  body.innerHTML=`
    <div class="sym-big">${SYM[infoKey]||''}</div>
    <div class="info-section">
      <h4>Tanım</h4>
      <p>${i.desc}</p>
    </div>
    <div class="info-section">
      <h4>Kullanım</h4>
      <p>${i.use||'—'}</p>
    </div>
    ${i.term ? `<div class="info-section">
      <h4>Terminal / Uç Kodları (EN 50005)</h4>
      <div class="info-grid">
        ${i.term.map(t=>`<div class="ig"><div class="k">${t[0]}</div><div class="v">${t[1]}</div></div>`).join('')}
      </div>
    </div>` : ''}
    ${i.std ? `<div class="info-section">
      <h4>Standart</h4>
      <p style="font-size:12px;color:var(--muted)"><code>${i.std}</code></p>
    </div>` : ''}
  `;
  document.getElementById('infoModal').classList.add('show');
}
function closeInfo(){document.getElementById('infoModal').classList.remove('show');}

/* =================================================================
   TEZGÂH AÇMA
   ================================================================= */
function openTask(id){
  CUR={...TASKS.find(t=>t.id===id)};
  // derin kopya
  CUR.components=JSON.parse(JSON.stringify(CUR.components));
  CUR.solution=JSON.parse(JSON.stringify(CUR.solution));
  if(CUR.powerComponents)CUR.powerComponents=JSON.parse(JSON.stringify(CUR.powerComponents));
  if(CUR.powerSolution)CUR.powerSolution=JSON.parse(JSON.stringify(CUR.powerSolution));
  WIRES=[];POWER_WIRES=[];pending=null;POWER_PENDING=null;SIM_STATE={};SANDBOX_MODE=false;
  document.getElementById('benchTab').style.display='block';
  document.getElementById('benchTitle').textContent=CUR.title;
  document.getElementById('benchTitleDesk').textContent=CUR.title;
  document.getElementById('objText').innerHTML=CUR.objective;
  document.getElementById('hintText').innerHTML='<b>💡 İPUCU:</b> '+CUR.hint;
  document.getElementById('scoreNum').textContent='—';
  const totalSol=(CUR.solution?.length||0)+(CUR.powerSolution?.length||0);
  document.getElementById('scoreOf').textContent='/ '+totalSol;
  document.getElementById('liveErr').innerHTML='';
  document.getElementById('libBar').classList.add('hidden');
  document.getElementById('sandboxBanner').classList.add('hidden');
  document.getElementById('checkBtn').classList.remove('hidden');
  // 3 faz güç sahnesi göster/gizle
  document.getElementById('powerStage').classList.toggle('show', !!CUR.hasPower);
  buildSimBar();
  buildStage();
  if(CUR.hasPower)buildPowerStage();
  switchTab('bench');setTimeout(fitStage,30);
}

/* =================================================================
   SERBEST MOD (Sandbox)
   ================================================================= */
function openSandbox(){
  CUR={
    id:'sandbox', title:'Serbest Mod', sandbox:true,
    objective:'<b>Serbest Mod:</b> Aşağıdaki kütüphaneden istediğin elemanı ekle, başlığa çift tıklayıp ismini değiştir, butonlara basıp devreyi test et.',
    hint:'Bilgi kartını açmak için elemanın sembolüne tıkla. Bir tel oluşturmak için iki ucu sırayla seç. Teli silmek için telin üstüne tıkla.',
    components:[], solution:[]
  };
  WIRES=[];POWER_WIRES=[];pending=null;POWER_PENDING=null;SIM_STATE={};SANDBOX_MODE=true;SANDBOX_COUNTER=0;
  document.getElementById('benchTab').style.display='block';
  document.getElementById('benchTitle').textContent='Serbest Mod';
  document.getElementById('benchTitleDesk').textContent='Serbest Mod';
  document.getElementById('objText').innerHTML=CUR.objective;
  document.getElementById('hintText').innerHTML='<b>💡 İPUCU:</b> '+CUR.hint;
  document.getElementById('scoreNum').textContent='—';
  document.getElementById('scoreOf').textContent='';
  document.getElementById('liveErr').innerHTML='';
  document.getElementById('libBar').classList.remove('hidden');
  document.getElementById('sandboxBanner').classList.remove('hidden');
  document.getElementById('checkBtn').classList.add('hidden');
  document.getElementById('powerStage').classList.remove('show');
  // Kaydet/Yükle butonları
  const savedBar = document.getElementById('circuitSaveBar');
  if (savedBar) {
    savedBar.classList.remove('hidden');
    document.getElementById('loadCircuitBtn').style.display = hasSavedCircuit() ? '' : 'none';
  }
  buildLibraryBar();
  buildSimBar();
  buildStage();switchTab('bench');setTimeout(fitStage,30);
}

/* ─── DEVRESİ KAYDET/YÜKLE ─────────────────────────────────────────────── */
const CIRCUIT_KEY = 'eg_saved_circuit_v1';

function saveCircuit() {
  if (!CUR) return;
  const data = {
    components: CUR.components,
    wires: WIRES,
    ts: new Date().toLocaleString('tr-TR')
  };
  localStorage.setItem(CIRCUIT_KEY, JSON.stringify(data));
  toast('💾 Devre kaydedildi', 'good');
}

function loadCircuit() {
  const raw = localStorage.getItem(CIRCUIT_KEY);
  if (!raw) { toast('Kayıtlı devre yok', 'bad'); return; }
  const data = JSON.parse(raw);
  if (!CUR) openSandbox();
  CUR.components = data.components;
  WIRES = data.wires;
  SANDBOX_COUNTER = Math.max(...data.components.map(c => parseInt(c.id.replace('sb','')) || 0), 0);
  buildStage();
  toast(`📂 Yüklendi (${data.ts})`, 'good');
}

function hasSavedCircuit() {
  return !!localStorage.getItem(CIRCUIT_KEY);
}

function buildLibraryBar(){
  const bar=document.getElementById('libBar');
  bar.innerHTML='<span style="font-size:10px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;padding:0 10px;align-self:center">Ekle →</span>';
  LIBRARY.forEach(item=>{
    const d=document.createElement('div');d.className='lib-item';
    d.title=item.name;
    d.innerHTML=`${SYM[item.sym]||''}<div class="lname">${item.name}</div>`;
    d.onclick=()=>addSandboxComponent(item);
    bar.appendChild(d);
  });
}

function addSandboxComponent(template){
  SANDBOX_COUNTER++;
  const uid='sb'+SANDBOX_COUNTER;
  const compId=uid;
  const comp={
    id:compId,
    name:template.name,
    code:template.code?template.code.replace('?',SANDBOX_COUNTER):'',
    sym:template.sym,
    info:template.sym,
    power:template.power||false,
    interactive:template.interactive,
    timerDelay:template.timerDelay,
    x:100+(SANDBOX_COUNTER%5)*180,
    y:100+Math.floor(SANDBOX_COUNTER/5)*140,
    t:template.terms.map((t,i)=>({id:compId+'_t'+i, label:t.label, side:t.side}))
  };
  CUR.components.push(comp);
  buildStage();
  toast(`${comp.name} eklendi`, 'good');
  // Stat tracking
  if(typeof PROFILE!=='undefined' && CUR.sandbox){
    PROFILE.stats.sandboxBuilt = (PROFILE.stats.sandboxBuilt||0)+1;
    if(PROFILE.stats.sandboxBuilt===1){
      // İlk sandbox eklemesi - rozet
      saveProfile(PROFILE);
      checkBadges();
    } else {
      saveProfile(PROFILE);
    }
  }
}

/* =================================================================
   SAHNE OLUŞTURMA
   ================================================================= */
function buildSimBar(){
  const bar=document.getElementById('simBar');
  bar.innerHTML=`
    <span class="lbl">Durum:</span>
    <span class="indicator" id="indPower" onclick="energize()" style="cursor:pointer" title="Enerjiyi aç/kapat">⚡ Enerji</span>
    <span class="indicator" id="indCoils">Bobin</span>
    <span class="indicator" id="indLamps">Lamba</span>
    <span class="indicator" id="indFault">Arıza</span>
  `;
  updateIndicators();
}

function updateIndicators(){
  const p=document.getElementById('indPower');
  const c=document.getElementById('indCoils');
  const l=document.getElementById('indLamps');
  const f=document.getElementById('indFault');
  if(!p)return;
  const activeCoils=CUR.components.filter(x=>(x.sym==='coil'||x.sym==='timer')&&SIM_STATE[x.id]?.energized).length;
  const activeLamps=CUR.components.filter(x=>x.sym.startsWith('lamp')&&SIM_STATE[x.id]?.energized).length;
  const faulted=CUR.components.filter(x=>SIM_STATE[x.id]?.fault).length;
  p.className='indicator '+(SIM_STATE._energized?'on':'');
  p.textContent='⚡ '+(SIM_STATE._energized?'AKTIF':'KAPALI');
  c.className='indicator '+(activeCoils?'on':'');
  c.textContent='Bobin '+activeCoils;
  l.className='indicator '+(activeLamps?'on':'');
  l.textContent='Lamba '+activeLamps;
  f.className='indicator '+(faulted?'fault':'');
  f.textContent=faulted?'⚠ ARIZA':'OK';
}

function buildStage(){
  const inner=document.getElementById('stageInner');
  [...inner.querySelectorAll('.node')].forEach(n=>n.remove());
  CUR.components.forEach(c=>{
    const n=document.createElement('div');
    n.className='node'+(c.power?' power':'');
    if(c.interactive)n.classList.add('interactive');
    n.style.left=c.x+'px';n.style.top=c.y+'px';n.dataset.id=c.id;
    const codeStr=c.code?`<div class="ntag"><span>${c.code}</span>${c.info?`<span class="info-btn" onclick="event.stopPropagation();showInfo('${c.info}')">i</span>`:''}</div>`:'';
    n.innerHTML=`<div class="nhead" ondblclick="startNameEdit('${c.id}',event)">${c.name}</div>
      ${codeStr}
      <div class="nbody">
        <div class="nsym" data-symclick="1">${SYM[c.sym]||''}</div>
        ${c.t.map(tm=>`<div class="term ${tm.side==='r'?'right':''}" data-term="${tm.id}">
          <span class="dot"></span><span>${tm.label}</span></div>`).join('')}
        ${SANDBOX_MODE?`<button onclick="removeComponent('${c.id}')" style="background:transparent;border:1px solid var(--danger);color:var(--danger);font-size:9px;padding:3px;border-radius:4px;margin-top:4px;cursor:pointer">SİL</button>`:''}
      </div>`;
    inner.appendChild(n);
    bindNode(n,c);
  });
  drawWires();updateSteps();
  // Görev tellerini doğru sırada görelim
}

function removeComponent(cid){
  CUR.components=CUR.components.filter(c=>c.id!==cid);
  WIRES=WIRES.filter(w=>{
    const a=w.a.split('_t')[0], b=w.b.split('_t')[0];
    // _t içermeyenler için: ilk altçizgiye kadar al
    const cidA=findCompIdForTerm(w.a);
    const cidB=findCompIdForTerm(w.b);
    return cidA!==cid && cidB!==cid;
  });
  buildStage();
}
function findCompIdForTerm(tid){
  for(const c of CUR.components)
    for(const t of c.t)
      if(t.id===tid)return c.id;
  return null;
}

function bindNode(n,c){
  // Terminal seçme
  n.querySelectorAll('.term').forEach(tEl=>{
    if(IS_TOUCH){
      let touched=false;
      tEl.addEventListener('touchstart',()=>{touched=true;},{passive:true});
      tEl.addEventListener('touchend',e=>{
        if(!touched)return;touched=false;
        e.preventDefault();e.stopPropagation();
        pickTerm(tEl.dataset.term);
      },{passive:false});
    } else {
      tEl.addEventListener('click',e=>{e.stopPropagation();pickTerm(tEl.dataset.term);});
    }
  });

  // Sembolün üstüne tıklayınca interaktif eleman tetikle / bilgi kartı aç
  const sym=n.querySelector('.nsym');
  if(sym){
    const handler=(e)=>{
      e.stopPropagation();
      if(c.interactive){
        // İnteraktif elemansa basıldı/bırakıldı mantığı
        triggerInteractive(c.id, c.interactive);
      } else if(c.info){
        // Sadece bilgi göster
        showInfo(c.info);
      }
    };
    if(c.interactive==='button'){
      // Buton: basılı tutma simülasyonu
      const press=(e)=>{e.preventDefault();e.stopPropagation();setButtonState(c.id,true);};
      const release=(e)=>{e.preventDefault();e.stopPropagation();setButtonState(c.id,false);};
      if(IS_TOUCH){
        sym.addEventListener('touchstart',press,{passive:false});
        sym.addEventListener('touchend',release,{passive:false});
        sym.addEventListener('touchcancel',release,{passive:false});
      } else {
        sym.addEventListener('mousedown',press);
        sym.addEventListener('mouseup',release);
        sym.addEventListener('mouseleave',release);
      }
      // Sağ tık → bilgi (PC) / uzun bas (mobil)
      sym.addEventListener('contextmenu',e=>{e.preventDefault();if(c.info)showInfo(c.info);});
    } else {
      // Diğer interaktif/normal — tek tıkla bilgi veya durum değiştirme
      sym.addEventListener('click',handler);
    }
  }

  // Sürükleme (head)
  const head=n.querySelector('.nhead');
  let drag=false,sx,sy,ox,oy;
  const start=(x,y)=>{drag=true;sx=x;sy=y;
    ox=parseInt(n.style.left);oy=parseInt(n.style.top);head.style.cursor='grabbing';};
  const move=(x,y)=>{if(!drag)return;
    n.style.left=Math.max(0,Math.min(950,ox+(x-sx)/scale))+'px';
    n.style.top=Math.max(0,Math.min(620,oy+(y-sy)/scale))+'px';
    // veriyi güncelle
    c.x=parseInt(n.style.left); c.y=parseInt(n.style.top);
    drawWires();};
  const end=()=>{drag=false;head.style.cursor='grab';};
  if(IS_TOUCH){
    head.addEventListener('touchstart',e=>{e.stopPropagation();
      start(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
    head.addEventListener('touchmove',e=>{e.preventDefault();e.stopPropagation();
      move(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
    head.addEventListener('touchend',end);
  } else {
    head.addEventListener('mousedown',e=>{e.preventDefault();start(e.clientX,e.clientY);});
    window.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
    window.addEventListener('mouseup',end);
  }
}

/* =================================================================
   İNTERAKTİF ELEMENT MANTIĞI
   ================================================================= */
function setButtonState(cid, pressed){
  if(!SIM_STATE[cid])SIM_STATE[cid]={};
  SIM_STATE[cid].pressed=pressed;
  const node=document.querySelector(`[data-id="${cid}"]`);
  if(node)node.classList.toggle('pressed',pressed);
  runSimulation();
}

function triggerInteractive(cid, kind){
  if(!SIM_STATE[cid])SIM_STATE[cid]={};
  if(kind==='switch'){
    SIM_STATE[cid].on=!SIM_STATE[cid].on;
    const node=document.querySelector(`[data-id="${cid}"]`);
    if(node)node.classList.toggle('pressed',SIM_STATE[cid].on);
  } else if(kind==='sensor'){
    SIM_STATE[cid].detected=!SIM_STATE[cid].detected;
    const node=document.querySelector(`[data-id="${cid}"]`);
    if(node)node.classList.toggle('pressed',SIM_STATE[cid].detected);
    toast(SIM_STATE[cid].detected?'🔵 Sensör algıladı':'⚫ Sensör boş','good');
  } else if(kind==='thermal'){
    SIM_STATE[cid].tripped=!SIM_STATE[cid].tripped;
    const node=document.querySelector(`[data-id="${cid}"]`);
    if(node)node.classList.toggle('faulted',SIM_STATE[cid].tripped);
    toast(SIM_STATE[cid].tripped?'⚠️ TERMİK ATTI':'✓ Termik sıfırlandı',SIM_STATE[cid].tripped?'bad':'good');
  }
  runSimulation();
}

/* =================================================================
   SİMÜLASYON ÇÖZÜMLEYİCİ
   Devre bağlantı grafiğinde her kontak için "iletken mi?" kararı ver,
   sonra L+ uçtan başlayarak BFS ile akan akımı bul.
   ================================================================= */
function runSimulation(){
  if(!SIM_STATE._energized){
    clearLiveStates();
    drawWires();
    updateIndicators();
    return;
  }

  // 1. Kontak durumlarını hesapla
  const contactState={}; // termId pairs → conducting?
  // Geçişler: bir komponentin uçları arasında "geçer mi" sorusu
  const passes = {}; // map: cid -> function(tIdA,tIdB) => bool
  CUR.components.forEach(c=>{
    const s=SIM_STATE[c.id]||{};
    if(c.sym==='source24'){
      // İçeride L+ ile 0V ayrı uçlar, geçiş yok. (Toplam devre kapanır)
    } else if(c.sym==='fuse'||c.sym==='mcb'||c.sym==='switch2'){
      // anahtarsa pozisyona göre, yoksa direkt geçer
      if(c.sym==='switch2'){
        passes[c.id]=(a,b)=>s.on===true;
      } else {
        passes[c.id]=(a,b)=>true; // sigorta hep kapalı (atmıyor)
      }
    } else if(c.sym==='buttonNO'){
      passes[c.id]=(a,b)=>s.pressed===true;
    } else if(c.sym==='buttonNC'){
      passes[c.id]=(a,b)=>!s.pressed;
    } else if(c.sym==='buttonMush'){
      // mantar buton, NC kontak, kilitleme yok (basıt)
      passes[c.id]=(a,b)=>!s.pressed;
    } else if(c.sym==='thermal'){
      // Termik: 95-96 NC (s.tripped ise açık), 97-98 NO (s.tripped ise kapalı)
      passes[c.id]=(a,b)=>{
        const ta=c.t.find(t=>t.id===a)?.label;
        const tb=c.t.find(t=>t.id===b)?.label;
        if((ta==='95'&&tb==='96')||(ta==='96'&&tb==='95'))return !s.tripped;
        if((ta==='97'&&tb==='98')||(ta==='98'&&tb==='97'))return s.tripped===true;
        return false;
      };
    } else if(c.sym==='contactNO'){
      // Bağlı olduğu bobin enerjili mi?
      const coilCid=c.followsCoil;
      passes[c.id]=(a,b)=>{
        return coilCid && SIM_STATE[coilCid]?.energized===true;
      };
    } else if(c.sym==='contactNC'){
      const coilCid=c.followsCoil;
      passes[c.id]=(a,b)=>{
        return !(coilCid && SIM_STATE[coilCid]?.energized===true);
      };
    } else if(c.sym==='coil'||c.sym==='lamp'||c.sym==='lampGreen'||c.sym==='lampRed'||c.sym==='lampYellow'||c.sym==='buzzer'){
      // Yükler: A1-A2 veya X1-X2 arası "geçer" diyemeyiz; bunlar tüketici.
      // Akım için yine geçirgenler ama "energized" olur. Burada iletken sayıyoruz.
      passes[c.id]=(a,b)=>true;
    } else if(c.sym==='timer'){
      // KT giriş (A1-A2) yük, çıkış (15-18 NO, 15-16 NC) bobin durumuna göre
      passes[c.id]=(a,b)=>{
        const ta=c.t.find(t=>t.id===a)?.label;
        const tb=c.t.find(t=>t.id===b)?.label;
        if((ta==='A1'&&tb==='A2')||(ta==='A2'&&tb==='A1'))return true; // bobin
        if((ta==='15'&&tb==='18')||(ta==='18'&&tb==='15'))return s.timerDone===true;
        if((ta==='15'&&tb==='16')||(ta==='16'&&tb==='15'))return !s.timerDone;
        return false;
      };
    } else if(c.sym==='sensor'){
      // L+/0V besleme, Q çıkış. Q algılayınca L+'ya bağlanır.
      passes[c.id]=(a,b)=>{
        const ta=c.t.find(t=>t.id===a)?.label;
        const tb=c.t.find(t=>t.id===b)?.label;
        if((ta==='L+'&&tb==='Q')||(ta==='Q'&&tb==='L+'))return s.detected===true;
        return false;
      };
    } else {
      passes[c.id]=(a,b)=>true;
    }
  });

  // 2. Graf oluştur: her terminal bir node, teller ve "geçen" komponent uçları kenar
  const graph={};
  const addEdge=(a,b)=>{
    if(!graph[a])graph[a]=new Set();
    if(!graph[b])graph[b]=new Set();
    graph[a].add(b); graph[b].add(a);
  };
  // Teller
  WIRES.forEach(w=>{addEdge(w.a,w.b);});
  // Komponent içi geçişler (her uç çifti için)
  CUR.components.forEach(c=>{
    const fn=passes[c.id];
    if(!fn)return;
    for(let i=0;i<c.t.length;i++){
      for(let j=i+1;j<c.t.length;j++){
        const a=c.t[i].id, b=c.t[j].id;
        if(fn(a,b))addEdge(a,b);
      }
    }
  });

  // 3. L+ uçlarından BFS ile gezilebilen tüm uçları bul (live set)
  // ve 0V uçlarına ulaşan yollar (= akan akım)
  const sources=[], grounds=[];
  CUR.components.forEach(c=>{
    if(c.sym==='source24'&&c.power){
      c.t.forEach(t=>{
        if(t.label==='L+')sources.push(t.id);
        if(t.label==='0V'||t.label==='M')grounds.push(t.id);
      });
    }
  });

  // L+'tan ulaşılabilen uçlar
  const fromL=new Set();
  const bfs=(start,target)=>{
    const seen=new Set([start]);
    const q=[start];
    while(q.length){
      const n=q.shift();
      seen.add(n);
      if(graph[n]){
        graph[n].forEach(m=>{if(!seen.has(m)){seen.add(m);q.push(m);}});
      }
    }
    return seen;
  };
  sources.forEach(s=>{
    const reach=bfs(s);
    reach.forEach(x=>fromL.add(x));
  });

  // Akan akım: hem L+ hem 0V'a ulaşılan uçlar
  // Daha basit: her L+ uçtan, herhangi bir 0V uca yol var mı?
  const liveTerms=new Set();
  sources.forEach(s=>{
    const seen=bfs(s);
    seen.forEach(x=>{
      // Bu uçtan da 0V'a yol var mı?
      const seen2=bfs(x);
      if(grounds.some(g=>seen2.has(g)))liveTerms.add(x);
    });
  });

  // 4. Komponentlerin enerji durumunu belirle
  const prevCoils={};
  CUR.components.forEach(c=>{if(c.sym==='coil'||c.sym==='timer')prevCoils[c.id]=SIM_STATE[c.id]?.energized;});

  CUR.components.forEach(c=>{
    if(!SIM_STATE[c.id])SIM_STATE[c.id]={};
    const s=SIM_STATE[c.id];
    // Yükler: A1-A2 veya X1-X2 arası akım var mı?
    if(c.sym==='coil'){
      const a1=c.t.find(t=>t.label==='A1')?.id;
      const a2=c.t.find(t=>t.label==='A2')?.id;
      s.energized = a1 && a2 && liveTerms.has(a1) && liveTerms.has(a2);
    } else if(c.sym==='timer'){
      const a1=c.t.find(t=>t.label==='A1')?.id;
      const a2=c.t.find(t=>t.label==='A2')?.id;
      const newE = a1 && a2 && liveTerms.has(a1) && liveTerms.has(a2);
      s.energized = newE;
      // Timer mantığı: enerji geldiğinde delay başlar
      if(newE && !s.timerStart){
        s.timerStart=Date.now();
        s.timerDone=false;
        const delay=c.timerDelay||5000;
        if(s.timerHandle)clearTimeout(s.timerHandle);
        s.timerHandle=setTimeout(()=>{
          s.timerDone=true;
          runSimulation();
        },delay);
      } else if(!newE){
        s.timerStart=null; s.timerDone=false;
        if(s.timerHandle){clearTimeout(s.timerHandle);s.timerHandle=null;}
      }
    } else if(c.sym==='lamp'||c.sym==='lampGreen'||c.sym==='lampRed'||c.sym==='lampYellow'||c.sym==='buzzer'){
      const x1=c.t[0].id, x2=c.t[1].id;
      s.energized = liveTerms.has(x1) && liveTerms.has(x2);
    } else if(c.sym==='motor'){
      // 3 uçtan en az 2'sinde akım varsa çalışıyor say (basitleştirme)
      const liveCount = c.t.filter(t=>liveTerms.has(t.id)).length;
      s.energized = liveCount>=2;
    }
  });

  // 5. Görselleri güncelle
  applyVisualStates(liveTerms);
  updateIndicators();
}

function clearLiveStates(){
  document.querySelectorAll('.term.energized').forEach(t=>t.classList.remove('energized'));
  document.querySelectorAll('.node.energized').forEach(n=>n.classList.remove('energized'));
  document.querySelectorAll('.lampGlow').forEach(e=>e.style.opacity='0');
  ['lamp-on','coil-energized','motor-spin','rev','timer-running','contactor-closed'].forEach(c=>{
    document.querySelectorAll('.'+c).forEach(e=>e.classList.remove(c));
  });
  WIRES.forEach(w=>w.live=false);
}

function applyVisualStates(liveTerms){
  // Tüm uçları temizle
  document.querySelectorAll('.term').forEach(t=>{
    t.classList.toggle('energized', liveTerms.has(t.dataset.term));
  });
  // Telleri canlı işaretle
  WIRES.forEach(w=>{
    w.live = liveTerms.has(w.a) && liveTerms.has(w.b);
  });
  drawWires();
  // Komponent görsel sınıfları
  CUR.components.forEach(c=>{
    const s=SIM_STATE[c.id]||{};
    const node=document.querySelector(`[data-id="${c.id}"]`);
    if(!node)return;
    const svg=node.querySelector('.nsym svg');
    node.classList.toggle('energized', s.energized===true);
    if(svg){
      if(c.sym==='coil'){
        svg.classList.toggle('coil-energized', s.energized);
      } else if(c.sym.startsWith('lamp')){
        svg.classList.toggle('lamp-on', s.energized);
      } else if(c.sym==='motor'){
        svg.classList.toggle('motor-spin', s.energized);
      } else if(c.sym==='timer'){
        svg.classList.toggle('timer-running', s.energized && !s.timerDone);
      }
    }
    // Kontaktör NO/NC kontakları için contactor-closed
    if(c.sym==='contactNO' && c.followsCoil){
      const coilOn=SIM_STATE[c.followsCoil]?.energized;
      svg.classList.toggle('contactor-closed', coilOn);
    }
  });
  // Power stage güncelle
  if(CUR.hasPower)buildPowerStage();
}

/* =================================================================
   TEL ÇİZME & SEÇME
   ================================================================= */
function pickTerm(tid){
  const hint=document.getElementById('wireHint');
  if(!pending){pending=tid;markTerm(tid,'wiring',true);hint.classList.add('show');return;}
  if(pending===tid){markTerm(tid,'wiring',false);pending=null;hint.classList.remove('show');return;}
  const ex=WIRES.some(w=>(w.a===pending&&w.b===tid)||(w.a===tid&&w.b===pending));
  markTerm(pending,'wiring',false);
  if(!ex)WIRES.push({a:pending,b:tid});
  pending=null;hint.classList.remove('show');
  drawWires();updateSteps();
  if(SIM_STATE._energized)runSimulation();
}
function markTerm(tid,cls,on){
  const el=document.querySelector(`[data-term="${tid}"]`);
  if(el)el.classList.toggle(cls,on);
}
function termCenter(tid){
  const inner=document.getElementById('stageInner').getBoundingClientRect();
  const el=document.querySelector(`[data-term="${tid}"] .dot`);
  if(!el)return null;
  const r=el.getBoundingClientRect();
  return {x:(r.left-inner.left+r.width/2)/scale,y:(r.top-inner.top+r.height/2)/scale};
}
function drawWires(){
  const svg=document.getElementById('wires');svg.innerHTML='';
  WIRES.forEach((w,i)=>{
    const a=termCenter(w.a),b=termCenter(w.b);if(!a||!b)return;
    const mx=(a.x+b.x)/2;
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',`M${a.x},${a.y} C ${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`);
    p.setAttribute('fill','none');
    p.setAttribute('stroke',w.live?'#27d07a':'#5b6675');
    p.setAttribute('stroke-width', w.live?'4':'3');
    p.setAttribute('stroke-linecap','round');
    if(w.live){p.setAttribute('filter','drop-shadow(0 0 5px #27d07a)');p.setAttribute('class','wire-live');}
    svg.appendChild(p);
    const h=document.createElementNS('http://www.w3.org/2000/svg','path');
    h.setAttribute('d',p.getAttribute('d'));h.setAttribute('stroke','transparent');
    h.setAttribute('stroke-width','22');h.setAttribute('fill','none');
    h.style.pointerEvents='stroke';h.style.cursor='pointer';
    const del=(e)=>{e&&e.preventDefault();WIRES.splice(i,1);drawWires();updateSteps();if(SIM_STATE._energized)runSimulation();};
    if(IS_TOUCH) h.addEventListener('touchend',del,{passive:false});
    else h.addEventListener('click',del);
    svg.appendChild(h);
  });
}

function sameWire(w,p){return (w.a===p[0]&&w.b===p[1])||(w.a===p[1]&&w.b===p[0]);}
function evaluate(){
  if(!CUR.solution||!CUR.solution.length)return {correct:0,total:0,wrong:[],missing:[],matched:new Set()};
  const sol=CUR.solution;let correct=0;const matched=new Set();
  sol.forEach((p,i)=>{if(WIRES.some(w=>sameWire(w,p))){correct++;matched.add(i);}});
  const wrong=WIRES.filter(w=>!sol.some(p=>sameWire(w,p)));
  const missing=sol.filter((p,i)=>!matched.has(i));
  // Güç devresi varsa onu da değerlendir
  if(CUR.powerSolution&&CUR.powerSolution.length){
    CUR.powerSolution.forEach((p)=>{
      if(POWER_WIRES.some(w=>sameWire(w,p)))correct++;
      else missing.push(p);
    });
    const powerWrong=POWER_WIRES.filter(w=>!CUR.powerSolution.some(p=>sameWire(w,p)));
    wrong.push(...powerWrong);
    return {correct,total:sol.length+CUR.powerSolution.length,wrong,missing,matched};
  }
  return {correct,total:sol.length,wrong,missing,matched};
}
function labelOf(tid){
  for(const c of CUR.components)for(const t of c.t)
    if(t.id===tid){
      const short=(c.code||c.name).split(/[·\s]/)[0];
      return short+'·'+t.label;
    }
  // Power komponenti de kontrol et
  if(CUR.powerComponents){
    for(const c of CUR.powerComponents)for(const t of c.terms||[])
      if(t.id===tid){
        const short=(c.code||c.name).split(/[·\s]/)[0];
        return short+'·'+t.label;
      }
  }
  return tid;
}
function updateSteps(){
  if(!CUR.solution.length){
    document.getElementById('stepList').innerHTML='<li>— serbest mod, çözüm yok —</li>';
    document.getElementById('scoreNum').textContent='—';
    return;
  }
  const {correct,matched}=evaluate();
  document.getElementById('stepList').innerHTML=CUR.solution.map((p,i)=>
    `<li class="${matched.has(i)?'ok':''}">${labelOf(p[0])} ↔ ${labelOf(p[1])}</li>`).join('');
  document.getElementById('scoreNum').textContent=correct;
}

/* =================================================================
   ENERJİ AÇMA / KONTROL
   ================================================================= */
function energize(){
  if(SIM_STATE._energized){
    // Kapat
    SIM_STATE._energized=false;
    clearLiveStates();
    drawWires();
    updateIndicators();
    document.getElementById('stageMsg').classList.remove('show');
    toast('Enerji kesildi','good');
    return;
  }
  SIM_STATE._energized=true;
  document.getElementById('stageMsg').textContent='⚡ ENERJİ AKTIF — Butonlara basarak devreyi test et';
  document.getElementById('stageMsg').classList.add('show');
  toast('Enerji açıldı — butonlara basarak devreyi çalıştır','good');
  runSimulation();
}

function checkTask(){
  const ev=evaluate(),u=DB.user();
  if(!ev.total){toast('Bu mod için kontrol yok','bad');return;}
  const pass=ev.correct===ev.total&&ev.wrong.length===0;
  const det=[];
  ev.missing.forEach(p=>det.push('Eksik: '+labelOf(p[0])+'–'+labelOf(p[1])));
  ev.wrong.forEach(w=>det.push('Yanlış: '+labelOf(w.a)+'–'+labelOf(w.b)));
  DB.addLog({ts:new Date().toLocaleString('tr-TR'),user:u.name,email:u.email,
    task:CUR.title,score:ev.correct+'/'+ev.total,pass,
    errors:det.length?det.join(' | '):'—'});
  document.getElementById('liveErr').innerHTML=det.map(e=>'• '+e).join('<br>');
  if(pass){
    const isFirst = !completed.includes(CUR.id);
    if(isFirst){completed.push(CUR.id);
      localStorage.setItem('eg_done',JSON.stringify(completed));}
    if(!SIM_STATE._energized)energize();
    toast(`✅ Başarılı! ${ev.correct}/${ev.total} bağlantı doğru`,'good');
    // XP kazanma (sadece ilk başarıda)
    if(isFirst && u.role!=='admin'){
      // Level'a göre XP: L1=25, L2=50, L3=75, L4+=100
      let xpAmount = 25;
      const lvlMatch = (CUR.level||'').match(/L(\d+)/);
      if(lvlMatch){
        const ln = parseInt(lvlMatch[1]);
        xpAmount = ln<=1 ? 25 : ln===2 ? 50 : ln===3 ? 75 : 100;
      }
      PROFILE.stats.tasksCompleted = (PROFILE.stats.tasksCompleted||0) + 1;
      saveProfile(PROFILE);
      awardXP(xpAmount, CUR.title+' tamamlandı');
      // Yıldız-üçgen ise rozet
      if((CUR.title||'').toLowerCase().includes('yıldız')){
        setTimeout(()=>awardBadge('panel'), 1500);
      }
      setTimeout(checkBadges, 2000);
    }
    renderTasks();
  }else toast(`❌ ${ev.missing.length} eksik, ${ev.wrong.length} yanlış`,'bad');
}

function resetBench(){
  WIRES=[];pending=null;
  // Önce timer'ları temizle, SONRA SIM_STATE sıfırla
  CUR.components.forEach(c=>{
    if(SIM_STATE[c.id]?.timerHandle)clearTimeout(SIM_STATE[c.id].timerHandle);
  });
  SIM_STATE={};
  clearLiveStates();
  buildStage();
  document.getElementById('liveErr').innerHTML='';
  document.getElementById('scoreNum').textContent='—';
  document.getElementById('wireHint').classList.remove('show');
  document.getElementById('stageMsg').classList.remove('show');
  updateIndicators();
}

/* =================================================================
   İSİM DÜZENLEYİCİ
   ================================================================= */
function startNameEdit(cid,e){
  e.stopPropagation();
  const comp=CUR.components.find(c=>c.id===cid);
  if(!comp)return;
  EDIT_TARGET=cid;
  const ne=document.getElementById('nameEdit');
  const input=document.getElementById('nameEditInput');
  input.value=comp.name;
  const node=document.querySelector(`[data-id="${cid}"]`);
  const rect=node.getBoundingClientRect();
  const scrollRect=document.getElementById('scroll').getBoundingClientRect();
  ne.style.left=(rect.left-scrollRect.left)+'px';
  ne.style.top=(rect.top-scrollRect.top-40)+'px';
  ne.classList.add('show');
  input.focus();
  input.select();
}
function saveNameEdit(){
  const comp=CUR.components.find(c=>c.id===EDIT_TARGET);
  if(!comp)return;
  const newName=document.getElementById('nameEditInput').value.trim();
  if(newName)comp.name=newName;
  document.getElementById('nameEdit').classList.remove('show');
  buildStage();
  if(SIM_STATE._energized)runSimulation();
}
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&document.getElementById('nameEdit').classList.contains('show'))saveNameEdit();
  if(e.key==='Escape')document.getElementById('nameEdit').classList.remove('show');
});

/* =================================================================
   ZOOM/PAN
   ================================================================= */
function applyT(){
  document.getElementById('stageInner').style.transform=
    `translate(${panX}px,${panY}px) scale(${scale})`;
}
function zoomBy(f){scale=Math.max(.3,Math.min(2,scale*f));applyT();}
function fitStage(){
  const sc=document.getElementById('scroll');
  const w=sc.clientWidth, h=sc.clientHeight;
  scale=Math.max(.3,Math.min(1.2,Math.min((w-10)/1100,(h-10)/720)));
  panX=Math.max(0,(w-1100*scale)/2);panY=10;applyT();
}
(function panSetup(){
  const sc=document.getElementById('scroll');
  if(IS_TOUCH){
    let p=false,sx,sy,px,py,pinch=false,d0,s0;
    sc.addEventListener('touchstart',e=>{
      if(e.target.closest('.term')||e.target.closest('.nhead')||e.target.closest('.ztool')||e.target.closest('.nsym'))return;
      if(e.touches.length===2){pinch=true;
        d0=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        s0=scale;return;}
      p=true;sx=e.touches[0].clientX;sy=e.touches[0].clientY;px=panX;py=panY;
    },{passive:true});
    sc.addEventListener('touchmove',e=>{
      if(pinch&&e.touches.length===2){
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        scale=Math.max(.3,Math.min(2,s0*d/d0));applyT();e.preventDefault();return;}
      if(!p)return;
      panX=px+(e.touches[0].clientX-sx);panY=py+(e.touches[0].clientY-sy);applyT();
    },{passive:false});
    sc.addEventListener('touchend',e=>{if(e.touches.length===0){p=false;pinch=false;}});
  } else {
    let md=false,mx,my,mpx,mpy;
    sc.addEventListener('mousedown',e=>{
      if(e.target.closest('.term')||e.target.closest('.nhead')||e.target.closest('.ztool')||e.target.closest('.nsym'))return;
      md=true;mx=e.clientX;my=e.clientY;mpx=panX;mpy=panY;sc.style.cursor='grabbing';});
    window.addEventListener('mousemove',e=>{if(!md)return;
      panX=mpx+(e.clientX-mx);panY=mpy+(e.clientY-my);applyT();});
    window.addEventListener('mouseup',()=>{md=false;sc.style.cursor='';});
    sc.addEventListener('wheel',e=>{
      e.preventDefault();
      const f=e.deltaY<0?1.1:0.9;
      scale=Math.max(.3,Math.min(2,scale*f));applyT();
    },{passive:false});
  }
})();

/* =================================================================
   ADMIN
   ================================================================= */

/* =================================================================
   VIEW MODE: Serbest vs Şema (Merdiven)
   ================================================================= */
function setViewMode(m){
  VIEW_MODE=m;
  document.getElementById('vmFree').classList.toggle('active',m==='free');
  document.getElementById('vmSchema').classList.toggle('active',m==='schema');
  document.getElementById('stageInner').classList.toggle('schematic',m==='schema');
  if(m==='schema')layoutSchema();
  buildStage();
  setTimeout(()=>{drawWires();if(SIM_STATE._energized)runSimulation();},50);
}

function layoutSchema(){
  // Komponentleri merdiven şeklinde otomatik diz
  // Sol kenar (80px) L+, sağ kenar (1020px) 0V
  // Yükler (bobin, lamba, motor) — sağa yakın
  // Kontaklar, butonlar — orta-sol bölgede sıralı
  // Güç kaynağı — solda en üstte
  const power=CUR.components.find(c=>c.power);
  const loads=CUR.components.filter(c=>['coil','lamp','lampGreen','lampRed','lampYellow','timer','buzzer'].includes(c.sym));
  const switches=CUR.components.filter(c=>['buttonNO','buttonNC','buttonMush','switch2'].includes(c.sym));
  const protect=CUR.components.filter(c=>['fuse','mcb','thermal'].includes(c.sym));
  const contacts=CUR.components.filter(c=>['contactNO','contactNC'].includes(c.sym));
  const others=CUR.components.filter(c=>['sensor','motor'].includes(c.sym));

  // Power solda en üstte
  if(power){power.x=20;power.y=20;}

  // Her yük (bobin/lamba) bir satırda. Yatay olarak: koruma → buton → kontak → yük
  let row=0;
  loads.forEach((load,i)=>{
    const y=80+row*130;
    load.x=900; load.y=y;
    row++;
  });

  // Korumalar üstte sol bölgede sıralı
  protect.forEach((p,i)=>{
    p.x=170+i*150; p.y=20;
  });

  // Butonlar ve kontaklar — yüklere bağlanan en yakın satıra
  let usedRowsBtn={};
  switches.forEach((s,i)=>{
    s.x=320+i*170;
    s.y=80+(i%2)*60;
  });
  contacts.forEach((c,i)=>{
    c.x=320+(i%4)*170;
    c.y=200+Math.floor(i/4)*100;
  });
  others.forEach((o,i)=>{
    o.x=500; o.y=80+i*130;
  });
}

/* =================================================================
   3 FAZ GÜÇ SAHNESİ
   ================================================================= */
function buildPowerStage(){
  if(!CUR.powerComponents)return;
  const svg=document.getElementById('powerSvg');
  svg.innerHTML='';
  // Üç ray çiz (L1, L2, L3)
  [30,80,130].forEach((y,i)=>{
    const r=document.createElementNS('http://www.w3.org/2000/svg','line');
    r.setAttribute('x1',20);r.setAttribute('x2',180);
    r.setAttribute('y1',y);r.setAttribute('y2',y);
    r.setAttribute('stroke','#ff7a18');r.setAttribute('stroke-width','2.5');
    svg.appendChild(r);
    const t=document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x',10);t.setAttribute('y',y+4);
    t.setAttribute('fill','#ff7a18');t.setAttribute('font-family','monospace');
    t.setAttribute('font-size','12');t.setAttribute('font-weight','700');
    t.textContent='L'+(i+1);
    svg.appendChild(t);
  });
  // Komponent dot'larını çiz
  CUR.powerComponents.forEach(pc=>{
    pc.terms.forEach(t=>{
      const tx = pc.x + (t.side==='l'?0: t.side==='r'?80:40);
      const ty = pc.y;
      // dot
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',tx);c.setAttribute('cy',ty);c.setAttribute('r','6');
      c.setAttribute('fill','#1c232d');c.setAttribute('stroke','#5b6675');
      c.setAttribute('stroke-width','2');c.setAttribute('data-pterm',t.id);
      c.style.cursor='pointer';
      c.addEventListener('click',ev=>{ev.stopPropagation();pickPowerTerm(t.id);});
      svg.appendChild(c);
      // label
      const lbl=document.createElementNS('http://www.w3.org/2000/svg','text');
      lbl.setAttribute('x',tx);lbl.setAttribute('y',ty-12);
      lbl.setAttribute('fill','#8a96a3');lbl.setAttribute('font-family','monospace');
      lbl.setAttribute('font-size','9');lbl.setAttribute('text-anchor','middle');
      lbl.textContent=t.label;
      svg.appendChild(lbl);
    });
    // gövde (kontaktör kontağı veya motor)
    if(pc.kind==='motor'){
      const m=document.createElementNS('http://www.w3.org/2000/svg','circle');
      m.setAttribute('cx',pc.x+40);m.setAttribute('cy',pc.y+50);m.setAttribute('r','28');
      m.setAttribute('fill','none');m.setAttribute('stroke','#8a96a3');m.setAttribute('stroke-width','2');
      m.setAttribute('data-motor',pc.id);
      svg.appendChild(m);
      const mt=document.createElementNS('http://www.w3.org/2000/svg','text');
      mt.setAttribute('x',pc.x+40);mt.setAttribute('y',pc.y+55);
      mt.setAttribute('fill','#8a96a3');mt.setAttribute('font-family','monospace');
      mt.setAttribute('font-size','16');mt.setAttribute('font-weight','700');
      mt.setAttribute('text-anchor','middle');
      mt.textContent='M';
      svg.appendChild(mt);
      const mt2=document.createElementNS('http://www.w3.org/2000/svg','text');
      mt2.setAttribute('x',pc.x+40);mt2.setAttribute('y',pc.y+90);
      mt2.setAttribute('fill','#8a96a3');mt2.setAttribute('font-family','monospace');
      mt2.setAttribute('font-size','10');
      mt2.setAttribute('text-anchor','middle');
      mt2.textContent='3~ M1';
      svg.appendChild(mt2);
    } else if(pc.followsCoil){
      // Kontaktör ana kontağı
      const tx1 = pc.x;
      const tx2 = pc.x+80;
      const closed = SIM_STATE[pc.followsCoil]?.energized;
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',tx1+6);
      line.setAttribute('y1',pc.y);
      if(closed){
        line.setAttribute('x2',tx2-6);
        line.setAttribute('y2',pc.y);
        line.setAttribute('stroke','#27d07a');
        line.setAttribute('stroke-width','3');
        line.setAttribute('filter','drop-shadow(0 0 4px #27d07a)');
      } else {
        // Açık - eğri çizgi
        line.setAttribute('x2',tx2-6);
        line.setAttribute('y2',pc.y-14);
        line.setAttribute('stroke','#5b6675');
        line.setAttribute('stroke-width','2.5');
      }
      svg.appendChild(line);
      // Kontak adı
      const lbl=document.createElementNS('http://www.w3.org/2000/svg','text');
      lbl.setAttribute('x',pc.x+40);lbl.setAttribute('y',pc.y+18);
      lbl.setAttribute('fill','#f5b301');lbl.setAttribute('font-family','monospace');
      lbl.setAttribute('font-size','9');lbl.setAttribute('font-weight','700');
      lbl.setAttribute('text-anchor','middle');
      lbl.textContent=pc.code||'K';
      svg.appendChild(lbl);
    }
  });
  drawPowerWires();
}

function pickPowerTerm(tid){
  if(!POWER_PENDING){POWER_PENDING=tid;
    document.querySelector(`[data-pterm="${tid}"]`)?.setAttribute('fill','#f5b301');
    return;}
  if(POWER_PENDING===tid){
    document.querySelector(`[data-pterm="${tid}"]`)?.setAttribute('fill','#1c232d');
    POWER_PENDING=null;return;}
  const ex=POWER_WIRES.some(w=>(w.a===POWER_PENDING&&w.b===tid)||(w.a===tid&&w.b===POWER_PENDING));
  document.querySelector(`[data-pterm="${POWER_PENDING}"]`)?.setAttribute('fill','#1c232d');
  if(!ex)POWER_WIRES.push({a:POWER_PENDING,b:tid});
  POWER_PENDING=null;
  drawPowerWires();
}

function findPowerTerm(tid){
  for(const c of (CUR.powerComponents||[])){
    for(const t of c.terms){
      if(t.id===tid)return {c,t,tx:c.x+(t.side==='l'?0:t.side==='r'?80:40),ty:c.y};
    }
  }
  return null;
}

function drawPowerWires(){
  if(!CUR.powerComponents)return;
  const svg=document.getElementById('powerSvg');
  // önceki tellerin gruplarını sil
  [...svg.querySelectorAll('[data-wire]')].forEach(e=>e.remove());
  POWER_WIRES.forEach((w,i)=>{
    const a=findPowerTerm(w.a), b=findPowerTerm(w.b);
    if(!a||!b)return;
    const isLive = isPowerWireLive(w);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    // 90 derece dönüşlü
    const mx=(a.tx+b.tx)/2;
    path.setAttribute('d',`M${a.tx},${a.ty} L${mx},${a.ty} L${mx},${b.ty} L${b.tx},${b.ty}`);
    path.setAttribute('fill','none');
    path.setAttribute('stroke',isLive?'#27d07a':'#5b6675');
    path.setAttribute('stroke-width',isLive?'3.5':'2.5');
    path.setAttribute('data-wire','1');
    if(isLive){path.setAttribute('filter','drop-shadow(0 0 4px #27d07a)');}
    svg.appendChild(path);
    // Tıklanabilir
    const hit=document.createElementNS('http://www.w3.org/2000/svg','path');
    hit.setAttribute('d',path.getAttribute('d'));
    hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','20');
    hit.setAttribute('fill','none');hit.setAttribute('data-wire','1');
    hit.style.cursor='pointer';
    hit.addEventListener('click',e=>{e.stopPropagation();POWER_WIRES.splice(i,1);drawPowerWires();});
    svg.appendChild(hit);
  });
}

function isPowerWireLive(w){
  // Güç hattı yaşıyor mu? Kontaktör kapalıysa ve motor bağlıysa
  if(!CUR.powerComponents)return false;
  const motor=CUR.powerComponents.find(c=>c.kind==='motor');
  if(!motor)return false;
  // Motor en az 2 fazlı çekiyorsa (k1 enerjili ise) hatlar canlı
  const k1On = CUR.components.find(c=>c.sym==='coil') && SIM_STATE[CUR.components.find(c=>c.sym==='coil').id]?.energized;
  return k1On===true;
}

/* =================================================================
   PEDAGOJİK ANALİZ (devre mantığını anla, ne eksik ne yanlış söyle)
   ================================================================= */
function analyzeCircuit(){
  const issues=[];
  const sol=CUR.solution||[];
  if(!sol.length){
    return [{type:'info',icon:'🛠️',title:'Serbest Mod',
      text:'Serbest moddasın. Devre kur, butonlara bas, davranışı gözlemle. Hazır olduğunda görevlere geri dön.'}];
  }

  // Genel kontroller
  const ev=evaluate();
  const u=DB.user();

  // 1) Hiç bağlantı yok
  if(WIRES.length===0){
    issues.push({type:'info',icon:'🔌',title:'Henüz hiç tel çekmedin',
      text:'Bağlanacak iki ucu sırayla seç. Devre <b>L+ kaynağından</b> başlar ve <b>yük</b> (bobin/lamba) üzerinden <b>0V\'a</b> döner.'});
    return issues;
  }

  // 2) Güç kaynağı bağlanmamış mı?
  const power=CUR.components.find(c=>c.power);
  if(power){
    const lpUsed=WIRES.some(w=>w.a===power.t.find(t=>t.label==='L+')?.id||w.b===power.t.find(t=>t.label==='L+')?.id);
    const mpUsed=WIRES.some(w=>w.a===power.t.find(t=>t.label==='0V')?.id||w.b===power.t.find(t=>t.label==='0V')?.id);
    if(!lpUsed)issues.push({type:'error',icon:'⚡',title:'L+ ucu hiç kullanılmamış',
      text:'Devrenin başlangıç noktası <b>G1 güç kaynağının L+ ucu</b>. Genelde önce <code>Q1 sigorta</code>\'ya gider.'});
    if(!mpUsed)issues.push({type:'error',icon:'⚫',title:'0V (nötr) ucu kullanılmamış',
      text:'Devre tamamlanabilmesi için <b>0V referansa</b> dönmeli. Yüklerin (bobin, lamba) A2 veya X2 ucu mutlaka 0V\'a bağlanmalı.'});
  }

  // 3) Sigorta bypass edilmiş mi?
  const fuse=CUR.components.find(c=>c.sym==='fuse');
  if(fuse&&power){
    const lpId=power.t.find(t=>t.label==='L+')?.id;
    const fuseUsed=WIRES.some(w=>(w.a===fuse.t[0].id||w.b===fuse.t[0].id||w.a===fuse.t[1].id||w.b===fuse.t[1].id));
    if(!fuseUsed)issues.push({type:'warn',icon:'🔥',title:'Sigorta devre dışı',
      text:'<b>Sigorta atlanmış!</b> Kısa devre koruması yok — kazara kontak yaparsan tüm devre yanar. L+ → Q1 → ... şeklinde sigortayı dahil et.'});
  }

  // 4) Termik 95-96 atlanmış mı?
  const term=CUR.components.find(c=>c.sym==='thermal');
  if(term){
    const t95=term.t.find(t=>t.label==='95'),t96=term.t.find(t=>t.label==='96');
    if(t95&&t96){
      const used=WIRES.some(w=>w.a===t95.id||w.b===t95.id||w.a===t96.id||w.b===t96.id);
      if(!used)issues.push({type:'warn',icon:'🌡️',title:'Termik koruma atlanmış',
        text:'<b>F2·95-96 NC kontağı kumanda zincirinde değil!</b> Motor aşırı akım çekerse koruma çalışmaz. Sigorta sonrası ilk eleman olarak F2 ekle.'});
    }
  }

  // 5) Bobin var ama A1-A2 ikisi de bağlı değil
  const coils=CUR.components.filter(c=>c.sym==='coil');
  coils.forEach(coil=>{
    const a1=coil.t.find(t=>t.label==='A1'),a2=coil.t.find(t=>t.label==='A2');
    const a1U=WIRES.some(w=>w.a===a1?.id||w.b===a1?.id);
    const a2U=WIRES.some(w=>w.a===a2?.id||w.b===a2?.id);
    if(!a1U&&!a2U)issues.push({type:'error',icon:'🔴',title:`${coil.code||coil.name} bobini bağlanmamış`,
      text:`<b>${coil.code} bobini henüz devreye dahil değil.</b> A1 ucu kumanda hattına (L+ tarafına), A2 ucu 0V\'a bağlanmalı.`});
    else if(!a1U)issues.push({type:'error',icon:'🔴',title:`${coil.code} A1 ucu boşta`,
      text:'Bobinin <b>A1 ucu</b> kumanda zincirinden gelen akımı almalı (Stop → Start üzerinden).'});
    else if(!a2U)issues.push({type:'error',icon:'🔴',title:`${coil.code} A2 ucu boşta`,
      text:'Bobinin <b>A2 ucu</b> 0V referansa dönmeli. Devre tamamlanmazsa bobin enerjilenmez.'});
  });

  // 6) Mühürleme eksik mi? (S1 NO ve K1·13-14 paralel olmalı)
  const startBtn=CUR.components.find(c=>c.sym==='buttonNO'&&c.code?.toLowerCase().includes('s1'));
  const k1aux=CUR.components.find(c=>c.sym==='contactNO'&&c.code?.includes('13')&&c.code?.includes('14'));
  if(startBtn&&k1aux&&coils.length){
    const s14=startBtn.t.find(t=>t.label==='14')?.id;
    const k1a14=k1aux.t.find(t=>t.label==='14')?.id;
    if(s14&&k1a14){
      // İkisi de aynı noktaya gidiyor mu? (paralel)
      const s14Targets=WIRES.filter(w=>w.a===s14||w.b===s14).map(w=>w.a===s14?w.b:w.a);
      const k1a14Targets=WIRES.filter(w=>w.a===k1a14||w.b===k1a14).map(w=>w.a===k1a14?w.b:w.a);
      const parallel=s14Targets.some(t=>k1a14Targets.includes(t));
      if(!parallel&&s14Targets.length>0&&!k1a14Targets.length){
        issues.push({type:'warn',icon:'🔗',title:'Mühürleme eksik',
          text:'<b>Start butonu bağlandı ama K1·13-14 yardımcı kontağı bağlı değil.</b> Bu durumda Start\'ı bırakınca devre düşer (jog modu). Sürekli çalışma için K1·13-14\'ü Start\'a paralel bağla: ikisi de aynı çıkışa bağlanmalı.'});
      }
    }
  }

  // 7) Eksik bağlantılar — pedagojik olarak söyle
  if(ev.missing.length){
    ev.missing.forEach(m=>{
      const fromComp=CUR.components.find(c=>c.t.some(t=>t.id===m[0]));
      const toComp=CUR.components.find(c=>c.t.some(t=>t.id===m[1]));
      if(!fromComp||!toComp)return;
      const f=fromComp.t.find(t=>t.id===m[0]);
      const t=toComp.t.find(t=>t.id===m[1]);
      issues.push({type:'error',icon:'❌',title:'Eksik: '+labelOf(m[0])+' ↔ '+labelOf(m[1]),
        text:`<b>${fromComp.name}</b> (${f.label}) ile <b>${toComp.name}</b> (${t.label}) arası bağlantı yok. ${suggestForPair(fromComp,f,toComp,t)}`});
    });
  }

  // 8) Yanlış bağlantılar
  if(ev.wrong.length){
    ev.wrong.forEach(w=>{
      issues.push({type:'warn',icon:'⚠️',title:'Gereksiz tel: '+labelOf(w.a)+' ↔ '+labelOf(w.b),
        text:'Bu bağlantı çözümde yok. Devrenin mantığını gözden geçir; bazen "kısa yol" gibi görünen tel devreyi tehlikeli hale getirebilir.'});
    });
  }

  // Tamam mı?
  if(ev.correct===ev.total && !ev.wrong.length){
    issues.unshift({type:'success',icon:'✅',title:'Devre doğru kuruldu!',
      text:'Tüm bağlantılar yerinde. ⚡ Enerji butonuna basıp çalıştırabilirsin.'});
  }

  return issues;
}

function suggestForPair(fc,ft,tc,tt){
  // Akıllı öneri üret
  if(fc.sym==='source24'&&ft.label==='L+')return 'L+ uçtan çıkan ilk tel genelde sigortaya (Q1·1) gider.';
  if(fc.sym==='fuse'&&ft.label==='2')return 'Sigorta çıkışından sonra genelde termik veya stop butonu gelir.';
  if(fc.sym==='thermal')return 'Termik 95-96 NC kontağı stop butonundan önce zincire dahil edilmeli.';
  if(fc.sym==='buttonNC'&&ft.label==='12')return 'Stop butonu çıkışından sonra Start butonu (NO) gelir.';
  if(fc.sym==='buttonNO'&&ft.label==='14')return 'Start çıkışı bobinin A1 ucuna gider.';
  if(tc.sym==='coil'&&tt.label==='A2')return 'Bobin A2 ucu mutlaka 0V\'a bağlanmalı (devrenin dönüş ucu).';
  return 'IEC akış yönü: <code>L+ → Sigorta → Termik → Stop → Start → Bobin → 0V</code>';
}

function showFeedback(){
  const items=analyzeCircuit();
  document.getElementById('fbBody').innerHTML=items.map(i=>`
    <div class="feedback-item ${i.type}">
      <span class="icon">${i.icon}</span>
      <div class="ft">${i.title}</div>
      <div class="fd">${i.text}</div>
    </div>`).join('');
  document.getElementById('fbModal').classList.add('show');
}
function closeFb(){document.getElementById('fbModal').classList.remove('show');}