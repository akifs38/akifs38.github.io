/* =================================================================
   GAMİFİKASYON — XP, Rozetler, Seviyeler, Onboarding, Mobil Nav
   ================================================================= */

/* =================================================================
   MOBİL ALT NAVBAR (Bottom Navigation)
   ================================================================= */
/* =================================================================
   ONBOARDING + GAMIFICATION SİSTEMİ
   ================================================================= */

/* --- PROFİL VERİSİ (localStorage) --- */
const PROFILE_KEY = 'eg_profile_v1';
const OB_KEY = 'eg_onboarding_done_v1';

function loadProfile(){
  try{
    const p=JSON.parse(localStorage.getItem(PROFILE_KEY))||null;
    if(p){
      // Eski profiller için stats default'larını garantile
      p.stats = p.stats || {};
      p.stats.tasksCompleted = p.stats.tasksCompleted || 0;
      p.stats.plcExamplesRun = p.stats.plcExamplesRun || 0;
      p.stats.pneumExamples = p.stats.pneumExamples || 0;
      p.stats.sandboxBuilt = p.stats.sandboxBuilt || 0;
      p.stats.mechCardsViewed = p.stats.mechCardsViewed || 0;
      p.badges = p.badges || [];
      return p;
    }
  }catch(e){}
  return {xp:0, badges:[], stats:{tasksCompleted:0, plcExamplesRun:0, sandboxBuilt:0, pneumExamples:0, mechCardsViewed:0}};
}
function saveProfile(p){
  try{localStorage.setItem(PROFILE_KEY, JSON.stringify(p));}catch(e){}
}
let PROFILE = loadProfile();

/* --- SEVİYE TANIMLARI --- */
const LEVELS = [
  {name:'Çırak',     icon:'🥉', min:0,    next:200},
  {name:'Operatör',  icon:'🥈', min:200,  next:500},
  {name:'Tekniker',  icon:'🥇', min:500,  next:1000},
  {name:'Mühendis',  icon:'💎', min:1000, next:2000},
  {name:'Usta',      icon:'⭐', min:2000, next:Infinity}
];

function getLevel(xp){
  for(let i=LEVELS.length-1;i>=0;i--){
    if(xp >= LEVELS[i].min)return {idx:i, ...LEVELS[i]};
  }
  return {idx:0, ...LEVELS[0]};
}

function renderXpBar(){
  const bar = document.getElementById('xpBar');
  if(!bar)return;
  const u = DB.user();
  if(!u || u.role==='admin'){bar.style.display='none';return;}
  bar.style.display='flex';
  const lvl = getLevel(PROFILE.xp);
  const progress = lvl.next===Infinity ? 100 : 
    ((PROFILE.xp - lvl.min) / (lvl.next - lvl.min) * 100);
  document.getElementById('xpLvl').textContent = lvl.icon;
  document.getElementById('xpLvl').title = lvl.name;
  document.getElementById('xpProgress').style.setProperty('--xpp', progress + '%');
  document.getElementById('xpNum').textContent = PROFILE.xp + ' XP';
}

/* --- XP KAZANMA --- */
function awardXP(amount, reason){
  const oldLvl = getLevel(PROFILE.xp);
  PROFILE.xp += amount;
  const newLvl = getLevel(PROFILE.xp);
  saveProfile(PROFILE);
  renderXpBar();
  // Toast
  setTimeout(()=>{
    toast(`+${amount} XP — ${reason}`, 'good');
  }, 400);
  // Seviye atlama
  if(newLvl.idx > oldLvl.idx){
    setTimeout(()=>{
      showAchievement('SEVİYE ATLANDI', newLvl.icon+' '+newLvl.name, 
        'Tebrikler! Yeni seviyene ulaştın. Daha zor görevlerin kilidi açıldı.', 
        '+'+amount+' XP');
    }, 1200);
  }
}

