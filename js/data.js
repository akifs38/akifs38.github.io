/* =================================================================
   VERİ — DB, SYM (IEC semboller), INFO (bilgi kartları), TASKS, LIBRARY
   ================================================================= */

/* =================================================================
   v0.5 — BİLGİ KARTLARI + İNTERAKTİF SİMÜLASYON + ÖZELLEŞTIRME
   ================================================================= */

/* ===== Kullanıcı ===== */
const DB={
  logs(){return JSON.parse(localStorage.getItem('eg_logs')||'[]')},
  addLog(e){const l=this.logs();l.unshift(e);localStorage.setItem('eg_logs',JSON.stringify(l))},
  clear(){localStorage.removeItem('eg_logs')},
  user(){return JSON.parse(localStorage.getItem('eg_user')||'null')},
  setUser(u){localStorage.setItem('eg_user',JSON.stringify(u))},
  logout(){localStorage.removeItem('eg_user')}
};
const DEMO_NAMES=['A. Yılmaz','M. Demir','S. Kaya','E. Çelik','B. Şahin','C. Arslan','F. Aydın'];
function doLogin(){
  const role=document.querySelector('input[name=role]:checked').value;
  let name,email;
  if(role==='admin'){name='Yönetici (Siz)';email='admin@panel.local';}
  else{name=DEMO_NAMES[Math.floor(Math.random()*DEMO_NAMES.length)];
    email=name.toLowerCase().replace(/[^a-z]/g,'')+'@operator.local';}
  DB.setUser({name,email,role});boot();
}
function logout(){DB.logout();location.reload();}
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints>0);

/* =================================================================
   SEMBOLLER (IEC 60617) — modal görüntüleme için ayrı sürüm de var
   ================================================================= */
