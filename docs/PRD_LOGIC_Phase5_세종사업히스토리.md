# PRD_LOGIC_Phase3_세종사업히스토리.md
> 작성: 익스 + Claude | 2026.05.17
> Phase 5: 세종사업히스토리 탭

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 탭 이름 | 세종사업히스토리 |
| 노션 페이지 | `[AX]세종사업히스토리_연도별` |
| 페이지 ID | `363963cc-8170-81de-a362-d9294436af0b` |
| 목적 | 연도별 사업 이력 및 매출/영업이익 현황 조회 |
| 데이터 | 노션 원본 그대로 표시 (요약 없음) |

---

## 2. 노션 페이지 구조 (실제 확인)

```
📊 [AX]세종사업히스토리_연도별

## 2026년  {color="yellow_bg"}   ← heading_2
  table (header-row):
    [사업명, 고객사, 기간, 매출액(확정), 영업이익(확정), 이익률,
     매출액(최초계획), 영업이익(최초계획), 이익률, 계획대비실적]
    ... 사업별 행들 ...
    합계 행 (bold)

## 2025년  {color="yellow_bg"}
  table ...

## 2024년  {color="yellow_bg"}
  table ...

## 2023년  {color="yellow_bg"}
  table ...

## 2022년  {color="yellow_bg"}
  table ...

## 2021년  {color="yellow_bg"}
  table ...

## 2020년  {color="yellow_bg"}
  table ...

## 연도별 매출 합계 요약  {color="blue_bg"}  ← 핵심!
  table (header-row):
    [년도, 사업 수, 매출액(확정), 영업이익(확정), 영업이익률,
     전년대비 증감, 계획대비실적 합계]
    2020년 ~ 2026년 행들
```

---

## 3. 화면 구성