/* --- ROZETLER --- */
const BADGES = [
  {id:'first',     icon:'🔥', name:'İlk Devre',         desc:'İlk görevini tamamladın'},
  {id:'fast',      icon:'⚡', name:'Hızlı Bağlamacı',   desc:'5 görev hatasız tamamlandı'},
  {id:'panel',     icon:'🛠️', name:'Pano Ustası',       desc:'Yıldız-üçgen görevini bitirdin'},
  {id:'plc',       icon:'💡', name:'PLC Programcısı',  desc:'5 PLC örneğini çalıştırdın'},
  {id:'pneum',     icon:'💨', name:'Pnömatikçi',       desc:'Pnömatik devre kurdun'},
  {id:'sandbox',   icon:'🎨', name:'Yaratıcı',          desc:'Serbest modda kendi devreni kurdun'},
  {id:'mech',      icon:'⚙️', name:'Makinist',          desc:'5 mekanik kart incelendi'},
  {id:'half',      icon:'📚', name:'Yarı Yolda',        desc:'6 görev tamamlandı'},
  {id:'allTasks',  icon:'👑', name:'Görev Şampiyonu',  desc:'Tüm görevleri bitirdin'},
  {id:'lvl2',      icon:'🥈', name:'Operatör',          desc:'200 XP ile Operatör seviyesi'},
  {id:'lvl3',      icon:'🥇', name:'Tekniker',          desc:'500 XP ile Tekniker seviyesi'},
  {id:'master',    icon:'⭐', name:'Usta',              desc:'2000 XP ile en üst seviye'}
];

function hasBadge(id){return PROFILE.badges.includes(id);}
function awardBadge(id){
  if(hasBadge(id))return;
  const badge = BADGES.find(b=>b.id===id);
  if(!badge)return;
  PROFILE.badges.push(id);
  saveProfile(PROFILE);
  setTimeout(()=>{
    showAchievement('YENİ ROZET', badge.icon+' '+badge.name, badge.desc, '+50 XP');
    PROFILE.xp += 50;
    saveProfile(PROFILE);
    renderXpBar();
  }, 800);
}

function checkBadges(){
  // İlk Devre
  if(PROFILE.stats.tasksCompleted >= 1)awardBadge('first');
  // Yarı yolda
  if(PROFILE.stats.tasksCompleted >= 6)awardBadge('half');
  // PLC programcısı
  if(PROFILE.stats.plcExamplesRun >= 5)awardBadge('plc');
  // Pnömatikçi
  if(PROFILE.stats.pneumExamples >= 1)awardBadge('pneum');
  // Yaratıcı
  if(PROFILE.stats.sandboxBuilt >= 1)awardBadge('sandbox');
  // Makinist
  if(PROFILE.stats.mechCardsViewed >= 5)awardBadge('mech');
  // Seviye rozetleri
  const lvl = getLevel(PROFILE.xp);
  if(lvl.idx >= 1)awardBadge('lvl2');
  if(lvl.idx >= 2)awardBadge('lvl3');
  if(lvl.idx >= 4)awardBadge('master');
  // Tüm görevler — bitirdi mi?
  if(typeof TASKS !== 'undefined' && PROFILE.stats.tasksCompleted >= TASKS.length){
    awardBadge('allTasks');
  }
}

/* --- BAŞARI POPUP --- */
function showAchievement(title, name, desc, reward){
  const popup = document.getElementById('achievementPopup');
  const iconChar = name.split(' ')[0]; // emoji
  const nameOnly = name.split(' ').slice(1).join(' ');
  popup.innerHTML = `
    <div class="ach-icon">${iconChar}</div>
    <div class="ach-title">${title}</div>
    <div class="ach-name">${nameOnly || name}</div>
    <div class="ach-desc">${desc}</div>
    <div class="ach-reward">⭐ ${reward}</div>
    <button class="ach-btn" onclick="closeAchievement()">Devam</button>
  `;
  document.getElementById('achievementModal').classList.add('show');
}
function closeAchievement(){
  document.getElementById('achievementModal').classList.remove('show');
}