const SYM={
  source24:`<svg viewBox="0 0 60 50"><rect x="3" y="5" width="54" height="40" rx="3" fill="#0e1116" stroke="#f5b301" stroke-width="2"/><text x="30" y="22" text-anchor="middle" fill="#f5b301" font-family="monospace" font-size="11" font-weight="700">24V</text><text x="30" y="34" text-anchor="middle" fill="#f5b301" font-family="monospace" font-size="9">DC ⎓</text></svg>`,
  fuse:`<svg viewBox="0 0 50 50"><line x1="25" y1="6" x2="25" y2="14" stroke="#8a96a3" stroke-width="2"/><rect x="18" y="14" width="14" height="22" fill="none" stroke="#8a96a3" stroke-width="2"/><line x1="25" y1="14" x2="25" y2="36" stroke="#8a96a3" stroke-width="2"/><line x1="25" y1="36" x2="25" y2="44" stroke="#8a96a3" stroke-width="2"/></svg>`,
  mcb:`<svg viewBox="0 0 50 50"><line x1="25" y1="4" x2="25" y2="14" stroke="#8a96a3" stroke-width="2"/><circle cx="25" cy="14" r="2.5" fill="none" stroke="#8a96a3" stroke-width="2"/><line x1="25" y1="16" x2="14" y2="32" stroke="#8a96a3" stroke-width="2"/><path d="M21 24 L29 22 L27 28" fill="none" stroke="#ff7a18" stroke-width="1.5"/><line x1="25" y1="34" x2="25" y2="46" stroke="#8a96a3" stroke-width="2"/></svg>`,
  lamp:`<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="15" class="lampGlow" fill="#e8edf2" opacity="0"/><circle cx="25" cy="25" r="14" fill="none" stroke="#8a96a3" stroke-width="2"/><path d="M15 15 L35 35 M35 15 L15 35" stroke="#8a96a3" stroke-width="1.5"/></svg>`,
  lampRed:`<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="15" class="lampGlow" fill="#ff4d4f" opacity="0"/><circle cx="25" cy="25" r="14" fill="none" stroke="#ff4d4f" stroke-width="2"/><path d="M15 15 L35 35 M35 15 L15 35" stroke="#ff4d4f" stroke-width="1.5"/></svg>`,
  lampGreen:`<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="15" class="lampGlow" fill="#27d07a" opacity="0"/><circle cx="25" cy="25" r="14" fill="none" stroke="#27d07a" stroke-width="2"/><path d="M15 15 L35 35 M35 15 L15 35" stroke="#27d07a" stroke-width="1.5"/></svg>`,
  lampYellow:`<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="15" class="lampGlow" fill="#f5b301" opacity="0"/><circle cx="25" cy="25" r="14" fill="none" stroke="#f5b301" stroke-width="2"/><path d="M15 15 L35 35 M35 15 L15 35" stroke="#f5b301" stroke-width="1.5"/></svg>`,
  buttonNO:`<svg viewBox="0 0 50 50"><circle cx="25" cy="12" r="6" fill="#27d07a" stroke="#8a96a3" stroke-width="2"/><line x1="25" y1="18" x2="25" y2="28" stroke="#8a96a3" stroke-width="2"/><line x1="14" y1="34" x2="36" y2="34" stroke="#8a96a3" stroke-width="2"/><line x1="14" y1="34" x2="26" y2="28" stroke="#8a96a3" stroke-width="2" class="btnArm"/></svg>`,
  buttonNC:`<svg viewBox="0 0 50 50"><circle cx="25" cy="12" r="6" fill="#ff4d4f" stroke="#8a96a3" stroke-width="2"/><line x1="25" y1="18" x2="25" y2="32" stroke="#8a96a3" stroke-width="2"/><line x1="14" y1="32" x2="36" y2="32" stroke="#8a96a3" stroke-width="2"/><line x1="14" y1="36" x2="36" y2="36" stroke="#8a96a3" stroke-width="2"/></svg>`,
  buttonMush:`<svg viewBox="0 0 50 50"><ellipse cx="25" cy="14" rx="14" ry="6" fill="#ff4d4f" stroke="#8a96a3" stroke-width="2"/><line x1="25" y1="20" x2="25" y2="32" stroke="#8a96a3" stroke-width="2"/><line x1="14" y1="32" x2="36" y2="32" stroke="#8a96a3" stroke-width="2"/><line x1="14" y1="36" x2="36" y2="36" stroke="#8a96a3" stroke-width="2"/></svg>`,
  switch2:`<svg viewBox="0 0 50 50"><circle cx="14" cy="14" r="2.5" fill="#8a96a3"/><circle cx="14" cy="36" r="2.5" fill="#8a96a3"/><circle cx="36" cy="25" r="2.5" fill="#8a96a3"/><line x1="14" y1="14" x2="34" y2="22" stroke="#8a96a3" stroke-width="2" class="swArm"/></svg>`,
  coil:`<svg viewBox="0 0 50 50"><rect x="9" y="14" width="32" height="22" fill="none" stroke="#8a96a3" stroke-width="2" class="coilCore"/><text x="25" y="29" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="11" font-weight="600">A1·A2</text><line x1="25" y1="6" x2="25" y2="14" stroke="#8a96a3" stroke-width="1.5"/><line x1="25" y1="36" x2="25" y2="44" stroke="#8a96a3" stroke-width="1.5"/></svg>`,
  contactNO:`<svg viewBox="0 0 50 50"><line x1="14" y1="6" x2="14" y2="12" stroke="#8a96a3" stroke-width="2"/><line x1="14" y1="38" x2="14" y2="44" stroke="#8a96a3" stroke-width="2"/><line x1="14" y1="12" x2="36" y2="22" stroke="#8a96a3" stroke-width="2" class="contArm"/><circle cx="14" cy="12" r="2" fill="#8a96a3"/><circle cx="14" cy="38" r="2" fill="#8a96a3"/></svg>`,
  contactNC:`<svg viewBox="0 0 50 50"><line x1="14" y1="6" x2="14" y2="12" stroke="#ff7a18" stroke-width="2"/><line x1="14" y1="38" x2="14" y2="44" stroke="#ff7a18" stroke-width="2"/><line x1="14" y1="12" x2="14" y2="38" stroke="#ff7a18" stroke-width="2" class="contNcArm"/><line x1="9" y1="22" x2="22" y2="22" stroke="#ff7a18" stroke-width="2"/><circle cx="14" cy="12" r="2" fill="#ff7a18"/><circle cx="14" cy="38" r="2" fill="#ff7a18"/></svg>`,
  thermal:`<svg viewBox="0 0 50 50"><rect x="5" y="10" width="40" height="30" fill="none" stroke="#ff7a18" stroke-width="2"/><path d="M12 20 Q16 16 20 20 Q24 24 28 20 Q32 16 36 20" fill="none" stroke="#ff7a18" stroke-width="1.5"/><text x="25" y="35" text-anchor="middle" fill="#ff7a18" font-family="monospace" font-size="9">F2</text></svg>`,
  timer:`<svg viewBox="0 0 50 50"><circle cx="25" cy="22" r="14" fill="none" stroke="#8a96a3" stroke-width="2"/><line x1="25" y1="22" x2="25" y2="11" stroke="#f5b301" stroke-width="2" class="timerHand"/><circle cx="25" cy="22" r="2" fill="#f5b301"/><text x="25" y="46" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="9">KT</text></svg>`,
  motor:`<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="18" fill="none" stroke="#8a96a3" stroke-width="2"/><g class="motorRot"><line x1="13" y1="25" x2="37" y2="25" stroke="#8a96a3" stroke-width="1.5"/><line x1="25" y1="13" x2="25" y2="37" stroke="#8a96a3" stroke-width="1.5"/></g><text x="25" y="29" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="11" font-weight="700">M</text></svg>`,
  sensor:`<svg viewBox="0 0 50 50"><rect x="8" y="14" width="34" height="22" rx="2" fill="none" stroke="#3aa0ff" stroke-width="2"/><circle cx="36" cy="25" r="4" fill="#3aa0ff"/><text x="20" y="29" text-anchor="middle" fill="#3aa0ff" font-family="monospace" font-size="11" font-weight="700">B</text></svg>`,
  buzzer:`<svg viewBox="0 0 50 50"><path d="M14 18 L26 18 L34 12 L34 38 L26 32 L14 32 Z" fill="none" stroke="#f5b301" stroke-width="2"/><path d="M37 17 Q42 22 42 25 Q42 28 37 33" fill="none" stroke="#f5b301" stroke-width="1.5"/></svg>`,
  // === MEKANİK ELEMANLAR ===
  bearing:`<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="22" fill="none" stroke="#8a96a3" stroke-width="2"/><circle cx="25" cy="25" r="14" fill="none" stroke="#8a96a3" stroke-width="2"/><circle cx="25" cy="25" r="7" fill="#1c232d" stroke="#8a96a3" stroke-width="1.5"/><g fill="#8a96a3"><circle cx="25" cy="11" r="2.5"/><circle cx="25" cy="39" r="2.5"/><circle cx="11" cy="25" r="2.5"/><circle cx="39" cy="25" r="2.5"/><circle cx="35" cy="15" r="2.5"/><circle cx="15" cy="35" r="2.5"/><circle cx="35" cy="35" r="2.5"/><circle cx="15" cy="15" r="2.5"/></g></svg>`,
  gear:`<svg viewBox="0 0 50 50"><g transform="translate(25,25)"><g><path d="M-3,-22 L3,-22 L4,-16 L-4,-16 Z" fill="#8a96a3"/></g><g transform="rotate(45)"><path d="M-3,-22 L3,-22 L4,-16 L-4,-16 Z" fill="#8a96a3"/></g><g transform="rotate(90)"><path d="M-3,-22 L3,-22 L4,-16 L-4,-16 Z" fill="#8a96a3"/></g><g transform="rotate(135)"><path d="M-3,-22 L3,-22 L4,-16 L-4,-16 Z" fill="#8a96a3"/></g><g transform="rotate(180)"><path d="M-3,-22 L3,-22 L4,-16 L-4,-16 Z" fill="#8a96a3"/></g><g transform="rotate(225)"><path d="M-3,-22 L3,-22 L4,-16 L-4,-16 Z" fill="#8a96a3"/></g><g transform="rotate(270)"><path d="M-3,-22 L3,-22 L4,-16 L-4,-16 Z" fill="#8a96a3"/></g><g transform="rotate(315)"><path d="M-3,-22 L3,-22 L4,-16 L-4,-16 Z" fill="#8a96a3"/></g><circle r="16" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><circle r="5" fill="#0e1116" stroke="#8a96a3" stroke-width="1.5"/></g></svg>`,
  rackpinion:`<svg viewBox="0 0 50 50"><g><circle cx="15" cy="18" r="9" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><g transform="translate(15,18)"><line x1="0" y1="-12" x2="0" y2="-7" stroke="#8a96a3" stroke-width="2"/><line x1="0" y1="7" x2="0" y2="12" stroke="#8a96a3" stroke-width="2"/><line x1="-12" y1="0" x2="-7" y2="0" stroke="#8a96a3" stroke-width="2"/><line x1="7" y1="0" x2="12" y2="0" stroke="#8a96a3" stroke-width="2"/></g><circle cx="15" cy="18" r="2" fill="#8a96a3"/><rect x="3" y="32" width="44" height="10" fill="none" stroke="#8a96a3" stroke-width="2"/><g stroke="#8a96a3" stroke-width="1.5"><line x1="7" y1="32" x2="9" y2="28"/><line x1="13" y1="32" x2="15" y2="28"/><line x1="19" y1="32" x2="21" y2="28"/><line x1="25" y1="32" x2="27" y2="28"/><line x1="31" y1="32" x2="33" y2="28"/><line x1="37" y1="32" x2="39" y2="28"/><line x1="43" y1="32" x2="45" y2="28"/></g></svg>`,
  belt:`<svg viewBox="0 0 50 50"><circle cx="12" cy="25" r="8" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><circle cx="38" cy="25" r="10" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><circle cx="12" cy="25" r="2" fill="#8a96a3"/><circle cx="38" cy="25" r="2" fill="#8a96a3"/><path d="M12 17 L38 15 M12 33 L38 35" stroke="#f5b301" stroke-width="2.5" fill="none"/></svg>`,
  reductor:`<svg viewBox="0 0 50 50"><rect x="4" y="14" width="42" height="22" rx="2" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><line x1="0" y1="25" x2="4" y2="25" stroke="#8a96a3" stroke-width="3"/><line x1="46" y1="25" x2="50" y2="25" stroke="#8a96a3" stroke-width="3"/><circle cx="16" cy="25" r="5" fill="none" stroke="#8a96a3" stroke-width="1.5"/><circle cx="34" cy="25" r="7" fill="none" stroke="#8a96a3" stroke-width="1.5"/><text x="25" y="46" text-anchor="middle" fill="#8a96a3" font-family="monospace" font-size="7">i=1:n</text></svg>`,
  ballscrew:`<svg viewBox="0 0 50 50"><line x1="2" y1="25" x2="48" y2="25" stroke="#8a96a3" stroke-width="3"/><g stroke="#8a96a3" stroke-width="1.5" fill="none"><path d="M5 25 Q8 20 11 25 Q14 30 17 25 Q20 20 23 25 Q26 30 29 25 Q32 20 35 25 Q38 30 41 25 Q44 20 47 25"/></g><rect x="18" y="18" width="14" height="14" fill="#0e1116" stroke="#f5b301" stroke-width="2"/></svg>`,
  coupling:`<svg viewBox="0 0 50 50"><line x1="2" y1="25" x2="20" y2="25" stroke="#8a96a3" stroke-width="4"/><line x1="30" y1="25" x2="48" y2="25" stroke="#8a96a3" stroke-width="4"/><rect x="18" y="14" width="4" height="22" fill="#aabbcc" stroke="#8a96a3" stroke-width="1"/><rect x="28" y="14" width="4" height="22" fill="#aabbcc" stroke="#8a96a3" stroke-width="1"/><path d="M22 17 L28 17 L28 33 L22 33 Z" fill="#1c232d" stroke="#f5b301" stroke-width="1.5"/></svg>`,
  oring:`<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="18" fill="none" stroke="#8a96a3" stroke-width="2"/><circle cx="25" cy="25" r="12" fill="none" stroke="#8a96a3" stroke-width="2"/><path d="M25 7 L25 13 M25 37 L25 43 M7 25 L13 25 M37 25 L43 25" stroke="#8a96a3" stroke-width="1"/><text x="25" y="29" text-anchor="middle" fill="#f5b301" font-family="monospace" font-size="9" font-weight="700">O</text></svg>`,
  ropePulley:`<svg viewBox="0 0 50 50"><circle cx="25" cy="20" r="14" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><circle cx="25" cy="20" r="9" fill="#0e1116" stroke="#8a96a3" stroke-width="1.5"/><circle cx="25" cy="20" r="2" fill="#8a96a3"/><path d="M16 33 L16 45 M34 33 L34 45" stroke="#8a96a3" stroke-width="2"/><path d="M14 45 L18 45 L18 47 L14 47 Z M32 45 L36 45 L36 47 L32 47 Z" fill="#8a96a3"/></svg>`,
  bolt:`<svg viewBox="0 0 50 50"><polygon points="15,8 35,8 38,14 35,20 15,20 12,14" fill="none" stroke="#8a96a3" stroke-width="2"/><rect x="20" y="20" width="10" height="20" fill="#8a96a3"/><g stroke="#0e1116" stroke-width="1.5"><line x1="20" y1="24" x2="30" y2="24"/><line x1="20" y1="28" x2="30" y2="28"/><line x1="20" y1="32" x2="30" y2="32"/><line x1="20" y1="36" x2="30" y2="36"/></g></svg>`,
  spring:`<svg viewBox="0 0 50 50"><line x1="25" y1="4" x2="25" y2="8" stroke="#8a96a3" stroke-width="2"/><path d="M25 8 L15 13 L35 18 L15 23 L35 28 L15 33 L35 38 L25 42" stroke="#8a96a3" stroke-width="1.5" fill="none"/><line x1="25" y1="42" x2="25" y2="46" stroke="#8a96a3" stroke-width="2"/></svg>`,
  shaft:`<svg viewBox="0 0 50 50"><rect x="3" y="22" width="44" height="6" fill="#aabbcc" stroke="#8a96a3" stroke-width="1.5"/><line x1="14" y1="22" x2="14" y2="28" stroke="#0e1116" stroke-width="1"/><line x1="36" y1="22" x2="36" y2="28" stroke="#0e1116" stroke-width="1"/><circle cx="8" cy="25" r="2" fill="#0e1116"/><circle cx="42" cy="25" r="2" fill="#0e1116"/></svg>`,
  cam:`<svg viewBox="0 0 50 50"><path d="M25 5 C 40 8 42 25 38 35 C 32 42 18 40 12 30 C 8 22 12 12 25 5 Z" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><circle cx="22" cy="22" r="3" fill="#8a96a3"/><line x1="38" y1="35" x2="45" y2="45" stroke="#f5b301" stroke-width="2"/><rect x="42" y="42" width="6" height="6" fill="#f5b301"/></svg>`,
  chain:`<svg viewBox="0 0 50 50"><g stroke="#8a96a3" stroke-width="1.5" fill="none"><rect x="4" y="20" width="10" height="10" rx="3"/><rect x="13" y="20" width="10" height="10" rx="3"/><rect x="22" y="20" width="10" height="10" rx="3"/><rect x="31" y="20" width="10" height="10" rx="3"/><rect x="40" y="20" width="8" height="10" rx="3"/></g></svg>`,
  worm:`<svg viewBox="0 0 50 50"><circle cx="35" cy="22" r="11" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><g transform="translate(35,22)"><line x1="0" y1="-13" x2="0" y2="-8" stroke="#8a96a3" stroke-width="2"/><line x1="0" y1="8" x2="0" y2="13" stroke="#8a96a3" stroke-width="2"/><line x1="-13" y1="0" x2="-8" y2="0" stroke="#8a96a3" stroke-width="2"/><line x1="8" y1="0" x2="13" y2="0" stroke="#8a96a3" stroke-width="2"/></g><rect x="3" y="35" width="44" height="10" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><g stroke="#8a96a3" stroke-width="1" fill="none"><path d="M5 35 Q9 42 13 35 M13 35 Q17 42 21 35 M21 35 Q25 42 29 35 M29 35 Q33 42 37 35 M37 35 Q41 42 45 35"/></g></svg>`,
  damper:`<svg viewBox="0 0 50 50"><line x1="25" y1="4" x2="25" y2="14" stroke="#8a96a3" stroke-width="2"/><rect x="14" y="14" width="22" height="18" fill="#1c232d" stroke="#8a96a3" stroke-width="2"/><rect x="22" y="20" width="6" height="14" fill="#8a96a3"/><line x1="25" y1="34" x2="25" y2="46" stroke="#8a96a3" stroke-width="2"/></svg>`
};

