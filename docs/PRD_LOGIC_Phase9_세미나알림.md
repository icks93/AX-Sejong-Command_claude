# PRD_LOGIC — Phase 9: 세미나 알림 탭
> AX Sejong Command | 작성: 2026.05.24

---

## 1. 목적

매주 Cowork가 저장하는 [AX]세미나브리핑 노션 페이지를 주차별 카드로 표시한다.
드롭다운 선택 없이 전체 주차를 펼친 상태로 나열한다.

---

## 2. 노션 데이터 구조

### 소스 페이지
- 페이지명: [AX]세미나브리핑
- 페이지 ID: 369963cc-8170-815e-9ca9-ff3ea7f9d2fb

### 실제 블록 구조 (노션 기준)

행사 있는 경우:
```
heading_2: "[2026년 5월 4주차] 세미나 알림"  → color: yellow_background
paragraph: "05/21 기준 · 신규 N건"
divider
heading_3: "근거리 행사 (세종·대전·충청)"   ← 해당 없으면 섹션 자체 없음
paragraph:  "[행사명]"
bulleted_list: "날짜: YYYY.MM.DD"
bulleted_list: "장소: OOO"
bulleted_list: "링크: URL"
paragraph:  "[행사명2]"
bulleted_list: "날짜: YYYY.MM.DD"
...
heading_3: "기타 행사"
paragraph:  "[행사명]"
bulleted_list: "날짜: YYYY.MM.DD"
bulleted_list: "장소: OOO"
bulleted_list: "링크: URL"
...
paragraph: "자동 생성: YYYY년 MM월 DD일 HH:MM | semina-briefing"  (italic)
divider
```

행사 없는 경우:
```
heading_2: "[2026년 5월 4주차] 세미나 알림"  → color: yellow_background
paragraph: "신규 행사 없음"
paragraph: "자동 생성: YYYY년 MM월 DD일 HH:MM | semina-briefing"  (italic)
divider
```

### 주차 헤더 파싱 규칙
- heading_2 텍스트가 "[20XX년" 으로 시작하면 주차 구분자로 인식
- 정규식: \[(\d{4}년\s*\d+월\s*\d+주차)\]
- heading_2 ~ 다음 heading_2 직전까지를 한 주차 블록으로 수집

### 섹션 구분 규칙
- heading_3 텍스트로 섹션 식별
  - "근거리 행사" 포함 → nearby
  - "기타 행사" 포함 → others

### 행사 파싱 규칙 (영업보고/리스크알람과 다름 — 주의)
- heading_3 아래에 paragraph(행사명) + bulleted_list 3개(날짜/장소/링크) 묶음이 반복됨
- paragraph 만나면 → 새 행사 시작
- 이후 bulleted_list → 해당 행사의 속성 수집
- "날짜:", "장소:", "링크:" 키워드로 속성 구분

### 파싱 방어 규칙
- 근거리 행사 섹션 없으면 nearby: [] 반환 (키 누락 금지)
- 부제 paragraph가 "신규 행사 없음" 이면 no_event: true 플래그
- 링크 없는 행사 → link: "" 로 처리

---

## 3. 백엔드 로직 (app.py 추가)

### 상수 / 캐시

```python
# ── PHASE 9: 세미나 알림 ──────────────────────────────────────
SEMINAR_PAGE_ID = "369963cc-8170-815e-9ca9-ff3ea7f9d2fb"
_seminar_cache  = {"data": None, "timestamp": 0}
```

### 헬퍼 함수

```python
def parse_event_group(blocks: list) -> list[dict]:
    """
    heading_3 아래 paragraph+bulleted_list 묶음 파싱
    반환: [
      {"name": "행사명", "date": "2026.06.10", "place": "서울 코엑스", "link": "https://..."},
      ...
    ]
    """

def parse_seminar_blocks(top_blocks: list) -> list[dict]:
    """
    heading_2 기준으로 주차 분리 후 각 주차 파싱
    반환: [
      {
        "label":     "2026년 5월 4주차",
        "base_date": "05/21 기준",
        "count":     3,
        "no_event":  False,
        "nearby":    [{"name": "...", "date": "...", "place": "...", "link": "..."}],
        "others":    [{"name": "...", "date": "...", "place": "...", "link": "..."}],
        "generated": "자동 생성: 2026년 05월 24일 | semina-briefing"
      },
      ...  # 최신순 정렬
    ]
    """

def get_seminar_data(force_refresh: bool = False) -> list[dict]:
    """
    캐시 확인 → 만료 시 노션 API 호출 → parse_seminar_blocks 실행
    CACHE_TTL 상수 재사용
    """
```

