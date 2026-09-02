export * from './highSchool';

export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'TwoWay';
export type PlayerStatus = 'HighSchool' | 'Pro' | 'Minor' | 'Military' | 'Retired';

export type Handedness = 'R/R' | 'R/L' | 'L/R' | 'L/L'; // 우투우타, 우투좌타, 좌투우타, 좌투좌타
export type PitchingForm = 'Overhand' | 'ThreeQuarter' | 'Sidearm' | 'Underhand' | 'None';
export type PitcherRole = 'Starter' | 'Reliever' | 'Closer' | 'None';
export type BattingForm = 'Open' | 'Straight' | 'LegKick' | 'ToeTap' | 'None';

export interface Player {
  id?: number; // Auto-incremented
  name: string;
  age: number;
  position: Position;
  status: PlayerStatus;
  teamId?: number; // null if not in a team (e.g. High school or retired)
  
  // Basic attributes
  uniformNumber: number | string;
  highSchool: string;
  handedness: Handedness;
  
  // Pitcher Attributes
  pitchingForm: PitchingForm;
  pitcherRole: PitcherRole;
  
  // Batter Attributes
  battingForm: BattingForm;
  
  // Overall & Potential
  overall: number; // Base starts at 20
  potential: number; // Growth potential
  
  // Batting Ratings (0-100 scale)
  contact: number;
  power: number;
  eye: number; // Plate discipline
  speed: number;
  defense: number;
  
  // Pitcher specific ratings (0-100 scale)
  stuff: number;
  control: number;
  stamina: number;

  // Development Event Stats
  condition: number; // 0-100 (멘탈/컨디션)
  academics: number; // 0-100 (학업 성취도)
  relationshipFamily: number;
  relationshipFriends: number;
  relationshipTeam: number;
  relationshipCoach: number;

  // Career Story & Progression
  traits?: string[]; // 획득한 고유 특성 (예: '파이어볼러', '거포 본능' 등)
  interviewCompleted?: boolean; // 감독 면담 완료 여부
  chosenPathTitle?: string; // 면담에서 선택한 목표
  grade?: number; // 고1, 고2, 고3 (1, 2, 3)
  month?: number; // 3월 ~ 다음해 2월
  week?: number; // 1주 ~ 4주
  fame?: number; // 전국 인지도 / 스카우트 주목도 (0-100)
}

export interface Team {
  id?: number;
  name: string;
  city: string;
  budget: number;
  fanBase: number; // 0-100
}

export interface LeagueSeason {
  id?: number;
  year: number;
  currentStage: 'Offseason' | 'SpringTraining' | 'RegularSeason' | 'Playoffs' | 'Draft';
}