```
┌──────────────────────────────────────────────────────┐
│ 세종사업히스토리         [📊 그래프 보기]  [↻ 새로고침]│
├──────────────────────────────────────────────────────┤
│ ▼ 그래프 영역 (토글, 기본 닫힘)                       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 연도별 매출액 & 영업이익 (막대+라인 복합 차트)     │ │
│ │                                                  │ │
│ │  60억  ████                    ████              │ │
│ │  50억  ████  ████  ████  ████  ████  ████        │ │
│ │  30억  ████  ████  ████  ████  ████  ████        │ │
│ │  10억  ─────────────────────────────────         │ │
│ │        2020  2021  2022  2023  2024  2025  2026  │ │
│ │  ■ 매출액(확정)  ◆ 영업이익(확정)                 │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ 연도별 매출 합계 요약 (항상 표시)                      │
│ ┌───────┬──────┬──────────┬──────────┬──────┐       │
│ │ 년도  │사업수│ 매출액   │ 영업이익 │이익률│       │
│ ├───────┼──────┼──────────┼──────────┼──────┤       │
│ │ 2026  │  6건 │ 50.3억   │  0.32억  │ 0.6% │       │
│ │ 2025  │  7건 │ 40.3억   │ -0.03억  │-0.1% │       │
│ │  ...  │  ... │   ...    │   ...    │  ... │       │
│ └───────┴──────┴──────────┴──────────┴──────┘       │
├──────────────────────────────────────────────────────┤
│ 연도 선택 탭: [전체] [2026] [2025] [2024] [2023] ...  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ [전체 선택 시] 2020년부터 2026년 모든 연도 순서대로    │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 2026년 사업 현황                                  │ │  ← 연도 헤더
│ ├────────────────┬──────┬──────┬────────┬──────┤   │ │
│ │ 사업명         │고객사│ 기간 │매출액  │이익률│   │ │
│ ├────────────────┼──────┼──────┼────────┼──────┤   │ │
│ │ 안전신문고...  │행안부│12M   │15.2억  │ 4.7% │   │ │
│ │ **합계 (6건)** │      │      │**50.3억**│**0.6%** │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 2025년 사업 현황                                  │ │  ← 연도 헤더
│ ├────────────────┬──────┬──────┬────────┬──────┤   │ │
│ │ ...            │  ... │ ...  │  ...   │  ... │   │ │
│ └──────────────────────────────────────────────────┘ │
│ ... (2024, 2023, 2022, 2021, 2020 순서대로)          │
│                                                      │
│ [특정 연도 선택 시]                                   │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 2026년 사업 현황                                  │ │  ← 연도 헤더
│ ├────────────────┬──────┬──────┬────────┬──────┤   │ │
│ │ 사업명         │고객사│ 기간 │매출액  │이익률│   │ │
│ │ ...            │  ... │ ...  │  ...   │  ... │   │ │
│ │ **합계 (6건)** │      │      │**50.3억**│**0.6%** │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 4. 그래프 상세 설계

### 데이터 소스
노션 `연도별 매출 합계 요약` 테이블에서 추출

```json
[
  {"year": "2020", "revenue": 1110598283, "profit": 50511670, "rate": "4.5%"},
  {"year": "2021", "revenue": 2736597002, "profit": 119406968, "rate": "4.4%"},
  {"year": "2022", "revenue": 4023400236, "profit": 369058985, "rate": "9.2%"},
  {"year": "2023", "revenue": 5828688339, "profit": -109641969, "rate": "-1.9%"},
  {"year": "2024", "revenue": 5413459545, "profit": 144976093, "rate": "2.7%"},
  {"year": "2025", "revenue": 4029673567, "profit": -3203514, "rate": "-0.1%"},
  {"year": "2026", "revenue": 5030248818, "profit": 32339855, "rate": "0.6%"}
]
```

### 차트 타입
```
매출액  → 막대 그래프 (파란색 #4A9EE0)
영업이익 → 라인 그래프 + 점 (초록/빨강 — 양수/음수 구분)
Y축 단위: 억원
X축: 연도 (2020~2026)
```

### 토글 동작
```javascript
// 그래프 보기 버튼 클릭 시
// → 그래프 영역 슬라이드 다운 (CSS transition)
// → 버튼 텍스트: "📊 그래프 보기" ↔ "📊 그래프 닫기"

document.getElementById("btn-chart").addEventListener("click", () => {
    const chartArea = document.getElementById("chart-area");
    chartArea.classList.toggle("chart-open");
    // chart-open 클래스: max-height: 400px (transition 0.3s)
});
```

---

## 5. API 엔드포인트

```
GET /api/history              ← 전체 데이터 (모든 연도)
GET /api/history?refresh=1   ← 캐시 무시

응답:
{
  "success": true,
  "data": {
    "summary": [              ← 연도별 합계 요약 (그래프용)
      {
        "year": "2026",
        "count": "6건",
        "revenue": 5030248818,
        "profit": 32339855,
        "rate": "0.6%",
        "yoy": "+24.8%",
        "vs_plan": "+9,333,572"
      },
      ...
    ],
    "years": [                ← 연도별 상세 사업 목록
      {
        "year": "2026",
        "projects": [
          {
            "name": "2026~2027년 공직자통합메일 운영...",
            "client": "문화체육관광부 정책포털과",
            "period": "1/1~12/31(12M)",
            "revenue_actual": 318767000,
            "profit_actual": 1330486,
            "rate_actual": "0.4%",
            "revenue_plan": 318767000,
            "profit_plan": 1330486,
            "rate_plan": "0.4%",
            "vs_plan": "0",
            "is_total": false
          },
          ...
          {
            "name": "합계 (6건)",
            "revenue_actual": 5030248818,
            "profit_actual": 32339855,
            "rate_actual": "0.6%",
            "is_total": true   ← 합계 행 구분
          }
        ]
      },
      ...
    ]
  }
}
```

---

## 6. 파싱 로직 (app.py에 추가할 코드)

```python
HISTORY_PAGE_ID = "363963cc-8170-81de-a362-d9294436af0b"
_history_cache = {"top_blocks": None, "timestamp": 0}


def get_history_data(force_refresh: bool = False) -> dict:
    """세종사업히스토리 전체 데이터를 반환합니다."""
    global _history_cache
    now = time.time()

    # ── 캐시 확인
    if (not force_refresh
            and _history_cache["top_blocks"] is not None
            and now - _history_cache["timestamp"] < CACHE_TTL):
        top_blocks = _history_cache["top_blocks"]
    else:
        top_blocks = fetch_block_children(HISTORY_PAGE_ID)
        _history_cache = {"top_blocks": top_blocks, "timestamp": now}

    summary = []    # 연도별 합계 요약 (파란 테이블)
    years   = []    # 연도별 상세 사업 목록

    cur_year       = None
    cur_projects   = []
    is_summary_section = False

    for block in top_blocks:
        btype = block.get("type", "")
        text  = get_block_text(block).strip()

        # ── 연도 heading_2 감지
        if btype == "heading_2":
            # 이전 연도 저장
            if cur_year and cur_projects:
                years.append({"year": cur_year, "projects": cur_projects})

            if "연도별 매출 합계 요약" in text:
                # 파란 요약 섹션
                is_summary_section = True
                cur_year     = None
                cur_projects = []
            elif "년" in text:
                # 일반 연도 섹션 (2026년, 2025년 ...)
                is_summary_section = False
                cur_year     = text.replace("년", "").strip()
                cur_projects = []

        # ── 테이블 처리
        elif btype == "table":
            rows = fetch_table_rows(block)
            if not rows:
                continue

            if is_summary_section:
                # 연도별 합계 요약 테이블
                # 헤더: [년도, 사업 수, 매출액(확정), 영업이익(확정), 영업이익률, 전년대비 증감, 계획대비실적 합계]
                for row in rows[1:]:  # 헤더 제외
                    if len(row) >= 4 and row[0]:
                        summary.append({
                            "year":    row[0].replace("년", "").strip(),
                            "count":   row[1] if len(row) > 1 else "",
                            "revenue": parse_number(row[2]) if len(row) > 2 else 0,
                            "profit":  parse_number(row[3]) if len(row) > 3 else 0,
                            "rate":    row[4] if len(row) > 4 else "",
                            "yoy":     row[5] if len(row) > 5 else "",
                            "vs_plan": row[6] if len(row) > 6 else "",
                        })
            else:
                # 연도별 사업 상세 테이블
                # 헤더: [사업명, 고객사, 기간, 매출액(확정), 영업이익(확정), 이익률, ...]
                for row in rows[1:]:  # 헤더 제외
                    if len(row) >= 4 and row[0]:
                        is_total = "합계" in row[0]
                        cur_projects.append({
                            "name":           row[0],
                            "client":         row[1] if len(row) > 1 else "",
                            "period":         row[2] if len(row) > 2 else "",
                            "revenue_actual": parse_number(row[3]) if len(row) > 3 else 0,
                            "profit_actual":  parse_number(row[4]) if len(row) > 4 else 0,
                            "rate_actual":    row[5] if len(row) > 5 else "",
                            "revenue_plan":   parse_number(row[6]) if len(row) > 6 else 0,
                            "profit_plan":    parse_number(row[7]) if len(row) > 7 else 0,
                            "rate_plan":      row[8] if len(row) > 8 else "",
                            "vs_plan":        row[9] if len(row) > 9 else "",
                            "is_total":       is_total,
                        })

    # 마지막 연도 저장
    if cur_year and cur_projects:
        years.append({"year": cur_year, "projects": cur_projects})

    # 최신 연도가 앞에 오도록 정렬
    years.sort(key=lambda x: x["year"], reverse=True)

    return {
        "success": True,
        "data": {
            "summary": summary,
            "years":   years,
        }
    }


def parse_number(text: str) -> int:
    """
    숫자 문자열에서 정수를 추출합니다.
    예: "5,030,248,818" → 5030248818
        "-109,641,969"  → -109641969
        "-"             → 0
        ""              → 0
    """
    import re
    if not text or text.strip() in ["-", ""]:
        return 0
    # 콤마, 공백 제거 후 숫자와 마이너스 기호만 추출
    cleaned = re.sub(r"[^\d\-]", "", text.strip())
    try:
        return int(cleaned)
    except:
        return 0
```

---

## 7. main.js 렌더링 로직

```javascript
// ── 전역 데이터 저장
let _historyYears = [];

// ── 히스토리 데이터 로딩
async function loadHistory(refresh = false) {
    const url = `/api/history${refresh ? "?refresh=1" : ""}`;
    const res  = await fetch(url);
    const result = await res.json();
    if (!result.success) return;

    const { summary, years } = result.data;
    _historyYears = years;  // 전역 저장

    renderSummaryTable(summary);   // 연도별 합계 요약 테이블
    renderYearTabs(years);         // 연도 선택 탭 (전체 포함)
    renderChart(summary);          // 그래프 (숨겨진 상태로 준비)

    // 기본: 최신 연도 선택
    renderHistoryDetail("latest");
}

// ── 그래프 토글
document.getElementById("btn-chart").addEventListener("click", () => {
    const area = document.getElementById("chart-area");
    const btn  = document.getElementById("btn-chart");
    const isOpen = area.classList.toggle("chart-open");
    btn.textContent = isOpen ? "📊 그래프 닫기" : "📊 그래프 보기";
    if (isOpen) drawChart();
});

// ── 연도 탭 렌더링 (전체 탭 포함)
function renderYearTabs(years) {
    const tabs = document.getElementById("year-tabs");

    // 전체 탭 + 각 연도 탭
    const allBtn = `<button class="year-tab" onclick="selectHistoryTab('all')">전체</button>`;
    const yearBtns = years.map(y =>
        `<button class="year-tab" onclick="selectHistoryTab('${y.year}')">${y.year}</button>`
    ).join("");

    tabs.innerHTML = allBtn + yearBtns;

    // 기본: 최신 연도 활성
    if (years.length > 0) {
        const firstBtn = tabs.querySelector(`button:nth-child(2)`);
        if (firstBtn) firstBtn.classList.add("active");
    }
}

// ── 탭 선택
function selectHistoryTab(target) {
    // 모든 탭 비활성
    document.querySelectorAll(".year-tab").forEach(b => b.classList.remove("active"));
    // 선택 탭 활성
    event.target.classList.add("active");
    renderHistoryDetail(target);
}

// ── 상세 테이블 렌더링
// target: "all" → 전체, "latest" → 최신 연도, "2026" 등 → 해당 연도
function renderHistoryDetail(target) {
    const container = document.getElementById("history-detail");

    let targetYears;
    if (target === "all") {
        // 전체: 2026 → 2020 순서
        targetYears = _historyYears;
    } else if (target === "latest") {
        // 기본: 최신 연도 1개
        targetYears = _historyYears.slice(0, 1);
    } else {
        // 특정 연도
        targetYears = _historyYears.filter(y => y.year === target);
    }

    // 각 연도별 섹션 렌더링
    container.innerHTML = targetYears.map(yearData => `
        <div class="year-section">
            <div class="year-section-title">${yearData.year}년 사업 현황</div>
            <div class="table-container">
                <table class="projects-table history-table">
                    <colgroup>
                        <col style="width:30%">
                        <col style="width:16%">
                        <col style="width:12%">
                        <col style="width:12%">
                        <col style="width:12%">
                        <col style="width:8%">
                        <col style="width:10%">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>사업명</th>
                            <th>고객사</th>
                            <th>기간</th>
                            <th>매출액(확정)</th>
                            <th>영업이익(확정)</th>
                            <th>이익률</th>
                            <th>계획대비실적</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${yearData.projects.map(p => `
                            <tr class="${p.is_total ? "row-total" : ""}">
                                <td>${p.name}</td>
                                <td class="td-muted">${p.client}</td>
                                <td class="td-muted">${p.period}</td>
                                <td class="td-money">${formatRevenue(p.revenue_actual)}</td>
                                <td class="td-money ${p.profit_actual >= 0 ? "profit-pos" : "profit-neg"}">
                                    ${formatRevenue(p.profit_actual)}
                                </td>
                                <td class="${p.profit_actual >= 0 ? "profit-pos" : "profit-neg"}">
                                    ${p.rate_actual}
                                </td>
                                <td class="td-muted">${p.vs_plan || "-"}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `).join("");
}

// ── Chart.js 그래프
function drawChart() {
    // summary 데이터로 막대+라인 복합 차트 생성
    // 막대: 매출액(확정) - 파란색 #4A9EE0
    // 라인: 영업이익(확정) - 양수 초록 / 음수 빨강
}
```

---

## 8. style.css 추가 스타일

```css
/* 그래프 토글 영역 */
.chart-area {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.chart-area.chart-open {
    max-height: 400px;
}

/* 연도 탭 */
.year-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.year-tab {
    padding: 4px 12px;
    font-size: 11px;
    border: 0.5px solid #D1D5DB;
    border-radius: 99px;
    background: #fff;
    color: #475569;
    cursor: pointer;
}

.year-tab.active {
    background: #185FA5;
    color: #fff;
    border-color: #185FA5;
}

/* 연도 섹션 헤더 */
.year-section {
    margin-bottom: 20px;
}

.year-section-title {
    font-size: 12px;
    font-weight: 500;
    color: #0F172A;
    padding: 8px 0 6px;
    border-bottom: 1.5px solid #185FA5;
    margin-bottom: 8px;
}

/* 합계 행 */
.row-total td {
    font-weight: 500;
    background: #F8FAFC;
    border-top: 1px solid #D1D5DB;
}

/* 이익 색상 */
.profit-pos { color: #3B6D11; }
.profit-neg { color: #A32D2D; }
```

---

## 9. 아테나 코드 프롬프트

```
@app.py @static/main.js @static/style.css @templates/index.html
@docs/UI_COMPONENTS.md

Phase 5: 세종사업히스토리 탭을 추가해줘.

## 추가할 상수 (app.py)
HISTORY_PAGE_ID = "363963cc-8170-81de-a362-d9294436af0b"
_history_cache = {"top_blocks": None, "timestamp": 0}

## 추가할 함수 (app.py)
- parse_number(text) — 문자열에서 정수 추출
- get_history_data(force_refresh) — 전체 데이터 파싱

## 추가할 API (app.py)
GET /api/history?refresh=0

## index.html에 추가
- 사이드바에 "세종사업히스토리" 메뉴 (data-tab="history")
- tab-history 탭 콘텐츠:
  - 상단: 그래프 보기 버튼 + 새로고침 버튼
  - 그래프 영역 (id="chart-area", 기본 숨김)
  - 연도별 합계 요약 테이블 (id="summary-table")
  - 연도 탭 버튼들 (id="year-tabs")
  - 선택 연도 상세 테이블 (id="history-tbody")

## main.js에 추가
- loadHistory(refresh) 함수
- renderSummaryTable(summary) 함수
- renderYearTabs(years) 함수
- renderYearDetail(yearData) 함수
- drawChart(summary) 함수 — Chart.js 사용
  - 막대: 매출액, 라인: 영업이익
  - Y축 단위: 억원

## style.css에 추가
- .chart-area, .chart-area.chart-open (토글 애니메이션)
- .year-tab, .year-tab.active
- .row-total, .profit-pos, .profit-neg

## 중요 주의사항
- fetch_table_rows() 함수 이미 있음 — 새로 만들지 마
- fetch_block_children(), get_block_text() 이미 있음
- CACHE_TTL 이미 있음
- Chart.js: CDN 추가 필요
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
- Phase 1, 2 코드 절대 건드리지 마
- 한국어 주석 포함
```

---

## 10. 완료 기준

```
✅ 사이드바에 "세종사업히스토리" 메뉴 표시
✅ 탭 클릭 시 화면 전환
✅ 연도별 합계 요약 테이블 표시 (7개 연도)
✅ "그래프 보기" 버튼 클릭 시 차트 토글
✅ 매출액 막대 + 영업이익 라인 차트 표시
✅ 연도 탭 클릭 시 해당 연도 사업 상세 표시
✅ 합계 행 별도 스타일 (굵게 + 배경)
✅ 영업이익 양수(초록) / 음수(빨강) 색상 구분
✅ 새로고침 버튼 동작
```

---

*작성: 익스 + Claude | 2026.05.17 | AX Sejong Command Phase 5*
