import type { Player } from '../types';
import { CHARACTER_PORTRAITS, type PortraitCharacterId } from '../data/characterPortraits';
import { getCastMember, isCastId } from '../data/cast';
import { PlayerPortrait } from './PlayerAppearance';

/** 인물 초상화. 회차별 학생 인물은 이번 회차 외모로, 나머지는 전용 일러스트로 그린다. */
export function CharacterPortrait({ player, id, className, variant = 'school' }: { player: Player; id: PortraitCharacterId; className?: string; variant?: 'school' | 'casual' }) {
  if (isCastId(id)) {
    const { portrait, gender } = getCastMember(player, id);
    if (portrait.kind === 'preset') {
      return (
        <div className={`character-portrait-preset ${className ?? ''}`}>
          <PlayerPortrait appearance={portrait.appearance} gender={gender} schoolName={portrait.schoolName} number={portrait.number} size="100%" />
        </div>
      );
    }
    if (portrait.kind === 'imagePair') {
      return <img className={className} src={variant === 'casual' ? portrait.casualSrc : portrait.schoolSrc} alt="" loading="lazy" />;
    }
    return <img className={className} src={portrait.src} alt="" loading="lazy" />;
  }
  return <img className={className} src={CHARACTER_PORTRAITS[id]} alt="" loading="lazy" />;
}
