# PRD_LOGIC — Phase 7: 영업보고 분석 탭
> AX Sejong Command | 작성: 2026.05.24

---

## 1. 목적

매주 Cowork가 저장하는 [AX]영업보고 노션 페이지를 주차별 카드로 표시한다.
드롭다운 선택 없이 전체 주차를 펼친 상태로 나열한다.

---

## 2. 노션 데이터 구조

### 소스 페이지
- 페이지명: [AX]영업보고
- 페이지 ID: 369963cc-8170-816e-b723-efc00c45e3fe

### 실제 블록 구조 (노션 확인 기준)

```
heading_2: "[2026년 5월 3주차] 영업보고 분석"  → color: yellow_background
paragraph: "05/12(월) ~ 05/18(일)  총 12건"
divider
heading_3: "고객사별 접촉 현황"
bulleted_list: "고객사명 — N건 / 최근 MM/DD / 보고자: OOO / 내용 [수주]"
...
heading_3: "세종본부 연관 기회"
bulleted_list: 내용 or "해당 없음"
heading_3: "액션 필요 건"
bulleted_list: 내용 or "없음"
heading_3: "주목할 이슈·리스크"
bulleted_list: 내용 or "없음"
paragraph: "자동 생성: YYYY년 MM월 DD일 | sales-report-to-slack"  (italic)
divider
```

### 주차 헤더 파싱 규칙
- heading_2 텍스트가 "[20XX년" 으로 시작하면 주차 구분자로 인식
- 정규식: \[(\d{4}년\s*\d+월\s*\d+주차)\]
- heading_2 ~ 다음 heading_2 직전까지를 한 주차 블록으로 수집

### 섹션 구분 규칙
- heading_3 텍스트로 섹션 식별
  - "고객사별 접촉 현황"
  - "세종본부 연관 기회"
  - "액션 필요 건"
  - "주목할 이슈·리스크"
- heading_3 ~ 다음 heading_3 또는 divider 직전까지 bulleted_list 수집

### 파싱 방어 규칙
- bulleted_list 없는 섹션 → 빈 배열 [] 반환 (키 누락 금지)
- "해당 없음" / "없음" 텍스트도 수집 대상에 포함 (그대로 표시)
- 섹션 자체가 없으면 빈 배열로 처리

---

## 3. 백엔드 로직 (app.py 추가)

### 상수 / 캐시

```python
# ── PHASE 7: 영업보고 ──────────────────────────────────────
SALES_PAGE_ID = "369963cc-8170-816e-b723-efc00c45e3fe"
_sales_cache  = {"data": None, "timestamp": 0}
```

### 헬퍼 함수

```python
def parse_sales_blocks(top_blocks: list) -> list[dict]:
    """
    heading_2 기준으로 주차 분리 후 각 주차 파싱
    반환: [
      {
        "label":    "2026년 5월 3주차",
        "range":    "05/12(월) ~ 05/18(일)",
        "total":    12,
        "clients":  ["한국고용정보원 — 1건 / ... [수주]", ...],
        "opps":     ["해당 없음"],
        "actions":  ["없음"],
        "risks":    ["보험개발원 모바일 AOS — 3주 연속 ..."],
        "generated": "자동 생성: 2026년 05월 24일 | sales-report-to-slack"
      },
      ...  # 최신순 정렬
    ]
    """

def get_sales_data(force_refresh: bool = False) -> list[dict]:
    """
    캐시 확인 → 만료 시 노션 API 호출 → parse_sales_blocks 실행
    CACHE_TTL 상수 재사용
    """
```

### API 엔드포인트

```python
@app.get("/api/sales")
async def api_sales(refresh: int = 0):
    """
    전체 주차 데이터를 최신순 배열로 반환
    refresh=1: 캐시 무시
    """
```

### 반환 JSON 구조

```json
[
  {
    "label":    "2026년 5월 3주차",
    "range":    "05/12(월) ~ 05/18(일)",
    "total":    12,
    "clients":  [
      "한국고용정보원 — 1건 / 최근 05/11 / 보고자: 박형준 / AX기반 AI고용서비스 수주 2억 [수주]",
      "SK하이닉스 — 2건 / 최근 05/15 / 보고자: 최남기·박태진 / 해외공장 독립망 구축 기회인지"
    ],
    "opps":    ["해당 없음"],
    "actions": ["없음"],
    "risks":   ["보험개발원 모바일 AOS — 3주 연속 기회인지 단계 유지, 진전 없음"],
    "generated": "자동 생성: 2026년 05월 24일 | sales-report-to-slack"
  }
]
```

---

## 4. 프론트엔드 구성

### 사이드 메뉴 추가 (index.html)

```html
<!-- 기존 메뉴 아이템 다음에 추가 -->
<li class="menu-item" data-tab="sales">
  <span class="menu-icon">◈</span> 영업보고
</li>
```

### 탭 컨텐츠 영역 (index.html)

```html
<div id="tab-sales" class="tab-content" style="display:none;">
  <div class="page-header">
    <div>
      <h1 class="page-title">영업보고 분석</h1>
      <p class="page-sub">노션 실시간 연동 · 주차별 자동 집계</p>
    </div>
    <button class="refresh-btn" onclick="loadSales(true)">↻ 새로고침</button>
  </div>
  <div id="sales-list" class="sales-list"></div>
</div>
```

### 화면 레이아웃 (카드 전체 펼침)

