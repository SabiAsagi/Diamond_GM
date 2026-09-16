# Diamond GM 작업 규칙

- 작업 완료 시 GitHub에 업로드하고 커밋·PR 제목과 설명은 한글로 작성한다.
- 현재 릴리스는 1.7이다. 이후 사용자에게 전달할 업데이트를 GitHub에 업로드할 때마다 표시 버전을 0.1씩 올린다(다음 1.8, 그다음 1.9).
- `package.json`의 버전을 기준으로 `package-lock.json` 루트 버전과 변경 기록을 함께 갱신한다. 화면은 `src/version.ts`에서 이 값을 가져온다.
- 인연 점수의 유일한 저장 원본은 `Player.relationships`다. 이전 네 개의 공유 필드는 마이그레이션에서만 읽고 제거한다. 첫날 면담의 그룹 보너스 정의는 예외로 유지한다.
- 개별 활동·컷신 보상은 `relationshipTargets`로 대상과 증감량을 지정한다.
- 로맨스 대상 강민준·이도현·한서윤·윤하린은 선수 성별에 관계없이 개방한다.
- 변경 파일은 지정된 Google Drive 폴더 `1pOqZQRLoGEkTa6eRmby6fWG30zFIVNDp`에도 업로드한다. 사용자 PC의 `E:\Dev\Diamond_GM`에 접근할 수 없으면 반영하지 못했음을 명시한다.
