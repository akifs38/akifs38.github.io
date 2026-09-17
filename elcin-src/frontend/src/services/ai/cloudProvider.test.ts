import { describe, expect, it } from 'vitest';
import { parseResponse } from './cloudProvider';

describe('parseResponse', () => {
  it('tam şemayı olduğu gibi okur', () => {
    const result = parseResponse(
      {
        message: 'Merhaba Gülçin 🌸',
        mood: 'happy',
        animation: 'smile',
        device_action: { command: 'animation', animation: 'smile' },
        memory_action: { type: 'preference', content: 'Kahve seviyor.', importance: 0.8 },
        used_memory_ids: ['m1'],
      },
      Date.now(),
    );

    expect(result.message).toBe('Merhaba Gülçin 🌸');
    expect(result.mood).toBe('happy');
    expect(result.animation).toBe('smile');
    expect(result.deviceAction?.command).toBe('animation');
    expect(result.memoryActions).toHaveLength(1);
    expect(result.usedMemoryIds).toEqual(['m1']);
  });

  it('eksik alanları makul varsayılana düşürür', () => {
    const result = parseResponse({ message: 'Selam' }, Date.now());
    expect(result.mood).toBe('normal');
    expect(result.animation).toBe('idle');
    expect(result.deviceAction).toBeNull();
    expect(result.memoryActions).toEqual([]);
  });

  it('boş mesajda kullanıcıya teknik hata değil cümle döner', () => {
    const result = parseResponse({ message: '   ' }, Date.now());
    expect(result.message.length).toBeGreaterThan(0);
    expect(result.message).not.toContain('undefined');
  });

  it('geçersiz mood ve animasyonu güvenli değere indirger', () => {
    const result = parseResponse({ message: 'x', mood: 'kahve', animation: 'dans' }, Date.now());
    expect(result.mood).toBe('normal');
    expect(result.animation).toBe('idle');
  });

  it('tanınmayan cihaz komutunu yok sayar', () => {
    const result = parseResponse(
      { message: 'x', device_action: { command: 'self_destruct' } },
      Date.now(),
    );
    expect(result.deviceAction).toBeNull();
  });

  it('önem puanını 0–1 aralığına kırpar', () => {
    const result = parseResponse(
      { message: 'x', memory_action: [{ content: 'a', importance: 9 }] },
      Date.now(),
    );
    const action = result.memoryActions[0];
    expect(action?.op).toBe('create');
    if (action?.op === 'create') expect(action.memory.importance).toBe(1);
  });

  it('pekiştirme işlemini ayrı tanır', () => {
    const result = parseResponse(
      { message: 'x', memory_action: [{ op: 'reinforce', id: 'm3', importance: 0.9 }] },
      Date.now(),
    );
    expect(result.memoryActions[0]).toEqual({ op: 'reinforce', id: 'm3', importance: 0.9 });
  });

  it('tamamen boş gövdede çökmez', () => {
    expect(() => parseResponse(null, Date.now())).not.toThrow();
  });
});
