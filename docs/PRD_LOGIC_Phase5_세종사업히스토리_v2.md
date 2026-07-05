# PRD_LOGIC_Phase5_세종사업히스토리_v2.md
> 작성: 익스 + Claude | 2026.06.13
> Phase 5: 세종사업히스토리 탭 (v2 — 노션 테이블 구조 변경 완료)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|---------|
| v1 | 2026.05.17 | 최초 작성 |
| v2 | 2026.06.13 | 노션 테이블 전면 재작성 (엑셀 기준), 컬럼 구조 변경, 그래프 3분할 |

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 탭 이름 | 세종사업히스토리 |
| 노션 페이지 | [AX]세종사업히스토리_연도별 |
| 페이지 ID | 363963cc-8170-81de-a362-d9294436af0b |
| 목적 | 연도별 사업 이력 및 매출/원가/이익 현황 조회 |
| 데이터 소스 | 노션 원본 그대로 표시 (요약 없음) |

---

## 2. 노션 테이블 구조 (v2 — 업데이트 완료)

### 2-1. 연도별 사업 현황 테이블 (각 연도 heading_2 아래)

**컬럼 (11개):**

| 컬럼명 | 설명 |
|--------|------|
| 사업명 | 프로젝트 전체 이름 |
| 고객사 | 발주처 |
| 기간 | 예: 1/1~12/31(12M) |
| 매출액 | 최종 확정 매출액 |
| 매출원가 | 내부인건비 + 외부인건비 + 외부SW + 제경비/기타 합계 |
| 매출이익 | 매출액 - 매출원가 |
| 매출이익률 | 매출이익 / 매출액 (%) |
| 공통비 | 전사 공통비 배분액 |
| 영업이익 | 매출이익 - 공통비 |
| 영업이익률 | 영업이익 / 매출액 (%) |
| 계획대비실적 | 최종 영업이익 - 최초계획 영업이익 |

**합계 행:** 사업명에 "합계 (N건)" bold 텍스트, 나머지 컬럼도 bold

### 2-2. 연도별 매출 합계 요약 테이블 (blue_bg heading_2 아래)

**컬럼 (10개):**

| 컬럼명 | 설명 |
|--------|------|
| 연도 | 2020년 ~ 2026년 |
| 사업수 | N건 |
| 매출액 | 연도 합계 |
| 매출원가 | 연도 합계 |
| 매출이익 | 연도 합계 |
| 매출이익률 | 매출이익 / 매출액 (%) |
| 공통비 | 연도 합계 |
| 영업이익 | 연도 합계 (음수 가능) |
| 영업이익률 | 영업이익 / 매출액 (%) |
| 전년대비실적 | 당해 매출액 - 전년 매출액 |

---

## 3. 노션 페이지 구조

```
📊 [AX]세종사업히스토리_연도별

## 2026년  {color="yellow_bg"}
  table (header-row, 11컬럼): 사업명 ~ 계획대비실적
  ... 사업별 행 + 합계 행 ...

## 2025년  {color="yellow_bg"}
  table ...

## 2024년 ~ ## 2020년
  table ...

## 연도별 매출 합계 요약  {color="blue_bg"}
  table (header-row, 10컬럼): 연도 ~ 전년대비실적
  2020년 ~ 2026년 행들
```

---

## 4. API 엔드포인트

