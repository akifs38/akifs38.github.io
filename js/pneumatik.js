/* =================================================================
   PNÖMATİK SİMÜLATÖRÜ — ISO 1219 devre şeması
   ================================================================= */

/* =================================================================
   PNÖMATİK SİMÜLATÖRÜ — ISO 1219
   ================================================================= */
let PNEUM = {
  components: [],   // {id, type, x, y, ports[], data{}}
  hoses: [],        // {a:portId, b:portId}
  pressureOn: false
};
let PNEUM_COUNTER = 0;
let PNEUM_PENDING = null;  // hortum bağlanırken seçilen ilk port
let PNEUM_DRAG = null;     // sürüklenen element
let PNEUM_SCALE = 1, PNEUM_PAN_X = 0, PNEUM_PAN_Y = 0;

function openPneum(){
  switchTab('pneum');
  renderPneum();
  renderPneumPanel();
  setTimeout(()=>{ pneumBindPan(); pneumFit(); }, 50);
  if(window.innerWidth<900){
    const p=document.getElementById('pnSideAside');
    if(p)p.classList.add('collapsed');
  }
}

/* Pnömatik zoom/pan */
function pneumApplyTransform(){
  const inner = document.getElementById('pneumStageInner');
  if(!inner)return;
  inner.style.transform = `translate(${PNEUM_PAN_X}px, ${PNEUM_PAN_Y}px) scale(${PNEUM_SCALE})`;
}
function pneumZoom(factor){
  PNEUM_SCALE = Math.max(0.3, Math.min(2.5, PNEUM_SCALE * factor));
  pneumApplyTransform();
}
function pneumFit(){
  const area = document.getElementById('pneumArea');
  if(!area)return;
  const w = area.clientWidth, h = area.clientHeight;
  // 1100x600 SVG'yi ekrana sığdır
  PNEUM_SCALE = Math.min((w-10) / 1100, (h-10) / 600);
  PNEUM_SCALE = Math.max(0.3, Math.min(1.2, PNEUM_SCALE));
  // Yatayda ortala
  PNEUM_PAN_X = Math.max(0, (w - 1100 * PNEUM_SCALE) / 2);
  PNEUM_PAN_Y = 8;
  pneumApplyTransform();
}

/* Pnömatik sahnesinde pan/pinch — openPneum() çağrısından sonra çalışır */
let _pneumPanBound = false;
function pneumBindPan(){
  if(_pneumPanBound)return;
  _pneumPanBound = true;
  (function pneumPanSetup(){
  let p=false, sx, sy, px, py, pinch=false, d0, s0;
    const area = document.getElementById('pneumArea');
    if(!area)return;
    const isTouch = 'ontouchstart' in window;
    if(isTouch){
      area.addEventListener('touchstart', e=>{
        // Eleman, port veya tetik üstündeyse sürükleme — sahne pan değil
        const t = e.target;
        if(t.closest('.pn-element') || t.tagName==='circle' || t.classList.contains('pn-trigger') || t.classList.contains('pn-port') || t.closest('.ztool'))return;
        if(e.touches.length===2){
          pinch=true;
          d0=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
          s0=PNEUM_SCALE;
          return;
        }
        p=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY;
        px=PNEUM_PAN_X; py=PNEUM_PAN_Y;
      }, {passive:true});
      area.addEventListener('touchmove', e=>{
        if(pinch && e.touches.length===2){
          const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
          PNEUM_SCALE = Math.max(0.3, Math.min(2.5, s0 * d/d0));
          pneumApplyTransform();
          e.preventDefault();
          return;
        }
        if(!p)return;
        PNEUM_PAN_X = px + (e.touches[0].clientX - sx);
        PNEUM_PAN_Y = py + (e.touches[0].clientY - sy);
        pneumApplyTransform();
      }, {passive:false});
      area.addEventListener('touchend', e=>{
        if(e.touches.length===0){p=false; pinch=false;}
      });
    } else {
      let md=false, mx, my, mpx, mpy;
      area.addEventListener('mousedown', e=>{
        const t = e.target;
        if(t.closest('.pn-element') || t.tagName==='circle' || t.classList.contains('pn-trigger') || t.classList.contains('pn-port') || t.closest('.ztool'))return;
        md=true; mx=e.clientX; my=e.clientY; mpx=PNEUM_PAN_X; mpy=PNEUM_PAN_Y;
        area.style.cursor='grabbing';
      });
      window.addEventListener('mousemove', e=>{
        if(!md)return;
        PNEUM_PAN_X = mpx + (e.clientX - mx);
        PNEUM_PAN_Y = mpy + (e.clientY - my);
        pneumApplyTransform();
      });
      window.addEventListener('mouseup', ()=>{md=false; const a=document.getElementById('pneumArea'); if(a)a.style.cursor='';});
      area.addEventListener('wheel', e=>{
        e.preventDefault();
        const f = e.deltaY < 0 ? 1.12 : 0.89;
        PNEUM_SCALE = Math.max(0.3, Math.min(2.5, PNEUM_SCALE * f));
        pneumApplyTransform();
      }, {passive:false});
    }
  })();
}

function resetPneum(){
  if(confirm('Tüm devre silinsin mi?')){
    // Basınç açıksa önce kapat (buton görsel durumunu günceller)
    if(PNEUM.pressureOn) togglePneum();
    PNEUM = {components:[], hoses:[], pressureOn:false};
    PNEUM_COUNTER = 0;
    renderPneum();
    renderPneumPanel();
  }
}

function togglePneum(){
  PNEUM.pressureOn = !PNEUM.pressureOn;
  const btn=document.getElementById('pneumRunBtn');
  if(PNEUM.pressureOn){
    btn.textContent='■ Kapat';
    btn.style.background='var(--danger)';btn.style.color='#fff';
    toast('▶ Basınç açıldı — devre canlı','good');
  } else {
    btn.textContent='▶ Basınç';
    btn.style.background='';btn.style.color='';
    // Tüm silindirleri başlangıç pozisyonuna döndür
    PNEUM.components.forEach(c=>{
      if(c.type==='cyl1'||c.type==='cyl2'){c.data.pos=0;}
    });
    toast('■ Basınç kapatıldı','good');
  }
  renderPneum();
}