/* =================================================================
   ELEMAN BİLGİ KARTLARI (eğitim içeriği)
   ================================================================= */
const INFO = {
  source24:{title:'24V DC Güç Kaynağı',code:'G1',desc:'Kumanda devresine 24V DC enerji sağlayan güç kaynağı. Endüstride güvenlik açısından kumanda devreleri düşük gerilimde (genellikle 24V DC) çalıştırılır.',
    use:'Tüm kumanda elemanlarını (bobin, lamba, sensör) besler. Çıkış uçları <code>L+</code> (pozitif) ve <code>0V</code> (referans/eksi).',
    term:[['L+','+24V çıkışı (kahverengi)'],['0V','Referans/eksi (mavi)']],
    std:'IEC 60204-1: Makinelerin kumanda gerilimi PELV/SELV (≤50V AC veya ≤120V DC) olmalı'},
  fuse:{title:'Cam Sigorta',code:'F1, F3...',desc:'Aşırı akımdan koruma elemanı. Akım belirlenen değerin üstüne çıkınca eriyerek devreyi açar. Tek kullanımlıktır; atınca değiştirilir.',
    use:'Devrenin başına seri bağlanır. Kısa devre koruması yapar — ama motor aşırı yükten korumaz, onun için termik gerekir.',
    term:[['1','Giriş ucu'],['2','Çıkış ucu']],
    std:'IEC 60127. Tipik kumanda sigortası: 2A, 4A, 6A (kumanda devresi için).'},
  mcb:{title:'Otomatik Sigorta (MCB)',code:'Q1',desc:'Manuel resetlenebilir otomatik sigorta. Hem termik (yavaş, aşırı yük) hem manyetik (hızlı, kısa devre) koruma yapar. Atınca kolu kaldırılarak resetlenir.',
    use:'Devre koruması için sigortaya tercih edilir. B, C, D karakteristikleri (kalkış akımına göre seçilir).',
    term:[['1','Giriş'],['2','Çıkış']],
    std:'IEC/EN 60898-1 (ev tipi), IEC/EN 60947-2 (endüstri tipi)'},
  lamp:{title:'Beyaz Sinyal Lambası',code:'H4 (genelde)',desc:'Devrede enerji olduğunu gösterir (besleme var göstergesi). 24V DC veya 230V AC tipleri vardır.',
    use:'Ana şalter açıkken sürekli yanar. Operatöre "pano enerjili" sinyali verir.',
    term:[['X1','+ ucu'],['X2','− ucu']],
    std:'IEC 60204-1: Beyaz = nötr/genel bilgi, sinyal lambası rengi standartlıdır.'},
  lampRed:{title:'Kırmızı Sinyal Lambası',code:'H2',desc:'Tehlike, arıza veya acil durum sinyali. Operatörün hemen müdahale etmesi gereken durumu gösterir.',
    use:'Termik atması, faz hatası, acil stop bastırılması gibi durumlarda yanar. F2.97-98 (NO, alarm) kontağından beslenir.',
    term:[['X1','+ ucu'],['X2','− ucu']],
    std:'IEC 60204-1 Tablo 2: Kırmızı = "Tehlikeli durum, acil müdahale"'},
  lampGreen:{title:'Yeşil Sinyal Lambası',code:'H1',desc:'Normal çalışma sinyali. Motorun veya sistemin sağlıklı bir şekilde çalıştığını gösterir.',
    use:'Kontaktör NO yardımcı kontağından (K1.23-24) beslenir. K1 çekince yanar.',
    term:[['X1','+ ucu'],['X2','− ucu']],
    std:'IEC 60204-1: Yeşil = "Normal çalışma, makine hazır"'},
  lampYellow:{title:'Sarı Sinyal Lambası',code:'H3',desc:'Uyarı sinyali. Anormal ama tehlikeli olmayan durumu gösterir.',
    use:'Geçiş süresi, yıldız çalışma, otomatik mod gibi durumlarda yanar.',
    term:[['X1','+ ucu'],['X2','− ucu']],
    std:'IEC 60204-1: Sarı = "Anormal durum, dikkat"'},
  buttonNO:{title:'Yeşil Start Butonu (NO)',code:'S1, S3',desc:'Normalde Açık (Normally Open) buton. Basılı olduğu sürece kontak kapanır, bırakılınca yay ile geri döner.',
    use:'Motoru, kontaktörü veya devreyi <b>başlatmak</b> için kullanılır. Kontaktör mühürlemesi ile birlikte çalışır.',
    term:[['13','Giriş ucu (NO)'],['14','Çıkış ucu (NO)']],
    std:'EN 50005: Başlatma butonları için NO kontak numarası <code>13-14</code>'},
  buttonNC:{title:'Kırmızı Stop Butonu (NC)',code:'S2, S4',desc:'Normalde Kapalı (Normally Closed) buton. Serbest haldeyken kontak kapalıdır; basılınca açılır.',
    use:'Motoru veya devreyi <b>durdurmak</b> için. Güvenlik mantığı: kablo kopsa bile devre kesilir (fail-safe).',
    term:[['11','Giriş ucu (NC)'],['12','Çıkış ucu (NC)']],
    std:'EN 50005: Durdurma butonları için NC kontak numarası <code>11-12</code>'},
  buttonMush:{title:'Acil Stop Mantar Buton',code:'S0',desc:'Kırmızı mantar başlıklı, sarı zeminli, <b>kilitlemeli</b> acil stop butonu. Basılınca aşağı kilitlenir, çevirerek serbest bırakılır.',
    use:'Acil durumda tüm makineyi enerjisiz bırakmak için. Her makinede mecburi (CE şartı). Tüm Stop’lardan önce devrede olmalı.',
    term:[['11–12','NC kontak (kumanda)'],['21–22','NC kontak (ek)']],
    std:'EN ISO 13850: Acil durdurma cihazlarının tasarımı ve konumlandırılması'},
  switch2:{title:'2 Konumlu Anahtar',code:'S0',desc:'Aç-kapa pozisyonu olan mekanik kilitli anahtar. Buton gibi yaylı değil; pozisyon kalır.',
    use:'Ana enerji açma, mod seçici (Manuel/Otomatik), aydınlatma anahtarları.',
    term:[['1','Ortak uç'],['2','Çıkış ucu']],
    std:'IEC 60947-3'},
  coil:{title:'Kontaktör Bobini',code:'K1, K2...',desc:'Elektromıknatıs bobini. Enerji uygulanınca demir nüve mıknatıslanır, ana kontakları ve yardımcı kontakları çeker.',
    use:'Motor güç devresini ana kontaklardan (1-2, 3-4, 5-6 = L1·L2·L3) kontrol eder. Kumanda devresi ile motor güç devresini ayırır.',
    term:[['A1','Bobin (+) ucu'],['A2','Bobin (−) ucu']],
    std:'EN 60947-4-1: Kontaktör standardı. Bobin gerilimi: 24V DC, 230V AC vb.'},
  contactNO:{title:'Yardımcı NO Kontak',code:'K1·13-14, 23-24...',desc:'Kontaktör/röle bobini ile birlikte hareket eden Normalde Açık yardımcı kontak. Bobin çekince kapanır.',
    use:'Mühürleme (S1’e paralel), sinyal lambası sürme, başka bir kontaktörü çalıştırma.',
    term:[['13','Giriş (1. NO)'],['14','Çıkış (1. NO)'],['23','Giriş (2. NO)'],['24','Çıkış (2. NO)']],
    std:'EN 50005: NO yardımcı kontak son rakamı <code>3-4</code> ile biter'},
  contactNC:{title:'Yardımcı NC Kontak',code:'K1·21-22...',desc:'Kontaktör/röle bobini ile birlikte hareket eden Normalde Kapalı yardımcı kontak. Bobin çekince açılır.',
    use:'Karşılıklı kilitleme (interlock): bir kontaktör çekince diğerinin bobinini açılı tutmak için.',
    term:[['21','Giriş (1. NC)'],['22','Çıkış (1. NC)'],['31','Giriş (2. NC)'],['32','Çıkış (2. NC)']],
    std:'EN 50005: NC yardımcı kontak son rakamı <code>1-2</code> ile biter'},
  thermal:{title:'Termik Aşırı Akım Rölesi',code:'F2',desc:'Motoru uzun süreli aşırı akıma karşı koruyan bimetalik koruma elemanı. Akım anma değerinin üstüne çıkarsa bimetal ısınır, bükülür, 95-96 kontağı açar.',
    use:'Kontaktörün çıkışına seri bağlanır. 95-96 NC trip kontağı kumanda devresinde, 97-98 NO alarm kontağı sinyal lambasında.',
    term:[['95–96','NC trip kontağı'],['97–98','NO alarm kontağı'],['1-2, 3-4, 5-6','Güç ana kontakları']],
    std:'EN 60947-4-1: Termik röle açma sınırı 1,05–1,2×In arası'},
  timer:{title:'Zaman Rölesi (KT)',code:'KT1, KT2',desc:'Belirli süre sonra kontak değiştiren röle. On-delay (ZG) ve Off-delay (AG) tipleri var. Endüstride yıldız-üçgen yol vermede vazgeçilmez.',
    use:'<b>On-delay:</b> A1-A2 enerjisi gelir, ayar süresi sonra 15-18 NO kapanır. <b>Off-delay:</b> Enerji kesilince süre sayar.',
    term:[['A1','Bobin (+)'],['A2','Bobin (−)'],['15','Ortak çıkış'],['16','NC çıkış (zaman sonu açar)'],['18','NO çıkış (zaman sonu kapatır)']],
    std:'EN 50005: Zaman rölesi terminal kodlaması'},
  motor:{title:'3 Fazlı Asenkron Motor',code:'M1',desc:'Sincap kafesli, üç fazlı asenkron motor. Endüstride en yaygın motor tipi. Aşağıdaki simülasyonda kumanda mantığı gösterilir.',
    use:'Kontaktör ana kontakları üzerinden 3 fazlı (L1-L2-L3, 400V AC) güç hattından beslenir. Etiketinde gerilim, akım, kW, devir/dak bilgileri olur.',
    term:[['U1·V1·W1','Sargı başlangıçları'],['U2·V2·W2','Sargı uçları (D bağlantısı için)'],['PE','Topraklama']],
    std:'IEC 60034 (motor standartları)'},
  sensor:{title:'Endüktif Yaklaşım Sensörü',code:'B1, B2',desc:'Metal cisimleri temassız algılayan sensör. PNP veya NPN tipi olur, genelde 24V DC ile çalışır.',
    use:'Konveyörlerde parça sayımı, pozisyon algılama, son kademe tespiti.',
    term:[['L+','+24V besleme (kahverengi)'],['0V','Eksi besleme (mavi)'],['Q (BK)','Çıkış (siyah, PNP: algılayınca +24V verir)']],
    std:'IEC 60947-5-2'},
  buzzer:{title:'Sesli Uyarı (Buzzer)',code:'H5, P1',desc:'Sesli alarm. Arıza durumunda sinyal lambası yanmaz, kullanılır.',
    use:'Termik atması, acil stop basılması, faz kaybı gibi durumlarda kısa süreli ses verir.',
    term:[['X1','+'],['X2','−']],
    std:'EN 60204-1: Sesli sinyal min 65 dB(A)'},

  // === MEKANİK ELEMANLAR ===
  bearing:{title:'Rulman (Yatak)',code:'',
    desc:'Bir mil ile gövde arasındaki sürtünmeyi azaltan, miline dönme veya kayma serbestisi sağlayan makine elemanı. İç bilezik, dış bilezik, bilyalar (veya makaralar) ve kafesten oluşur.',
    use:'Motor milleri, redüktör çıkışı, konveyör rulosu, otomobil aksı — dönen her şeyde rulman vardır. Tipler: <b>bilyalı rulman</b> (yüksek devir), <b>makaralı rulman</b> (yüksek yük), <b>iğne yataklı</b> (dar alan), <b>konik makaralı</b> (eksenel + radyal yük), <b>eksenel</b> (sadece eksenel yük).',
    term:[['İç çap (d)','Mile oturan çap (mm)'],['Dış çap (D)','Gövde içine giren çap'],['Genişlik (B)','Rulman kalınlığı'],['Anma kodu','Örn: 6203 — 17×40×12 mm']],
    std:'ISO 15:2017 (anma boyutları), ISO 281 (ömür hesabı: L₁₀=10⁶/60n × (C/P)³ dev)'},
  gear:{title:'Dişli Çark (Düz / Helisel)',code:'',
    desc:'Hareketi ve momenti diğer dişliye aktarmak için dişli yüzeyleri ile temas eden tekerlek. Düz dişli (sessiz değil, paralel mil), helisel dişli (sessiz, paralel mil), konik dişli (kesişen mil), sonsuz vidalı dişli (dik kesişen mil + yüksek oran).',
    use:'Redüktörlerde, otomobil şanzımanlarında, takım tezgâhlarında, robot kollarında. Çevrim oranı (i) = pinyon dişi / büyük dişli dişi. Modül (m): standart diş büyüklüğü.',
    term:[['z','Diş sayısı'],['m','Modül (mm) — diş büyüklüğü'],['d','Bölüm dairesi çapı (d=m·z)'],['i','Çevrim oranı']],
    std:'ISO 1328-1 (kalite), DIN 867 (diş profili 20°)'},
  rackpinion:{title:'Kremayer–Pinyon (Dişli–Çubuk)',code:'',
    desc:'Dönel hareketi doğrusal harekete (veya tam tersi) çeviren mekanizma. Düz dişli (pinyon) düz dişli çubuk (kremayer) üzerinde döner ve kayar.',
    use:'CNC tezgah eksenleri, asansör kapıları, otomobil direksiyon kutusu, demiryolu (raylı tren), endüstri robotları, otomatik kapılar. Pinyon dönüş açısı: θ=2π·(yol/(π·d))=2yol/d.',
    term:[['Pinyon m','Modül'],['Pinyon z','Diş sayısı'],['v','Doğrusal hız (mm/min)'],['n','Pinyon devri (rpm)']],
    std:'ISO 1328 (toleranslar), DIN 867 (diş geometrisi)'},
  belt:{title:'Kayış–Kasnak Sistemi',code:'',
    desc:'İki paralel mil arasında hareket ve moment aktarımı sağlayan esnek bağlantı. Tipleri: <b>V kayış</b> (sürtünme), <b>düz kayış</b>, <b>triger (zamanlama) kayışı</b> (kaymaz, dişli), <b>çoklu V (poly-V)</b>.',
    use:'Kompresörler, otomobil motorları, çamaşır makinesi, CNC z ekseni. Çevrim oranı = büyük kasnak çapı / küçük kasnak çapı. Triger kayışı kaymadan moment aktarır (CNC, robot).',
    term:[['D1, D2','Kasnak çapları'],['L','Kayış uzunluğu'],['T','Diş aralığı (triger için)'],['i','Çevrim oranı = D2/D1']],
    std:'ISO 4184 (V kayış), ISO 5296 (triger kayış HTD profili)'},
  reductor:{title:'Redüktör (Hız Düşürücü)',code:'',
    desc:'Yüksek devirli motorun çıkış hızını düşürüp momenti artıran içinde dişliler bulunan kapalı kutu. Tipleri: <b>helisel</b> (paralel), <b>konik</b> (90°), <b>sonsuz vidalı</b> (yüksek oran), <b>planet</b> (kompakt, yüksek oran).',
    use:'Konveyörler, vinçler, asansörler, mikserler, tezgâh ana iş mili. Çevrim oranı i = n₁/n₂. Çıkış momenti = giriş momenti × i × η (verim).',
    term:[['i','Çevrim oranı (örn 1:30)'],['n₁','Giriş devri (motor)'],['n₂','Çıkış devri'],['M₂','Çıkış momenti'],['η','Verim (genelde 0.7-0.95)']],
    std:'ISO 6336 (yük taşıma kapasitesi), DIN 3960'},
  ballscrew:{title:'Bilyalı Vida (Ball Screw)',code:'',
    desc:'Dönel hareketi yüksek hassasiyetle ve düşük sürtünmeyle doğrusal harekete çeviren vida-somun mekanizması. Vida ile somun arasındaki yiv içinde bilyeler dolaşır.',
    use:'CNC tezgah eksenleri, kalıp pres, hassas pozisyonlama tablası, robot eklemleri. Verimi %90+ (klasik vida %30-50). Adım (lead): vida bir tam dönüşte somunun yer değiştirmesi.',
    term:[['Çap','Vida nominal çapı (mm)'],['Adım (P)','Bir tam dönüşte ilerleme'],['Geri tepme','Backlash, hassasiyet için kritik'],['C','Dinamik yük kapasitesi (N)']],
    std:'ISO 3408 (bilyalı vida sınıflandırma), DIN 69051'},
  coupling:{title:'Kavrama (Coupling)',code:'',
    desc:'İki mili (örn motor mili ile redüktör girişi) eksenel olarak bağlayan eleman. Türleri: <b>rijit</b> (eksenel kaçıklığa hassas), <b>elastik</b> (titreşim soğurur), <b>kavrama (clutch)</b> (devreye sokulup çıkarılabilir).',
    use:'Motor-redüktör arası, kompresör mili, pompa mili. Eksenel/açısal/paralel kaçıklığı tolere eder. Kayışsız doğrudan tahrik için zorunlu.',
    term:[['d1, d2','Mil çapları'],['Tn','Anma momenti (Nm)'],['ω max','Maksimum devir (rpm)']],
    std:'ISO 14691 (rotorlu makinelerde kavrama)'},
  oring:{title:'O-Ring (Sızdırmazlık Halkası)',code:'',
    desc:'Pnömatik silindirler, hidrolik valfler, pompalarda statik veya dinamik sızdırmazlık sağlayan kauçuk halka. NBR, FKM (Viton), EPDM, silikon gibi malzemelerden yapılır.',
    use:'Pnömatik silindir piston ve mil sızdırmazlığı, valf gövdeleri, hidrolik kuplajlar, dişli pompaların contası. Sıcaklık ve basınç sınırlarına dikkat: NBR -30°C/+100°C, Viton -20°C/+200°C.',
    term:[['ID','İç çap (mm)'],['Kesit','3 mm, 5 mm gibi'],['Malzeme','NBR, FKM, EPDM, Silikon'],['Shore A','Sertlik (genelde 70-90)']],
    std:'ISO 3601 (boyut), DIN 3771'},
  ropePulley:{title:'Çelik Halat ve Makara',code:'',
    desc:'Vinç, asansör ve kaldırma sistemlerinde yük taşımak için kullanılan çok telli çelik halat ve halatı yönlendiren makara. Halat 6×19, 6×36 gibi yapılarda yapılır (6 demet, demet başına 19 tel).',
    use:'Asansör kabin halatları, vinç sapanları, tekne yelken halatları, teleferik. Makara üzerinde bir kez geçince yön değişir, çift makara sistemi (palanga) ile kuvvet azaltılır.',
    term:[['d','Halat çapı (mm)'],['Min kopma yükü','MBL (kg veya kN)'],['Güvenlik kat','5 (vinç), 12 (asansör)'],['Makara/halat oranı','D/d ≥ 25 (asansör)']],
    std:'EN 12385 (çelik halat), EN 81-20 (asansörler), DIN 15020'},
  bolt:{title:'Cıvata–Somun (Civata Bağlantısı)',code:'',
    desc:'İki parçayı sökülebilir şekilde birbirine bağlayan vidalı eleman. Cıvata + somun + (gerektiğinde) rondela. ISO metrik (M4, M6, M8...), inç (UNC, UNF), boy (mm cinsinden).',
    use:'Pano sabitlemesi, makine kapağı, redüktör bağlantısı. Sıkma momenti çok kritiktir; gevşek bırakılırsa titreşimle döner.',
    term:[['M','Metrik adım (örn M8 = 8mm çap)'],['L','Toplam boy (mm)'],['Sıkma momenti','Tn (Nm) — sınıfa göre'],['Sınıf','4.6, 8.8, 10.9, 12.9 (mukavemet)']],
    std:'ISO 4014 (altıgen başlıklı cıvata), DIN 933, ISO 898-1 (mekanik özellikler)'},
  spring:{title:'Yay (Helisel Yay)',code:'',
    desc:'Esnek deformasyonu ile enerji depolayıp serbest bırakan eleman. Tipler: <b>basma yayı</b> (silindir geri dönüş), <b>çekme yayı</b>, <b>burulma yayı</b> (mandallar), <b>yaprak yay</b> (otomobil).',
    use:'Tek etkili pnömatik silindirin geri dönüşü, buton yayı, kontaktör basma yayı, valf yayı, otomobil süspansiyonu. F=k·x (Hooke yasası, k yay sabiti).',
    term:[['k','Yay sabiti (N/mm)'],['d','Tel çapı'],['D','Sarım çapı'],['n','Aktif sarım sayısı']],
    std:'EN 13906 (helisel basma yayı), DIN 2095'},
  shaft:{title:'Mil (Şaft)',code:'',
    desc:'Üzerine dişli, kasnak, kavrama gibi elemanların monte edildiği, hareket ve moment ileten yuvarlak kesitli element. Çelikten (yaygın olarak C45, 42CrMo4) torna edilir, kanal açılır.',
    use:'Motor mili, redüktör mili, konveyör tahrik mili, freze tezgahı işmili. Kama yuvası (keyway) ile dişli sabitlenir.',
    term:[['d','Mil çapı (mm)'],['L','Boy'],['Kama','Çıkıntı/yiv (DIN 6885)'],['Yüzey kalitesi','Ra 0.8–1.6 (rulman oturma)']],
    std:'DIN 743 (mukavemet), ISO 286 (toleranslar)'},
  cam:{title:'Kam (Eksantrik)',code:'',
    desc:'Asimetrik kesitli, döndüğünde takipçi (follower) üzerinden doğrusal veya açısal salınımlı hareket veren element. İçten yanmalı motorlarda supap, otomatik makinelerde sıralı işlem.',
    use:'Motor supap mekanizması, mekanik zamanlama, eski tezgahlarda otomatik dönüş. Kam profili (cam profile) hareket eğrisini belirler.',
    term:[['Profil','Daire, eliptik, özel'],['Strok','Takipçinin yer değiştirmesi'],['n','Devir (rpm)']],
    std:'DIN 8000'},
  chain:{title:'Zincir–Dişli (Chain Drive)',code:'',
    desc:'Triger kayışına benzer ama metal halkalarla birbirine geçen kaymaz aktarım. Yüksek moment, uzun mesafe.',
    use:'Bisiklet, motosiklet, konveyörler, taşıma sistemleri, asansör kontrol kapı tahriki. Yağlama gerekir. Kayışa göre uzun ömürlü ama gürültülü.',
    term:[['Adım','Halka uzunluğu (1/2", 5/8" vb)'],['z','Dişli diş sayısı'],['L','Zincir halka sayısı']],
    std:'ISO 606 (rulolu zincir), DIN 8187'},
  worm:{title:'Sonsuz Vida–Karşı Dişli',code:'',
    desc:'Tek başlangıçlı vida (sonsuz) ile özel dişli arasında 90° hareket aktarımı. Tek kademede 1:100 gibi çok yüksek çevrim oranları sağlar.',
    use:'Yüksek oranlı redüktörler, asansör tahriki, vinç döner masası, otomatik kapı tahriki. Geri tahrik (self-locking) özelliği vardır: motor durunca yük geri itemez.',
    term:[['Vida başı sayısı','Genelde 1'],['Diş sayısı','30, 40, 60...'],['i','Çevrim oranı = z/k']],
    std:'DIN 3975, ISO TR 10828'},
  damper:{title:'Amortisör (Damper)',code:'',
    desc:'Yağ veya gaz dolu silindir içindeki pistonla mekanik enerjiyi (titreşim, darbe) ısıya çeviren element. Yay ile birlikte titreşim sönümleme sağlar.',
    use:'Pnömatik silindir yumuşak duruş için son amortisör, otomobil süspansiyonu, kapı yavaşlatıcı, asansör tampon. Damper olmadan piston darbe ile durursa hem ses çıkarır hem ekipman aşınır.',
    term:[['c','Sönümleme katsayısı (Ns/m)'],['Strok','İniş-çıkış mesafesi'],['F','Direnç kuvveti']],
    std:'ISO 16385 (lineer amortisör testi)'}
};

