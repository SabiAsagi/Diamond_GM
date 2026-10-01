import { GAME_VERSION } from '../../../version';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player } from '../../../types';
import { Settings, Database, RotateCcw } from 'lucide-react';
import { db } from '../../../db';
import { createSaveExport } from '../../../data/saveExport';
import { useGameClockStore } from '../../../store/gameClockStore';
interface SettingsViewProps { player: Player; onClose: () => void }
export function SettingsView({ player }: SettingsViewProps) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const isLoading = useGameClockStore(s => s.isLoading);
  const exportSave = () => {
    setError('');
    try {
      const url = URL.createObjectURL(new Blob([createSaveExport(player, GAME_VERSION)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `DiamondGM-${player.id ?? 'player'}-${player.gameDate?.year ?? 2026}-${player.gameDate?.month ?? 3}-${player.gameDate?.day ?? 2}.json`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('진행 기록 파일을 만들지 못했습니다. 다시 시도해주세요.'); }
  };
  const reset = async () => {
    if (useGameClockStore.getState().isLoading || !confirm('현재 선수를 삭제하고 새 선수를 만드시겠습니까? 진행 기록이 사라집니다.')) return;
    setError(''); useGameClockStore.setState({ isLoading: true });
    try { if (player.id !== undefined) await db.players.delete(player.id); navigate('/development/create'); }
    catch { setError('선수를 삭제하지 못했습니다. 저장본을 유지합니다. 다시 시도해주세요.'); }
    finally { useGameClockStore.setState({ isLoading: false }); }
  };
  return <div className="menu-view-container glass-panel animate-scale-up">
    <div className="menu-view-header"><div className="menu-view-title-group"><Settings size={22} /><div><h3 className="menu-view-title">환경설정 & 데이터 관리</h3><p className="menu-view-sub">Diamond GM {GAME_VERSION} · 현재 선수의 진행 기록</p></div></div></div>
    <div className="menu-view-body"><div className="settings-sections-stack">
      <section className="settings-section glass-panel"><h4 className="setting-sec-title"><Database size={16} /> 저장과 진행 기록</h4>
        <div className="setting-row"><div className="setting-label-group"><strong>브라우저 자동 저장</strong><span>활동·경기·목표·인연 변경이 저장되면 다음 진행에 반영됩니다.</span></div><span className="save-status-badge">{isLoading ? '저장 중…' : '자동 저장 사용'}</span></div>
        <div className="setting-row"><div className="setting-label-group"><strong>진행 기록 내보내기</strong><span>현재 선수의 전체 저장본을 JSON으로 내려받습니다. 문제 확인에 사용할 수 있습니다.</span></div><button className="btn btn-secondary" disabled={isLoading} onClick={exportSave}>JSON 내려받기</button></div>
        <div className="setting-row danger-zone"><div className="setting-label-group"><strong>선수 데이터 초기화</strong><span>현재 선수를 삭제하고 새 선수 생성으로 이동합니다.</span></div><button className="btn btn-sm btn-danger" disabled={isLoading} onClick={() => void reset()}><RotateCcw size={14} /> 데이터 초기화</button></div>
        {error && <p role="alert">{error}</p>}
      </section>
      <section className="settings-section glass-panel"><h4 className="setting-sec-title">후속 개발 예정</h4><p>경기는 현재 발표된 역할로 결과를 계산합니다. 경기 재생 배속·승부처 수동 개입·배경음악·효과음 설정은 준비 중입니다.</p></section>
    </div></div>
  </div>;
}
