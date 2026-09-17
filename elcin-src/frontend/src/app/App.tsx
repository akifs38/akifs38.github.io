import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { config } from '@/config';
import { AppShell } from '@/components/layout';
import { Toaster } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useDevice, useSettings, useSurprises } from '@/stores';
import { BootSequence } from './BootSequence';
import { ErrorBoundary } from './ErrorBoundary';
import { AppRoutes } from './routes';

/**
 * Uygulamanın kökü.
 *
 * Üç iş yapar: temayı uygular, cihaz bağlantısını kurar, açılış sekansını
 * oynatır. Geri kalan her şey sayfalarda.
 */
export function App() {
  useTheme();

  const userName = useSettings((state) => state.userName);
  const deviceTransport = useSettings((state) => state.deviceTransport);
  const startDevice = useDevice((state) => state.start);
  const stopDevice = useDevice((state) => state.stop);
  const refreshLocks = useSurprises((state) => state.refreshLocks);

  // Açılış sekansı oturumda bir kez; sekmede gezinirken tekrar oynamaz.
  const [booting, setBooting] = useState(() => {
    try {
      return sessionStorage.getItem(config.ui.bootSeenKey) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    startDevice(deviceTransport);
    return () => stopDevice();
  }, [deviceTransport, startDevice, stopDevice]);

  useEffect(() => {
    refreshLocks();
  }, [refreshLocks]);

  const finishBoot = () => {
    try {
      sessionStorage.setItem(config.ui.bootSeenKey, '1');
    } catch {
      /* depolama yoksa sekans her açılışta oynar, zararsız */
    }
    setBooting(false);
  };

  return (
    <ErrorBoundary>
      {/* Vite `base` ile aynı önek: /elcin/ altında da derin bağlantılar çalışır. */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        {booting && <BootSequence userName={userName} onDone={finishBoot} />}
        <AppShell>
          <AppRoutes />
        </AppShell>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