function addPneumComp(type){
  PNEUM_COUNTER++;
  const id='pn'+PNEUM_COUNTER;
  // Pozisyonu önceki elemana göre belirle
  let nx = 100, ny = 100;
  if(PNEUM.components.length){
    const lastX = Math.max(...PNEUM.components.map(c=>c.x));
    nx = (lastX + 200) % 900;
    if(nx<100)nx=100;
  }
  ny = 100 + (PNEUM_COUNTER%4)*120;

  // Eleman tanımları
  const defs = {
    source:{w:80,h:60,label:'Kompresör',code:'P0',ports:[{id:'p',label:'P',x:80,y:30,side:'r'}]},
    frl:{w:120,h:60,label:'FRL',code:'Z1',ports:[{id:'in',label:'P1',x:0,y:30,side:'l'},{id:'out',label:'P',x:120,y:30,side:'r'}]},
    v32:{w:120,h:80,label:'3/2 Buton',code:'V?',ports:[{id:'p',label:'P',x:60,y:80,side:'b'},{id:'a',label:'A',x:60,y:0,side:'t'},{id:'r',label:'R',x:0,y:80,side:'b'}],data:{pressed:false,nc:true}},
    v32sol:{w:120,h:80,label:'3/2 Selenoid',code:'Y?',ports:[{id:'p',label:'P',x:60,y:80,side:'b'},{id:'a',label:'A',x:60,y:0,side:'t'},{id:'r',label:'R',x:0,y:80,side:'b'}],data:{energized:false,nc:true,sol:'Y1'}},
    v52:{w:160,h:80,label:'5/2 Buton',code:'V?',ports:[
      {id:'p',label:'P',x:80,y:80,side:'b'},
      {id:'a',label:'A',x:40,y:0,side:'t'},
      {id:'b',label:'B',x:120,y:0,side:'t'},
      {id:'r',label:'R',x:0,y:80,side:'b'},
      {id:'s',label:'S',x:160,y:80,side:'b'}
    ],data:{pressed:false}},
    v52sol:{w:160,h:80,label:'5/2 Selenoid',code:'Y?',ports:[
      {id:'p',label:'P',x:80,y:80,side:'b'},
      {id:'a',label:'A',x:40,y:0,side:'t'},
      {id:'b',label:'B',x:120,y:0,side:'t'},
      {id:'r',label:'R',x:0,y:80,side:'b'},
      {id:'s',label:'S',x:160,y:80,side:'b'}
    ],data:{energized:false,sol:'Y1'}},
    v52dual:{w:160,h:80,label:'5/2 Çift Bobinli',code:'Y?',ports:[
      {id:'p',label:'P',x:80,y:80,side:'b'},
      {id:'a',label:'A',x:40,y:0,side:'t'},
      {id:'b',label:'B',x:120,y:0,side:'t'},
      {id:'r',label:'R',x:0,y:80,side:'b'},
      {id:'s',label:'S',x:160,y:80,side:'b'}
    ],data:{state:'a',sol1:'Y1',sol2:'Y2'}},
    v53cc:{w:200,h:80,label:'5/3 Orta Kapalı',code:'Y?',ports:[
      {id:'p',label:'P',x:100,y:80,side:'b'},
      {id:'a',label:'A',x:50,y:0,side:'t'},
      {id:'b',label:'B',x:150,y:0,side:'t'},
      {id:'r',label:'R',x:0,y:80,side:'b'},
      {id:'s',label:'S',x:200,y:80,side:'b'}
    ],data:{state:'mid',sol1:'Y1',sol2:'Y2'}},
    cyl1:{w:180,h:50,label:'Tek Etkili',code:'A?',ports:[{id:'in',label:'P',x:15,y:50,side:'b'}],data:{pos:0,kind:'single'}},
    cyl2:{w:200,h:50,label:'Çift Etkili',code:'A?',ports:[{id:'in1',label:'A',x:15,y:50,side:'b'},{id:'in2',label:'B',x:165,y:50,side:'b'}],data:{pos:0,kind:'double'}},
    flow:{w:80,h:60,label:'Akış Kontrol',code:'F?',ports:[{id:'in',label:'',x:0,y:30,side:'l'},{id:'out',label:'',x:80,y:30,side:'r'}],data:{open:50}},
    mufler:{w:50,h:50,label:'Susturucu',code:'',ports:[{id:'in',label:'',x:0,y:25,side:'l'}]},
    sensor:{w:60,h:50,label:'Sensör',code:'B?',ports:[],data:{detect:'end',cyl:null}}
  };

  const def = defs[type];
  if(!def){toast('Tanınmayan eleman','bad');return;}

  PNEUM.components.push({
    id, type,
    name: def.label,
    code: def.code ? def.code.replace('?', PNEUM_COUNTER) : '',
    x: nx, y: ny,
    w: def.w, h: def.h,
    ports: def.ports.map(p=>({...p, id: id+'_'+p.id})),
    data: def.data ? {...def.data} : {}
  });
  renderPneum();
  renderPneumPanel();
  // Mobilde yeni eleman eklendi → ekrana sığacak şekilde tüm sahneyi fit'le
  if(window.innerWidth < 900){
    setTimeout(pneumFit, 30);
  }
  toast(`${def.label} eklendi`, 'good');
}

function removePneumComp(cid){
  PNEUM.components = PNEUM.components.filter(c=>c.id!==cid);
  PNEUM.hoses = PNEUM.hoses.filter(h=>{
    return !PNEUM.components.find(c=>c.id===cid && c.ports.some(p=>p.id===h.a||p.id===h.b)) &&
           !(h.a.startsWith(cid+'_') || h.b.startsWith(cid+'_'));
  });
  renderPneum();
  renderPneumPanel();
}

/* Pnömatik basınç akışı çözümleyici */
function pneumSolve(){
  // Her port: live (basınçlı) mı?
  // Kompresörden başla → FRL → açık valf yolları → silindirlere doğru
  const liveBlocks = new Set(); // {portId or compId}
  if(!PNEUM.pressureOn){
    return {livePorts:new Set(), liveHoses:new Set()};
  }

  // Önce hortum grafiği kur
  const adj = {};
  PNEUM.hoses.forEach((h,i)=>{
    if(!adj[h.a])adj[h.a]=[];
    if(!adj[h.b])adj[h.b]=[];
    adj[h.a].push({port:h.b,hose:i});
    adj[h.b].push({port:h.a,hose:i});
  });

  // Valf içi geçişleri tanımla
  // Bir komponentin hangi portları birbirine bağlanıyor (valf konumuna göre)?
  function internalLinks(c){
    const links = [];
    const p = pid => c.id+'_'+pid;

    if(c.type==='source'){
      // Source: P çıkışı doğrudan basınçlı
    } else if(c.type==='frl'){
      links.push([p('in'),p('out')]);
    } else if(c.type==='v32'){
      // NC: pressed yoksa P-A kapalı, A-R açık (silindiri tahliye)
      //     pressed varsa P-A açık, A-R kapalı
      if(c.data.pressed){
        links.push([p('p'),p('a')]);
      } else {
        links.push([p('a'),p('r')]);
      }
    } else if(c.type==='v32sol'){
      if(c.data.energized){
        links.push([p('p'),p('a')]);
      } else {
        links.push([p('a'),p('r')]);
      }
    } else if(c.type==='v52'){
      // pressed yoksa: P→B, A→R; pressed: P→A, B→S
      if(c.data.pressed){
        links.push([p('p'),p('a')]);
        links.push([p('b'),p('s')]);
      } else {
        links.push([p('p'),p('b')]);
        links.push([p('a'),p('r')]);
      }
    } else if(c.type==='v52sol'){
      if(c.data.energized){
        links.push([p('p'),p('a')]);
        links.push([p('b'),p('s')]);
      } else {
        links.push([p('p'),p('b')]);
        links.push([p('a'),p('r')]);
      }
    } else if(c.type==='v52dual'){
      // state 'a' = P→A, B→S; state 'b' = P→B, A→R
      if(c.data.state==='a'){
        links.push([p('p'),p('a')]);
        links.push([p('b'),p('s')]);
      } else {
        links.push([p('p'),p('b')]);
        links.push([p('a'),p('r')]);
      }
    } else if(c.type==='v53cc'){
      // mid: tümü kapalı
      if(c.data.state==='a'){
        links.push([p('p'),p('a')]);
        links.push([p('b'),p('s')]);
      } else if(c.data.state==='b'){
        links.push([p('p'),p('b')]);
        links.push([p('a'),p('r')]);
      }
      // mid'te bağlantı yok
    } else if(c.type==='flow'){
      links.push([p('in'),p('out')]);
    } else if(c.type==='mufler'){
      // Susturucu: basıncı tahliye
      // -> port "in" tahliye edilir (live olmasına gerek yok ama dump alanı)
    }
    return links;
  }

  // Birleşik grafi: hortum + internal
  PNEUM.components.forEach(c=>{
    internalLinks(c).forEach(([a,b])=>{
      if(!adj[a])adj[a]=[];
      if(!adj[b])adj[b]=[];
      adj[a].push({port:b,internal:true});
      adj[b].push({port:a,internal:true});
    });
  });

  // BFS: tüm kompresör P portlarından başla
  const livePorts = new Set();
  const sources = [];
  PNEUM.components.forEach(c=>{
    if(c.type==='source'){
      const pPort = c.id+'_p';
      sources.push(pPort);
    }
  });

  // Tahliye/susturucu portlarını "drain" olarak işaretle
  // Bir port susturucu-bağlı veya egzoz portuysa orada basınç kalmaz
  const drains = new Set();
  PNEUM.components.forEach(c=>{
    if(c.type==='mufler'){
      drains.add(c.id+'_in');
    }
    // Egzoz portları (R, S) susturucuya bağlı değilse de açık (atmosfer) sayılır
    if(['v32','v32sol','v52','v52sol','v52dual','v53cc'].includes(c.type)){
      ['r','s'].forEach(prt=>{
        const pid=c.id+'_'+prt;
        // Eğer bu portla hiçbir hortum bağlı değilse, atmosfer
        const hasHose = PNEUM.hoses.some(h=>h.a===pid||h.b===pid);
        if(!hasHose)drains.add(pid);
      });
    }
  });

  // BFS kaynaklardan
  const visited = new Set();
  const queue = [...sources];
  sources.forEach(s=>livePorts.add(s));

  while(queue.length){
    const node = queue.shift();
    if(visited.has(node))continue;
    visited.add(node);
    if(drains.has(node))continue; // tahliye - basınç kayboluyor
    livePorts.add(node);
    if(adj[node]){
      adj[node].forEach(n=>{
        if(!visited.has(n.port))queue.push(n.port);
      });
    }
  }

  // Hortumları işaretle
  const liveHoses = new Set();
  PNEUM.hoses.forEach((h,i)=>{
    if(livePorts.has(h.a) && livePorts.has(h.b))liveHoses.add(i);
  });

  return {livePorts, liveHoses};
}

