# Diamond GM

한국 고교야구 선수 육성 시뮬레이션 웹게임입니다. 고1 3월부터 고3까지 3년 커리어를 하루 3슬롯(오전·오후·야간) 단위로 진행합니다.

## 주요 기능

- **선수 생성**: 실제 고교 야구부 선택, 남녀 선수 프리셋과 외형 커스터마이징
- **감독 면담**: 커리어 목표(KBO·해외·대학) 선택
- **일일 생활**: 학사일정·주말·방학에 따라 달라지는 훈련·학업·휴식 활동
- **성장**: 세부 능력치, 구종 습득(XP), 장비 슬롯, 동학년 전국 상위 퍼센트 비교, 라이벌
- **대회**: 64팀 조별 예선 → 16강 → 결승, 조 추첨 연출
- **인연·이벤트**: 13명 개별 인연과 전용 초상화, 캐릭터 대화와 선택지, 외출
- **프로 일정**: 2026 KBO 공식 일정 스냅샷, 미발표 연도는 가상 시즌

구단 운영(GM) 모드는 선수 육성 모드 완성 후 개발 예정입니다. 버전별 변경 사항은 [CHANGELOG.md](CHANGELOG.md), 작업 규칙은 [AGENTS.md](AGENTS.md)를 참고하세요.

## 기술 스택

React 19 · TypeScript · Vite · Zustand · Dexie(IndexedDB, 브라우저 로컬 저장)

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm test         # 테스트 (node:test)
npm run lint     # oxlint
npm run build    # 타입체크 + 프로덕션 빌드
```

`main` 브랜치에 push하면 GitHub Actions가 테스트·빌드 후 GitHub Pages로 배포합니다.

## 구조

```
src/
  pages/development/   선수 육성 모드 화면 (생성·면담·대시보드)
  pages/management/    구단 운영 모드 (플레이스홀더)
  components/          일일 생활·네비게이션·뷰 컴포넌트
  store/               게임 진행 상태 (gameClockStore)
  types/               게임 규칙·일정·대회·인연 로직과 타입
  data/                고교·KBO 일정·이벤트·선택지 데이터
  styles/              화면별 CSS (index.css에서 순서대로 import)
public/assets/         캐릭터·초상화 이미지
scripts/               KBO 일정 가져오기 스크립트
tests/                 node:test 테스트
```
