#!/usr/bin/env python3
"""gundam_bust.html tasarim/spec sayfasini uretir (PNG'ler base64 gomulu)."""
import base64, os

def b64(p):
    with open(p, "rb") as f:
        return base64.b64encode(f.read()).decode()

hero = b64("hero.png")
preview = b64("preview.png")

HTML = f"""<title>MECHA-01 Bust Kit</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
:root{{
  --ground:#eef1f7; --panel:#ffffff; --panel2:#f5f7fc;
  --ink:#161b24; --muted:#5b667a; --line:#d5dbe8; --line2:#e6ebf4;
  --accent:#0e7490; --accent-ink:#0b5566; --amber:#b45309; --grid:#dbe2f0;
  --good:#0f766e; --warn:#b45309;
  --shadow:0 1px 2px rgba(20,30,50,.06),0 8px 30px rgba(20,30,50,.06);
}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{
  --ground:#0c0f16; --panel:#141924; --panel2:#101521;
  --ink:#e7ecf6; --muted:#8b97ab; --line:#252d3c; --line2:#1c2432;
  --accent:#3cc7f0; --accent-ink:#8fe0f7; --amber:#f5b544; --grid:#1a2130;
  --good:#34d3b5; --warn:#f5b544;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 40px rgba(0,0,0,.5);
}}}}
:root[data-theme="dark"]{{
  --ground:#0c0f16; --panel:#141924; --panel2:#101521;
  --ink:#e7ecf6; --muted:#8b97ab; --line:#252d3c; --line2:#1c2432;
  --accent:#3cc7f0; --accent-ink:#8fe0f7; --amber:#f5b544; --grid:#1a2130;
  --good:#34d3b5; --warn:#f5b544;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 40px rgba(0,0,0,.5);
}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--ground);color:var(--ink);
  font-family:"IBM Plex Sans",system-ui,sans-serif;line-height:1.6;
  -webkit-font-smoothing:antialiased;}}
.wrap{{max-width:1080px;margin:0 auto;padding:clamp(20px,4vw,48px);}}
h1,h2,h3{{font-family:"Chakra Petch",sans-serif;font-weight:600;text-wrap:balance;line-height:1.1;margin:0;}}
.mono{{font-family:"IBM Plex Mono",monospace;}}
.eyebrow{{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.22em;
  text-transform:uppercase;color:var(--accent);}}

/* header */
header{{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:flex-end;
  justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:22px;}}
header .title h1{{font-size:clamp(30px,5.5vw,52px);letter-spacing:.01em;}}
header .title .sub{{color:var(--muted);margin-top:6px;max-width:52ch;}}
.rev{{font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--muted);text-align:right;}}
.rev b{{color:var(--ink);}}

/* spec strip */
.strip{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
  gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;
  overflow:hidden;margin:26px 0;}}
.strip div{{background:var(--panel);padding:14px 16px;}}
.strip .k{{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);}}
.strip .v{{font-family:"Chakra Petch",sans-serif;font-size:20px;font-weight:600;margin-top:3px;
  font-variant-numeric:tabular-nums;}}
.strip .v small{{font-size:12px;color:var(--muted);font-weight:500;}}

section{{margin:44px 0;}}
.sec-head{{display:flex;align-items:baseline;gap:14px;margin-bottom:18px;}}
.sec-head h2{{font-size:22px;}}
.sec-head .n{{font-family:"IBM Plex Mono",monospace;color:var(--accent);font-size:14px;}}
.sec-head .rule{{flex:1;height:1px;background:var(--line);align-self:center;}}

.imgcard{{background:
   linear-gradient(var(--grid) 1px,transparent 1px),
   linear-gradient(90deg,var(--grid) 1px,transparent 1px);
  background-size:26px 26px,26px 26px;background-color:var(--panel2);
  border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);}}
.imgcard img{{display:block;width:100%;height:auto;}}
.cap{{font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--muted);
  padding:10px 14px;border-top:1px solid var(--line);}}

.grid2{{display:grid;grid-template-columns:1fr 1fr;gap:22px;}}
.grid2>.imgcard img{{background:transparent;}}
@media(max-width:720px){{.grid2{{grid-template-columns:1fr;}}}}

/* technical drawing svg */
.dwg{{background:var(--panel2);border:1px solid var(--line);border-radius:14px;
  padding:8px;box-shadow:var(--shadow);}}
.dwg svg{{display:block;width:100%;height:auto;}}
.dwg .out{{fill:none;stroke:var(--ink);stroke-width:1.6;stroke-linejoin:round;}}
.dwg .det{{fill:none;stroke:var(--muted);stroke-width:1;}}
.dwg .scr{{fill:color-mix(in srgb,var(--accent) 22%,transparent);stroke:var(--accent);stroke-width:1.4;}}
.dwg .comp{{stroke-width:1.3;}}
.dwg .dim{{stroke:var(--accent);stroke-width:.8;}}
.dwg .dimt{{fill:var(--accent);font-family:"IBM Plex Mono",monospace;font-size:9px;}}
.dwg .lbl{{fill:var(--ink);font-family:"IBM Plex Mono",monospace;font-size:8.5px;}}
.dwg .lbm{{fill:var(--muted);font-family:"IBM Plex Mono",monospace;font-size:8px;}}

/* tables */
table{{width:100%;border-collapse:collapse;font-size:14px;}}
th,td{{text-align:left;padding:11px 12px;border-bottom:1px solid var(--line2);vertical-align:top;}}
th{{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line);}}
td.mono,.tabnum{{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;}}
tr:last-child td{{border-bottom:none;}}
.tbl{{background:var(--panel);border:1px solid var(--line);border-radius:14px;
  overflow:hidden;box-shadow:var(--shadow);}}
.tbl .pad{{padding:4px 10px;}}

.pill{{display:inline-block;font-family:"IBM Plex Mono",monospace;font-size:11px;
  padding:2px 9px;border-radius:999px;border:1px solid var(--line);color:var(--muted);}}
.pill.ok{{color:var(--good);border-color:color-mix(in srgb,var(--good) 45%,var(--line));}}

/* steps */
.steps{{display:grid;gap:2px;background:var(--line);border:1px solid var(--line);
  border-radius:14px;overflow:hidden;box-shadow:var(--shadow);}}
.step{{background:var(--panel);padding:16px 18px;display:grid;grid-template-columns:auto 1fr;gap:16px;}}
.step .no{{font-family:"Chakra Petch",sans-serif;font-weight:700;font-size:22px;color:var(--accent);
  font-variant-numeric:tabular-nums;line-height:1;}}
.step h3{{font-size:15px;margin-bottom:3px;}}
.step p{{margin:0;color:var(--muted);font-size:14px;}}

.note{{background:var(--panel2);border-left:3px solid var(--amber);border-radius:0 10px 10px 0;
  padding:12px 16px;font-size:14px;color:var(--ink);}}
.note b{{color:var(--amber);}}
.cols{{display:grid;grid-template-columns:1fr 1fr;gap:22px;}}
@media(max-width:720px){{.cols{{grid-template-columns:1fr;}}}}
footer{{border-top:1px solid var(--line);margin-top:48px;padding-top:20px;
  font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--muted);
  display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;}}
ul.tight{{margin:6px 0 0;padding-left:18px;}}
ul.tight li{{margin:3px 0;color:var(--muted);font-size:14px;}}
ul.tight li b{{color:var(--ink);font-weight:600;}}
</style>

<div class="wrap">
<header>
  <div class="title">
    <div class="eyebrow">Masaustu Bust &middot; 3D Baski Kiti</div>
    <h1>MECHA-01 Bust</h1>
    <div class="sub">1.3&Prime; AMOLED ekranli, ESP32-C3 tabanli masaustu mecha bust. Govde ici elektronik yuvasi, kafada dokunmatik sensor ve arkadan sokulebilir kapak.</div>
  </div>
  <div class="rev">
    REV <b>A</b><br>UNIT <b>mm</b><br>SCALE <b>1:1</b>
  </div>
</header>

<div class="strip">
  <div><div class="k">Yukseklik</div><div class="v">188<small> mm</small></div></div>
  <div><div class="k">Genislik</div><div class="v">175<small> mm (omuz)</small></div></div>
  <div><div class="k">Derinlik</div><div class="v">92<small> mm</small></div></div>
  <div><div class="k">Ekran</div><div class="v">1.3<small>&Prime; AMOLED</small></div></div>
  <div><div class="k">MCU</div><div class="v">ESP32-C3</div></div>
  <div><div class="k">Parca</div><div class="v">2<small> (govde+kapak)</small></div></div>
</div>

<section>
  <div class="sec-head"><span class="n">01</span><h2>Genel gorunum</h2><span class="rule"></span></div>
  <div class="imgcard">
    <img src="data:image/png;base64,{hero}" alt="Gundam bust 3/4 perspektif">
    <div class="cap">// gundam_bust.stl &mdash; on 3/4 perspektif. V-fin anten, visor + goz yarigi, gogus ekran penceresi, omuz zirhi, kaide.</div>
  </div>
</section>

<section>
  <div class="sec-head"><span class="n">02</span><h2>Teknik cizim &amp; ic yerlesim</h2><span class="rule"></span></div>
  <div class="grid2">
    <div class="dwg">{{FRONT_SVG}}</div>
    <div class="dwg">{{SIDE_SVG}}</div>
  </div>
  <p style="color:var(--muted);font-size:13px;margin-top:12px">
    Olculer temsili &amp; yuvarlanmistir; birebir mesh degerleri icin STL'i CAD/dilimleyicide olcun.
    Ic yuva net alani: <b class="mono" style="color:var(--ink)">~70&ndash;112 &times; 85 &times; 50 mm</b> &rarr; tum modüller rahat sigar.
  </p>
</section>

<section>
  <div class="sec-head"><span class="n">03</span><h2>Cok acili gorunum</h2><span class="rule"></span></div>
  <div class="imgcard">
    <img src="data:image/png;base64,{preview}" alt="On, yan, ust ve perspektif gorunumler">
    <div class="cap">// on-3/4 &middot; yan &middot; on &middot; ust &mdash; arka yuzde elektronik kapagi acikligi (yan gorunumde).</div>
  </div>
</section>

<section>
  <div class="sec-head"><span class="n">04</span><h2>Malzeme listesi (BOM)</h2><span class="rule"></span></div>
  <div class="tbl"><div class="pad">
  <table>
    <thead><tr><th>Bilesen</th><th>Boyut (mm)</th><th>Yuva</th><th>Durum</th></tr></thead>
    <tbody>
      <tr><td><b>1.3&Prime; AMOLED ekran</b><br><span class="lbm mono" style="color:var(--muted)">SPI/QSPI modul</span></td><td class="mono">36 &times; 36 &times; 6</td><td>Gogus cebi + 26&times;26 pencere</td><td><span class="pill ok">sigar</span></td></tr>
      <tr><td><b>ESP32-C3 SuperMini</b></td><td class="mono">22.5 &times; 18 &times; 6</td><td>Ic yuva (arka duvar)</td><td><span class="pill ok">sigar</span></td></tr>
      <tr><td><b>TP4056 sarj modulu</b><br><span class="lbm mono" style="color:var(--muted)">USB-C tercih</span></td><td class="mono">26 &times; 17 &times; 5</td><td>Ic yuva (alt)</td><td><span class="pill ok">sigar</span></td></tr>
      <tr><td><b>LiPo batarya</b><br><span class="lbm mono" style="color:var(--muted)">603040 / benzeri</span></td><td class="mono">40 &times; 30 &times; 9</td><td>Ic yuva (ust)</td><td><span class="pill ok">sigar</span></td></tr>
      <tr><td><b>Dokunmatik sensor</b><br><span class="lbm mono" style="color:var(--muted)">TTP223 / metal pad</span></td><td class="mono">&Oslash;14 &times; 4</td><td>Kafa ustu cep + kablo kanali</td><td><span class="pill ok">sigar</span></td></tr>
      <tr><td>Arka kapak</td><td class="mono">71 &times; 76 &times; 7</td><td>Surme + lip (0.35 tol.)</td><td><span class="pill">ayri STL</span></td></tr>
    </tbody>
  </table>
  </div></div>
</section>

<section>
  <div class="sec-head"><span class="n">05</span><h2>STL dosyalari</h2><span class="rule"></span></div>
  <div class="tbl"><div class="pad">
  <table>
    <thead><tr><th>Dosya</th><th>Icerik</th><th>Bbox (mm)</th><th>Ucgen</th></tr></thead>
    <tbody>
      <tr><td class="mono">gundam_bust.stl</td><td>Ana govde (kafa+gogus+omuz+kaide)</td><td class="mono">175 &times; 92 &times; 188</td><td class="mono">1184</td></tr>
      <tr><td class="mono">gundam_bust_cover.stl</td><td>Arka elektronik kapagi</td><td class="mono">71 &times; 7 &times; 76</td><td class="mono">28</td></tr>
      <tr><td class="mono">gundam_bust_full.stl</td><td>Montajli onizleme (baski icin degil)</td><td class="mono">175 &times; 113 &times; 188</td><td class="mono">1212</td></tr>
    </tbody>
  </table>
  </div></div>
  <p style="color:var(--muted);font-size:13px;margin-top:10px">Tum meshler <b class="mono" style="color:var(--good)">watertight</b> (su gecirmez) &mdash; dilimleyiciye dogrudan girer. Parametrik kaynak: <span class="mono">gundam_bust.py</span>.</p>
</section>

<section>
  <div class="sec-head"><span class="n">06</span><h2>Baski &amp; montaj</h2><span class="rule"></span></div>
  <div class="cols">
    <div>
      <h3 style="font-size:15px;margin-bottom:10px">Baski ayarlari</h3>
      <ul class="tight">
        <li><b>Yon:</b> govde dik, arka yuz tablaya bakacak sekilde (ekran penceresi ustte kalir, destek minimum).</li>
        <li><b>Destek:</b> V-fin, omuz altlari ve visor icin (tercihen tree/organic).</li>
        <li><b>Duvar:</b> 3 mm tasarim &rarr; 3&ndash;4 perimeter, %15&ndash;20 dolgu yeterli.</li>
        <li><b>Katman:</b> 0.2 mm; yuz/visor detayi icin 0.12&ndash;0.16 mm daha temiz.</li>
        <li><b>Malzeme:</b> PLA/PETG. Kapak toleransi <span class="mono">0.35 mm</span> &mdash; sikiysa yazici akisini/olcegi ayarla.</li>
      </ul>
    </div>
    <div>
      <h3 style="font-size:15px;margin-bottom:10px">Montaj sirasi</h3>
      <div class="steps">
        <div class="step"><span class="no">1</span><div><h3>Ekran</h3><p>AMOLED modulu on gogus cebine yerlestir, cami 26&times;26 pencereye hizala; arkadan sicak tutkal/vida.</p></div></div>
        <div class="step"><span class="no">2</span><div><h3>Dokunmatik</h3><p>TTP223'u kafa ustu cebe koy; sinyal/güç kablosunu &Oslash;5 kanaldan govde yuvasina indir.</p></div></div>
        <div class="step"><span class="no">3</span><div><h3>Guc</h3><p>LiPo &rarr; TP4056 &rarr; ESP32-C3 5V/3V3. TP4056 USB-C portunu kapak kenarina hizala (gerekirse kapakta delik ac).</p></div></div>
        <div class="step"><span class="no">4</span><div><h3>Kapak</h3><p>Kabloları toparla, arka kapagi lip'e bastir. Sikiysa zimparala, gevsekse bant/vida.</p></div></div>
      </div>
    </div>
  </div>
  <div class="note" style="margin-top:20px">
    <b>Not:</b> Olculer gercek modullere gore <b>parametrik</b>. Kendi kartların farkliysa <span class="mono">gundam_bust.py</span> icindeki <span class="mono">P{{...}}</span> sozlugunden ( or. <span class="mono">scr_board_w</span>, <span class="mono">torso_depth</span>, <span class="mono">touch_dia</span>) degistirip yeniden uret.
  </div>
</section>

<footer>
  <div>MECHA-01 &middot; parametrik OpenSCAD-benzeri Python/trimesh uretimi</div>
  <div>REV A &middot; watertight &middot; mm / 1:1</div>
</footer>
</div>
"""

