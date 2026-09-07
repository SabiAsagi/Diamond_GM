import type { AcademicEvent } from '../types/academicCalendar';
import type { Player } from '../types';
import type { ActivityResult } from '../types/activity';

/**
 * 학사 일정 강제 슬롯(시험, 행사 등) 진행 결과 생성 엔진
 */
export function resolveAcademicEvent(
  event: AcademicEvent,
  player: Player
): ActivityResult {
  const currentAcademics = player.academics || 50;

  switch (event.type) {
    case 'entrance_ceremony': {
      return {
        statChanges: {
          relationshipTeam: 5,
          relationshipFriends: 5,
          condition: 15,
        },
        staminaDelta: -5,
        mentalDelta: 15,
        logMessage: `🌸 [${event.label}] 선배들과 코칭스태프의 박수를 받으며 고교 야구부 신입생으로 정식 입학했습니다!`,
      };
    }

    case 'midterm_exam':
    case 'final_exam': {
      // 학업 성취도 기반 시험 결과 산출
      let examGrade = '보통';
      let score = 60 + Math.floor(Math.random() * 20);
      let academicDelta = 2;

      if (currentAcademics >= 80) {
        examGrade = '최상위권 (우등생)';
        score = 90 + Math.floor(Math.random() * 10);
        academicDelta = 3;
      } else if (currentAcademics >= 60) {
        examGrade = '상위권';
        score = 75 + Math.floor(Math.random() * 15);
        academicDelta = 2;
      } else if (currentAcademics <= 35) {
        examGrade = '낙제 위기 (보충수업 주의)';
        score = 40 + Math.floor(Math.random() * 15);
        academicDelta = 4; // 더 노력해서 오름
      }

      return {
        statChanges: {
          academics: academicDelta,
          condition: currentAcademics > 50 ? 5 : -5,
        },
        staminaDelta: -10,
        mentalDelta: currentAcademics > 50 ? 5 : -10,
        logMessage: `📝 [${event.label}] 지필 시험 완료! 평균 약 ${score}점 (${examGrade}). 학업 성취도 +${academicDelta}`,
      };
    }

    case 'sports_day': {
      return {
        statChanges: {
          speed: 1,
          relationshipFriends: 8,
          relationshipTeam: 5,
          condition: 15,
        },
        staminaDelta: -15,
        mentalDelta: 20,
        logMessage: `🏃 [${event.label}] 계주 마지막 주자로 나서 폭풍 질주로 역전승! 전교생의 환호를 받았습니다!`,
      };
    }

    case 'field_trip': {
      return {
        statChanges: {
          relationshipFriends: 10,
          relationshipTeam: 6,
          condition: 25,
        },
        staminaDelta: 10,
        mentalDelta: 30,
        logMessage: `🚌 [${event.label}] 숙소에서 동기들과 밤새 이야기꽃을 피우며 평생 잊지 못할 추억을 쌓았습니다.`,
      };
    }

    case 'graduation_ceremony': {
      return {
        statChanges: {
          fame: 5,
          condition: 20,
        },
        staminaDelta: 0,
        mentalDelta: 25,
        logMessage: `🎓 [${event.label}] 3년의 모든 땀방울이 담긴 졸업장을 수여받았습니다! 영광스러운 고교 선수 생활 완주!`,
      };
    }

    default: {
      return {
        statChanges: { condition: 5 },
        staminaDelta: -5,
        mentalDelta: 5,
        logMessage: `📌 [${event.label}] 일정을 성공적으로 마쳤습니다.`,
      };
    }
  }
}
