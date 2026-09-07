import type { BoardAdapter } from '@/types';
import { esp32c3Adapter } from './ESP32C3Adapter';

const adapters = new Map<string, BoardAdapter>([['esp32-c3', esp32c3Adapter]]);

export function getBoardAdapter(boardId: string): BoardAdapter {
  const adapter = adapters.get(boardId);
  if (!adapter) throw new Error(`No adapter registered for board "${boardId}".`);
  return adapter;
}

export function listBoards(): string[] {
  return [...adapters.keys()];
}

export { ESP32C3Adapter } from './ESP32C3Adapter';