```
GET /api/history              ← 전체 데이터
GET /api/history?refresh=1   ← 캐시 무시

응답:
{
  "success": true,
  "data": {
    "summary": [
      {
        "year": "2026",
        "count": "6건",
        "revenue": 5057248818,
        "cost": 4238292193,
        "gross_profit": 818956626,
        "gross_rate": "16.2%",
        "overhead": 793624204,
        "op_profit": 25332422,
        "op_rate": "0.5%",
        "yoy": 1030125743
      }
    ],
    "years": [
      {
        "year": "2026",
        "projects": [
          {
            "name": "2026년 안전신문고 시스템 유지관리 사업",
            "client": "행정안전부 안전개선과",
            "period": "1/1~12/31(12M)",
            "type": "운영",
            "revenue": 1522800000,
            "cost": 1173097219,
            "gross_profit": 349702781,
            "gross_rate": "23.0%",
            "overhead": 275283878,
            "op_profit": 74418903,
            "op_rate": "4.9%",
            "vs_plan": 7486719,
            "is_total": false
          },
          {
            "name": "합계 (6건)",
            "revenue": 5057248818,
            "cost": 4238292193,
            "gross_profit": 818956626,
            "gross_rate": "16.2%",
            "overhead": 793624204,
            "op_profit": 25332422,
            "op_rate": "0.5%",
            "vs_plan": 2216321,
            "is_total": true
          }
        ],
        "chart": {
          "total": 5057248818,
          "ops": 3244849818,
          "dev": 1812399000
        }
      }
    ]
  }
}
```

---

## 5. 파싱 로직 (app.py)

```python
HISTORY_PAGE_ID = "363963cc-8170-81de-a362-d9294436af0b"
_history_cache = {"top_blocks": None, "timestamp": 0}

OPS_KEYWORDS = ["운영", "유지관리", "유지보수", "유지운영"]
DEV_KEYWORDS = ["고도화", "기능보강", "구축", "개발", "기술개발",
                "컨설팅", "용역", "연구", "타당성"]

def classify_project(name: str) -> str:
    for kw in OPS_KEYWORDS:
        if kw in name:
            return "운영"
    for kw in DEV_KEYWORDS:
        if kw in name:
            return "개발"
    return "운영"


def parse_history_row(row: list) -> dict:
    """
    11컬럼 행 파싱:
    [0]사업명, [1]고객사, [2]기간, [3]매출액, [4]매출원가,
    [5]매출이익, [6]매출이익률, [7]공통비, [8]영업이익,
    [9]영업이익률, [10]계획대비실적
    """
    name = row[0].strip() if row else ""
    is_total = "합계" in name

    return {
        "name":        name,
        "client":      row[1] if len(row) > 1 else "",
        "period":      row[2] if len(row) > 2 else "",
        "type":        classify_project(name) if not is_total else "",
        "revenue":     parse_number(row[3])  if len(row) > 3  else 0,
        "cost":        parse_number(row[4])  if len(row) > 4  else 0,
        "gross_profit":parse_number(row[5])  if len(row) > 5  else 0,
        "gross_rate":  row[6]                if len(row) > 6  else "",
        "overhead":    parse_number(row[7])  if len(row) > 7  else 0,
        "op_profit":   parse_number(row[8])  if len(row) > 8  else 0,
        "op_rate":     row[9]                if len(row) > 9  else "",
        "vs_plan":     parse_number(row[10]) if len(row) > 10 else 0,
        "is_total":    is_total,
    }


def parse_summary_row(row: list) -> dict:
    """
    10컬럼 행 파싱:
    [0]연도, [1]사업수, [2]매출액, [3]매출원가, [4]매출이익,
    [5]매출이익률, [6]공통비, [7]영업이익, [8]영업이익률,
    [9]전년대비실적
    """
    year = row[0].replace("년", "").strip() if row else ""
    if not year.isdigit():
        return None

    return {
        "year":        year,
        "count":       row[1]                if len(row) > 1  else "",
        "revenue":     parse_number(row[2])  if len(row) > 2  else 0,
        "cost":        parse_number(row[3])  if len(row) > 3  else 0,
        "gross_profit":parse_number(row[4])  if len(row) > 4  else 0,
        "gross_rate":  row[5]                if len(row) > 5  else "",
        "overhead":    parse_number(row[6])  if len(row) > 6  else 0,
        "op_profit":   parse_number(row[7])  if len(row) > 7  else 0,
        "op_rate":     row[8]                if len(row) > 8  else "",
        "yoy":         parse_number(row[9])  if len(row) > 9  else 0,
    }


def build_chart_data(projects: list) -> dict:
    """총매출 / 운영매출 / 개발매출 집계"""
    total = ops = dev = 0
    for p in projects:
        if p.get("is_total"):
            continue
        rev = p.get("revenue", 0)
        total += rev
        if p.get("type") == "운영":
            ops += rev
        else:
            dev += rev
    return {"total": total, "ops": ops, "dev": dev}


def get_history_data(force_refresh: bool = False) -> dict:
    """세종사업히스토리 전체 데이터 반환"""
    global _history_cache
    now = time.time()

    if (not force_refresh
            and _history_cache["top_blocks"] is not None
            and now - _history_cache["timestamp"] < CACHE_TTL):
        top_blocks = _history_cache["top_blocks"]
    else:
        top_blocks = fetch_block_children(HISTORY_PAGE_ID)
        _history_cache = {"top_blocks": top_blocks, "timestamp": now}

    summary = []
    years   = []
    cur_year     = None
    cur_projects = []
    is_summary   = False

    for block in top_blocks:
        btype = block.get("type", "")
        text  = get_block_text(block).strip()

        if btype == "heading_2":
            if cur_year and cur_projects:
                years.append({
                    "year": cur_year,
                    "projects": cur_projects,
                    "chart": build_chart_data(cur_projects)
                })
            if "연도별 매출 합계 요약" in text:
                is_summary = True
                cur_year = None
                cur_projects = []
            elif "년" in text:
                is_summary = False
                cur_year = text.replace("년", "").strip()
                cur_projects = []

        elif btype == "table":
            rows = fetch_table_rows(block)
            if not rows:
                continue
            if is_summary:
                for row in rows[1:]:  # 헤더 제외
                    parsed = parse_summary_row(row)
                    if parsed:
                        summary.append(parsed)
            elif cur_year:
                for row in rows[1:]:  # 헤더 제외
                    if row and row[0]:
                        cur_projects.append(parse_history_row(row))

    if cur_year and cur_projects:
        years.append({
            "year": cur_year,
            "projects": cur_projects,
            "chart": build_chart_data(cur_projects)
        })

    return {"success": True, "data": {"summary": summary, "years": years}}
```

