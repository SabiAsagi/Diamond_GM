import type { Player } from '../types';
/** 내보내기는 파일을 내려받을 뿐 기존 저장본을 수정하지 않는다. */
export function createSaveExport(player: Player, gameVersion: string, exportedAt = new Date().toISOString()): string {
  return JSON.stringify({ format: 'DiamondGM-save', schemaVersion: 1, gameVersion, exportedAt, player }, null, 2);
}
