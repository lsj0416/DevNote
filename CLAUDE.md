# DevNote AI — 프로젝트 지침

## BMAD 스토리 구현 워크플로우

이 프로젝트는 `bmad-output/`에 BMAD 플래닝 산출물(prd.md, architecture.md, epics.md,
stories/)이 있다. `bmad-output/stories/*.story.md` 중 하나를 구현해 달라는 요청을 받으면,
**작업을 시작하기 전에 반드시**:

1. 해당 스토리 파일 상단의 `**Branch:**` 필드를 확인한다 (예: `feature/1.1-nextjs-project-init`
   (base: `develop`)).
2. `develop` 브랜치를 최신으로 갱신한 뒤, 그 브랜치 이름으로 새 브랜치를 생성해 체크아웃한다.
   이미 해당 브랜치가 존재하면 그 브랜치로 전환한다.
3. 그 다음에 스토리의 Acceptance Criteria / Tasks / Dev Notes / Testing 섹션에 따라 구현을
   진행한다.

사용자가 브랜치 생성을 별도로 명시하지 않아도 이 절차를 항상 따른다.
