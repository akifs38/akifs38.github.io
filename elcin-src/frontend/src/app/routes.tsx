import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ElcinAvatar } from "@/components/avatar/ElcinAvatar";

/*
  Rotalar tembel yüklenir: ilk açılışta yalnızca ana sayfanın kodu iner.
  Geliştirici paneli gibi Gülçin'in hiç açmayacağı ekranlar ona hiç
  indirilmez.
*/
const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ChatPage = lazy(() =>
  import("@/pages/ChatPage").then((m) => ({ default: m.ChatPage })),
);
const MemoryPage = lazy(() =>
  import("@/pages/MemoryPage").then((m) => ({ default: m.MemoryPage })),
);
const MoodPage = lazy(() =>
  import("@/pages/MoodPage").then((m) => ({ default: m.MoodPage })),
);
const CalendarPage = lazy(() =>
  import("@/pages/CalendarPage").then((m) => ({ default: m.CalendarPage })),
);
const SurprisesPage = lazy(() =>
  import("@/pages/SurprisesPage").then((m) => ({ default: m.SurprisesPage })),
);
const DevicePage = lazy(() =>
  import("@/pages/DevicePage").then((m) => ({ default: m.DevicePage })),
);
const BodyPage = lazy(() =>
  import("@/pages/BodyPage").then((m) => ({ default: m.BodyPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const DeveloperPage = lazy(() =>
  import("@/pages/DeveloperPage").then((m) => ({ default: m.DeveloperPage })),
);

/** Sayfa yüklenirken: boş bir iskelet değil, düşünen Elçin. */
function PageLoader(): ReactNode {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <ElcinAvatar
        mood="thinking"
        animation="loading"
        size={120}
        trackCursor={false}
      />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sohbet" element={<ChatPage />} />
        <Route path="/hafiza" element={<MemoryPage />} />
        <Route path="/duygular" element={<MoodPage />} />
        <Route path="/takvim" element={<CalendarPage />} />
        <Route path="/surprizler" element={<SurprisesPage />} />
        <Route path="/cihaz" element={<DevicePage />} />
        <Route path="/govde" element={<BodyPage />} />
        <Route path="/ayarlar" element={<SettingsPage />} />
        <Route path="/gelistirici" element={<DeveloperPage />} />
        {/* Bilinmeyen adres kullanıcıyı hata sayfasına değil eve götürür. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