/* Silindir hareketini hesapla (basınç durumuna göre) */
function pneumUpdateCylinders(livePorts){
  PNEUM.components.forEach(c=>{
    if(c.type==='cyl1'){
      // Tek etkili: in port basınçlıysa ileri, yoksa geri
      const inLive = livePorts.has(c.id+'_in');
      c.data.pos = inLive ? 1 : 0;
    } else if(c.type==='cyl2'){
      // Çift etkili: in1 basınçlıysa ileri, in2 basınçlıysa geri
      const in1Live = livePorts.has(c.id+'_in1');
      const in2Live = livePorts.has(c.id+'_in2');
      if(in1Live && !in2Live)c.data.pos = 1;
      else if(in2Live && !in1Live)c.data.pos = 0;
      // ikisi de değilse pozisyonu koru
    }
  });
}

/* Sensör tetikleme */
function pneumUpdateSensors(){
  PNEUM.components.forEach(c=>{
    if(c.type==='sensor' && c.data.cyl){
      const cyl = PNEUM.components.find(x=>x.id===c.data.cyl);
      if(cyl){
        if(c.data.detect==='end')c.data.active = cyl.data.pos>=1;
        else if(c.data.detect==='start')c.data.active = cyl.data.pos<=0;
      }
    }
  });
}

/* ============= RENDER ============= */
function renderPneum(){
  const svg = document.getElementById('pneumSvg');
  if(!svg)return;
  // ÇOK ÖNEMLİ: defs eklemek için clear et
  svg.innerHTML = `
    <defs>
      <marker id="arrowBlue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#3aa0ff"/>
      </marker>
    </defs>
  `;
  // Çözümle
  const {livePorts, liveHoses} = pneumSolve();
  pneumUpdateCylinders(livePorts);
  pneumUpdateSensors();

  // Hortumlar (komponentlerden önce ki altta kalsın)
  // Akıllı routing: port tarafına göre çıkış yönü, silindirleri etrafından dolaş, dikey kanallarda çakışmayı azalt
  const hosesByLane = {}; // x koordinatına göre lane sayacı
  PNEUM.hoses.forEach((h,i)=>{
    const a = findPneumPort(h.a), b = findPneumPort(h.b);
    if(!a||!b)return;
    const live = liveHoses.has(i);
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', buildHoseRoute(a, b, i));
    path.setAttribute('class','pn-hose'+(live?' live':''));
    path.setAttribute('data-hose',i);
    path.addEventListener('click',e=>{
      e.stopPropagation();
      if(confirm('Bu hortum silinsin mi?')){
        PNEUM.hoses.splice(i,1);
        renderPneum();
      }
    });
    svg.appendChild(path);
  });

  // Komponentleri çiz
  PNEUM.components.forEach(c=>{
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','pn-element');
    g.setAttribute('transform',`translate(${c.x},${c.y})`);
    g.setAttribute('data-id',c.id);
    drawPneumComp(g, c, livePorts);
    svg.appendChild(g);
    // Sürükleme
    bindPneumDrag(g, c);
  });

  renderPneumPanel();
}

function findPneumPort(pid){
  for(const c of PNEUM.components){
    for(const p of c.ports){
      if(p.id===pid){
        return {c, p, gx: c.x+p.x, gy: c.y+p.y};
      }
    }
  }
  return null;
}

/* === AKILLI HORTUM ROUTING ===
   - Port tarafına göre kısa "stub" çıkışı (port üzerinde 18px stick)
   - Sonra dikey kanal (silindir/komponent gövdelerinin altında veya yanında)
   - Çakışmayı azaltmak için hortum indeksine göre lane offseti
   - Silindirlerin ÜSTÜNDEN GEÇMEZ (silindir kutusunu y+h/2'den dolaşır) */
function getPortStub(portInfo, len=24){
  const {p, gx, gy} = portInfo;
  if(p.side==='t')return {x:gx, y:gy-len, dir:'up'};
  if(p.side==='b')return {x:gx, y:gy+len, dir:'down'};
  if(p.side==='l')return {x:gx-len, y:gy, dir:'left'};
  if(p.side==='r')return {x:gx+len, y:gy, dir:'right'};
  return {x:gx, y:gy, dir:'mid'};
}

function buildHoseRoute(a, b, hoseIdx){
  // Stub uzunlukları — aynı x'te birden fazla hortum olursa lane'lere ayır
  const stubA = 20 + (hoseIdx%3)*6;
  const stubB = 20 + (hoseIdx%3)*6;
  const sA = getPortStub(a, stubA);
  const sB = getPortStub(b, stubB);

  // Silindir engellerini topla — silindirlerin üst kenarı (y) ile alt kenarı (y+h) arası bant
  const obstacles = PNEUM.components
    .filter(c=>c.type==='cyl1'||c.type==='cyl2')
    .map(c=>({x1:c.x-5, y1:c.y-5, x2:c.x+c.w+30, y2:c.y+c.h+5, comp:c}));

  // Hortumun gideceği dikey kanal x koordinatını seç
  // İdeal: iki stub'ın ortası, ama silindirin içine düşerse kenara kaydır
  let midX = (sA.x + sB.x) / 2;
  for(const o of obstacles){
    if(midX > o.x1 && midX < o.x2){
      // İçine düşüyor — kenara kaydır (hangi taraf daha kısa?)
      if(Math.abs(sA.x - o.x1) + Math.abs(sB.x - o.x1) < Math.abs(sA.x - o.x2) + Math.abs(sB.x - o.x2)){
        midX = o.x1 - 15;
      } else {
        midX = o.x2 + 15;
      }
    }
  }

  // Hortum yatay kanal y — silindirlerin altından dolaş eğer iki port da silindir hizasında
  // Basit kural: yatay kanal y = max(sA.y, sB.y) + offset, ama silindirlerin altından
  let lowestObsBottom = 0;
  for(const o of obstacles){
    // Eğer hortumun yatay seyahat bölümü silindiri kesecekse
    const segX1 = Math.min(sA.x, midX, sB.x);
    const segX2 = Math.max(sA.x, midX, sB.x);
    if(segX2 > o.x1 && segX1 < o.x2){
      lowestObsBottom = Math.max(lowestObsBottom, o.y2 + 10);
    }
  }
  // Lane offset için her hortum farklı dikey hizada
  const laneOffset = (hoseIdx%5)*8;

  // Path oluştur — port stub'tan başla, dikey/yatay manhattan rotası
  const p = [];
  p.push(`M${a.gx},${a.gy}`);
  // Stub A
  p.push(`L${sA.x},${sA.y}`);

  // Eğer stub'lar farklı taraflara bakıyorsa basit L bağlantı yeterli
  // Çıkış yönlerine göre route belirle
  const dirA = sA.dir, dirB = sB.dir;

  // Dikey kanal kullanımı: iki stub farklı tarafta ise midX dikey kanal
  if((dirA==='down'||dirA==='up') && (dirB==='down'||dirB==='up')){
    // İki stub da dikey çıkıyor → bir yatay köprü kur
    // Köprü y koordinatı: silindirlerin altında veya en altta
    let bridgeY = Math.max(sA.y, sB.y) + 20 + laneOffset;
    if(lowestObsBottom > bridgeY)bridgeY = lowestObsBottom + laneOffset;
    p.push(`L${sA.x},${bridgeY}`);
    p.push(`L${sB.x},${bridgeY}`);
    p.push(`L${sB.x},${sB.y}`);
  } else if((dirA==='left'||dirA==='right') && (dirB==='left'||dirB==='right')){
    // İki stub da yatay çıkıyor → dikey köprü
    let bridgeX = (sA.x + sB.x)/2;
    // Lane offset
    bridgeX += laneOffset;
    // Silindiri keserse kaydır
    for(const o of obstacles){
      if(bridgeX > o.x1 && bridgeX < o.x2){
        bridgeX = o.x2 + 15 + laneOffset;
      }
    }
    p.push(`L${bridgeX},${sA.y}`);
    p.push(`L${bridgeX},${sB.y}`);
    p.push(`L${sB.x},${sB.y}`);
  } else {
    // Karışık (biri dikey biri yatay) → L şeklinde, ama silindir altından
    // sA dikey ise sB yatayın hizasına, sonra sB'ye
    if(dirA==='down'||dirA==='up'){
      // sA dikey çıkıyor → yatay olarak sB.x hizasına, sonra dikey sB.y'ye
      let pathY = sA.y;
      // Silindiri keserse altından dolaş
      for(const o of obstacles){
        const segX1 = Math.min(sA.x, sB.x), segX2 = Math.max(sA.x, sB.x);
        if(segX2 > o.x1 && segX1 < o.x2 && pathY > o.y1 && pathY < o.y2){
          pathY = o.y2 + 15 + laneOffset;
          p.push(`L${sA.x},${pathY}`);
          break;
        }
      }
      p.push(`L${sB.x},${pathY}`);
      p.push(`L${sB.x},${sB.y}`);
    } else {
      // sA yatay → dikey olarak sB.y hizasına, sonra yatay sB.x'e
      let pathX = sA.x;
      for(const o of obstacles){
        const segY1 = Math.min(sA.y, sB.y), segY2 = Math.max(sA.y, sB.y);
        if(segY2 > o.y1 && segY1 < o.y2 && pathX > o.x1 && pathX < o.x2){
          pathX = o.x2 + 15 + laneOffset;
          p.push(`L${pathX},${sA.y}`);
          break;
        }
      }
      p.push(`L${pathX},${sB.y}`);
      p.push(`L${sB.x},${sB.y}`);
    }
  }

  // Stub B → port B
  p.push(`L${b.gx},${b.gy}`);
  return p.join(' ');
}

