import { config } from '@/config';
import { CloudAIProvider } from './cloudProvider';
import { MockAIProvider } from './mockProvider';
import type { AIProvider } from './types';

export type { AIProvider, AIRequest, AIResponse, MemoryAction } from './types';
export { MockAIProvider, offlineReply } from './mockProvider';
export { CloudAIProvider, parseResponse } from './cloudProvider';

/**
 * Sağlayıcı fabrikası.
 *
 * Uygulamanın geri kalanı hangi modelin konuştuğunu bilmez; yalnızca
 * `AIProvider` görür. Backend adresi tanımlı değilse demo motoruna düşeriz —
 * böylece site tek başına da çalışır.
 */
export function createAIProvider(preference: 'mock' | 'cloud' = config.ai.provider): AIProvider {
  if (preference === 'cloud' && config.api.baseUrl) {
    return new CloudAIProvider(config.api.baseUrl);
  }
  return new MockAIProvider();
}