---

## 6. 화면 구성

```
┌──────────────────────────────────────────────────────────────┐
│  세종사업히스토리         [📊 그래프 보기]   [↻ 새로고침]    │
├──────────────────────────────────────────────────────────────┤
│  ▼ 그래프 영역 (토글, 기본 닫힘)                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  연도별 매출 (총매출 / 운영 / 개발 막대 그래프)         │  │
│  │  ■ 총매출  ■ 운영매출  ■ 개발매출                      │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  연도별 매출 합계 요약                                        │
│  연도│사업수│매출액│매출원가│매출이익│이익률│공통비│영업이익│이익률│전년대비│
├──────────────────────────────────────────────────────────────┤
│  연도 선택: [전체] [2026] [2025] ... [2020]                   │
├──────────────────────────────────────────────────────────────┤
│  2026년 사업 현황                                             │
│  사업명│고객사│기간│매출액│매출원가│매출이익│이익률│공통비│영업이익│이익률│계획대비│
│  ... 사업별 행 ...                                            │
│  **합계(6건)** ...                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. main.js 렌더링

```javascript
// ── 연도별 합계 요약 테이블 (10컬럼)
function renderSummaryTable(summary) {
    const tbody = document.getElementById("summary-tbody");
    tbody.innerHTML = summary.map(s => `
        <tr>
            <td>${s.year}년</td>
            <td>${s.count}</td>
            <td class="td-money">${formatRevenue(s.revenue)}</td>
            <td class="td-money">${formatRevenue(s.cost)}</td>
            <td class="td-money ${s.gross_profit >= 0 ? "profit-pos" : "profit-neg"}">
                ${formatRevenue(s.gross_profit)}</td>
            <td class="${s.gross_profit >= 0 ? "profit-pos" : "profit-neg"}">${s.gross_rate}</td>
            <td class="td-money">${formatRevenue(s.overhead)}</td>
            <td class="td-money ${s.op_profit >= 0 ? "profit-pos" : "profit-neg"}">
                ${formatRevenue(s.op_profit)}</td>
            <td class="${s.op_profit >= 0 ? "profit-pos" : "profit-neg"}">${s.op_rate}</td>
            <td class="td-money ${s.yoy >= 0 ? "profit-pos" : "profit-neg"}">
                ${s.yoy === 0 ? "-" : (s.yoy > 0 ? "+" : "") + formatRevenue(s.yoy)}</td>
        </tr>
    `).join("");
}