# ---- SVG: FRONT ELEVATION -------------------------------------------------
# koordinat: model x(-87..87), z(0..188) -> svg (10+ (x+95), 20 + (188 - z))
def fx(x): return 20 + (x + 90)
def fy(z): return 20 + (188 - z)

FRONT_SVG = f'''<svg viewBox="0 0 220 230" role="img" aria-label="On elevation">
<text class="lbl" x="12" y="14">ON ELEVATION</text>
<!-- kaide -->
<polygon class="out" points="{fx(-66)},{fy(0)} {fx(66)},{fy(0)} {fx(66)},{fy(9)} {fx(52)},{fy(12)} {fx(-52)},{fy(12)} {fx(-66)},{fy(9)}"/>
<!-- torso trapez -->
<polygon class="out" points="{fx(-38)},{fy(12)} {fx(38)},{fy(12)} {fx(59)},{fy(106)} {fx(-59)},{fy(106)}"/>
<!-- omuzlar -->
<polygon class="det" points="{fx(-85)},{fy(78)} {fx(-52)},{fy(96)} {fx(-52)},{fy(74)} {fx(-83)},{fy(66)}"/>
<polygon class="det" points="{fx(85)},{fy(78)} {fx(52)},{fy(96)} {fx(52)},{fy(74)} {fx(83)},{fy(66)}"/>
<!-- gogus plakasi + ekran -->
<rect class="det" x="{fx(-31)}" y="{fy(90)}" width="{62}" height="{60}"/>
<rect class="scr" x="{fx(-13)}" y="{fy(85)}" width="{26}" height="{26}"/>
<text class="lbl" x="{fx(20)}" y="{fy(72)+3}">1.3&quot; AMOLED</text>
<!-- boyun + kafa -->
<rect class="det" x="{fx(-13)}" y="{fy(118)}" width="26" height="12"/>
<polygon class="out" points="{fx(-25)},{fy(120)} {fx(25)},{fy(120)} {fx(25)},{fy(166)} {fx(-25)},{fy(166)}"/>
<!-- visor -->
<rect class="scr" x="{fx(-20)}" y="{fy(148)}" width="40" height="6"/>
<!-- kulak vent -->
<rect class="det" x="{fx(-28)}" y="{fy(154)}" width="4" height="14"/>
<rect class="det" x="{fx(24)}" y="{fy(154)}" width="4" height="14"/>
<!-- touch cep -->
<circle class="scr" cx="{fx(0)}" cy="{fy(166)}" r="7"/>
<text class="lbm" x="{fx(9)}" y="{fy(166)+2}">touch &Oslash;14</text>
<!-- V-fin -->
<polygon class="out" points="{fx(6)},{fy(162)} {fx(40)},{fy(186)} {fx(34)},{fy(180)} {fx(4)},{fy(160)}"/>
<polygon class="out" points="{fx(-6)},{fy(162)} {fx(-40)},{fy(186)} {fx(-34)},{fy(180)} {fx(-4)},{fy(160)}"/>
<rect class="det" x="{fx(-4)}" y="{fy(172)}" width="8" height="10"/>
<!-- dimensions -->
<line class="dim" x1="{fx(-90)}" y1="{fy(0)}" x2="{fx(-90)}" y2="{fy(188)}"/>
<line class="dim" x1="{fx(-92)}" y1="{fy(0)}" x2="{fx(-88)}" y2="{fy(0)}"/>
<line class="dim" x1="{fx(-92)}" y1="{fy(188)}" x2="{fx(-88)}" y2="{fy(188)}"/>
<text class="dimt" x="{fx(-88)}" y="{fy(94)}" transform="rotate(-90 {fx(-88)} {fy(94)})" text-anchor="middle">188</text>
<line class="dim" x1="{fx(-66)}" y1="{fy(-6)}" x2="{fx(66)}" y2="{fy(-6)}"/>
<text class="dimt" x="{fx(0)}" y="{fy(-8)}" text-anchor="middle">base 132</text>
</svg>'''