/* --- ONBOARDING --- */
let OB_SLIDE = 0;

function showOnboardingIfFirstTime(){
  const u = DB.user();
  if(!u || u.role==='admin')return; // operatöre gösteriyoruz, admin atlasın
  if(localStorage.getItem(OB_KEY)==='1')return; // daha önce yaptı
  showOnboarding();
}

function showOnboarding(){
  OB_SLIDE = 0;
  renderObDots();
  updateObSlide();
  document.getElementById('onboarding').classList.add('show');
}

function renderObDots(){
  const dots = document.getElementById('obDots');
  dots.innerHTML = Array.from({length:4},(_,i)=>
    `<div class="ob-dot ${i===OB_SLIDE?'active':''}"></div>`
  ).join('');
}

function updateObSlide(){
  document.querySelectorAll('.ob-slide').forEach(s=>{
    s.classList.toggle('active', parseInt(s.dataset.slide)===OB_SLIDE);
  });
  const progress = ((OB_SLIDE+1)/4)*100;
  document.getElementById('obProgress').style.setProperty('--p', progress+'%');
  document.getElementById('obNext').textContent = OB_SLIDE===3 ? 'Başla 🚀' : 'İleri →';
  renderObDots();
}

function nextOnboarding(){
  if(OB_SLIDE < 3){
    OB_SLIDE++;
    updateObSlide();
  } else {
    skipOnboarding();
  }
}

function skipOnboarding(){
  document.getElementById('onboarding').classList.remove('show');
  localStorage.setItem(OB_KEY, '1');
  // Onboarding bitti — küçük XP hediyesi
  if(PROFILE.xp === 0){
    awardXP(25, 'Tanıtımı tamamladın');
  }
}

