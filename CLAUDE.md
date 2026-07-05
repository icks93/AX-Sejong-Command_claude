# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 서버 실행

```bash
python app.py
# → http://localhost:8001
```

`.env` 파일 필요:
```
NOTION_API_KEY=secret_xxxx
NOTION_PROJECTS_DB_ID=xxxx
```

---

## 아키텍처

**단일 FastAPI 서버** + **단일 페이지 SPA** 구조. 별도 빌드 단계 없음.

```
app.py              ← 백엔드 전체 (Phase 1~9 순서대로 나열)
templates/index.html ← HTML SPA (탭별 div, 전역 topbar)
static/main.js      ← 탭 전환·렌더링·API fetch 전체
static/style.css    ← Phase 번호 주석으로 구역 구분
```

### 백엔드 구조 (app.py)

Phase 번호 주석(`# PHASE N — ...`)으로 구역이 나뉘어 있다.

**공용 헬퍼 (Phase 2에 정의, 전 Phase 재사용):**
- `fetch_block_children(block_id)` — Notion 블록 1단계 자식 가져오기 (페이지네이션 포함)
- `fetch_block_children_all(block_id)` — 재귀 fetch
- `get_block_text(block)` — 블록에서 plain_text 추출

**캐시 패턴:** 각 Phase마다 `_xxx_cache = {"data": None, "timestamp": 0}` 전역 딕셔너리. `CACHE_TTL = 600`(10분) 상수 재사용. `force_refresh=True` 시 캐시 무시.

**노션 블록 파싱 패턴 (Phase 7~9):**
- `heading_2` 텍스트가 `[20XX년`으로 시작 → 주차 구분자
- `heading_3` 텍스트 키워드 매칭 → 섹션 구분
- `bulleted_list_item` → 해당 섹션의 항목 수집

**API 응답:** Phase 1~5는 `{"success": bool, "data": ...}` 래퍼 사용. Phase 6~9는 배열 직접 반환. `?refresh=1` 파라미터로 캐시 강제 갱신.

### 프론트엔드 구조

**탭 전환:** `switchTab(tabName)` 함수가 topbar title/subtitle 업데이트 + 해당 탭 `loadXxx()` 호출. `currentTab` 전역 변수로 상태 관리.

**특수 케이스:**
- 조직도(`org`) 탭: 전역 `#btn-refresh` 숨기고 내부 `#btn-org-refresh` 사용
- 영업보고·RISK·세미나 탭: 전역 topbar가 타이틀 담당, 탭 내부에 별도 헤더 없음
- Phase 5 히스토리: `#btn-chart` 그래프 토글 버튼 히스토리 탭에서만 표시

**`escape()` 함수:** XSS 방지용 전역 함수. 노션 텍스트를 innerHTML에 삽입할 때 반드시 사용.

---

## 핵심 개발 규칙

### 절대 지켜야 할 것
- **기존 Phase 코드 수정 금지** — 새 Phase 추가 시 기존 파일에 ADD만 허용
- **`fetch_block_children()`, `get_block_text()` 중복 정의 금지** — Phase 2에 이미 정의됨
- **`CACHE_TTL` 상수 그대로 재사용** — 새 값 정의 금지
- **`parse_number()`와 `parse_num()` 혼용 주의** — Phase 5에 `parse_number(text)`, Phase 6에 `parse_num(val)` 별도 존재 (충돌 방지를 위해 다른 이름 사용)
- 백엔드는 **동기(synchronous)** — `async def` 금지, `requests` 라이브러리 사용
- 노션 API는 **읽기 전용** — POST /query와 GET /blocks만 사용

### 코드 스타일
- 주석은 **한국어**
- Python: snake_case, JS: camelCase, CSS: kebab-case
- JS 프레임워크(React/Vue) 금지, npm 금지
- `position: fixed` CSS 금지 (툴팁 등은 `absolute`)
- 아이콘은 Tabler Icons CDN만 사용 (`ti-` 접두사)
- 한자 금지 — 순수 한글로만 (예: `분析` → `분석`)

### 새 Phase 추가 시 체크 리스트 
1. `app.py`: 상수(`XXX_PAGE_ID`) → 캐시(`_xxx_cache`) → 파싱 함수 → `get_xxx_data()` → `@app.get("/api/xxx")` 순으로 추가
2. `index.html`: 사이드바 메뉴 아이템 + 탭 content div 추가
3. `main.js`: `switchTab()` 내 `else if (tabName === "xxx")` 케이스 + `loadXxx()` / `renderXxx()` 함수 추가
4. `style.css`: 파일 끝에 Phase 번호 구역 주석과 함께 추가


# 언어 설정
모든 응답은 반드시 한국어로 해주세요.