# ---- SVG: SIDE ELEVATION + cavity -----------------------------------------
def sx(y): return 60 + (y + 46)   # depth model y(-46..46)
def sy(z): return 20 + (188 - z)

SIDE_SVG = f'''<svg viewBox="0 0 220 230" role="img" aria-label="Yan elevation / kesit">
<text class="lbl" x="12" y="14">YAN / KESIT</text>
<!-- kaide -->
<rect class="out" x="{sx(-46)}" y="{sy(12)}" width="{92}" height="{12}"/>
<!-- torso (yan) -->
<polygon class="out" points="{sx(-28)},{sy(12)} {sx(28)},{sy(12)} {sx(28)},{sy(106)} {sx(-28)},{sy(106)}"/>
<!-- ic bosluk (cavity) dashed -->
<rect x="{sx(-22)}" y="{sy(103)}" width="44" height="{sy(18)-sy(103)}" fill="none" stroke="var(--amber)" stroke-width="1" stroke-dasharray="4 3"/>
<text class="lbm" x="{sx(-20)}" y="{sy(60)}" style="fill:var(--amber)">ic yuva 50&times;85</text>
<!-- arka kapak (lip) -->
<rect class="comp" x="{sx(-30)}" y="{sy(90)}" width="4" height="{sy(30)-sy(90)}" fill="color-mix(in srgb,var(--accent) 20%,transparent)" stroke="var(--accent)"/>
<text class="lbm" x="{sx(-44)}" y="{sy(58)}" style="fill:var(--accent)">kapak</text>
<!-- ekran on -->
<rect class="scr" x="{sx(28)}" y="{sy(85)}" width="6" height="26"/>
<text class="lbm" x="{sx(36)}" y="{sy(72)}">ekran</text>
<!-- neck+head -->
<rect class="det" x="{sx(-13)}" y="{sy(118)}" width="26" height="12"/>
<polygon class="out" points="{sx(-24)},{sy(120)} {sx(24)},{sy(120)} {sx(24)},{sy(166)} {sx(-16)},{sy(166)} {sx(-24)},{sy(150)}"/>
<!-- wire channel -->
<line x1="{sx(4)}" y1="{sy(166)}" x2="{sx(4)}" y2="{sy(95)}" stroke="var(--amber)" stroke-width="1" stroke-dasharray="3 3"/>
<text class="lbm" x="{sx(7)}" y="{sy(140)}" style="fill:var(--amber)">kablo kanali</text>
<!-- touch -->
<rect class="scr" x="{sx(-3)}" y="{sy(170)}" width="14" height="4"/>
<!-- vfin -->
<polygon class="det" points="{sx(-8)},{sy(162)} {sx(-26)},{sy(184)} {sx(-20)},{sy(182)} {sx(-4)},{sy(160)}"/>
<!-- depth dim -->
<line class="dim" x1="{sx(-46)}" y1="{sy(-6)}" x2="{sx(46)}" y2="{sy(-6)}"/>
<text class="dimt" x="{sx(0)}" y="{sy(-8)}" text-anchor="middle">depth 92</text>
</svg>'''

HTML = HTML.replace("{FRONT_SVG}", FRONT_SVG).replace("{SIDE_SVG}", SIDE_SVG)

with open("gundam_bust.html", "w") as f:
    f.write(HTML)
print("wrote gundam_bust.html", round(os.path.getsize("gundam_bust.html")/1024, 1), "KB")