function drawPneumComp(g, c, livePorts){
  const ns = 'http://www.w3.org/2000/svg';
  // Çerçeve
  if(c.type==='source'){
    // Daire kompresör
    const circ = document.createElementNS(ns,'circle');
    circ.setAttribute('cx',c.w/2);circ.setAttribute('cy',c.h/2);circ.setAttribute('r',c.w/2-4);
    circ.setAttribute('class','pn-frame');
    g.appendChild(circ);
    // P0 etiketi
    const t = document.createElementNS(ns,'text');
    t.setAttribute('x',c.w/2);t.setAttribute('y',c.h/2+4);
    t.setAttribute('class','pn-label');t.setAttribute('font-size','13');
    t.textContent='P0';
    g.appendChild(t);
    // Aşağı ok
    const a = document.createElementNS(ns,'path');
    a.setAttribute('d',`M${c.w/2-6},${c.h/2-18} L${c.w/2},${c.h/2-26} L${c.w/2+6},${c.h/2-18} Z`);
    a.setAttribute('fill','#5b6675');
    g.appendChild(a);

  } else if(c.type==='frl'){
    const r = document.createElementNS(ns,'rect');
    r.setAttribute('x',0);r.setAttribute('y',0);r.setAttribute('width',c.w);r.setAttribute('height',c.h);
    r.setAttribute('class','pn-frame');r.setAttribute('rx',4);
    g.appendChild(r);
    // 3 bölme: filtre, regülatör, yağlayıcı
    [40,80].forEach(x=>{
      const sep = document.createElementNS(ns,'line');
      sep.setAttribute('x1',x);sep.setAttribute('y1',5);sep.setAttribute('x2',x);sep.setAttribute('y2',c.h-5);
      sep.setAttribute('stroke','#5b6675');sep.setAttribute('stroke-width','1');
      g.appendChild(sep);
    });
    ['F','R','L'].forEach((ch,i)=>{
      const t = document.createElementNS(ns,'text');
      t.setAttribute('x',20+i*40);t.setAttribute('y',c.h/2+4);
      t.setAttribute('class','pn-label');t.textContent=ch;
      g.appendChild(t);
    });

  } else if(c.type==='v32' || c.type==='v32sol'){
    // 3/2 valf: 2 kutu yan yana, mevcut konum vurgulu
    drawValveBody(g, c, 2);
    // konumu çizgilerini ekle
    drawValve32Symbols(g, c);

  } else if(c.type==='v52' || c.type==='v52sol' || c.type==='v52dual'){
    drawValveBody(g, c, 2);
    drawValve52Symbols(g, c);

  } else if(c.type==='v53cc'){
    drawValveBody(g, c, 3);
    drawValve53Symbols(g, c);

  } else if(c.type==='cyl1' || c.type==='cyl2'){
    drawCylinder(g, c);

  } else if(c.type==='flow'){
    // Akış kontrol valfi: dikdörtgen + diagonal ok
    const r = document.createElementNS(ns,'rect');
    r.setAttribute('x',10);r.setAttribute('y',15);r.setAttribute('width',60);r.setAttribute('height',30);
    r.setAttribute('class','pn-frame');
    g.appendChild(r);
    const a = document.createElementNS(ns,'path');
    a.setAttribute('d',`M5,40 L75,20`);
    a.setAttribute('stroke','#f5b301');a.setAttribute('stroke-width','2');a.setAttribute('fill','none');
    g.appendChild(a);

  } else if(c.type==='mufler'){
    // Üçgen
    const p = document.createElementNS(ns,'path');
    p.setAttribute('d',`M5,5 L45,25 L5,45 Z`);
    p.setAttribute('class','pn-frame');
    g.appendChild(p);
    const lines = document.createElementNS(ns,'g');
    [12,18,24,30,36].forEach(y=>{
      const l = document.createElementNS(ns,'line');
      l.setAttribute('x1',15);l.setAttribute('y1',y);l.setAttribute('x2',25);l.setAttribute('y2',y);
      l.setAttribute('stroke','#8a96a3');l.setAttribute('stroke-width','1');
      lines.appendChild(l);
    });
    g.appendChild(lines);

  } else if(c.type==='sensor'){
    const r = document.createElementNS(ns,'rect');
    r.setAttribute('x',5);r.setAttribute('y',10);r.setAttribute('width',50);r.setAttribute('height',30);
    r.setAttribute('class','pn-frame');r.setAttribute('rx',4);
    if(c.data.active)r.setAttribute('stroke','#27d07a');
    g.appendChild(r);
    const t = document.createElementNS(ns,'text');
    t.setAttribute('x',30);t.setAttribute('y',30);
    t.setAttribute('class','pn-label');t.setAttribute('font-size','13');
    t.textContent='B';
    if(c.data.active)t.setAttribute('fill','#27d07a');
    g.appendChild(t);
  }

  // Etiket (sol üst)
  if(c.code){
    const lbl = document.createElementNS(ns,'text');
    lbl.setAttribute('x',0);lbl.setAttribute('y',-4);
    lbl.setAttribute('class','pn-label');
    lbl.setAttribute('text-anchor','start');
    lbl.setAttribute('fill','#f5b301');
    lbl.textContent = c.code;
    g.appendChild(lbl);
  }

  // Portlar
  c.ports.forEach(p=>{
    const circ = document.createElementNS(ns,'circle');
    circ.setAttribute('cx',p.x);circ.setAttribute('cy',p.y);circ.setAttribute('r',6);
    circ.setAttribute('class','pn-port'+(livePorts.has(p.id)?' live':''));
    circ.setAttribute('data-port',p.id);
    circ.addEventListener('click',e=>{
      e.stopPropagation();
      pickPneumPort(p.id);
    });
    g.appendChild(circ);
    if(p.label){
      const t = document.createElementNS(ns,'text');
      const lx = p.side==='l' ? p.x-12 : p.side==='r' ? p.x+12 : p.x;
      const ly = p.side==='t' ? p.y-10 : p.side==='b' ? p.y+16 : p.y+4;
      t.setAttribute('x',lx);t.setAttribute('y',ly);
      t.setAttribute('class','pn-label');t.setAttribute('font-size','9');
      t.textContent = p.label;
      g.appendChild(t);
    }
  });

  // Tetikleyici (buton veya selenoid)
  if(c.type==='v32' || c.type==='v52'){
    // Buton ikonu (sol kenarda)
    const btn = document.createElementNS(ns,'rect');
    btn.setAttribute('x',-18);btn.setAttribute('y',c.h/2-10);
    btn.setAttribute('width',14);btn.setAttribute('height',20);
    btn.setAttribute('class','pn-trigger'+(c.data.pressed?' on':''));
    btn.addEventListener('mousedown',e=>{e.stopPropagation();c.data.pressed=true;renderPneum();});
    btn.addEventListener('mouseup',e=>{e.stopPropagation();c.data.pressed=false;renderPneum();});
    btn.addEventListener('mouseleave',e=>{c.data.pressed=false;renderPneum();});
    btn.addEventListener('touchstart',e=>{e.stopPropagation();e.preventDefault();c.data.pressed=true;renderPneum();},{passive:false});
    btn.addEventListener('touchend',e=>{e.stopPropagation();e.preventDefault();c.data.pressed=false;renderPneum();},{passive:false});
    g.appendChild(btn);
  } else if(c.type==='v32sol' || c.type==='v52sol'){
    // Selenoid: kutu + "Y1"
    const sol = document.createElementNS(ns,'rect');
    sol.setAttribute('x',-22);sol.setAttribute('y',c.h/2-12);
    sol.setAttribute('width',18);sol.setAttribute('height',24);
    sol.setAttribute('class','pn-trigger'+(c.data.energized?' on':''));
    sol.addEventListener('click',e=>{e.stopPropagation();c.data.energized=!c.data.energized;renderPneum();});
    g.appendChild(sol);
    const st = document.createElementNS(ns,'text');
    st.setAttribute('x',-13);st.setAttribute('y',c.h/2+4);
    st.setAttribute('text-anchor','middle');st.setAttribute('class','pn-label');st.setAttribute('font-size','9');
    st.textContent=c.data.sol||'Y1';
    g.appendChild(st);
  } else if(c.type==='v52dual' || c.type==='v53cc'){
    // İki selenoid: sol Y1, sağ Y2
    ['left','right'].forEach((side,i)=>{
      const xPos = side==='left' ? -22 : c.w+4;
      const sol = document.createElementNS(ns,'rect');
      sol.setAttribute('x',xPos);sol.setAttribute('y',c.h/2-12);
      sol.setAttribute('width',18);sol.setAttribute('height',24);
      const isActive = (side==='left' && c.data.state==='a') || (side==='right' && c.data.state==='b');
      sol.setAttribute('class','pn-trigger'+(isActive?' on':''));
      sol.addEventListener('click',e=>{
        e.stopPropagation();
        if(c.type==='v52dual')c.data.state = side==='left' ? 'a' : 'b';
        else if(c.type==='v53cc'){
          // Üç konum: a, mid, b
          c.data.state = side==='left' ? 'a' : 'b';
        }
        renderPneum();
      });
      g.appendChild(sol);
      const st = document.createElementNS(ns,'text');
      st.setAttribute('x',xPos+9);st.setAttribute('y',c.h/2+4);
      st.setAttribute('text-anchor','middle');st.setAttribute('class','pn-label');st.setAttribute('font-size','9');
      st.textContent = side==='left' ? (c.data.sol1||'Y1') : (c.data.sol2||'Y2');
      g.appendChild(st);
    });
    // Mid butonu (5/3 için)
    if(c.type==='v53cc'){
      const midBtn = document.createElementNS(ns,'rect');
      midBtn.setAttribute('x',c.w/2-9);midBtn.setAttribute('y',-22);
      midBtn.setAttribute('width',18);midBtn.setAttribute('height',16);
      midBtn.setAttribute('class','pn-trigger'+(c.data.state==='mid'?' on':''));
      midBtn.addEventListener('click',e=>{e.stopPropagation();c.data.state='mid';renderPneum();});
      g.appendChild(midBtn);
      const mt = document.createElementNS(ns,'text');
      mt.setAttribute('x',c.w/2);mt.setAttribute('y',-10);
      mt.setAttribute('text-anchor','middle');mt.setAttribute('class','pn-label');mt.setAttribute('font-size','9');
      mt.textContent='MID';
      g.appendChild(mt);
    }
  }

  // Silindire sensör atama (sensör elemanı için)
  if(c.type==='sensor'){
    // Tıklanınca silindir seç (basit: ilk cyl2'ye otomatik)
    g.addEventListener('dblclick',e=>{
      e.stopPropagation();
      const cyls = PNEUM.components.filter(x=>x.type==='cyl1'||x.type==='cyl2');
      if(!cyls.length){toast('Önce silindir ekle','bad');return;}
      const cur = c.data.cyl;
      const idx = cyls.findIndex(x=>x.id===cur);
      const next = cyls[(idx+1)%cyls.length];
      c.data.cyl = next.id;
      // ileri/geri konumu da toggle
      c.data.detect = c.data.detect==='end' ? 'start' : 'end';
      toast(`Sensör → ${next.code} (${c.data.detect==='end'?'uç':'başlangıç'})`,'good');
      renderPneum();
    });
  }

  // Sil butonu
  const del = document.createElementNS(ns,'circle');
  del.setAttribute('cx',c.w);del.setAttribute('cy',-6);
  del.setAttribute('r',8);
  del.setAttribute('class','pn-delete');
  del.addEventListener('click',e=>{
    e.stopPropagation();
    if(confirm(`${c.code||c.name} silinsin mi?`))removePneumComp(c.id);
  });
  g.appendChild(del);
  const delTxt = document.createElementNS(ns,'text');
  delTxt.setAttribute('x',c.w);delTxt.setAttribute('y',-2);
  delTxt.setAttribute('text-anchor','middle');delTxt.setAttribute('class','pn-delete');
  delTxt.setAttribute('font-size','12');delTxt.setAttribute('fill','#fff');
  delTxt.textContent='×';
  g.appendChild(delTxt);
}