/* --- PROFİL SAYFASI --- */
function showProfile(){
  document.getElementById('infoTitle').textContent='🏆 Profilim';
  const body = document.getElementById('infoBody');
  const lvl = getLevel(PROFILE.xp);
  const nextXp = lvl.next === Infinity ? 'MAX' : lvl.next;
  const progress = lvl.next === Infinity ? 100 :
    ((PROFILE.xp - lvl.min) / (lvl.next - lvl.min) * 100);

  body.innerHTML = `
    <div style="text-align:center;background:linear-gradient(135deg,#1c232d,#0a0d12);
        padding:24px;border-radius:14px;margin-bottom:16px;border:1px solid var(--accent)">
      <div style="font-size:60px;line-height:1;margin-bottom:8px">${lvl.icon}</div>
      <div style="font-size:11px;color:var(--accent);letter-spacing:2px;text-transform:uppercase;font-weight:700">${lvl.name}</div>
      <div style="font-size:32px;font-family:'JetBrains Mono',monospace;font-weight:700;margin-top:8px">${PROFILE.xp} XP</div>
      <div style="margin-top:14px">
        <div style="height:8px;background:#0a0d12;border-radius:4px;overflow:hidden;border:1px solid var(--line)">
          <div style="height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-2));width:${progress}%"></div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px;font-family:'JetBrains Mono',monospace">
          ${lvl.next===Infinity ? 'En üst seviye' : `Bir sonraki seviyeye: ${lvl.next - PROFILE.xp} XP`}
        </div>
      </div>
    </div>

    <div class="info-section">
      <h4>İstatistikler</h4>
      <div class="info-grid">
        <div class="ig"><div class="k">Tamamlanan Görev</div><div class="v">${PROFILE.stats.tasksCompleted||0}</div></div>
        <div class="ig"><div class="k">PLC Programları</div><div class="v">${PROFILE.stats.plcExamplesRun||0}</div></div>
        <div class="ig"><div class="k">Pnömatik Devre</div><div class="v">${PROFILE.stats.pneumExamples||0}</div></div>
        <div class="ig"><div class="k">Serbest Mod</div><div class="v">${PROFILE.stats.sandboxBuilt||0}</div></div>
      </div>
    </div>

    <div class="info-section">
      <h4>Rozetler (${PROFILE.badges.length}/${BADGES.length})</h4>
      <div class="badges-grid">
        ${BADGES.map(b=>{
          const has = hasBadge(b.id);
          return `<div class="badge-card ${has?'unlocked':'locked'}">
            <div class="b-icon">${has?b.icon:'🔒'}</div>
            <div class="b-name">${b.name}</div>
            <div class="b-desc">${b.desc}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="info-section" style="text-align:center;margin-top:18px">
      <button class="btn ghost sm" onclick="resetProfile()" style="color:var(--danger);border-color:var(--danger)">
        Profili Sıfırla
      </button>
    </div>
  `;
  document.getElementById('infoModal').classList.add('show');
}

function resetProfile(){
  if(!confirm('Tüm XP ve rozetler silinecek. Emin misin?'))return;
  PROFILE = {xp:0, badges:[], stats:{tasksCompleted:0, plcExamplesRun:0, sandboxBuilt:0, pneumExamples:0, mechCardsViewed:0}};
  saveProfile(PROFILE);
  renderXpBar();
  closeInfo();
  toast('Profil sıfırlandı','good');
}


function bnavGo(navKey){
  setBnavActive(navKey);
  if(navKey==='tasks')switchTab('tasks');
  else if(navKey==='plc')openPLC();
  else if(navKey==='pneum')openPneum();
  else if(navKey==='mech')openMech();
}

function setBnavActive(key){
  document.querySelectorAll('.bnav-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.nav===key);
  });
}

function openMoreMenu(){
  const u = DB.user();
  if(u && u.role==='admin'){
    document.getElementById('moreAdminItem').style.display='flex';
  }
  document.getElementById('moreModal').classList.add('show');
}
function closeMoreMenu(){document.getElementById('moreModal').classList.remove('show');}

/* MOBİL BENCH PANEL SHEET */
function showMobileSheet(kind){
  const title = {obj:'📋 Görev Tanımı', steps:'📝 Bağlantı Adımları', score:'🎯 Skor ve Hatalar'}[kind];
  document.getElementById('benchSheetTitle').textContent = title;
  const body = document.getElementById('benchSheetBody');
  if(kind==='obj'){
    const objHTML = document.getElementById('objText').innerHTML;
    const hintHTML = document.getElementById('hintText').innerHTML;
    body.innerHTML = `<div class="obj">${objHTML}</div><div class="hint" style="margin-top:14px">${hintHTML}</div>`;
  } else if(kind==='steps'){
    const stepsHTML = document.getElementById('stepList').innerHTML;
    body.innerHTML = `<ul class="steps">${stepsHTML}</ul>`;
  } else if(kind==='score'){
    const scoreNum = document.getElementById('scoreNum').textContent;
    const scoreOf = document.getElementById('scoreOf').textContent;
    const errHTML = document.getElementById('liveErr').innerHTML;
    body.innerHTML = `<div class="scorebar"><span class="big">${scoreNum}</span><span class="of">${scoreOf}</span></div><div class="errlist">${errHTML||'<span style="color:var(--muted)">— hata yok —</span>'}</div>`;
  }
  document.getElementById('benchSheet').classList.add('show');
}
function closeBenchSheet(){document.getElementById('benchSheet').classList.remove('show');}

/* switchTab'a hook: çağrıldığında bnav active'i senkronize et */
const _originalSwitchTab = switchTab;
switchTab = function(t){
  _originalSwitchTab(t);
  const navMap = {tasks:'tasks',plc:'plc',pneum:'pneum',mech:'mech'};
  if(navMap[t])setBnavActive(navMap[t]);
  else setBnavActive(null);
};

boot();