// ── 연도별 사업 현황 테이블 (11컬럼)
function renderHistoryRow(p) {
    return `
        <tr class="${p.is_total ? "row-total" : ""}">
            <td>${p.name}</td>
            <td class="td-muted">${p.client || ""}</td>
            <td class="td-muted">${p.period || ""}</td>
            <td class="td-money">${formatRevenue(p.revenue)}</td>
            <td class="td-money">${formatRevenue(p.cost)}</td>
            <td class="td-money ${p.gross_profit >= 0 ? "profit-pos" : "profit-neg"}">
                ${formatRevenue(p.gross_profit)}</td>
            <td class="${p.gross_profit >= 0 ? "profit-pos" : "profit-neg"}">${p.gross_rate || ""}</td>
            <td class="td-money">${formatRevenue(p.overhead)}</td>
            <td class="td-money ${p.op_profit >= 0 ? "profit-pos" : "profit-neg"}">
                ${formatRevenue(p.op_profit)}</td>
            <td class="${p.op_profit >= 0 ? "profit-pos" : "profit-neg"}">${p.op_rate || ""}</td>
            <td class="td-money ${p.vs_plan >= 0 ? "profit-pos" : "profit-neg"}">
                ${p.vs_plan === 0 ? "0" : (p.vs_plan > 0 ? "+" : "") + formatRevenue(p.vs_plan)}</td>
        </tr>
    `;
}

// ── 그래프: 총매출 / 운영 / 개발 3분할
function drawChart(years) {
    const labels = years.map(y => y.year);
    const ctx = document.getElementById("history-chart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                { label: "총매출",  data: years.map(y => y.chart.total), backgroundColor: "rgba(74,158,224,0.8)" },
                { label: "운영매출", data: years.map(y => y.chart.ops),   backgroundColor: "rgba(124,182,82,0.8)" },
                { label: "개발매출", data: years.map(y => y.chart.dev),   backgroundColor: "rgba(245,158,11,0.8)" }
            ]
        },
        options: {
            scales: { y: { ticks: { callback: v => (v/100_000_000).toFixed(0) + "억" } } },
            plugins: { tooltip: { callbacks: { label: ctx =>
                ctx.dataset.label + ": " + (ctx.raw/100_000_000).toFixed(1) + "억" } } }
        }
    });
}
```

---

## 8. HTML 테이블 헤더 (index.html)

```html
<!-- 연도별 합계 요약 (10컬럼) -->
<colgroup>
    <col style="width:7%">   <!-- 연도 -->
    <col style="width:5%">   <!-- 사업수 -->
    <col style="width:10%">  <!-- 매출액 -->
    <col style="width:10%">  <!-- 매출원가 -->
    <col style="width:10%">  <!-- 매출이익 -->
    <col style="width:6%">   <!-- 매출이익률 -->
    <col style="width:9%">   <!-- 공통비 -->
    <col style="width:10%">  <!-- 영업이익 -->
    <col style="width:6%">   <!-- 영업이익률 -->
    <col style="width:10%">  <!-- 전년대비 -->
</colgroup>
<thead>
    <tr>
        <th>연도</th><th>사업수</th><th>매출액</th><th>매출원가</th>
        <th>매출이익</th><th>매출이익률</th><th>공통비</th>
        <th>영업이익</th><th>영업이익률</th><th>전년대비실적</th>
    </tr>
</thead>

