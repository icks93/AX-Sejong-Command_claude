새 Phase를 추가할 때 아래 순서대로 진행한다.

1. **PRD 또는 요구사항 확인**: 사용자에게 어떤 데이터를 표시할지, 노션 페이지/DB ID가 무엇인지 물어본다.

2. **기존 코드 파악**: app.py, index.html, main.js, style.css 를 읽고 현재 마지막 Phase 번호를 확인한다.

3. **app.py 추가** (기존 코드 절대 수정 금지, ADD만):
   - 상수 정의: `XXX_PAGE_ID = "..."`
   - 캐시 딕셔너리: `_xxx_cache = {"data": None, "timestamp": 0}`
   - 파싱 함수: `parse_xxx_blocks(top_blocks)`
   - 데이터 함수: `get_xxx_data(force_refresh=False)` — CACHE_TTL 재사용
   - API 엔드포인트: `@app.get("/api/xxx")`
   - 백엔드는 반드시 동기(synchronous) — async def 금지, requests 라이브러리 사용
   - fetch_block_children(), get_block_text() 재사용 (중복 정의 금지)

4. **index.html 추가**:
   - 사이드바 메뉴 아이템 (Tabler Icons `ti-` 접두사 사용)
   - 탭 content div: `<div id="tab-xxx" class="tab-content">`

5. **main.js 추가**:
   - `switchTab()` 내 `else if (tabName === "xxx")` 케이스 추가
   - `loadXxx()` 함수 — fetch `/api/xxx`, force_refresh 파라미터 지원
   - `renderXxx()` 함수 — XSS 방지 위해 innerHTML 삽입 시 반드시 escape() 사용

6. **style.css 추가**:
   - 파일 끝에 `/* ===== PHASE N — XXX ===== */` 주석 구역과 함께 추가

7. **체크리스트 확인**:
   - [ ] CACHE_TTL 새로 정의하지 않고 재사용했는가?
   - [ ] fetch_block_children() / get_block_text() 중복 정의하지 않았는가?
   - [ ] 기존 Phase 코드를 수정하지 않았는가?
   - [ ] 주석은 한국어로 작성했는가?
   - [ ] position: fixed CSS를 사용하지 않았는가?
   - [ ] 한자를 사용하지 않았는가?
   - [ ] async def를 사용하지 않았는가?
   - [ ] escape() 함수로 XSS를 방지했는가?
