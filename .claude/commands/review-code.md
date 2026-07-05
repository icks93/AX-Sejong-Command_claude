현재 프로젝트 코드를 Phase별로 리뷰한다.

app.py, index.html, main.js, style.css 파일을 읽고 아래 항목을 점검한다.

## 공통 규칙 준수 여부

- [ ] `fetch_block_children()`, `get_block_text()` 중복 정의 없는가?
- [ ] `CACHE_TTL` 상수가 새로 정의되지 않고 재사용되는가?
- [ ] `async def`가 사용되지 않았는가? (백엔드는 동기)
- [ ] `position: fixed` CSS가 없는가?
- [ ] 한자가 사용되지 않았는가?
- [ ] JS에서 innerHTML 삽입 시 `escape()` 함수를 사용했는가?
- [ ] Tabler Icons(`ti-` 접두사)만 사용했는가?
- [ ] React/Vue/npm 등 프레임워크 사용이 없는가?

## Phase별 점검

각 Phase(1~9)에 대해 아래를 확인한다:
- 캐시 딕셔너리(`_xxx_cache`)가 올바르게 정의되어 있는가?
- `?refresh=1` 파라미터가 지원되는가?
- 사이드바 메뉴 아이템과 탭 content div가 매칭되는가?
- `switchTab()` 내 케이스가 존재하는가?
- style.css에 Phase 번호 주석 구역이 있는가?

## 개선 제안

위 점검 결과를 바탕으로 문제점과 개선 가능한 부분을 정리해서 보고한다.
문제가 없으면 "이상 없음"으로 표시한다.
