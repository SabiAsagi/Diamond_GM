import type { Player } from '../types';
import { getEffectiveStat } from '../types/equipment';

export const PITCH_NAMES = { fastball:'포심 패스트볼', twoSeam:'투심 패스트볼', cutter:'커터', slider:'슬라이더', curve:'커브', changeup:'체인지업', splitter:'스플리터', sinker:'싱커', forkball:'포크볼', knuckleball:'너클볼' } as const;
export type PitchType = keyof typeof PITCH_NAMES;
export interface PitchRating { type: PitchType; rating: number; potential: number; xp: number }
export interface Appearance { skin: string; hair: string; hairStyle: 'short' | 'long' | 'crop' | 'ponytail' | 'bob'; uniform: string; accessory: 'none' | 'glasses' | 'headband' }
export const DEFAULT_APPEARANCE: Appearance = {skin:'#e7b68e',hair:'#292524',hairStyle:'short',uniform:'#2563eb',accessory:'none'};
export const EXTRA_RATINGS = {
 gapPower:['갭파워','외야 사이를 가르는 2·3루타 생산 능력'], avoidK:['삼진 회피','2스트라이크 이후 공을 맞히는 능력'],
 movement:['무브먼트','장타와 홈런을 억제하는 공의 움직임'], holdRunners:['주자 견제','견제와 퀵모션으로 도루를 억제'],
 stealing:['도루 기술','스타트 타이밍과 슬라이딩 기술'], baserunning:['주루 판단','진루·귀루 상황 판단'],
 fieldingRange:['수비 범위','타구를 따라가는 첫발과 커버 범위'], fieldingError:['포구 안정성','실책 없이 타구를 처리하는 능력'], arm:['송구 능력','송구의 강도와 정확성'],
} as const;
export type ExtraRating = keyof typeof EXTRA_RATINGS;
export function normalizePlayer(p: Player): Player {
 return { ...p, gapPower:p.gapPower ?? p.power, avoidK:p.avoidK ?? p.contact, movement:p.movement ?? p.stuff, holdRunners:p.holdRunners ?? p.control, stealing:p.stealing ?? p.speed, baserunning:p.baserunning ?? p.speed, fieldingRange:p.fieldingRange ?? p.defense, fieldingError:p.fieldingError ?? p.defense, arm:p.arm ?? p.defense, velocity:p.velocity ?? 125, appearance:p.appearance ?? {...DEFAULT_APPEARANCE}, pitches:p.pitches ?? (p.position === 'P' || p.position === 'TwoWay' ? [{type:'fastball',rating:p.stuff,potential:p.potential,xp:0},{type:'slider',rating:Math.max(10,p.stuff-5),potential:p.potential,xp:0}] : []) };
}
export function pitchingRating(p: Player) {
 const n=normalizePlayer(p);
 const stuff = getEffectiveStat(n, 'stuff');
 const control = getEffectiveStat(n, 'control');
 const stamina = getEffectiveStat(n, 'stamina');
 const arsenal=n.pitches!.filter(x=>x.rating>0);
 const pitch=arsenal.length ? arsenal.reduce((s,x)=>s+x.rating,0)/arsenal.length : 0;
 return (stuff + n.movement! + control + stamina + n.holdRunners! + pitch + Math.max(0, Math.min(100, (n.velocity! - 100) * 2))) / 7;
}
export function battingRating(p: Player) {
 const n=normalizePlayer(p);
 const contact = getEffectiveStat(n, 'contact');
 const power = getEffectiveStat(n, 'power');
 const eye = getEffectiveStat(n, 'eye');
 const speed = getEffectiveStat(n, 'speed');
 const defense = getEffectiveStat(n, 'defense');
 const gapPower = n.gapPower ?? power;
 const avoidK = n.avoidK ?? contact;
 const stealing = n.stealing ?? speed;
 const baserunning = n.baserunning ?? speed;
 const fieldingRange = n.fieldingRange ?? defense;
 const fieldingError = n.fieldingError ?? defense;
 const arm = n.arm ?? defense;
 return (contact + power + eye + gapPower + avoidK + speed + stealing + baserunning + fieldingRange + fieldingError + arm) / 11;
}
export function overallRating(p: Player) { return Math.round(p.position==='P'?pitchingRating(p):p.position==='TwoWay'?(pitchingRating(p)+battingRating(p))/2:battingRating(p)); }
export function trainPitch(p: Player, type: PitchType, xp: number): PitchRating[] {
 const pitches=normalizePlayer(p).pitches!.map(x=>({...x}));
 let pitch=pitches.find(x=>x.type===type);
 if(!pitch){ pitch={type,rating:0,potential:p.potential,xp:0};pitches.push(pitch); }
 pitch.xp+=Math.max(0,xp);
 while(pitch.xp>=100 && pitch.rating<pitch.potential){pitch.xp-=100; pitch.rating=Math.min(pitch.potential,pitch.rating+2);}
 if(pitch.rating>=pitch.potential) pitch.xp=0;
 return pitches;
}