### API 엔드포인트

```python
@app.get("/api/seminar")
async def api_seminar(refresh: int = 0):
    """
    전체 주차 데이터를 최신순 배열로 반환
    refresh=1: 캐시 무시
    """
```

### 반환 JSON 구조

```json
[
  {
    "label":     "2026년 5월 4주차",
    "base_date": "05/21 기준",
    "count":     3,
    "no_event":  false,
    "nearby": [
      {"name": "2026 대전 AI 포럼", "date": "2026.06.05", "place": "대전 컨벤션센터", "link": "https://..."}
    ],
    "others": [
      {"name": "AI EXPO KOREA 2026", "date": "2026.06.11", "place": "서울 코엑스", "link": "https://..."},
      {"name": "공공클라우드 컨퍼런스", "date": "2026.06.18", "place": "서울 aT센터", "link": "https://..."}
    ],
    "generated": "자동 생성: 2026년 05월 24일 | semina-briefing"
  }
]
```

---

## 4. 프론트엔드 구성

### 사이드 메뉴 추가 (index.html)

```html
<li class="menu-item" data-tab="seminar">
  <span class="menu-icon">◉</span> 세미나 알림
</li>
```

### 탭 컨텐츠 영역 (index.html)

```html
<div id="tab-seminar" class="tab-content" style="display:none;">
  <div class="page-header">
    <div>
      <h1 class="page-title">세미나 알림</h1>
      <p class="page-sub">AI · 공공IT 세미나 · 컨퍼런스 자동 수집</p>
    </div>
    <button class="refresh-btn" onclick="loadSeminar(true)">↻ 새로고침</button>
  </div>
  <div id="seminar-list" class="seminar-list"></div>
</div>
```

### 화면 레이아웃

```
┌─ 세미나 알림                            [↻ 새로고침] ─┐
│  AI · 공공IT 세미나 · 컨퍼런스 자동 수집               │
├────────────────────────────────────────────────────────┤
│  ┌─ 2026년 5월 4주차   05/21 기준   [신규 3건] ──────┐ │
│  │                                                    │ │
│  │  근거리 행사 (세종·대전·충청)                      │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  2026 대전 AI 포럼                            │ │ │
│  │  │  날짜: 2026.06.05   장소: 대전 컨벤션센터    │ │ │
│  │  │  [바로가기 →]                                 │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  기타 행사                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │AI EXPO KOREA │  │공공클라우드  │               │ │
│  │  │2026.06.11    │  │컨퍼런스      │               │ │
│  │  │서울 코엑스   │  │2026.06.18    │               │ │
│  │  │[바로가기 →]  │  │서울 aT센터   │               │ │
│  │  └──────────────┘  │[바로가기 →]  │               │ │
│  │                     └──────────────┘               │ │
│  │  자동 생성: 2026년 05월 24일 | semina-briefing     │ │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─ 2026년 5월 3주차   신규 행사 없음 ───────────────┐ │
│  │  자동 생성: 2026년 05월 17일 | semina-briefing     │ │
│  └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### 레이아웃 규칙

```
근거리 행사: 풀폭 카드 (1열) — 강조 표시 (연두 계열 배경)
기타 행사:   그리드 카드 (3열) — 행사명 + 날짜 + 장소 + 링크버튼
no_event=true: 카드 내부에 "신규 행사 없음" 심플 표시
링크 있으면: [바로가기 →] 버튼 표시 / 없으면 버튼 생략
```

### JS 함수 (main.js 추가)

```javascript
// ── PHASE 9: 세미나 알림 ──────────────────────────────────────

async function loadSeminar(forceRefresh = false) {
    // GET /api/seminar?refresh=1 호출
    // renderSeminarList(data) 실행
}

function renderSeminarList(weeks) {
    // weeks 배열 순서대로 카드 렌더링 (전체 펼침)
    const html = weeks.map(w => renderSeminarCard(w)).join('');
    document.getElementById('seminar-list').innerHTML = html;
}

function renderSeminarCard(week) {
    // no_event=true → 심플 카드 (신규 행사 없음)
    // no_event=false → 근거리(풀폭) + 기타(3열 그리드)
}

function renderEventFull(event) {
    // 근거리 행사 — 풀폭 카드
    // 연두 배경 강조
}

