import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { Panel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { BODY_PARTS, lidAxis, type BodyPart } from "./bodyParts";

/**
 * Gövde ekranı — Elçin'in bedeni, montajlı ve döndürülebilir.
 *
 * GitHub'ın STL görüntüleyicisi tek renk gösteriyor; siyah filamentle
 * basılan kulak, pati ve göz yaması orada beyaz gövdeden ayırt edilemiyor,
 * içeri de bakılamıyor. Burada her parça kendi dosyasından ayrı yükleniyor,
 * kendi rengini alıyor ve kapak kaydırılarak içi açılabiliyor.
 *
 * Modeller elcin-src/kutu/montaj.py tarafından üretiliyor ve derlemede
 * dist/model/ altına kopyalanıyor (vite.config.ts → kutuModelleri).
 */

type Durum = "yukleniyor" | "hazir" | "hata";

interface Sahne {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  meshes: Map<string, THREE.Mesh>;
  dispose: () => void;
}

const MODEL_BASE = `${import.meta.env.BASE_URL}model/`;

/** montaj.py'nin yazdığı yerleşim dosyası. */
interface Yerlesim {
  yuz: {
    merkez: [number, number, number];
    sag: [number, number, number];
    ust: [number, number, number];
    normal: [number, number, number];
    genislik: number;
    yukseklik: number;
  };
  yuz_gorseli: boolean;
}

/**
 * OLED yüzünü camın önüne yerleştirir.
 *
 * Konum JS'te hesaplanmıyor: yaslanma açısı ve cam derinliği montaj.py'de
 * zaten var, iki yerde tutulsa biri değişince diğeri sessizce kayardı.
 * Buraya yalnızca hazır eksenler geliyor.
 */
function yuzDuzlemi(yerlesim: Yerlesim, doku: THREE.Texture): THREE.Mesh {
  const { merkez, sag, ust, normal, genislik, yukseklik } = yerlesim.yuz;
  doku.colorSpace = THREE.SRGBColorSpace;
  doku.magFilter = THREE.NearestFilter; // 128 × 64; yumuşatmak pikselleri bulandırıyor
  doku.minFilter = THREE.LinearMipmapLinearFilter;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(genislik, yukseklik),
    new THREE.MeshBasicMaterial({ map: doku, toneMapped: false }),
  );
  const donus = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(...sag),
    new THREE.Vector3(...ust),
    new THREE.Vector3(...normal),
  );
  mesh.quaternion.setFromRotationMatrix(donus);
  mesh.position.set(...merkez);
  mesh.name = "yuz";
  return mesh;
}