```
┌─ 영업보고 분석                          [↻ 새로고침] ─┐
│  노션 실시간 연동 · 주차별 자동 집계                   │
├────────────────────────────────────────────────────────┤
│  ┌─ 2026년 5월 3주차  05/12~05/18         [총 12건] ─┐ │
│  │ ──────────────────────────────────────────────── │ │
│  │  고객사별 접촉 현황  │  세종본부 연관 기회         │ │
│  │  · 한국고용정보원    │  · 해당 없음               │ │
│  │    [수주]            │                            │ │
│  │  · SK하이닉스        │  액션 필요 건              │ │
│  │  · KB증권            │  · 없음                   │ │
│  │  ...                 │                            │ │
│  │                      │  주목할 이슈·리스크        │ │
│  │                      │  · 보험개발원 3주 연속...  │ │
│  │ ──────────────────────────────────────────────── │ │
│  │  자동 생성: 2026년 05월 24일 | sales-report-...   │ │
│  └────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ 2026년 5월 2주차  05/05~05/11         [총 8건]  ─┐ │
│  │  ... (동일 구조)                                │ │
│  └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### JS 함수 (main.js 추가)

```javascript
// ── PHASE 7: 영업보고 ──────────────────────────────────────

async function loadSales(forceRefresh = false) {
    // GET /api/sales?refresh=1 호출
    // renderSalesList(data) 실행
}

function renderSalesList(weeks) {
    // weeks 배열 순서대로 카드 렌더링 (전체 펼침)
    const html = weeks.map(w => renderSalesCard(w)).join('');
    document.getElementById('sales-list').innerHTML = html;
}

function renderSalesCard(week) {
    // 카드 HTML 반환
    // 좌: 고객사별 접촉 현황 (전체 표시)
    // 우: 세종본부 연관 기회 / 액션 필요 건 / 주목할 이슈·리스크
}

function renderSalesItems(items) {
    // items 배열 → <ul><li> 리스트
    // "해당 없음" / "없음" → 회색 이탤릭 표시
    // [수주] → 초록 뱃지
    // [세종] → 파랑 뱃지
}
```

### 태그 렌더링 규칙

```javascript
// 텍스트 내 태그를 HTML 뱃지로 변환
text.replace('[수주]', '<span class="tag tag-win">수주</span>')
text.replace('[세종]', '<span class="tag tag-sejong">세종</span>')
```

### CSS 클래스 (style.css 추가)

```css
/* Phase 7 — 영업보고 */
.sales-list { display: flex; flex-direction: column; gap: 16px; }

.sales-card { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; }

.sales-card-header {
    padding: 12px 18px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; gap: 10px;
}
.sales-card-accent { width: 4px; height: 22px; background: #3b82f6; border-radius: 2px; }
.sales-card-title  { font-size: 14px; font-weight: 700; color: #1e293b; }
.sales-card-date   { font-size: 12px; color: #94a3b8; }
.sales-card-badge  {
    margin-left: auto;
    background: #eff6ff; color: #3b82f6;
    border: 1px solid #bfdbfe;
    font-size: 11px; padding: 2px 10px; border-radius: 10px; font-weight: 600;
}

.sales-card-body {
    display: grid; grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #f1f5f9;
}
.sales-col-left  { padding: 14px 18px; border-right: 1px solid #f1f5f9; }
.sales-col-right { padding: 14px 18px; display: flex; flex-direction: column; gap: 14px; }

.sales-section-title {
    font-size: 11px; font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.04em;
    margin-bottom: 8px; padding-bottom: 5px;
    border-bottom: 1px solid #f1f5f9;
}
.sales-item      { display: flex; gap: 6px; margin-bottom: 5px; font-size: 12px; color: #475569; line-height: 1.5; }
.sales-item-dot  { width: 5px; height: 5px; background: #cbd5e1; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.sales-empty     { font-size: 12px; color: #cbd5e1; font-style: italic; }

.tag             { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 3px; margin-left: 4px; font-weight: 600; }
.tag-win         { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
.tag-sejong      { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

.sales-card-footer {
    padding: 6px 18px;
    font-size: 10px; color: #cbd5e1; font-style: italic;
}
```

---

## 5. 개발 원칙

1. 노션 원본 텍스트 그대로 표시 — 요약/축약 없음
2. 캐싱 10분 — CACHE_TTL 상수 재사용
3. Phase 1~6 코드 건드리지 않음
4. 전체 주차 펼침 — 토글/드롭다운 없음
5. 빈 항목 skip 없음 — "해당 없음" / "없음" 그대로 표시

---

## 6. 클로드 코드 프롬프트

```
현재 app.py, index.html, main.js, style.css 파일 읽고
기존 Phase 1~6 구조 파악한 후 Phase 7 영업보고 탭을 추가해줘.

docs/PRD_LOGIC_Phase7_영업보고.md 참고.

반드시 지켜야 할 것:
- fetch_block_children(), get_block_text() 이미 있으면 재사용
- Phase 1~6 코드 절대 건드리지 마
- CACHE_TTL 상수 그대로 재사용
- 전체 주차 카드 펼침 상태로 나열 (토글 없음)
- 한국어 주석 포함
```

## 7. 아테나 코드 프롬프트

```
@app.py @templates/index.html @static/main.js @static/style.css
@docs/PRD_LOGIC_Phase7_영업보고.md
@docs/UI_COMPONENTS.md

위 문서 읽고 Phase 7 영업보고 탭 구현해줘.

반드시 지켜야 할 것:
- fetch_block_children(), get_block_text() 이미 있으면 재사용
- Phase 1~6 코드 절대 건드리지 마
- CACHE_TTL 상수 그대로 재사용
- 전체 주차 카드 펼침 상태로 나열 (토글 없음)
- 한국어 주석 포함
```

---

*작성: 익스 + Claude | 2026.05.24*
