import { describe, expect, it } from 'vitest';
import type { AIRequest } from './types';
import { MockAIProvider, offlineReply } from './mockProvider';

const provider = new MockAIProvider();

function request(input: string, extra: Partial<AIRequest> = {}): AIRequest {
  return {
    input,
    history: [],
    memories: [],
    userName: 'Gülçin',
    currentMood: 'normal',
    ...extra,
  };
}

describe('MockAIProvider', () => {
  it('selamlamaya sıcak karşılık verir', async () => {
    const response = await provider.respond(request('Merhaba'));
    expect(response.message).toContain('Gülçin');
    expect(response.meta.matchedIntent).toBe('greeting');
    expect(response.mood).toBe('happy');
  });

  it('uzun cümlede selamlamadansa asıl duyguyu yakalar', async () => {
    const response = await provider.respond(
      request('Merhaba Elçin, bugün çok yorgunum ve moralim bozuk'),
    );
    // Selamlama da eşleşiyor ama önemli olan ikinci kısım.
    expect(response.meta.matchedIntent).not.toBe('greeting');
    expect(['sad', 'sleepy']).toContain(response.mood);
  });

  it('üzgün mesajda çözüm dayatmaz, cihaza da üzgün animasyon gönderir', async () => {
    const response = await provider.respond(request('Bugün çok kötüyüm, ağladım'));
    expect(response.mood).toBe('sad');
    expect(response.deviceAction).toEqual({
      type: 'device_command',
      command: 'animation',
      animation: 'sad',
    });
  });

  it('kısa girdiye kısa, uzun girdiye uzun cevap verir', async () => {
    const short = await provider.respond(request('Merhaba'));
    const long = await provider.respond(
      request(
        'Merhaba Elçin bugün sana uzun uzun anlatmak istediğim çok şey var çünkü gün baya yoğun geçti',
      ),
    );
    expect(long.message.length).toBeGreaterThan(short.message.length);
  });

  it('konuşmadan hafıza çıkarır', async () => {
    const response = await provider.respond(request('ben kahveyi çok seviyorum'));
    expect(response.memoryActions.length).toBeGreaterThan(0);
    expect(response.memoryActions[0]?.op).toBe('create');
  });

  it('bağlama giren hafızaları cevapla birlikte bildirir', async () => {
    const response = await provider.respond(
      request('kahve', {
        memories: [
          {
            id: 'm1',
            kind: 'preference',
            content: 'Gülçin kahve seviyor.',
            importance: 0.8,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }),
    );
    expect(response.usedMemoryIds).toEqual(['m1']);
  });

  it('özel günü cevabına katar', async () => {
    const response = await provider.respond(request('Merhaba', { occasion: 'Doğum günün' }));
    expect(response.message).toContain('Doğum günün');
  });

  it('her cevapta geçerli bir ruh hali ve animasyon döner', async () => {
    for (const input of ['selam', 'çok mutluyum', 'iyi geceler', 'zzzxyz']) {
      const response = await provider.respond(request(input));
      expect(response.mood).toBeTruthy();
      expect(response.animation).toBeTruthy();
      expect(response.message.trim().length).toBeGreaterThan(0);
    }
  });

  it('iptal edilen istek AbortError fırlatır', async () => {
    const controller = new AbortController();
    const pending = provider.respond(request('merhaba', { signal: controller.signal }));
    controller.abort();
    await expect(pending).rejects.toThrow();
  });

  it('"Size nasıl yardımcı olabilirim" kalıbını kullanmaz', async () => {
    for (const input of ['merhaba', 'nasılsın', 'teşekkürler', 'bir şaka yap']) {
      const response = await provider.respond(request(input));
      expect(response.message.toLowerCase()).not.toContain('nasıl yardımcı olabilirim');
    }
  });
});

describe('offlineReply', () => {
  it('teknik hata degil, kullaniciya bir cumle doner', () => {
    const reply = offlineReply();
    expect(reply.length).toBeGreaterThan(0);
    expect(reply).not.toMatch(/error|exception|undefined/i);
  });
});