function renderEventGrid(event) {
    // 기타 행사 — 그리드 카드
}
```

### CSS 클래스 (style.css 추가)

```css
/* Phase 9 — 세미나 알림 */
.seminar-list { display: flex; flex-direction: column; gap: 16px; }

.seminar-card { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; }

.seminar-card-header {
    padding: 12px 18px;
    background: #f0fdf4;
    border-bottom: 1px solid #bbf7d0;
    display: flex; align-items: center; gap: 10px;
}
.seminar-card-accent { width: 4px; height: 22px; background: #22c55e; border-radius: 2px; }
.seminar-card-title  { font-size: 14px; font-weight: 700; color: #1e293b; }
.seminar-card-meta   { font-size: 12px; color: #94a3b8; }
.seminar-card-badge  {
    margin-left: auto;
    background: #f0fdf4; color: #16a34a;
    border: 1px solid #bbf7d0;
    font-size: 11px; padding: 2px 10px; border-radius: 10px; font-weight: 600;
}

.seminar-card-body   { padding: 14px 18px; display: flex; flex-direction: column; gap: 16px; }

.seminar-section-title {
    font-size: 11px; font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.04em;
    margin-bottom: 10px; padding-bottom: 5px;
    border-bottom: 1px solid #f1f5f9;
}

/* 근거리 행사 — 풀폭 강조 카드 */
.event-nearby {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 12px 16px;
    display: flex; align-items: center; gap: 16px;
}
.event-nearby-name  { font-size: 13px; font-weight: 700; color: #15803d; flex: 1; }
.event-nearby-meta  { font-size: 12px; color: #4ade80; }

/* 기타 행사 — 3열 그리드 */
.event-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.event-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    display: flex; flex-direction: column; gap: 6px;
}
.event-name  { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; }
.event-date  { font-size: 11px; color: #64748b; }
.event-place { font-size: 11px; color: #94a3b8; }
.event-link  {
    margin-top: auto;
    display: inline-block;
    font-size: 11px; color: #3b82f6;
    text-decoration: none;
    padding: 3px 8px;
    border: 1px solid #bfdbfe;
    border-radius: 4px;
    width: fit-content;
}
.event-link:hover { background: #eff6ff; }

/* 신규 없음 */
.seminar-no-event { padding: 20px; text-align: center; color: #94a3b8; font-size: 13px; }

.seminar-card-footer {
    padding: 6px 18px;
    font-size: 10px; color: #cbd5e1; font-style: italic;
    border-top: 1px solid #f1f5f9;
}
```

---

## 5. 개발 원칙

1. 노션 원본 텍스트 그대로 표시 — 요약/축약 없음
2. 캐싱 10분 — CACHE_TTL 상수 재사용
3. Phase 1~8 코드 건드리지 않음
4. 전체 주차 펼침 — 토글/드롭다운 없음
5. 근거리 행사 없으면 해당 섹션 렌더링 생략
6. 링크 있는 행사만 [바로가기] 버튼 표시

---

## 6. 클로드 코드 프롬프트

```
현재 app.py, index.html, main.js, style.css 파일 읽고
기존 Phase 1~8 구조 파악한 후 Phase 9 세미나 알림 탭을 추가해줘.

docs/PRD_LOGIC_Phase9_세미나알림.md 참고.

반드시 지켜야 할 것:
- fetch_block_children(), get_block_text() 이미 있으면 재사용
- Phase 1~8 코드 절대 건드리지 마
- CACHE_TTL 상수 그대로 재사용
- 전체 주차 카드 펼침 상태로 나열 (토글 없음)
- 근거리 행사: 풀폭 강조 카드 / 기타 행사: 3열 그리드
- 한국어 주석 포함
```

## 7. 아테나 코드 프롬프트

```
@app.py @templates/index.html @static/main.js @static/style.css
@docs/PRD_LOGIC_Phase9_세미나알림.md
@docs/UI_COMPONENTS.md

위 문서 읽고 Phase 9 세미나 알림 탭 구현해줘.

반드시 지켜야 할 것:
- fetch_block_children(), get_block_text() 이미 있으면 재사용
- Phase 1~8 코드 절대 건드리지 마
- CACHE_TTL 상수 그대로 재사용
- 전체 주차 카드 펼침 상태로 나열 (토글 없음)
- 근거리 행사: 풀폭 강조 카드 / 기타 행사: 3열 그리드
- 한국어 주석 포함
```

---

*작성: 익스 + Claude | 2026.05.24*