export function BodyPage() {
  const tuval = useRef<HTMLDivElement | null>(null);
  const sahne = useRef<Sahne | null>(null);
  const [durum, setDurum] = useState<Durum>("yukleniyor");
  const [seffaf, setSeffaf] = useState(false);
  const [kapakAcik, setKapakAcik] = useState(0);
  const [donuyor, setDonuyor] = useState(true);
  const [gizli, setGizli] = useState<ReadonlySet<string>>(() => new Set());

  const eksen = useMemo(() => lidAxis(), []);

  /* ---- sahne kurulumu: bir kez ---- */
  useEffect(() => {
    const kap = tuval.current;
    if (!kap) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(kap.clientWidth, kap.clientHeight);
    kap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      kap.clientWidth / kap.clientHeight,
      1,
      2000,
    );

    // Işık: tepeden yumuşak ortam + önden yön. Tek yön ışığı kullanınca
    // beyaz gövdenin siluetteki kıvrımları düzleşip kutu gibi duruyordu.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404654, 1.15));
    const yon = new THREE.DirectionalLight(0xffffff, 1.5);
    yon.position.set(120, 180, -220);
    scene.add(yon);
    const dolgu = new THREE.DirectionalLight(0xffffff, 0.45);
    dolgu.position.set(-160, 60, 140);
    scene.add(dolgu);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 90;
    controls.maxDistance = 520;
    controls.autoRotateSpeed = 1.1;

    const meshes = new Map<string, THREE.Mesh>();
    let canli = true;

    const cizgi = () => {
      if (!canli) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(cizgi);
    };
    requestAnimationFrame(cizgi);

    const olcu = new ResizeObserver(() => {
      if (!kap.clientWidth || !kap.clientHeight) return;
      camera.aspect = kap.clientWidth / kap.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(kap.clientWidth, kap.clientHeight);
    });
    olcu.observe(kap);

    sahne.current = {
      renderer,
      scene,
      camera,
      controls,
      meshes,
      dispose: () => {
        canli = false;
        olcu.disconnect();
        controls.dispose();
        meshes.forEach((mesh) => {
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        });
        renderer.dispose();
        kap.removeChild(renderer.domElement);
      },
    };

    /* ---- parçaları yükle ---- */
    const loader = new STLLoader();
    const yerlesimIstegi = fetch(`${MODEL_BASE}yerlesim.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Yerlesim>) : null))
      .catch(() => null);
    const dokuIstegi = new Promise<THREE.Texture | null>((coz) => {
      new THREE.TextureLoader().load(
        `${MODEL_BASE}yuz.png`,
        (t) => coz(t),
        undefined,
        () => coz(null),
      );
    });

    const yukle = (parca: BodyPart) =>
      new Promise<[string, THREE.BufferGeometry]>((coz, red) => {
        loader.load(
          `${MODEL_BASE}${parca.id}.stl`,
          (geo) => coz([parca.id, geo]),
          undefined,
          () => red(new Error(parca.id)),
        );
      });

    Promise.all([
      Promise.all(BODY_PARTS.map(yukle)),
      yerlesimIstegi,
      dokuIstegi,
    ])
      .then(([sonuc, yerlesim, doku]) => {
        if (!canli) return;

        // İki katmanlı grup gerekiyor: iç grup parçaları kendi merkezine
        // çekiyor, dış grup Z-yukarı modeli Y-yukarı kameraya çeviriyor.
        // Tek grupta yapınca three.js önce dönüşü sonra ötelemeyi uyguluyor
        // ve merkezleme dönmüş eksende yanlış yere düşüyordu — model
        // çerçevenin tepesinde yarısı kesik duruyordu.
        const ic = new THREE.Group();
        const grup = new THREE.Group();
        grup.add(ic);

        for (const [id, geo] of sonuc) {
          const parca = BODY_PARTS.find((p) => p.id === id)!;
          geo.computeVertexNormals();
          const mesh = new THREE.Mesh(
            geo,
            new THREE.MeshStandardMaterial({
              color: new THREE.Color(parca.color),
              roughness: parca.kind === "kabuk" ? 0.72 : 0.5,
              metalness: parca.kind === "kabuk" ? 0.0 : 0.25,
            }),
          );
          mesh.name = id;
          meshes.set(id, mesh);
          ic.add(mesh);
        }

        if (yerlesim && doku) ic.add(yuzDuzlemi(yerlesim, doku));

        // STL'ler masa koordinatında: taban z = 0, model Z-yukarı.
        const kutu = new THREE.Box3().setFromObject(ic);
        ic.position.sub(kutu.getCenter(new THREE.Vector3()));
        grup.rotation.x = -Math.PI / 2;
        scene.add(grup);

        // Kamera uzaklığı silüetten hesaplanıyor. Sınır küresi kullanmak
        // modeli çerçevenin ortasında küçük bırakıyordu: Elçin derinlikte
        // ince, küre ise en uzun köşegene göre şişiyor.
        const en = kutu.max.x - kutu.min.x;
        const boy = kutu.max.z - kutu.min.z;
        const tan = Math.tan((camera.fov * Math.PI) / 360);
        const uzaklik =
          Math.max(boy / 2 / tan, en / 2 / (tan * camera.aspect)) * 1.3;

        // Yüz, model +Y'de; dış grup dönünce dünya −Z'ye bakıyor. Kamerayı
        // +Z'ye koymak Elçin'e arkadan baktırıyordu.
        camera.position.set(uzaklik * 0.42, uzaklik * 0.3, -uzaklik * 0.86);
        controls.target.set(0, 0, 0);
        controls.minDistance = uzaklik * 0.45;
        controls.maxDistance = uzaklik * 3;
        controls.update();

        setDurum("hazir");
      })
      .catch(() => canli && setDurum("hata"));

    return () => {
      sahne.current?.dispose();
      sahne.current = null;
    };
  }, []);

  /* ---- görünürlük, şeffaflık, kapak ---- */
  useEffect(() => {
    const s = sahne.current;
    if (!s) return;
    for (const parca of BODY_PARTS) {
      const mesh = s.meshes.get(parca.id);
      if (!mesh) continue;
      mesh.visible = !gizli.has(parca.id);

      const mat = mesh.material as THREE.MeshStandardMaterial;
      const solacak = seffaf && parca.shell === true;
      mat.transparent = solacak;
      mat.opacity = solacak ? 0.22 : 1;
      mat.depthWrite = !solacak;
      mat.needsUpdate = true;

      const kayma = parca.onLid ? kapakAcik : 0;
      mesh.position.set(eksen[0] * kayma, eksen[1] * kayma, eksen[2] * kayma);
    }
  }, [gizli, seffaf, kapakAcik, eksen, durum]);

  useEffect(() => {
    if (sahne.current) sahne.current.controls.autoRotate = donuyor;
  }, [donuyor]);

  const cevir = useCallback((id: string) => {
    setGizli((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }, []);

  const kabuk = BODY_PARTS.filter((p) => p.kind === "kabuk");
  const moduller = BODY_PARTS.filter((p) => p.kind === "modul");

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          🧩 Elçin&apos;in gövdesi
        </h1>
        <p className="mt-1 text-sm text-muted">
          Masada <strong>86 × 43 × 95 mm</strong>, 10° geriye yaslı, ~68 g PLA.
          Sürükleyerek döndür, tekerlekle yakınlaş. Kapağı kaydırıp içine bak.
        </p>
      </header>

      <Panel padded={false} className="overflow-hidden">
        <div className="relative h-[52dvh] min-h-[320px] bg-surface-2">
          <div ref={tuval} className="absolute inset-0" />
          {durum !== "hazir" && (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted">
              {durum === "yukleniyor"
                ? "Gövde yükleniyor…"
                : "Model yüklenemedi."}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line/30 px-5 py-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={seffaf}
              onChange={(e) => setSeffaf(e.target.checked)}
              className="size-4 accent-[hsl(var(--accent))]"
            />
            Kabuğu şeffaflaştır
          </label>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={donuyor}
              onChange={(e) => setDonuyor(e.target.checked)}
              className="size-4 accent-[hsl(var(--accent))]"
            />
            Kendiliğinden dön
          </label>

          <label className="flex min-w-[220px] flex-1 items-center gap-3 text-sm text-ink">
            <span className="whitespace-nowrap">Kapağı aç</span>
            <input
              type="range"
              min={0}
              max={70}
              step={1}
              value={kapakAcik}
              onChange={(e) => setKapakAcik(Number(e.target.value))}
              className="h-1 flex-1 accent-[hsl(var(--accent))]"
            />
            <span className="w-12 text-right tabular-nums text-xs text-muted">
              {kapakAcik} mm
            </span>
          </label>
        </div>
      </Panel>

      {/*
        Izgara öğelerine min-w-0 şart. Varsayılan min-width:auto, öğenin
        min-content genişliğinin altına inmesini engelliyor; listedeki
        `truncate` (white-space:nowrap) metinler de min-content'i kendi tam
        genişliklerine çekiyor. Sonuç: 390 px'lik telefonda ızgara 358 px
        ama sütunu 409 px oluyor ve sayfa yatay kayıyordu.
        grid-cols-1 eklemek yetmiyor — 1fr izinin de otomatik alt sınırı
        min-content.
      */}
      <div className="grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
        <ParcaListesi
          baslik="Basılan parçalar"
          altyazi="Beyaz gövde, siyah kulak ve patiler — tek renkli yazıcıda iki renk"
          parcalar={kabuk}
          gizli={gizli}
          cevir={cevir}
        />
        <ParcaListesi
          baslik="İçine girenler"
          altyazi="Kumpasla ölçüldü; yerleşimleri doğrulama betiğiyle ortak"
          parcalar={moduller}
          gizli={gizli}
          cevir={cevir}
        />
      </div>
    </div>
  );
}

function ParcaListesi({
  baslik,
  altyazi,
  parcalar,
  gizli,
  cevir,
}: {
  baslik: string;
  altyazi: string;
  parcalar: BodyPart[];
  gizli: ReadonlySet<string>;
  cevir: (id: string) => void;
}) {
  return (
    <Panel title={baslik} subtitle={altyazi} padded={false}>
      <ul className="divide-y divide-line/20">
        {parcalar.map((parca) => {
          const kapali = gizli.has(parca.id);
          return (
            <li key={parca.id}>
              <button
                type="button"
                onClick={() => cevir(parca.id)}
                aria-pressed={!kapali}
                className={cn(
                  "flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-surface-2",
                  kapali && "opacity-45",
                )}
              >
                <span
                  className="size-4 shrink-0 rounded-full border border-line/50"
                  style={{ background: parca.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">
                    {parca.label}
                  </span>
                  {/*
                    Not kesilmiyor, sarıyor: içinde ölçü var ve dar ekranda
                    kesilince tam o kısım kayboluyordu ("… 28° yatı").
                  */}
                  <span className="block text-xs text-muted">{parca.note}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {kapali ? "gizli" : "görünür"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