function drawValveBody(g, c, numPositions){
  const ns = 'http://www.w3.org/2000/svg';
  const sectionW = c.w / numPositions;
  for(let i=0;i<numPositions;i++){
    const r = document.createElementNS(ns,'rect');
    r.setAttribute('x',i*sectionW);r.setAttribute('y',0);
    r.setAttribute('width',sectionW);r.setAttribute('height',c.h);
    r.setAttribute('class','pn-frame');
    g.appendChild(r);
  }
}

function drawValve32Symbols(g, c){
  const ns = 'http://www.w3.org/2000/svg';
  const sectionW = c.w/2;
  // Sol kutu (basılı değil, NC pozisyonu): P kapalı, A→R bağlantı
  // Sağ kutu (basılı, açık): P→A
  const pressed = c.data.pressed || c.data.energized;
  const activeBox = pressed ? 1 : 0;

  // Sol kutu (0): A R bağlı, P kapalı (yay tarafı)
  // Sembol: A--R bağlantı (eğri ok)
  // Sağ kutu (1): P-A doğrudan ok
  // Soldan görünüm
  const activeColor = '#3aa0ff';
  const passiveColor = '#5b6675';

  // Sol kutu çizimleri
  if(activeBox===0){
    // A→R (silindiri tahliye)
    const a1 = document.createElementNS(ns,'path');
    a1.setAttribute('d',`M${sectionW/2},10 L${sectionW/2-15},${c.h-10}`);
    a1.setAttribute('stroke',activeColor);a1.setAttribute('stroke-width','2');
    a1.setAttribute('marker-end','url(#arrowBlue)');
    a1.setAttribute('fill','none');
    g.appendChild(a1);
    // P kapalı (T çizgi)
    const p1 = document.createElementNS(ns,'path');
    p1.setAttribute('d',`M${sectionW/2-5},${c.h-15} L${sectionW/2+5},${c.h-15} M${sectionW/2},${c.h-15} L${sectionW/2},${c.h-10}`);
    p1.setAttribute('stroke',activeColor);p1.setAttribute('stroke-width','2');p1.setAttribute('fill','none');
    g.appendChild(p1);
  } else {
    // pasif
    const a1 = document.createElementNS(ns,'path');
    a1.setAttribute('d',`M${sectionW/2},10 L${sectionW/2-15},${c.h-10}`);
    a1.setAttribute('stroke',passiveColor);a1.setAttribute('stroke-width','1.5');a1.setAttribute('fill','none');
    g.appendChild(a1);
  }

  // Sağ kutu çizimleri (P-A)
  if(activeBox===1){
    const p2 = document.createElementNS(ns,'path');
    p2.setAttribute('d',`M${sectionW+sectionW/2},${c.h-10} L${sectionW+sectionW/2},10`);
    p2.setAttribute('stroke',activeColor);p2.setAttribute('stroke-width','2.5');
    p2.setAttribute('marker-end','url(#arrowBlue)');
    p2.setAttribute('fill','none');
    g.appendChild(p2);
  } else {
    const p2 = document.createElementNS(ns,'path');
    p2.setAttribute('d',`M${sectionW+sectionW/2},${c.h-10} L${sectionW+sectionW/2},10`);
    p2.setAttribute('stroke',passiveColor);p2.setAttribute('stroke-width','1.5');p2.setAttribute('fill','none');
    g.appendChild(p2);
  }

  // Aktif kutuyu vurgula
  const highlight = document.createElementNS(ns,'rect');
  highlight.setAttribute('x',activeBox*sectionW+1);highlight.setAttribute('y',1);
  highlight.setAttribute('width',sectionW-2);highlight.setAttribute('height',c.h-2);
  highlight.setAttribute('fill','rgba(58,160,255,0.08)');
  highlight.setAttribute('stroke','#3aa0ff');highlight.setAttribute('stroke-width','1');
  g.appendChild(highlight);
}

