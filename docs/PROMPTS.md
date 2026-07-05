# PROMPTS.md — AX Sejong Command
> 작성: 익스 + Claude | 2026.05.10  
> 수정: 2026.06.07 — 아테나 코드 → Claude Code 기준으로 전환
> 용도: 잘 동작한 Claude Code 프롬프트 모음  
> 규칙: 검증된 프롬프트만 추가. 날짜와 결과 메모 필수.

---

## 사용법

1. 필요한 상황의 프롬프트 찾기
2. `[ ]` 부분만 채우기
3. Claude Code 채팅창에 붙여넣기
4. 잘 된 프롬프트는 맨 아래 "나만의 프롬프트" 섹션에 추가

---

## 새 Phase 추가

### 기본 패턴
```
현재 app.py, index.html, main.js, style.css 파일 읽고
기존 Phase 1~[N-1] 구조 파악한 후 Phase [N] [탭명] 탭을 추가해줘.
docs/PRD_LOGIC_Phase[N]_[탭명].md 참고.

반드시 지켜야 할 것:
- fetch_block_children(), get_block_text() 이미 있으면 재사용
- Phase 1~[N-1] 코드 절대 건드리지 마
- CACHE_TTL 상수 그대로 재사용
- 한국어 주석 포함
```
> 검증: Phase 5~9 모두 이 패턴으로 성공 ✅

---

## UI 관련

### 특정 스타일만 수정
```
static/style.css 파일 읽고
[수정할 내용]만 바꿔줘.
다른 스타일은 건드리지 마.

수정 내용:
- [항목1]: [현재값] → [바꿀값]
- [항목2]: [현재값] → [바꿀값]
```

### HTML/CSS 동시 수정
```
templates/index.html 과 static/style.css 파일 읽고
[수정할 내용]을 반영해줘.
app.py와 main.js는 절대 건드리지 마.
```

### 새 탭 콘텐츠 추가
```
docs/UI_COMPONENTS.md, templates/index.html, static/main.js 파일 읽고
[탭명] 탭(id="tab-[탭ID]")을 구현해줘.

화면 구성:
- KPI 박스 [N]개: [KPI1명](id="kpi-[id]") / [KPI2명] / ...
- API: GET /api/[엔드포인트명]

컴포넌트는 UI_COMPONENTS.md 스펙 그대로 사용.
style.css는 건드리지 마.
```

---

## 기능 추가

### 노션 API 엔드포인트 추가
```
app.py 파일 읽고
/api/[엔드포인트명] 엔드포인트를 추가해줘.

조건:
- 노션 DB ID: [DB ID값]
- 반환 형식: {"success": true, "data": [...]}
- 기존 코드 구조 유지
- 한국어 주석 포함
- fetch_block_children(), get_block_text() 재사용
- CACHE_TTL 상수 재사용
```

---

## 에러 해결

### 터미널 에러
```
app.py 파일 읽고 아래 에러를 고쳐줘.
다른 코드는 건드리지 마.

[터미널 에러 메시지 전체 붙여넣기]
```

### 브라우저 콘솔 에러
```
static/main.js 파일 읽고 브라우저 콘솔에서 아래 에러가 나. 고쳐줘.
다른 코드는 건드리지 마.

[콘솔 에러 메시지 전체 붙여넣기]
```

### 화면에 데이터가 안 나올 때
```
static/main.js, app.py 파일 읽고 확인해줘.
/api/[엔드포인트] 는 200 OK로 응답하는데 화면에 데이터가 표시되지 않아.

1. API 응답 JSON 구조와 렌더링 함수의 필드명이 일치하는지 확인
2. 문제 원인 설명
3. 수정 (다른 코드는 건드리지 마)
```

---

## 수정/개선

### 특정 함수만 수정
```
static/main.js 파일 읽고
[함수명] 함수만 수정해줘.
전체를 다시 짜지 말고 해당 함수만.

수정 내용:
[구체적인 수정 내용]

다른 함수는 건드리지 마.
```

### 코드 리뷰
```
/review-code
```

---

## Phase 전환

### 새 Phase 시작
```
docs/PRD_LOGIC_Phase[N]_[탭명].md 파일 읽고
Phase [N] 작업 계획을 todo list로 정리해줘.
기존 Phase 코드는 건드리지 말고, 추가할 것만 나열해줘.
```

### Phase 완료 후 체크포인트 메모
```
현재 상태:
- Phase [N] 완료
- 동작 확인: [날짜]
- 주요 변경 파일: [파일 목록]
- 다음 Phase: [Phase N+1] 예정
```

---

## Phase 6 조직도 — 검증된 프롬프트

```
현재 app.py, index.html, static/main.js, static/style.css 파일을 읽고
기존 Phase 1~5 구조를 파악한 후 Phase 6 조직도 탭을 추가해줘.
docs/PRD_LOGIC_Phase6_조직도.md 를 참고해서 구현해.

추가할 것 요약:
app.py:
  - STAFF_DB_ID = "7d93242628714413b4c31bffbadd3e03"
  - PROJECT_DB_ID = "e22b899799494b4e9a9edb8521d2084f"
  - _org_cache = {"data": None, "timestamp": 0}
  - query_notion_db(db_id) — Notion DB API 쿼리, 페이지네이션 포함
  - 속성 파싱 헬퍼 함수들 (parse_select, parse_text, parse_email 등)
  - get_org_data(force_refresh=False)
  - GET /api/org?refresh=0

반드시 지켜야 할 것:
- fetch_block_children(), get_block_text() 등 기존 헬퍼 건드리지 마
- Phase 1, 2, 3, 4, 5 코드 절대 수정하지 마
- CACHE_TTL 상수 그대로 재사용
- 한국어 주석 포함
```
> 검증: 2026.05.21 ✅

---

## 나만의 프롬프트 (잘 된 것 추가)

> 형식: ### [설명] / 날짜 / 결과

---

*작성: 익스 + Claude | 2026.05.10 | 수정: 2026.06.07*  
*이 파일은 사용할 때마다 업데이트*
