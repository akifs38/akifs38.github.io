import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ElcinAvatar } from '@/components/avatar/ElcinAvatar';

/**
 * Hata sınırı (58. madde).
 *
 * Bir şey patladığında kullanıcı yığın izi görmez; Elçin'in üzgün yüzü ve bir
 * cümle görür. Teknik ayrıntı yalnızca konsola yazılır — geliştirici oradan
 * bakar.
 */
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Elçin] beklenmeyen hata:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <ElcinAvatar mood="sad" animation="sad" size={150} trackCursor={false} />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-ink">Bir an dalmışım…</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Beklenmedik bir şey oldu ve toparlanamadım. Sayfayı yenilersen geri geleceğim.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-linear-to-br from-accent to-accent-2 px-5 py-2.5 text-sm font-medium text-white"
        >
          Yenile
        </button>
      </div>
    );
  }
}