function drawValve52Symbols(g, c){
  const ns = 'http://www.w3.org/2000/svg';
  const sectionW = c.w/2;
  const pressed = c.data.pressed || c.data.energized || c.data.state==='b';
  const activeBox = pressed ? 1 : 0;
  const activeColor = '#3aa0ff';
  const passiveColor = '#5b6675';

  // Sol kutu (varsayılan): P→B (sağ), A→R (sol egzoz)
  // Sağ kutu (aktif): P→A (sol), B→S (sağ egzoz)
  // Sol kutu çizimleri
  // P→B path
  const draw = (boxIdx, fromX, fromY, toX, toY, color, w) => {
    const p = document.createElementNS(ns,'path');
    p.setAttribute('d',`M${fromX},${fromY} L${toX},${toY}`);
    p.setAttribute('stroke',color);p.setAttribute('stroke-width',w);
    p.setAttribute('marker-end','url(#arrowBlue)');
    p.setAttribute('fill','none');
    g.appendChild(p);
  };
  // sol kutu (aktif değilse) P→B çizgisi:
  // Sol box: P sağ-alt, B sağ-üst → diagonal
  if(activeBox===0){
    draw(0, sectionW/2, c.h-10, sectionW-15, 10, activeColor, 2.5);  // P→B
    draw(0, 15, 10, 15, c.h-10, activeColor, 2);  // A→R (yatay aşağı)
  } else {
    // Sağ kutu: P→A, B→S
    draw(1, sectionW+sectionW/2, c.h-10, sectionW+15, 10, activeColor, 2.5); // P→A
    draw(1, c.w-15, 10, c.w-15, c.h-10, activeColor, 2);  // B→S
  }

  // Aktif kutu vurgu
  const highlight = document.createElementNS(ns,'rect');
  highlight.setAttribute('x',activeBox*sectionW+1);highlight.setAttribute('y',1);
  highlight.setAttribute('width',sectionW-2);highlight.setAttribute('height',c.h-2);
  highlight.setAttribute('fill','rgba(58,160,255,0.08)');
  highlight.setAttribute('stroke','#3aa0ff');highlight.setAttribute('stroke-width','1');
  g.appendChild(highlight);
}

function drawValve53Symbols(g, c){
  const ns = 'http://www.w3.org/2000/svg';
  const sectionW = c.w/3;
  let activeBox = 1; // mid
  if(c.data.state==='a')activeBox=0;
  else if(c.data.state==='b')activeBox=2;
  const activeColor = '#3aa0ff';

  // Sol kutu (Y1, a state): P→A, B→S
  // Orta (mid): tüm kapalı (sadece T şeklinde işaretler)
  // Sağ kutu (Y2, b state): P→B, A→R

  if(activeBox===0){
    const p1 = document.createElementNS(ns,'path');
    p1.setAttribute('d',`M${sectionW/2},${c.h-10} L15,10`);
    p1.setAttribute('stroke',activeColor);p1.setAttribute('stroke-width','2.5');
    p1.setAttribute('marker-end','url(#arrowBlue)');p1.setAttribute('fill','none');
    g.appendChild(p1);
  } else if(activeBox===2){
    const p1 = document.createElementNS(ns,'path');
    p1.setAttribute('d',`M${2*sectionW+sectionW/2},${c.h-10} L${c.w-15},10`);
    p1.setAttribute('stroke',activeColor);p1.setAttribute('stroke-width','2.5');
    p1.setAttribute('marker-end','url(#arrowBlue)');p1.setAttribute('fill','none');
    g.appendChild(p1);
  } else {
    // mid - tüm portlar kapalı (T sembolleri)
    [sectionW+30,sectionW+sectionW/2,sectionW+sectionW-30].forEach(x=>{
      const l = document.createElementNS(ns,'line');
      l.setAttribute('x1',x-5);l.setAttribute('y1',c.h/2);l.setAttribute('x2',x+5);l.setAttribute('y2',c.h/2);
      l.setAttribute('stroke','#8a96a3');l.setAttribute('stroke-width','2');
      g.appendChild(l);
    });
  }

  // Vurgu
  const highlight = document.createElementNS(ns,'rect');
  highlight.setAttribute('x',activeBox*sectionW+1);highlight.setAttribute('y',1);
  highlight.setAttribute('width',sectionW-2);highlight.setAttribute('height',c.h-2);
  highlight.setAttribute('fill','rgba(58,160,255,0.08)');
  highlight.setAttribute('stroke','#3aa0ff');highlight.setAttribute('stroke-width','1');
  g.appendChild(highlight);
}

function drawCylinder(g, c){
  const ns = 'http://www.w3.org/2000/svg';
  const bodyW = c.w - 40;
  // Silindir gövdesi
  const body = document.createElementNS(ns,'rect');
  body.setAttribute('x',0);body.setAttribute('y',5);body.setAttribute('width',bodyW);body.setAttribute('height',c.h-10);
  body.setAttribute('class','cyl-body');
  g.appendChild(body);
  // Piston pozisyonu (0 = sol, 1 = sağ)
  const pos = c.data.pos || 0;
  const pistonX = 10 + pos * (bodyW - 25);
  const piston = document.createElementNS(ns,'rect');
  piston.setAttribute('x',pistonX);piston.setAttribute('y',8);piston.setAttribute('width',8);piston.setAttribute('height',c.h-16);
  piston.setAttribute('class','cyl-piston');
  g.appendChild(piston);
  // Rod (mil) — pistondan sağa uzanır
  const rodX1 = pistonX+8;
  const rodEnd = bodyW + 30;
  const rod = document.createElementNS(ns,'line');
  rod.setAttribute('x1',rodX1);rod.setAttribute('y1',c.h/2);
  rod.setAttribute('x2',rodEnd);rod.setAttribute('y2',c.h/2);
  rod.setAttribute('class','cyl-rod');
  g.appendChild(rod);
  // Yay (tek etkili için)
  if(c.type==='cyl1'){
    const sp = document.createElementNS(ns,'path');
    sp.setAttribute('d',`M${bodyW-5},${c.h/2} L${pistonX+8},${c.h/2-6} L${pistonX+12},${c.h/2+6} L${pistonX+16},${c.h/2-6} L${pistonX+20},${c.h/2+6} L${pistonX+24},${c.h/2}`);
    sp.setAttribute('stroke','#888');sp.setAttribute('stroke-width','1.5');sp.setAttribute('fill','none');
    g.appendChild(sp);
  }
  // Pozisyon göstergesi
  const ind = document.createElementNS(ns,'text');
  ind.setAttribute('x',c.w/2);ind.setAttribute('y',c.h+15);
  ind.setAttribute('class','pn-label');ind.setAttribute('font-size','9');
  ind.textContent = pos>=1 ? '> İLERİ' : pos<=0 ? '< GERİ' : '— ARA';
  g.appendChild(ind);
}

function pickPneumPort(pid){
  if(!PNEUM_PENDING){
    PNEUM_PENDING = pid;
    // Görsel: portu sarı yap (zaten hover style var ama kalıcı işaret koymuyoruz, kullanıcı vurguyu görür)
    toast('Şimdi ikinci porta tıkla → hortum çekilsin','good');
    return;
  }
  if(PNEUM_PENDING===pid){PNEUM_PENDING=null;return;}
  // Aynı portla daha önce bağlı mı?
  const exists = PNEUM.hoses.some(h=>(h.a===PNEUM_PENDING&&h.b===pid)||(h.a===pid&&h.b===PNEUM_PENDING));
  if(!exists)PNEUM.hoses.push({a:PNEUM_PENDING, b:pid});
  PNEUM_PENDING=null;
  renderPneum();
}