<!-- 연도별 사업 현황 (11컬럼) -->
<colgroup>
    <col style="width:20%">  <!-- 사업명 -->
    <col style="width:10%">  <!-- 고객사 -->
    <col style="width:7%">   <!-- 기간 -->
    <col style="width:8%">   <!-- 매출액 -->
    <col style="width:8%">   <!-- 매출원가 -->
    <col style="width:8%">   <!-- 매출이익 -->
    <col style="width:5%">   <!-- 매출이익률 -->
    <col style="width:7%">   <!-- 공통비 -->
    <col style="width:8%">   <!-- 영업이익 -->
    <col style="width:5%">   <!-- 영업이익률 -->
    <col style="width:8%">   <!-- 계획대비 -->
</colgroup>
<thead>
    <tr>
        <th>사업명</th><th>고객사</th><th>기간</th>
        <th>매출액</th><th>매출원가</th><th>매출이익</th><th>매출이익률</th>
        <th>공통비</th><th>영업이익</th><th>영업이익률</th><th>계획대비실적</th>
    </tr>
</thead>
```

---

## 9. 클로드 코드 프롬프트

```
현재 app.py, templates/index.html, static/main.js, static/style.css 파일 읽고
Phase 5 세종사업히스토리 탭을 v2로 업데이트해줘.

docs/PRD_LOGIC_Phase5_세종사업히스토리_v2.md 참고.

변경 내용:
1. app.py
   - parse_history_row(row): 11컬럼 파싱
     [0]사업명 [1]고객사 [2]기간 [3]매출액 [4]매출원가 [5]매출이익
     [6]매출이익률 [7]공통비 [8]영업이익 [9]영업이익률 [10]계획대비실적
   - parse_summary_row(row): 10컬럼 파싱
     [0]연도 [1]사업수 [2]매출액 [3]매출원가 [4]매출이익 [5]매출이익률
     [6]공통비 [7]영업이익 [8]영업이익률 [9]전년대비실적
   - build_chart_data(projects): 총매출/운영/개발 집계
   - classify_project(name): 사업명으로 운영/개발 분류

2. index.html
   - 요약 테이블 헤더: 10컬럼
   - 사업현황 테이블 헤더: 11컬럼

3. main.js
   - renderSummaryTable: 10컬럼 렌더링
   - renderHistoryRow: 11컬럼 렌더링
   - drawChart: 총매출/운영/개발 3분할 막대 (Chart.js)

반드시 지켜야 할 것:
- Phase 1~4, 6~9 코드 절대 건드리지 마
- fetch_table_rows, get_block_text, CACHE_TTL 재사용
- Chart.js CDN 없으면 추가
- 한국어 주석 포함
```

---

## 10. 아테나 코드 프롬프트

```
@app.py @templates/index.html @static/main.js @static/style.css
@docs/PRD_LOGIC_Phase5_세종사업히스토리_v2.md

위 파일 읽고 Phase 5 세종사업히스토리 탭을 v2로 업데이트해줘.

변경 내용:
1. app.py — parse_history_row(11컬럼), parse_summary_row(10컬럼),
             build_chart_data, classify_project 교체/추가

2. index.html — 요약 테이블(10컬럼), 사업현황 테이블(11컬럼) 헤더

3. main.js — renderSummaryTable(10컬럼), renderHistoryRow(11컬럼),
              drawChart(총매출/운영/개발 3분할)

반드시 지켜야 할 것:
- Phase 1~4, 6~9 코드 절대 건드리지 마
- fetch_table_rows, get_block_text, CACHE_TTL 재사용
- 한국어 주석 포함
```

---

## 11. 완료 기준

```
✅ 요약 테이블 10컬럼 표시 (매출원가·매출이익·공통비 포함)
✅ 사업현황 테이블 11컬럼 표시 (매출원가·매출이익률·공통비·영업이익률 포함)
✅ 그래프: 총매출/운영매출/개발매출 3개 막대 그룹
✅ 운영/개발 사업 자동 분류 정상 동작
✅ 영업이익/매출이익 양수(초록)/음수(빨강) 색상 구분
✅ 합계 행 별도 스타일 (굵게+배경)
✅ 연도 탭 선택 정상 동작
✅ 새로고침 버튼 정상 동작
```

---

*작성: 익스 + Claude | 2026.06.13 | AX Sejong Command Phase 5 v2*
