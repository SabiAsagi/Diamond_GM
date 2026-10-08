# Google Drive 보관 구조

2026-10-06 사용자 요청에 따라 정리했다. 현재 릴리스는 2.0.3이다.

- [Diamond_GM](https://drive.google.com/drive/folders/1pOqZQRLoGEkTa6eRmby6fWG30zFIVNDp): 현재 로컬 Git 추적 소스·원화·설정·문서를 같은 상대 경로로 유지한다. 동일 파일은 기존 Drive 파일 ID의 내용을 업데이트한다.
- [이전 버전](https://drive.google.com/drive/folders/1axkwbPyXrAtwFh16URHpQcRZx8DWxdl_): 버전별 ZIP과 작업별 변경 ZIP을 보관한다. 기존 ZIP 10개를 이동했으며 2.0.3 전체 소스 ZIP을 추가했다.
- [초기 작업 자료](https://drive.google.com/drive/folders/1tzIQ33F_WsnP8PzipsC_6ASjiDwqq-_z): 예전에 올라온 .git, node_modules, dist와 더 이상 현재 소스에 없는 템플릿 파일 5개를 삭제 없이 보존했다.

## 이후 업데이트

1. 변경 내용을 로컬에 반영하고 필요한 검증을 실행한다.
2. GitHub에 한글 커밋·푸시 및 필요한 PR을 반영한다.
3. Drive 최신 소스의 동일 경로 파일은 내용을 갱신하고 새 파일은 해당 폴더에 추가한다. 관련 없는 사용자 자료를 임의로 삭제하지 않는다.
4. 버전·날짜를 포함한 변경 ZIP을 이전 버전에 업로드한다. 전체 소스 ZIP은 Git 추적 파일로 만들며 .git, node_modules, 비밀 설정과 로컬 채팅 백업을 넣지 않는다.
5. Drive 목록·크기·부모 폴더를 다시 확인하고 GitHub 및 Drive 결과 링크를 보고한다.

학교별 완성 이미지 736장은 Git에서 제외된 재생성 결과물이다. 전체 소스에는 원화 32장과 생성 스크립트를 포함하며 npm install 후 npm run kits 또는 npm run build로 다시 생성한다. 현재 Drive 루트는 소스 보관용이며 node_modules와 빌드 결과 dist를 최신 소스와 섞지 않는다.

## 이번 확인

최신 소스 312개를 업로드 또는 갱신한 후 45개 폴더의 목록을 다시 읽어 누락 0개를 확인했다. 이 안내 문서도 최신 폴더에 추가한다. 기존 게임 코드는 변경하지 않았으며 앞서 통과한 테스트 85개·빌드·린트 결과를 유지한다. 이번 추가 지침과 문서는 변경 diff를 검사했다.