/* =================================================================
   GÖREVLER — basitleştirilmiş 12 görev (v0.4'tekiler temel alındı)
   Her komponentin .info alanı, info modalında neyi gösterecek
   ================================================================= */
const TASKS=[
  {id:'t01',cat:'Temel Devre Tanıma',level:'L1 · Temel',title:'Sinyal Lambası Devresi',
   desc:'24V DC kaynaktan bir lambayı doğrudan besle.',
   objective:'<b>Q1</b> sigortasından çıkıp <b>L+</b>’dan lambanın <b>X1</b> ucuna, <b>X2</b>’den <b>0V</b>’ye dön.',
   hint:'Yük olmadan akım kapatılırsa kısa devre olur, sigorta atar.',
   components:[
     {id:'g',name:'24V DC Kaynak',code:'G1',sym:'source24',info:'source24',power:true,x:80,y:280,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1 (2A)',sym:'fuse',info:'fuse',x:300,y:280,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'h1',name:'Sinyal Lambası',code:'H1 · Beyaz',sym:'lamp',info:'lamp',x:700,y:280,t:[{id:'h1_1',label:'X1',side:'l'},{id:'h1_2',label:'X2',side:'l'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','h1_1'],['h1_2','g_M']]},

  {id:'t02',cat:'Temel Devre Tanıma',level:'L1 · Temel',title:'Start Butonu ile Jog',
   desc:'Start butonu (S1, NO) basılı tutulduğunda lamba yansın, bırakılınca sönsün.',
   objective:'Devre: <b>L+ → Q1 → S1(13-14) → H1 → 0V</b>. Mühürleme yok.',
   hint:'EN 50005: NO buton terminalleri 13-14. Butona basınca <b>devre tamamlanır</b> ve lamba yanar.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:60,y:300,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:260,y:300,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:480,y:120,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'h1',name:'Lamba',code:'H1',sym:'lamp',info:'lamp',x:780,y:300,t:[{id:'h1_1',label:'X1',side:'l'},{id:'h1_2',label:'X2',side:'l'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','s1_13'],['s1_14','h1_1'],['h1_2','g_M']]},

  {id:'t03',cat:'Temel Devre Tanıma',level:'L1 · Temel',title:'Stop Butonu (NC)',
   desc:'Lamba normalde yanıyor; Stop butonu basılınca sönsün.',
   objective:'Devre: <b>L+ → Q1 → S2(11-12) → H1 → 0V</b>. S2 basılmadıkça kapalı, basınca açılır.',
   hint:'NC kontak güvenlik için kullanılır: kablo kopsa devre kesilir (fail-safe).',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:60,y:300,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:260,y:300,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:480,y:120,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'h1',name:'Lamba',code:'H1',sym:'lamp',info:'lamp',x:780,y:300,t:[{id:'h1_1',label:'X1',side:'l'},{id:'h1_2',label:'X2',side:'l'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','s2_11'],['s2_12','h1_1'],['h1_2','g_M']]},

  {id:'t04',cat:'Kontaktör Devreleri',level:'L2 · Kontaktör',title:'Kontaktör Bobini Sürme',
   desc:'Start ile bir kontaktör bobinini (K1·A1-A2) enerjilendir.',
   objective:'<b>L+ → Q1 → S1(13-14) → K1.A1; K1.A2 → 0V</b>',
   hint:'Bobin enerjilenince tüm NO yardımcı kontakları kapanır, NC yardımcı kontakları açılır.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:60,y:300,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:260,y:300,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:480,y:120,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'K1·A1-A2',sym:'coil',info:'coil',x:780,y:300,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'l'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','s1_13'],['s1_14','k1_a1'],['k1_a2','g_M']]},

  {id:'t05',cat:'Kontaktör Devreleri',level:'L3 · Klasik',title:'Mühürleme Devresi',
   desc:'Start-Stop ve K1’in yardımcı NO kontağı ile klasik mühürleme.',
   objective:'<b>L+ → Q1 → S2(NC) → S1(NO) ∥ K1(13-14) → K1.A1; A2 → 0V</b>. K1·13-14 kontağı S1’e <b>paralel</b>.',
   hint:'Mühürleme = kalıcı çalışma. Start bırakılınca akım K1’in kendi NO kontağından akmaya devam eder.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:50,y:330,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:230,y:330,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:410,y:110,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:610,y:110,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1 Yard.',code:'K1·13-14',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:610,y:460,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'K1·A1-A2',sym:'coil',info:'coil',x:870,y:330,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'l'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','s2_11'],['s2_12','s1_13'],['s1_14','k1_a1'],['k1_a2','g_M'],['s2_12','k1a_13'],['k1a_14','k1_a1']]},

  {id:'t06',cat:'Kontaktör Devreleri',level:'L3 · Klasik',title:'Mühürleme + Çalışma Lambası',
   desc:'K1 çekince yeşil çalışma lambası (H1) yansın.',
   objective:'Mühürleme + K1·23-24 NO üzerinden H1 yeşil lamba.',
   hint:'IEC 60204-1: Yeşil = çalışıyor; Kırmızı = arıza; Sarı = uyarı; Beyaz = enerji var.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:30,y:340,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:200,y:340,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:370,y:120,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:560,y:120,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1 Yard.',code:'K1·13-14',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:560,y:470,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'K1·A1-A2',sym:'coil',info:'coil',x:790,y:340,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]},
     {id:'k1b',name:'K1 Yard.',code:'K1·23-24',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:790,y:90,t:[{id:'k1b_23',label:'23',side:'l'},{id:'k1b_24',label:'24',side:'r'}]},
     {id:'h1',name:'Çalışıyor',code:'H1·Yeşil',sym:'lampGreen',info:'lampGreen',x:970,y:90,t:[{id:'h1_1',label:'X1',side:'l'},{id:'h1_2',label:'X2',side:'l'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','s2_11'],['s2_12','s1_13'],['s1_14','k1_a1'],['k1_a2','g_M'],['s2_12','k1a_13'],['k1a_14','k1_a1'],['q1_2','k1b_23'],['k1b_24','h1_1'],['h1_2','g_M']]},

  {id:'t07',cat:'Kontaktör Devreleri',level:'L3 · Klasik',title:'Termik Röleli Motor Koruma',
   desc:'Mühürleme devresine termik (F2·95-96) ekle.',
   objective:'Standart sıra: <b>L+ → Q1 → F2(95-96 NC) → S2 → S1∥K1 → K1.A1; A2 → 0V</b>',
   hint:'F2.95-96 normalde kapalı. Motor aşırı akım çekerse bimetal eğilir, 95-96 açılır, K1 düşer.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:30,y:340,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:180,y:340,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'f2',name:'Termik',code:'F2·95-96',sym:'thermal',info:'thermal',x:320,y:340,t:[{id:'f2_95',label:'95',side:'l'},{id:'f2_96',label:'96',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:480,y:120,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:660,y:120,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1 Yard.',code:'K1·13-14',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:660,y:470,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'K1·A1-A2',sym:'coil',info:'coil',x:880,y:340,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','f2_95'],['f2_96','s2_11'],['s2_12','s1_13'],['s1_14','k1_a1'],['k1_a2','g_M'],['s2_12','k1a_13'],['k1a_14','k1_a1']]},

  {id:'t08',cat:'Çok Noktadan Kumanda',level:'L4 · Endüstri',title:'İki Yerden Start-Stop',
   desc:'Yerel ve uzak iki noktadan kumanda.',
   objective:'Stop’lar (NC) seri, Start’lar (NO) paralel. K1·13-14 mühürleme.',
   hint:'Stop’lar seri: ikisinden biri basılınca devre kesilir. Start’lar paralel: ikisinden biri basılınca devre kapanır.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:30,y:340,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:180,y:340,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s2',name:'Stop Yerel',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:320,y:120,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s4',name:'Stop Uzak',code:'S4·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:500,y:120,t:[{id:'s4_11',label:'11',side:'l'},{id:'s4_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start Yerel',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:680,y:80,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'s3',name:'Start Uzak',code:'S3·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:680,y:220,t:[{id:'s3_13',label:'13',side:'l'},{id:'s3_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1 Yard.',code:'K1·13-14',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:680,y:480,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'K1·A1-A2',sym:'coil',info:'coil',x:900,y:340,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','s2_11'],['s2_12','s4_11'],['s4_12','s1_13'],['s4_12','s3_13'],['s4_12','k1a_13'],['s1_14','k1_a1'],['s3_14','k1_a1'],['k1a_14','k1_a1'],['k1_a2','g_M']]},

  {id:'t09',cat:'Motor Yön Değiştirme',level:'L5 · Profesyonel',title:'İleri-Geri Kilitli',
   desc:'Karşılıklı kilitleme (K2·21-22 NC bobin K1 önünde, K1·21-22 NC bobin K2 önünde).',
   objective:'İki kontaktör asla aynı anda çekemez. Bir önce K1’in NC kontağı açılır, sonra K2 çekemez.',
   hint:'Bu yöntem mekanik kilitleme yerine "elektriksel kilitleme" sağlar; daha güvenli ve mekanik aşınma yok.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:20,y:360,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:140,y:360,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:260,y:360,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s3',name:'İleri',code:'S3·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:400,y:110,t:[{id:'s3_13',label:'13',side:'l'},{id:'s3_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1 Yard.',code:'K1·13-14',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:400,y:220,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k2b',name:'K2 Kilit',code:'K2·21-22',sym:'contactNC',info:'contactNC',followsCoil:'k2',x:600,y:170,t:[{id:'k2b_21',label:'21',side:'l'},{id:'k2b_22',label:'22',side:'r'}]},
     {id:'k1',name:'K1 İleri',code:'K1·A1-A2',sym:'coil',info:'coil',x:820,y:170,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]},
     {id:'s4',name:'Geri',code:'S4·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:400,y:460,t:[{id:'s4_13',label:'13',side:'l'},{id:'s4_14',label:'14',side:'r'}]},
     {id:'k2a',name:'K2 Yard.',code:'K2·13-14',sym:'contactNO',info:'contactNO',followsCoil:'k2',x:400,y:580,t:[{id:'k2a_13',label:'13',side:'l'},{id:'k2a_14',label:'14',side:'r'}]},
     {id:'k1b',name:'K1 Kilit',code:'K1·21-22',sym:'contactNC',info:'contactNC',followsCoil:'k1',x:600,y:520,t:[{id:'k1b_21',label:'21',side:'l'},{id:'k1b_22',label:'22',side:'r'}]},
     {id:'k2',name:'K2 Geri',code:'K2·A1-A2',sym:'coil',info:'coil',x:820,y:520,t:[{id:'k2_a1',label:'A1',side:'l'},{id:'k2_a2',label:'A2',side:'r'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','s2_11'],['s2_12','s3_13'],['s2_12','k1a_13'],['s3_14','k2b_21'],['k1a_14','k2b_21'],['k2b_22','k1_a1'],['k1_a2','g_M'],['s2_12','s4_13'],['s2_12','k2a_13'],['s4_14','k1b_21'],['k2a_14','k1b_21'],['k1b_22','k2_a1'],['k2_a2','g_M']]},

  {id:'t10',cat:'Zaman Röleleri',level:'L5 · Zamanlama',title:'Gecikmeli Lamba (On-Delay)',
   desc:'Start’a basılınca lamba 5 saniye sonra yansın.',
   objective:'KT1 A1-A2 enerjilenince timer çalışır; süre dolunca 15-18 NO kapanır → H1 yanar.',
   hint:'On-delay (ZG) = gecikmeli devreye girer. Off-delay (AG) = gecikmeli devreden çıkar.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:30,y:340,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:180,y:340,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:320,y:120,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:500,y:120,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1 Yard.',code:'K1·13-14',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:500,y:470,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'K1·A1-A2',sym:'coil',info:'coil',x:730,y:340,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]},
     {id:'kt1',name:'Zaman',code:'KT1·5sn',sym:'timer',info:'timer',timerDelay:5000,x:730,y:100,t:[{id:'kt1_a1',label:'A1',side:'l'},{id:'kt1_a2',label:'A2',side:'r'},{id:'kt1_15',label:'15',side:'l'},{id:'kt1_18',label:'18',side:'r'}]},
     {id:'h1',name:'Gecikmeli',code:'H1·Sarı',sym:'lampYellow',info:'lampYellow',x:990,y:100,t:[{id:'h1_1',label:'X1',side:'l'},{id:'h1_2',label:'X2',side:'l'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','s2_11'],['s2_12','s1_13'],['s1_14','k1_a1'],['s2_12','k1a_13'],['k1a_14','k1_a1'],['k1_a2','g_M'],['s2_12','kt1_a1'],['kt1_a2','g_M'],['q1_2','kt1_15'],['kt1_18','h1_1'],['h1_2','g_M']]},

  {id:'t11',cat:'Sensör Devresi',level:'L5 · Sensör',title:'Endüktif Sensör + Lamba',
   desc:'Sensör (B1) metal cisim algılayınca lamba yansın.',
   objective:'B1 PNP: <b>L+ → B1.L+; B1.0V → 0V; B1.Q → H1.X1; H1.X2 → 0V</b>',
   hint:'PNP sensör: algılayınca Q (çıkış, siyah) ucundan +24V verir. Algılamayınca yüksek empedans (kapalı).',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:60,y:340,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:230,y:340,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'b1',name:'Sensör',code:'B1·PNP',sym:'sensor',info:'sensor',interactive:'sensor',x:430,y:200,t:[{id:'b1_24',label:'L+',side:'l'},{id:'b1_0v',label:'0V',side:'l'},{id:'b1_out',label:'Q',side:'r'}]},
     {id:'h1',name:'Lamba',code:'H1',sym:'lamp',info:'lamp',x:780,y:340,t:[{id:'h1_1',label:'X1',side:'l'},{id:'h1_2',label:'X2',side:'l'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','b1_24'],['b1_0v','g_M'],['b1_out','h1_1'],['h1_2','g_M']]},

  {id:'t12',cat:'Birleşik Proje',level:'L6 · İleri',title:'Tam Motor Kumanda Devresi',
   desc:'Start-Stop + Termik + Çalışma yeşil + Arıza kırmızı lambası.',
   objective:'Tam endüstri standardı pano kumanda devresi. Termik atınca K1 düşer, H2 kırmızı yanar.',
   hint:'Bu, gerçek bir endüstriyel pano şemasının kumanda devresi tasarımıdır.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:30,y:360,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:180,y:360,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'f2',name:'Termik',code:'F2',sym:'thermal',info:'thermal',interactive:'thermal',x:320,y:360,t:[{id:'f2_95',label:'95',side:'l'},{id:'f2_96',label:'96',side:'r'},{id:'f2_97',label:'97',side:'l'},{id:'f2_98',label:'98',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:480,y:140,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:660,y:140,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1·13-14',code:'NO Mühür',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:660,y:480,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'A1-A2',sym:'coil',info:'coil',x:870,y:360,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]},
     {id:'k1b',name:'K1·23-24',code:'NO H1',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:870,y:100,t:[{id:'k1b_23',label:'23',side:'l'},{id:'k1b_24',label:'24',side:'r'}]},
     {id:'h1',name:'Çalışıyor',code:'H1·Yeşil',sym:'lampGreen',info:'lampGreen',x:1020,y:100,t:[{id:'h1_1',label:'X1',side:'l'},{id:'h1_2',label:'X2',side:'l'}]},
     {id:'h2',name:'Arıza',code:'H2·Kırmızı',sym:'lampRed',info:'lampRed',x:1020,y:600,t:[{id:'h2_1',label:'X1',side:'l'},{id:'h2_2',label:'X2',side:'l'}]}
   ],
   solution:[['g_L','q1_1'],['q1_2','f2_95'],['f2_96','s2_11'],['s2_12','s1_13'],['s1_14','k1_a1'],['k1_a2','g_M'],['s2_12','k1a_13'],['k1a_14','k1_a1'],['q1_2','k1b_23'],['k1b_24','h1_1'],['h1_2','g_M'],['q1_2','f2_97'],['f2_98','h2_1'],['h2_2','g_M']]},

  {id:'t13',cat:'3 Fazlı Güç Devresi',level:'L6 · Güç',title:'Direkt Yol Vermeli Motor (Kumanda+Güç)',
   desc:'Hem 24V DC kumanda devresi hem 3 fazlı 400V AC güç devresi birlikte.',
   objective:'Aşağıdaki <b>kumanda devresinde</b> mühürlemeyi kur. Üstteki <b>3 fazlı güç devresinde</b> K1 ana kontaklarını (1-2, 3-4, 5-6) hat ve motor arasına yerleştir.',
   hint:'<b>Endüstride iki ayrı devre var:</b> Kumanda 24V DC (güvenli, ince kablo); Güç 400V AC (büyük kesit). K1 bobini kumandadan, ana kontakları güç hattından geçer. Termik (F2) güç hattında, ama 95-96 NC kontağı kumandada.',
   hasPower:true,
   components:[
     // Kumanda devresi (alt)
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:30,y:360,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1·2A',sym:'fuse',info:'fuse',x:180,y:360,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'f2c',name:'Termik NC',code:'F2·95-96',sym:'thermal',info:'thermal',interactive:'thermal',x:320,y:360,t:[{id:'f2c_95',label:'95',side:'l'},{id:'f2c_96',label:'96',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:480,y:140,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:660,y:140,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1·13-14',code:'Mühür NO',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:660,y:480,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'A1-A2',sym:'coil',info:'coil',x:870,y:360,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]},
     // Güç devresi (üst sahne) — ayrı render edilecek
   ],
   powerComponents:[
     {id:'l1',name:'L1',x:80,y:30,rail:1,terms:[{id:'l1_o',label:'L1',side:'b'}]},
     {id:'l2',name:'L2',x:80,y:80,rail:2,terms:[{id:'l2_o',label:'L2',side:'b'}]},
     {id:'l3',name:'L3',x:80,y:130,rail:3,terms:[{id:'l3_o',label:'L3',side:'b'}]},
     {id:'k1m1',name:'K1·1-2',label:'1',code:'1-2',followsCoil:'k1',x:400,y:30,terms:[{id:'k1m1_1',label:'1',side:'l'},{id:'k1m1_2',label:'2',side:'r'}]},
     {id:'k1m2',name:'K1·3-4',label:'3',code:'3-4',followsCoil:'k1',x:400,y:80,terms:[{id:'k1m2_3',label:'3',side:'l'},{id:'k1m2_4',label:'4',side:'r'}]},
     {id:'k1m3',name:'K1·5-6',label:'5',code:'5-6',followsCoil:'k1',x:400,y:130,terms:[{id:'k1m3_5',label:'5',side:'l'},{id:'k1m3_6',label:'6',side:'r'}]},
     {id:'mot',name:'Motor M1',x:800,y:80,kind:'motor3',terms:[{id:'mot_u',label:'U',side:'l'},{id:'mot_v',label:'V',side:'l'},{id:'mot_w',label:'W',side:'l'}]}
   ],
   powerSolution:[['l1_o','k1m1_1'],['l2_o','k1m2_3'],['l3_o','k1m3_5'],['k1m1_2','mot_u'],['k1m2_4','mot_v'],['k1m3_6','mot_w']],
   solution:[['g_L','q1_1'],['q1_2','f2c_95'],['f2c_96','s2_11'],['s2_12','s1_13'],['s1_14','k1_a1'],['k1_a2','g_M'],['s2_12','k1a_13'],['k1a_14','k1_a1']]},

  {id:'t14',cat:'Güvenlik Devresi',level:'L4 · Emniyet',title:'Acil Durdurma + Sesli Alarm',
   desc:'Acil stop (mantar buton) basılınca motor durur, buzzer çalar. Makinenin enerjisiz olduğunu sesle duyurur.',
   objective:'S0 (NC mantar buton) → K1 devre dışı → K1·21-22 (NC) kapanır → P1 buzzer çalar. Normal çalışmada P1 sessiz, K1 çekikken K1·21-22 açık.',
   hint:'<b>Neden NC kontak?</b> Acil stop NC (normalde kapalı) olmalı — kablo kopsa bile devre kesilir. <b>Fail-safe</b> tasarım prensibi.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:30,y:360,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:180,y:360,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s0',name:'Acil Stop',code:'S0·NC',sym:'buttonMush',info:'buttonMush',interactive:'button',x:330,y:360,t:[{id:'s0_11',label:'11',side:'l'},{id:'s0_12',label:'12',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:490,y:120,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:660,y:120,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1·13-14',code:'Mühür NO',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:660,y:420,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'K1·A1-A2',sym:'coil',info:'coil',x:870,y:270,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]},
     {id:'k1b',name:'K1·21-22',code:'NC Alarm',sym:'contactNC',info:'contactNC',followsCoil:'k1',x:660,y:590,t:[{id:'k1b_21',label:'21',side:'l'},{id:'k1b_22',label:'22',side:'r'}]},
     {id:'p1',name:'Alarm',code:'P1·Buzzer',sym:'buzzer',info:'buzzer',x:870,y:590,t:[{id:'p1_x1',label:'X1',side:'l'},{id:'p1_x2',label:'X2',side:'r'}]}
   ],
   solution:[
     ['g_L','q1_1'],['q1_2','s0_11'],['s0_12','s2_11'],['s2_12','s1_13'],['s1_14','k1_a1'],
     ['s2_12','k1a_13'],['k1a_14','k1_a1'],['k1_a2','g_M'],
     ['q1_2','k1b_21'],['k1b_22','p1_x1'],['p1_x2','g_M']
   ]},

  {id:'t15',cat:'Motor Kalkış',level:'L6 · Yıldız-Üçgen',title:'Yıldız-Üçgen Otomatik Kalkış',
   desc:'Motor önce yıldız (Y) bağlamada düşük akımla başlar. 5 sn sonra KT timer üçgen (Δ) bağlamaya geçirir. Kalkış akımı ~1/3 oranında azalır.',
   objective:'Start basınca K1+KY çeker (yıldız). KT1 5sn sonra KD devreye girer, KD·21-22 NC kontağı KY\'yi keser (üçgen). KY ve KD ASLA aynı anda çekemez.',
   hint:'<b>Neden Y-Δ?</b> Doğrudan kalkışta motor nominal akımın 5-7 katı akım çeker. Yıldız bağlamada faz gerilimine (230V) bağlanır → düşük akım. Üçgen\'de hat gerilimine (400V) geçer → tam güç.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:30,y:380,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:170,y:380,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:300,y:380,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:430,y:120,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1·13-14',code:'Mühür NO',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:430,y:280,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Ana',code:'K1·A1-A2',sym:'coil',info:'coil',x:630,y:200,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]},
     {id:'k1b',name:'K1·23-24',code:'NO KT/KY',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:300,y:530,t:[{id:'k1b_23',label:'23',side:'l'},{id:'k1b_24',label:'24',side:'r'}]},
     {id:'kt1',name:'KT1 5sn',code:'KT1·On-Delay',sym:'timer',info:'timer',timerDelay:5000,x:500,y:530,t:[{id:'kt1_a1',label:'A1',side:'l'},{id:'kt1_a2',label:'A2',side:'r'},{id:'kt1_15',label:'15',side:'l'},{id:'kt1_18',label:'18',side:'r'}]},
     {id:'kda',name:'KD·21-22',code:'NC KD Kilit',sym:'contactNC',info:'contactNC',followsCoil:'kd',x:700,y:640,t:[{id:'kda_21',label:'21',side:'l'},{id:'kda_22',label:'22',side:'r'}]},
     {id:'ky',name:'KY Yıldız',code:'KY·A1-A2',sym:'coil',info:'coil',x:900,y:640,t:[{id:'ky_a1',label:'A1',side:'l'},{id:'ky_a2',label:'A2',side:'r'}]},
     {id:'kya',name:'KY·21-22',code:'NC KY Kilit',sym:'contactNC',info:'contactNC',followsCoil:'ky',x:700,y:760,t:[{id:'kya_21',label:'21',side:'l'},{id:'kya_22',label:'22',side:'r'}]},
     {id:'kd',name:'KD Üçgen',code:'KD·A1-A2',sym:'coil',info:'coil',x:900,y:760,t:[{id:'kd_a1',label:'A1',side:'l'},{id:'kd_a2',label:'A2',side:'r'}]}
   ],
   solution:[
     ['g_L','q1_1'],['q1_2','s2_11'],
     ['s2_12','s1_13'],['s1_14','k1_a1'],
     ['s2_12','k1a_13'],['k1a_14','k1_a1'],['k1_a2','g_M'],
     ['q1_2','k1b_23'],
     ['k1b_24','kt1_a1'],['kt1_a2','g_M'],
     ['k1b_24','kt1_15'],
     ['k1b_24','kda_21'],['kda_22','ky_a1'],['ky_a2','g_M'],
     ['kt1_18','kya_21'],['kya_22','kd_a1'],['kd_a2','g_M']
   ]},

  {id:'t16',cat:'Güç Devresi',level:'L5 · Faz Kontrolü',title:'Faz Koruma Rölesi + Motor',
   desc:'3 fazlı şebekede faz kaybı, faz sırası hatası veya gerilim dengesizliği olunca motor otomatik durur.',
   objective:'FKR (Faz Koruma Rölesi) N/O kontağı K1 bobini önüne seri bağla. Normal şebekede FKR NO kapanır → motor çalışır. Arızada FKR NO açılır → motor durur.',
   hint:'<b>Faz kaybı neden tehlikeli?</b> 2 fazla çalışan motor faz akımı yükselir → ısınır → yanar. Faz koruma rölesi bu durumu mikrosaniyelerde algılar.',
   components:[
     {id:'g',name:'24V DC',code:'G1',sym:'source24',info:'source24',power:true,x:30,y:340,t:[{id:'g_L',label:'L+',side:'r'},{id:'g_M',label:'0V',side:'r'}]},
     {id:'q1',name:'Sigorta',code:'Q1',sym:'fuse',info:'fuse',x:170,y:340,t:[{id:'q1_1',label:'1',side:'l'},{id:'q1_2',label:'2',side:'r'}]},
     {id:'fkr',name:'Faz Koruma',code:'FKR·NO',sym:'contactNO',info:'contactNO',x:320,y:340,t:[{id:'fkr_13',label:'13',side:'l'},{id:'fkr_14',label:'14',side:'r'}]},
     {id:'f2',name:'Termik',code:'F2·95-96',sym:'thermal',info:'thermal',interactive:'thermal',x:470,y:340,t:[{id:'f2_95',label:'95',side:'l'},{id:'f2_96',label:'96',side:'r'},{id:'f2_97',label:'97',side:'l'},{id:'f2_98',label:'98',side:'r'}]},
     {id:'s2',name:'Stop',code:'S2·NC',sym:'buttonNC',info:'buttonNC',interactive:'button',x:620,y:120,t:[{id:'s2_11',label:'11',side:'l'},{id:'s2_12',label:'12',side:'r'}]},
     {id:'s1',name:'Start',code:'S1·NO',sym:'buttonNO',info:'buttonNO',interactive:'button',x:780,y:120,t:[{id:'s1_13',label:'13',side:'l'},{id:'s1_14',label:'14',side:'r'}]},
     {id:'k1a',name:'K1·13-14',code:'Mühür NO',sym:'contactNO',info:'contactNO',followsCoil:'k1',x:780,y:460,t:[{id:'k1a_13',label:'13',side:'l'},{id:'k1a_14',label:'14',side:'r'}]},
     {id:'k1',name:'K1 Bobin',code:'K1·A1-A2',sym:'coil',info:'coil',x:980,y:290,t:[{id:'k1_a1',label:'A1',side:'l'},{id:'k1_a2',label:'A2',side:'r'}]},
     {id:'h2',name:'Faz Arıza',code:'H2·Kırmızı',sym:'lampRed',info:'lampRed',x:980,y:560,t:[{id:'h2_1',label:'X1',side:'l'},{id:'h2_2',label:'X2',side:'r'}]}
   ],
   solution:[
     ['g_L','q1_1'],['q1_2','fkr_13'],['fkr_14','f2_95'],['f2_96','s2_11'],
     ['s2_12','s1_13'],['s1_14','k1_a1'],
     ['s2_12','k1a_13'],['k1a_14','k1_a1'],['k1_a2','g_M'],
     ['q1_2','f2_97'],['f2_98','h2_1'],['h2_2','g_M']
   ]}
];

/* =================================================================
   ELEMAN KÜTÜPHANESİ (serbest moda eklenebilir + bilgi sayfası)
   ================================================================= */
const LIBRARY = [
  {sym:'source24',name:'24V DC Kaynak',code:'G1',terms:[{label:'L+',side:'r'},{label:'0V',side:'r'}],power:true},
  {sym:'fuse',name:'Sigorta',code:'Q?',terms:[{label:'1',side:'l'},{label:'2',side:'r'}]},
  {sym:'mcb',name:'Otomatik Sigorta',code:'Q?',terms:[{label:'1',side:'l'},{label:'2',side:'r'}]},
  {sym:'switch2',name:'Anahtar',code:'S?',terms:[{label:'1',side:'l'},{label:'2',side:'r'}],interactive:'switch'},
  {sym:'buttonNO',name:'Start (NO)',code:'S?',terms:[{label:'13',side:'l'},{label:'14',side:'r'}],interactive:'button'},
  {sym:'buttonNC',name:'Stop (NC)',code:'S?',terms:[{label:'11',side:'l'},{label:'12',side:'r'}],interactive:'button'},
  {sym:'buttonMush',name:'Acil Stop',code:'S0',terms:[{label:'11',side:'l'},{label:'12',side:'r'}],interactive:'button'},
  {sym:'coil',name:'Kontaktör Bobini',code:'K?',terms:[{label:'A1',side:'l'},{label:'A2',side:'r'}]},
  {sym:'contactNO',name:'Yard. NO',code:'K?·13-14',terms:[{label:'13',side:'l'},{label:'14',side:'r'}]},
  {sym:'contactNC',name:'Yard. NC',code:'K?·21-22',terms:[{label:'21',side:'l'},{label:'22',side:'r'}]},
  {sym:'thermal',name:'Termik',code:'F?',terms:[{label:'95',side:'l'},{label:'96',side:'r'},{label:'97',side:'l'},{label:'98',side:'r'}],interactive:'thermal'},
  {sym:'timer',name:'Zaman Rölesi',code:'KT?',terms:[{label:'A1',side:'l'},{label:'A2',side:'r'},{label:'15',side:'l'},{label:'18',side:'r'}],timerDelay:3000},
  {sym:'lamp',name:'Lamba Beyaz',code:'H?',terms:[{label:'X1',side:'l'},{label:'X2',side:'l'}]},
  {sym:'lampGreen',name:'Lamba Yeşil',code:'H?',terms:[{label:'X1',side:'l'},{label:'X2',side:'l'}]},
  {sym:'lampRed',name:'Lamba Kırmızı',code:'H?',terms:[{label:'X1',side:'l'},{label:'X2',side:'l'}]},
  {sym:'lampYellow',name:'Lamba Sarı',code:'H?',terms:[{label:'X1',side:'l'},{label:'X2',side:'l'}]},
  {sym:'motor',name:'Motor 3~',code:'M?',terms:[{label:'U',side:'l'},{label:'V',side:'l'},{label:'W',side:'l'}]},
  {sym:'sensor',name:'Sensör',code:'B?',terms:[{label:'L+',side:'l'},{label:'0V',side:'l'},{label:'Q',side:'r'}],interactive:'sensor'},
  {sym:'buzzer',name:'Buzzer',code:'P?',terms:[{label:'X1',side:'l'},{label:'X2',side:'l'}]}
];