function bindPneumDrag(g, c){
  let drag=false, sx, sy, ox, oy;
  const onStart = (x,y)=>{drag=true;sx=x;sy=y;ox=c.x;oy=c.y;};
  const onMove = (x,y)=>{
    if(!drag)return;
    c.x = Math.max(0, ox + (x-sx));
    c.y = Math.max(0, oy + (y-sy));
    g.setAttribute('transform',`translate(${c.x},${c.y})`);
    renderPneum(); // hortumları yeniden çiz
  };
  const onEnd = ()=>{drag=false;};

  // Sadece valf gövdesinden sürüklensin (port veya butona tıklama olmasın)
  g.addEventListener('mousedown',e=>{
    if(e.target.tagName==='circle' || e.target.classList.contains('pn-trigger'))return;
    e.preventDefault();
    onStart(e.clientX, e.clientY);
  });
  g.addEventListener('touchstart',e=>{
    if(e.target.tagName==='circle' || e.target.classList.contains('pn-trigger'))return;
    onStart(e.touches[0].clientX, e.touches[0].clientY);
  },{passive:true});
  window.addEventListener('mousemove',e=>onMove(e.clientX,e.clientY));
  window.addEventListener('touchmove',e=>{if(drag)onMove(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
  window.addEventListener('mouseup',onEnd);
  window.addEventListener('touchend',onEnd);
}

function renderPneumPanel(){
  // Selenoidler
  const sols = document.getElementById('pneumSols');
  if(!sols)return;
  sols.innerHTML='';
  const allSols = [];
  PNEUM.components.forEach(c=>{
    if(c.type==='v32sol'||c.type==='v52sol'){
      allSols.push({comp:c, sol:c.data.sol||'Y1', val:c.data.energized});
    } else if(c.type==='v52dual'||c.type==='v53cc'){
      allSols.push({comp:c, sol:c.data.sol1||'Y1', val:c.data.state==='a'});
      allSols.push({comp:c, sol:c.data.sol2||'Y2', val:c.data.state==='b'});
    }
  });
  if(!allSols.length){
    sols.innerHTML='<div style="grid-column:span 2;font-size:10px;color:var(--muted);text-align:center;padding:10px">— selenoid yok —</div>';
  } else {
    allSols.forEach((s,i)=>{
      const d = document.createElement('div');
      d.className = 'iobit btn-style '+(s.val?'on':'');
      d.innerHTML=`<span class="bv">${s.val?'1':'0'}</span>${s.sol}`;
      d.onclick=()=>{
        // ilgili komponenti aç/kapa
        if(s.comp.type==='v32sol'||s.comp.type==='v52sol'){
          s.comp.data.energized=!s.comp.data.energized;
        } else if(s.comp.type==='v52dual'||s.comp.type==='v53cc'){
          if(s.sol===s.comp.data.sol1){
            s.comp.data.state = s.comp.data.state==='a' ? 'mid' : 'a';
          } else {
            s.comp.data.state = s.comp.data.state==='b' ? 'mid' : 'b';
          }
        }
        renderPneum();
      };
      sols.appendChild(d);
    });
  }

  // Sensörler
  const sns = document.getElementById('pneumSensors');
  if(sns){
    let html='';
    PNEUM.components.filter(c=>c.type==='sensor').forEach(c=>{
      const cyl = c.data.cyl ? PNEUM.components.find(x=>x.id===c.data.cyl) : null;
      html+=`<div>${c.code}: ${c.data.active?'<span style="color:var(--live)">●AKTIF</span>':'<span style="color:var(--muted)">○boş</span>'} ${cyl?`(${cyl.code} ${c.data.detect})`:''}</div>`;
    });
    sns.innerHTML = html || '— sensör yok (sensör ekle, çift tık ile silindire bağla) —';
  }

  // Silindirler
  const cyls = document.getElementById('pneumCyls');
  if(cyls){
    let html='';
    PNEUM.components.filter(c=>c.type==='cyl1'||c.type==='cyl2').forEach(c=>{
      const state = c.data.pos>=1 ? '<span style="color:var(--live)">İLERİ ▶</span>' : c.data.pos<=0 ? '<span style="color:var(--accent)">◀ GERİ</span>' : 'ARA';
      html+=`<div>${c.code}: ${state}</div>`;
    });
    cyls.innerHTML = html || '— silindir yok —';
  }
}

/* HAZIR ÖRNEKLER */
const PNEUM_EXAMPLES = {
  empty: () => {PNEUM.components=[];PNEUM.hoses=[];PNEUM_COUNTER=0;},

  single32: () => {
    PNEUM.components = [
      {id:'pn1',type:'source',name:'Kompresör',code:'P0',x:50,y:300,w:80,h:60,ports:[{id:'pn1_p',label:'P',x:80,y:30,side:'r'}],data:{}},
      {id:'pn2',type:'frl',name:'FRL',code:'Z1',x:180,y:300,w:120,h:60,ports:[{id:'pn2_in',label:'P1',x:0,y:30,side:'l'},{id:'pn2_out',label:'P',x:120,y:30,side:'r'}],data:{}},
      {id:'pn3',type:'v32',name:'3/2 Buton Valf',code:'V1',x:400,y:300,w:120,h:80,ports:[
        {id:'pn3_p',label:'P',x:60,y:80,side:'b'},
        {id:'pn3_a',label:'A',x:60,y:0,side:'t'},
        {id:'pn3_r',label:'R',x:0,y:80,side:'b'}
      ],data:{pressed:false,nc:true}},
      {id:'pn4',type:'cyl1',name:'Tek Etkili Silindir',code:'A1',x:650,y:200,w:180,h:50,ports:[{id:'pn4_in',label:'P',x:15,y:50,side:'b'}],data:{pos:0,kind:'single'}}
    ];
    PNEUM.hoses = [
      {a:'pn1_p',b:'pn2_in'},
      {a:'pn2_out',b:'pn3_p'},
      {a:'pn3_a',b:'pn4_in'}
    ];
    PNEUM_COUNTER = 4;
  },

  double52: () => {
    PNEUM.components = [
      {id:'pn1',type:'source',name:'Kompresör',code:'P0',x:50,y:350,w:80,h:60,ports:[{id:'pn1_p',label:'P',x:80,y:30,side:'r'}],data:{}},
      {id:'pn2',type:'frl',name:'FRL',code:'Z1',x:180,y:350,w:120,h:60,ports:[{id:'pn2_in',label:'P1',x:0,y:30,side:'l'},{id:'pn2_out',label:'P',x:120,y:30,side:'r'}],data:{}},
      {id:'pn3',type:'v52',name:'5/2 Buton',code:'V1',x:400,y:350,w:160,h:80,ports:[
        {id:'pn3_p',label:'P',x:80,y:80,side:'b'},
        {id:'pn3_a',label:'A',x:40,y:0,side:'t'},
        {id:'pn3_b',label:'B',x:120,y:0,side:'t'},
        {id:'pn3_r',label:'R',x:0,y:80,side:'b'},
        {id:'pn3_s',label:'S',x:160,y:80,side:'b'}
      ],data:{pressed:false}},
      {id:'pn4',type:'cyl2',name:'Çift Etkili',code:'A1',x:680,y:200,w:200,h:50,ports:[
        {id:'pn4_in1',label:'A',x:15,y:50,side:'b'},
        {id:'pn4_in2',label:'B',x:165,y:50,side:'b'}
      ],data:{pos:0,kind:'double'}}
    ];
    PNEUM.hoses = [
      {a:'pn1_p',b:'pn2_in'},
      {a:'pn2_out',b:'pn3_p'},
      {a:'pn3_a',b:'pn4_in1'},
      {a:'pn3_b',b:'pn4_in2'}
    ];
    PNEUM_COUNTER = 4;
  },

  solenoid52: () => {
    PNEUM.components = [
      {id:'pn1',type:'source',name:'Kompresör',code:'P0',x:50,y:350,w:80,h:60,ports:[{id:'pn1_p',label:'P',x:80,y:30,side:'r'}],data:{}},
      {id:'pn2',type:'frl',name:'FRL',code:'Z1',x:180,y:350,w:120,h:60,ports:[{id:'pn2_in',label:'P1',x:0,y:30,side:'l'},{id:'pn2_out',label:'P',x:120,y:30,side:'r'}],data:{}},
      {id:'pn3',type:'v52sol',name:'5/2 Selenoid',code:'V1',x:400,y:350,w:160,h:80,ports:[
        {id:'pn3_p',label:'P',x:80,y:80,side:'b'},
        {id:'pn3_a',label:'A',x:40,y:0,side:'t'},
        {id:'pn3_b',label:'B',x:120,y:0,side:'t'},
        {id:'pn3_r',label:'R',x:0,y:80,side:'b'},
        {id:'pn3_s',label:'S',x:160,y:80,side:'b'}
      ],data:{energized:false,sol:'Y1'}},
      {id:'pn4',type:'cyl2',name:'Çift Etkili',code:'A1',x:680,y:200,w:200,h:50,ports:[
        {id:'pn4_in1',label:'A',x:15,y:50,side:'b'},
        {id:'pn4_in2',label:'B',x:165,y:50,side:'b'}
      ],data:{pos:0,kind:'double'}}
    ];
    PNEUM.hoses = [
      {a:'pn1_p',b:'pn2_in'},
      {a:'pn2_out',b:'pn3_p'},
      {a:'pn3_a',b:'pn4_in1'},
      {a:'pn3_b',b:'pn4_in2'}
    ];
    PNEUM_COUNTER = 4;
  },

  doubleSol52: () => {
    PNEUM.components = [
      {id:'pn1',type:'source',name:'Kompresör',code:'P0',x:50,y:350,w:80,h:60,ports:[{id:'pn1_p',label:'P',x:80,y:30,side:'r'}],data:{}},
      {id:'pn2',type:'frl',name:'FRL',code:'Z1',x:180,y:350,w:120,h:60,ports:[{id:'pn2_in',label:'P1',x:0,y:30,side:'l'},{id:'pn2_out',label:'P',x:120,y:30,side:'r'}],data:{}},
      {id:'pn3',type:'v52dual',name:'5/2 Çift Bobinli',code:'V1',x:400,y:350,w:160,h:80,ports:[
        {id:'pn3_p',label:'P',x:80,y:80,side:'b'},
        {id:'pn3_a',label:'A',x:40,y:0,side:'t'},
        {id:'pn3_b',label:'B',x:120,y:0,side:'t'},
        {id:'pn3_r',label:'R',x:0,y:80,side:'b'},
        {id:'pn3_s',label:'S',x:160,y:80,side:'b'}
      ],data:{state:'a',sol1:'Y1',sol2:'Y2'}},
      {id:'pn4',type:'cyl2',name:'Çift Etkili',code:'A1',x:680,y:200,w:200,h:50,ports:[
        {id:'pn4_in1',label:'A',x:15,y:50,side:'b'},
        {id:'pn4_in2',label:'B',x:165,y:50,side:'b'}
      ],data:{pos:0,kind:'double'}}
    ];
    PNEUM.hoses = [
      {a:'pn1_p',b:'pn2_in'},
      {a:'pn2_out',b:'pn3_p'},
      {a:'pn3_a',b:'pn4_in1'},
      {a:'pn3_b',b:'pn4_in2'}
    ];
    PNEUM_COUNTER = 4;
  },

  valve53: () => {
    PNEUM.components = [
      {id:'pn1',type:'source',name:'Kompresör',code:'P0',x:50,y:350,w:80,h:60,ports:[{id:'pn1_p',label:'P',x:80,y:30,side:'r'}],data:{}},
      {id:'pn2',type:'frl',name:'FRL',code:'Z1',x:180,y:350,w:120,h:60,ports:[{id:'pn2_in',label:'P1',x:0,y:30,side:'l'},{id:'pn2_out',label:'P',x:120,y:30,side:'r'}],data:{}},
      {id:'pn3',type:'v53cc',name:'5/3 Orta Kapalı',code:'V1',x:380,y:350,w:200,h:80,ports:[
        {id:'pn3_p',label:'P',x:100,y:80,side:'b'},
        {id:'pn3_a',label:'A',x:50,y:0,side:'t'},
        {id:'pn3_b',label:'B',x:150,y:0,side:'t'},
        {id:'pn3_r',label:'R',x:0,y:80,side:'b'},
        {id:'pn3_s',label:'S',x:200,y:80,side:'b'}
      ],data:{state:'mid',sol1:'Y1',sol2:'Y2'}},
      {id:'pn4',type:'cyl2',name:'Çift Etkili',code:'A1',x:700,y:200,w:200,h:50,ports:[
        {id:'pn4_in1',label:'A',x:15,y:50,side:'b'},
        {id:'pn4_in2',label:'B',x:165,y:50,side:'b'}
      ],data:{pos:0,kind:'double'}}
    ];
    PNEUM.hoses = [
      {a:'pn1_p',b:'pn2_in'},
      {a:'pn2_out',b:'pn3_p'},
      {a:'pn3_a',b:'pn4_in1'},
      {a:'pn3_b',b:'pn4_in2'}
    ];
    PNEUM_COUNTER = 4;
  },

  flowctrl: () => {
    PNEUM.components = [
      {id:'pn1',type:'source',name:'Kompresör',code:'P0',x:50,y:350,w:80,h:60,ports:[{id:'pn1_p',label:'P',x:80,y:30,side:'r'}],data:{}},
      {id:'pn2',type:'frl',name:'FRL',code:'Z1',x:180,y:350,w:120,h:60,ports:[{id:'pn2_in',label:'P1',x:0,y:30,side:'l'},{id:'pn2_out',label:'P',x:120,y:30,side:'r'}],data:{}},
      {id:'pn3',type:'v52',name:'5/2 Buton',code:'V1',x:380,y:350,w:160,h:80,ports:[
        {id:'pn3_p',label:'P',x:80,y:80,side:'b'},{id:'pn3_a',label:'A',x:40,y:0,side:'t'},
        {id:'pn3_b',label:'B',x:120,y:0,side:'t'},{id:'pn3_r',label:'R',x:0,y:80,side:'b'},
        {id:'pn3_s',label:'S',x:160,y:80,side:'b'}
      ],data:{pressed:false}},
      {id:'pn4',type:'flow',name:'Akış Kontrol',code:'F1',x:600,y:200,w:80,h:60,ports:[
        {id:'pn4_in',label:'',x:0,y:30,side:'l'},{id:'pn4_out',label:'',x:80,y:30,side:'r'}
      ],data:{open:50}},
      {id:'pn5',type:'cyl2',name:'Çift Etkili',code:'A1',x:730,y:200,w:200,h:50,ports:[
        {id:'pn5_in1',label:'A',x:15,y:50,side:'b'},
        {id:'pn5_in2',label:'B',x:165,y:50,side:'b'}
      ],data:{pos:0,kind:'double'}}
    ];
    PNEUM.hoses = [
      {a:'pn1_p',b:'pn2_in'},{a:'pn2_out',b:'pn3_p'},
      {a:'pn3_a',b:'pn4_in'},{a:'pn4_out',b:'pn5_in1'},
      {a:'pn3_b',b:'pn5_in2'}
    ];
    PNEUM_COUNTER = 5;
  },

  seqAB: () => {
    // A+B+A-B- sıralı çevrim — basitleştirilmiş, görsel ağırlıklı
    PNEUM.components = [
      {id:'pn1',type:'source',name:'Kompresör',code:'P0',x:30,y:400,w:80,h:60,ports:[{id:'pn1_p',label:'P',x:80,y:30,side:'r'}],data:{}},
      {id:'pn2',type:'frl',name:'FRL',code:'Z1',x:160,y:400,w:120,h:60,ports:[{id:'pn2_in',label:'P1',x:0,y:30,side:'l'},{id:'pn2_out',label:'P',x:120,y:30,side:'r'}],data:{}},
      {id:'pn3',type:'v52dual',name:'V_A',code:'V1',x:350,y:400,w:160,h:80,ports:[
        {id:'pn3_p',label:'P',x:80,y:80,side:'b'},{id:'pn3_a',label:'A',x:40,y:0,side:'t'},
        {id:'pn3_b',label:'B',x:120,y:0,side:'t'},{id:'pn3_r',label:'R',x:0,y:80,side:'b'},
        {id:'pn3_s',label:'S',x:160,y:80,side:'b'}
      ],data:{state:'a',sol1:'Y1',sol2:'Y2'}},
      {id:'pn4',type:'v52dual',name:'V_B',code:'V2',x:600,y:400,w:160,h:80,ports:[
        {id:'pn4_p',label:'P',x:80,y:80,side:'b'},{id:'pn4_a',label:'A',x:40,y:0,side:'t'},
        {id:'pn4_b',label:'B',x:120,y:0,side:'t'},{id:'pn4_r',label:'R',x:0,y:80,side:'b'},
        {id:'pn4_s',label:'S',x:160,y:80,side:'b'}
      ],data:{state:'a',sol1:'Y3',sol2:'Y4'}},
      {id:'pn5',type:'cyl2',name:'A Silindiri',code:'A1',x:330,y:200,w:200,h:50,ports:[
        {id:'pn5_in1',label:'A',x:15,y:50,side:'b'},
        {id:'pn5_in2',label:'B',x:165,y:50,side:'b'}
      ],data:{pos:0,kind:'double'}},
      {id:'pn6',type:'cyl2',name:'B Silindiri',code:'A2',x:580,y:200,w:200,h:50,ports:[
        {id:'pn6_in1',label:'A',x:15,y:50,side:'b'},
        {id:'pn6_in2',label:'B',x:165,y:50,side:'b'}
      ],data:{pos:0,kind:'double'}},
      {id:'pn7',type:'sensor',name:'a1 ileri',code:'B1',x:540,y:240,w:60,h:50,ports:[],data:{detect:'end',cyl:'pn5',active:false}},
      {id:'pn8',type:'sensor',name:'b1 ileri',code:'B2',x:790,y:240,w:60,h:50,ports:[],data:{detect:'end',cyl:'pn6',active:false}}
    ];
    PNEUM.hoses = [
      {a:'pn1_p',b:'pn2_in'},
      {a:'pn2_out',b:'pn3_p'},
      {a:'pn2_out',b:'pn4_p'},
      {a:'pn3_a',b:'pn5_in1'},{a:'pn3_b',b:'pn5_in2'},
      {a:'pn4_a',b:'pn6_in1'},{a:'pn4_b',b:'pn6_in2'}
    ];
    PNEUM_COUNTER = 8;
  }
};

function loadPneumExample(key){
  if(!key)return;
  if(PNEUM.pressureOn)togglePneum();
  PNEUM = {components:[], hoses:[], pressureOn:false};
  PNEUM_COUNTER = 0;
  PNEUM_EXAMPLES[key]();
  renderPneum();
  renderPneumPanel();
  toast(`Örnek yüklendi: ${key}`, 'good');
  // Stat tracking
  if(typeof PROFILE!=='undefined' && key!=='empty'){
    PROFILE.stats.pneumExamples = (PROFILE.stats.pneumExamples||0)+1;
    saveProfile(PROFILE);
    checkBadges();
  }
  document.getElementById('pneumExamples').value='';
}