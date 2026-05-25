/* =================================================================
   UYGULAMA ÇEKİRDEĞİ — Değişkenler, boot, sekme geçişi, toast, admin
   ================================================================= */

/* =================================================================
   UYGULAMA DEĞİŞKENLERİ
   ================================================================= */
let CUR=null, WIRES=[], pending=null;
let completed=JSON.parse(localStorage.getItem('eg_done')||'[]');
let scale=1, panX=0, panY=0;
let SIM_STATE = {}; // {nodeId: {pressed, energized, ...}}
let SANDBOX_MODE = false;
let EDIT_TARGET = null;
let SANDBOX_COUNTER = 0;
let VIEW_MODE='free'; // 'free' veya 'schema'
let POWER_WIRES=[]; // 3 fazlı güç devresi telleri
let POWER_PENDING=null;

/* ─── LAZY MODULE LOADER ─────────────────────────────────────────────────── */
const _loadedMods = new Set();
// Bu modüller kendi HTML'ini render eder — yüklenirken section temizlenebilir
const _SELF_RENDER = new Set(['js/sensor.js','js/guvenlik.js','js/dokuman.js','js/robot.js']);
function _loadMod(src) {
  if (_loadedMods.has(src)) return Promise.resolve();
  // Tab id'yi src'den çıkar (js/plc.js → plc, js/pneumatik.js → pneum, js/mech.js → mech)
  const tabMap = {'js/plc.js':'plc','js/pneumatik.js':'pneum','js/mech.js':'mech','js/sensor.js':'sensor','js/guvenlik.js':'guvenlik','js/dokuman.js':'dokuman','js/robot.js':'robot'};
  const tabId = tabMap[src];
  const section = tabId && document.getElementById('tab-'+tabId);
  // Sadece kendi HTML'ini oluşturan modüller için spinner göster
  // plc.js / pneumatik.js / mech.js index.html'deki statik HTML'e bağımlı — dokunma!
  if(section && _SELF_RENDER.has(src)) section.innerHTML = `<div class="mod-loading"><div class="mod-spinner"></div><p>Yükleniyor…</p></div>`;
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => {
      _loadedMods.add(src);
      if(section && _SELF_RENDER.has(src)) section.innerHTML = '';
      res();
    };
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

/* Stubs — gerçek fonksiyonlar modül yüklenince override eder */
const _modErr = (name) => () => toast(`${name} modülü yüklenemedi — bağlantı kontrol et`, 'bad');
function openPLC()      { _loadMod('js/plc.js').then(()         => window.openPLC())      .catch(_modErr('PLC')); }
function openPneum()    { _loadMod('js/pneumatik.js').then(()   => window.openPneum())    .catch(_modErr('Pnömatik')); }
function openMech()     { _loadMod('js/mech.js').then(()        => window.openMech())     .catch(_modErr('Mekanik')); }
function openSensor()   { _loadMod('js/sensor.js').then(()      => window.openSensor())   .catch(_modErr('Sensörler')); }
function openGuvenlik() { _loadMod('js/guvenlik.js').then(()    => window.openGuvenlik()) .catch(_modErr('Güvenlik')); }
function openDokuman()  { _loadMod('js/dokuman.js').then(()     => window.openDokuman())  .catch(_modErr('Dökümanlar')); }
function openRobot()    { _loadMod('js/robot.js').then(()       => window.openRobot())    .catch(_modErr('Robot')); }

function boot(){
  const u=DB.user();
  if(!u){document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('appView').classList.add('hidden');return;}
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('appView').classList.remove('hidden');
  document.getElementById('userBadge').textContent=(u.role==='admin'?'YÖNETİCİ':'OPERATÖR');
  if(u.role==='admin'){document.getElementById('adminTab').style.display='block';}
  // Profil yükle ve XP bar göster (operatör ise)
  PROFILE = loadProfile();
  renderXpBar();
  switchTab('tasks');
  renderTasks();
  renderLibrary();
  // İlk giriş onboarding'i (operatör ise ve daha önce görmediyse)
  setTimeout(showOnboardingIfFirstTime, 500);
}
function switchTab(t){
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===t));
  ['tasks','bench','admin','library','plc','pneum','mech','robot','sensor','guvenlik','dokuman'].forEach(s=>{
    const el=document.getElementById('tab-'+s);
    if(el) el.classList.toggle('hidden',s!==t);
  });
  if(t==='admin')renderAdmin();
  window.scrollTo(0,0);
}
function toggleAcc(id){
  if(window.innerWidth>=900) return;
  document.getElementById(id).classList.toggle('open');
}

/* =================================================================
   GÖREV LİSTESİ
   ================================================================= */

function renderAdmin(){
  const logs=DB.logs(),b=document.getElementById('logBody'),tb=document.getElementById('logTabBody');
  if(!logs.length){
    b.innerHTML=`<div class="empty">Henüz kayıt yok.</div>`;
    tb.innerHTML=`<tr><td colspan="6"><div class="empty">Henüz kayıt yok.</div></td></tr>`;
  }else{
    b.innerHTML=logs.map(l=>`<div class="logitem ${l.pass?'ok':'bad'}">
      <div class="lr"><span>${l.user}</span><span>${l.ts}</span></div>
      <div class="lt">${l.task}</div>
      <div class="ls ${l.pass?'ok':'bad'}">${l.pass?'✓ BAŞARILI':'✗ HATALI'} · Skor ${l.score}</div>
      ${l.errors!=='—'?`<div class="le">${l.errors.split(' | ').map(x=>'• '+x).join('<br>')}</div>`:''}
    </div>`).join('');
    tb.innerHTML=logs.map(l=>`<tr><td>${l.ts}</td><td>${l.user}</td><td>${l.task}</td><td>${l.score}</td>
      <td class="${l.pass?'tag-ok':'tag-err'}">${l.pass?'BAŞARILI':'HATALI'}</td>
      <td class="${l.errors==='—'?'':'tag-err'}">${l.errors}</td></tr>`).join('');
  }
  document.getElementById('stTotal').textContent=logs.length;
  document.getElementById('stErr').textContent=logs.filter(l=>!l.pass).length;
  document.getElementById('stPass').textContent=logs.filter(l=>l.pass).length;
  document.getElementById('stUsers').textContent=new Set(logs.map(l=>l.email)).size;
}
function clearLogs(){if(confirm('Tüm kayıtlar silinsin mi?')){DB.clear();renderAdmin();}}

let toastT;
function toast(m,k){
  const t=document.getElementById('toast');
  t.textContent=m;t.className='toast show '+(k||'');
  clearTimeout(toastT);toastT=setTimeout(()=>t.className='toast',2500);
}
window.addEventListener('resize',()=>{
  if(CUR&&!document.getElementById('tab-bench').classList.contains('hidden'))fitStage();
  // PLC ladder rung tellerini yeniden çiz
  if(typeof PLC_PROGRAM!=='undefined'&&typeof drawRungLines==='function'&&!document.getElementById('tab-plc').classList.contains('hidden')){
    PLC_PROGRAM.networks.forEach((_,nIdx)=>{
      const wrap=document.getElementById('elems-'+nIdx);
      const bWrap=wrap?.querySelector('.branches');
      if(wrap&&bWrap)drawRungLines(nIdx, wrap, bWrap, PLC_PROGRAM.networks[nIdx]);
    });
  }
});

/* Service Worker kaydı (PWA) */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}