export type SchoolType = 'School' | 'Club';
export type SchoolTier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface PositionCompetition {
  pitcher: number;    // 1 ~ 10 (투수 주전 경쟁도, 5가 전국 평균)
  catcher: number;    // 1 ~ 10 (포수 주전 경쟁도, 5가 전국 평균)
  infielder: number;  // 1 ~ 10 (내야수 주전 경쟁도, 5가 전국 평균)
  outfielder: number; // 1 ~ 10 (외야수 주전 경쟁도, 5가 전국 평균)
}

export interface HighSchoolEmblem {
  primaryColor: string;    // 메인 팀 컬러 (Hex)
  secondaryColor: string;  // 보조 팀 컬러 (Hex)
  textColor: string;       // 심볼 텍스트 색상
  symbolText: string;      // 모자/엠블럼 이니셜 (예: 'DS', 'KB', 'GJ')
  logoUrl?: string;        // 실제 학교 로고 이미지 경로 (선택)
}

export interface HighSchoolTournamentTitles {
  goldenLion: number;    // 황금사자기 우승
  blueDragon: number;    // 청룡기 우승
  phoenix: number;       // 봉황대기 우승
  president: number;     // 대통령배 우승
  others?: number;       // 협회장기 / 이마트배 / 전국체전 등
}

export interface HighSchoolData {
  id: string;
  name: string;
  type: SchoolType;
  region: string;           // 실제 소재 광역 시/도 (서울, 부산, 대구, 대전 등)
  foundedYear: number;      // 창단연도
  tier: SchoolTier;         // S, A, B, C, D

  // 로고 & 엠블럼 정보
  emblem?: HighSchoolEmblem;
  logoUrl?: string;
  uniformPrimaryColor?: string;
  uniformSecondaryColor?: string;

  // 게임 스탯 수치 (0 ~ 100)
  prestige: number;          // 명성 (스카우트 관심도, 신입생 유입에 영향)
  facilities: number;        // 시설 (훈련 효율에 영향)
  coaching: number;          // 코칭 (선수 성장 효율에 영향)
  scoutingExposure: number;  // 스카우트 노출도 (드래프트 평가에 영향)
  stability: number;         // 존속 안정성 (폐지 및 지원 삭감 리스크)

  rosterSize: number;        // 등록 선수 규모 (평균 부원 수)

  // 포지션별 주전 경쟁도
  competition: PositionCompetition;

  // 기록 및 실적
  championships: number;     // 전국대회 메이저 우승 횟수
  tournamentTitles?: HighSchoolTournamentTitles; // 메이저 대회별 세부 우승 횟수
  proPlayers: number;        // 누적 프로 지명 배출 지수/인원

  // 고유 특성 (Traits) 3~5개
  traits: string[];

  // 상세 부가 정보
  notableAlumni?: string[];  // 주요 OB 선수
  description?: string;      // 팀 소개 및 특징 한 줄 요약
}
