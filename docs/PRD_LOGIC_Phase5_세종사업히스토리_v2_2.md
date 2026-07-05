# PRD_LOGIC_Phase5_세종사업히스토리_v2.2.md
> 작성: 익스 + Claude | 2026.06.17
> 수정: 2026.06.17 v2.2 — 노션DB 전환, 계 행 추가, 전년대비 포맷 변경, 그래프 운영실적 강조

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|---------|
| v1 | 2026.05.17 | 최초 작성 |
| v2 | 2026.06.13 | 노션 테이블 전면 재작성 (엑셀 기준), 컬럼 구조 변경, 그래프 3분할 |
| v2.1 | 2026.06.14 | 사업구분 컬럼 첫째로 추가 (12컬럼), 파싱 인덱스 수정, 제외 처리, 그래프 운영/운영외 변경 |
| **v2.2** | **2026.06.17** | **노션 DB 전환 (마크다운 테이블 → 노션 DB API), 계 행 추가, 계획대비실적 천단위 콤마, 전년대비 포맷 변경, 그래프 운영실적 강조 (스택+꺾은선)** |

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 탭 이름 | 세종사업히스토리 |
| 노션 데이터 소스 | **[AX]세종사업히스토리_v2 (신규 DB)** |
| 기존 페이지 | [AX]세종사업히스토리_연도별 (363963cc-8170-81de-a362-d9294436af0b) — **수정 금지** |

---

## 2. 노션 DB 변경사항 (v2.2 핵심)

### 2-1. 신규 DB 생성

기존 마크다운 테이블 페이지, 기존 DB 모두 **건드리지 말 것**.
신규 DB를 새로 생성한다.

**DB명:** `[AX]세종사업히스토리_v2`
**위치:** 기존과 동일한 부모 페이지 (`📁 [WORK] 업무·자동화`)

### 2-2. DB 컬럼 구성 (17개)

| 컬럼명 | 노션 타입 | 비고 |
|--------|---------|------|
| 사업명 | Title | |
| 년도 | Select | 2020년~2026년 |
| 사업구분 | Select | 운영 / 개발 / 과제 / 운영_조폐 / 기타 / **제외** |
| 고객사 | Text | |
| 기간 | Text | |
| 매출액 | Number | 원 단위, 확정값 |
| 매출원가 | Number | 원 단위 |
| 매출이익 | Number | 원 단위 |
| 매출이익률 | Number | 소수점 (예: 0.12) |
| 공통비 | Number | 원 단위 |
| 영업이익 | Number | 원 단위, 확정값 |
| 영업이익률 | Number | 소수점 |
| 매출액_계획 | Number | 최초계획 매출액 |
| 매출원가_계획 | Number | 최초계획 매출원가 |
| 영업이익_계획 | Number | 최초계획 영업이익 |
| 계획대비실적 | Number | 영업이익 - 영업이익_계획 |
| 비고 | Text | |

### 2-3. 사업구분 값 정의 (v2.1과 동일)

| 값 | 의미 | 그래프 분류 |
|----|------|-----------|
| 운영 | 일반 SI운영 사업 | 운영매출 |
| 개발 | 고도화/기능보강/구축 | 운영외매출 |
| 과제 | 연구과제/컨설팅 | 운영외매출 |
| 운영_조폐 | KOMSCO 등 특수 운영 | 운영외매출 |
| 기타 | 기타 | 운영외매출 |
| **제외** | 집계/표시 제외 항목 | 제외 (표시 안 함) |

### 2-4. 데이터 현황 (엑셀 기준)

| 연도 | 사업 수 | 운영 매출 | 운영외 매출 | 합계 |
|------|---------|---------|-----------|------|
| 2020 | 7건 | 7.9억 | 3.2억 | 11.1억 |
| 2021 | 6건 | 22.2억 | 5.0억 | 27.2억 |
| 2022 | 6건 | 30.8억 | 12.2억 | 43.0억 |
| 2023 | 8건 | 32.5억 | 25.8억 | 58.3억 |
| 2024 | 8건 | 37.5억 | 11.2억 | 48.7억 |
| 2025 | 8건 | 29.0억 | 16.0억 | 45.0억 |
| 2026 | 6건 | 42.5억 | 0.0억 | 42.5억 |

> **2024/2025 철도 분리 주의:**
> 한국철도공사 모바일오피스 시스템 고도화 → 2024년 30% / 2025년 70% 분리

---

## 3. 파싱 로직 (app.py 수정)

### 3-1. 노션 DB API 호출로 전환

```python
# 기존: 마크다운 테이블 파싱
# 변경: 노션 DB API 호출

HISTORY_DB_ID = "신규생성된_DB_ID"  # [AX]세종사업히스토리_v2 생성 후 채울 것

def fetch_history_db(force_refresh: bool = False) -> list:
    """노션 DB에서 사업히스토리 전체 레코드 조회"""
    global _history_cache
    now = time.time()

    if (not force_refresh
            and _history_cache["records"] is not None
            and now - _history_cache["timestamp"] < CACHE_TTL):
        return _history_cache["records"]

    url = f"https://api.notion.com/v1/databases/{HISTORY_DB_ID}/query"
    headers = {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }

    records = []
    has_more = True
    start_cursor = None

    while has_more:
        body = {"page_size": 100}
        if start_cursor:
            body["start_cursor"] = start_cursor

        resp = requests.post(url, headers=headers, json=body)
        data = resp.json()

        for page in data.get("results", []):
            record = parse_db_record(page)
            if record:
                records.append(record)

        has_more = data.get("has_more", False)
        start_cursor = data.get("next_cursor")

    _history_cache = {"records": records, "timestamp": now}
    return records


def parse_db_record(page: dict) -> dict | None:
    """노션 DB 레코드 → 내부 dict 변환"""
    props = page.get("properties", {})

    def get_text(key):
        p = props.get(key, {})
        if p.get("type") == "title":
            return "".join([t["plain_text"] for t in p.get("title", [])])
        if p.get("type") == "rich_text":
            return "".join([t["plain_text"] for t in p.get("rich_text", [])])
        return ""

    def get_number(key):
        p = props.get(key, {})
        return p.get("number") or 0

    def get_select(key):
        p = props.get(key, {})
        sel = p.get("select")
        return sel.get("name", "") if sel else ""

    project_type = get_select("사업구분")
    name = get_text("사업명")

    if not name:
        return None

    is_excluded = project_type == "제외"

    # 웹앱 자동계산 항목
    매출액 = get_number("매출액")
    매출원가 = get_number("매출원가")
    영업이익 = get_number("영업이익")
    영업이익_계획 = get_number("영업이익_계획")

    매출이익 = 매출액 - 매출원가
    매출이익률 = f"{매출이익 / 매출액 * 100:.1f}%" if 매출액 else "—"
    영업이익률 = f"{영업이익 / 매출액 * 100:.1f}%" if 매출액 else "—"
    계획대비실적 = 영업이익 - 영업이익_계획

    return {
        "project_type":     project_type,
        "name":             name,
        "year":             get_select("년도"),
        "client":           get_text("고객사"),
        "period":           get_text("기간"),
        "revenue":          매출액,
        "cost":             매출원가,
        "gross_profit":     매출이익,
        "gross_rate":       매출이익률,
        "overhead":         get_number("공통비"),
        "op_profit":        영업이익,
        "op_rate":          영업이익률,
        "vs_plan":          계획대비실적,
        "is_total":         False,
        "is_excluded":      is_excluded,
    }
```

### 3-2. 연도별 그룹핑 및 합계 계산 (v2.1 로직 유지)

```python
def build_chart_data(projects: list) -> dict:
    """
    그래프 데이터 집계 (v2.1과 동일)
    - 운영매출: project_type == "운영"
    - 운영외매출: project_type not in ["운영", "제외"] 및 not is_total
    - 제외(is_excluded) 항목은 전부 집계에서 제외
    """
    total = ops = non_ops = 0
    for p in projects:
        if p.get("is_total") or p.get("is_excluded"):
            continue
        rev = p.get("revenue", 0) or 0
        total += rev
        if p.get("project_type") == "운영":
            ops += rev
        else:
            non_ops += rev
    return {"total": total, "ops": ops, "non_ops": non_ops}


def calc_year_total(projects: list) -> dict:
    """
    제외 항목 빼고 합계 재계산 (v2.1과 동일)
    """
    revenue = cost = gross_profit = overhead = op_profit = vs_plan = 0
    count = 0
    for p in projects:
        if p.get("is_total") or p.get("is_excluded"):
            continue
        revenue      += p.get("revenue", 0)      or 0
        cost         += p.get("cost", 0)          or 0
        gross_profit += p.get("gross_profit", 0)  or 0
        overhead     += p.get("overhead", 0)       or 0
        op_profit    += p.get("op_profit", 0)      or 0
        vs_plan      += p.get("vs_plan", 0)        or 0
        count        += 1

    gross_rate = f"{gross_profit / revenue * 100:.1f}%" if revenue else "—"
    op_rate    = f"{op_profit    / revenue * 100:.1f}%" if revenue else "—"

    return {
        "count":        f"{count}건",
        "revenue":      revenue,
        "cost":         cost,
        "gross_profit": gross_profit,
        "gross_rate":   gross_rate,
        "overhead":     overhead,
        "op_profit":    op_profit,
        "op_rate":      op_rate,
        "vs_plan":      vs_plan,
        "is_total":     True,
    }


def get_history_data(force_refresh: bool = False) -> dict:
    """세종사업히스토리 전체 데이터 반환 (v2.2 — DB API 기반)"""
    records = fetch_history_db(force_refresh)

    # 연도별 그룹핑 (2020~2026 순서 고정)
    year_order = ["2020년", "2021년", "2022년", "2023년", "2024년", "2025년", "2026년"]
    year_map = {y: [] for y in year_order}

    for r in records:
        year = r.get("year", "")
        if year in year_map:
            year_map[year].append(r)

    years = []
    summary_rows = []

    for year_label in year_order:
        projects = year_map[year_label]
        if not projects:
            continue

        # 합계 행 계산
        total_row = calc_year_total(projects)
        total_row["name"] = f"합계 ({total_row['count']})"

        # 전년대비 계산용 summary 수집
        year_num = year_label.replace("년", "").strip()
        summary_rows.append({
            "year": year_num,
            "revenue": total_row["revenue"],
            "op_profit": total_row["op_profit"],
        })

        projects_with_total = projects + [total_row]

        years.append({
            "year":     year_num,
            "projects": projects_with_total,
            "chart":    build_chart_data(projects),
        })

    # 전년대비 계산
    for i, s in enumerate(summary_rows):
        if i == 0:
            s["yoy_amount"] = None
            s["yoy_rate"] = None
        else:
            prev = summary_rows[i - 1]["revenue"]
            curr = s["revenue"]
            diff = curr - prev
            rate = diff / prev * 100 if prev else 0
            s["yoy_amount"] = diff
            s["yoy_rate"] = rate

    return {
        "success": True,
        "data": {
            "summary": summary_rows,
            "years": years,
        }
    }
```

---

## 4. API 응답 구조 (v2.2)

```json
{
  "summary": [
    {
      "year": "2024",
      "revenue": 4866881441,
      "op_profit": 230065795,
      "yoy_amount": -914542000,
      "yoy_rate": -15.8
    }
  ],
  "years": [
    {
      "year": "2026",
      "projects": [
        {
          "project_type": "운영",
          "name": "2026년 안전신문고 시스템 유지관리 사업",
          "client": "행정안전부 안전개선과",
          "period": "1/1~12/31(12M)",
          "revenue": 1522800000,
          "cost": 1173097219,
          "gross_profit": 349702781,
          "gross_rate": "23.0%",
          "overhead": 275283878,
          "op_profit": 74418903,
          "op_rate": "4.9%",
          "vs_plan": 7486719,
          "is_total": false,
          "is_excluded": false
        },
        {
          "name": "합계 (6건)",
          "revenue": 5057248818,
          "is_total": true
        }
      ],
      "chart": {
        "total": 5057248818,
        "ops": 4244849818,
        "non_ops": 812399000
      }
    }
  ]
}
```

---

## 5. 그래프 (v2.2 — 운영실적 강조 스택+꺾은선)

```javascript
function drawChart(years) {
    const labels  = years.map(y => y.year + "년");
    const ops     = years.map(y => (y.chart.ops     / 1e8).toFixed(1));
    const nonOps  = years.map(y => (y.chart.non_ops / 1e8).toFixed(1));

    const ctx = document.getElementById("history-chart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                // ① 운영 매출 (진한 빨간색, 스택 하단)
                {
                    type: "bar",
                    label: "운영매출",
                    data: ops,
                    backgroundColor: "#E53E3E",
                    borderColor: "#C53030",
                    borderWidth: 1,
                    stack: "stack",
                    order: 2
                },
                // ② 운영외 매출 (연한 빨간색, 스택 상단)
                {
                    type: "bar",
                    label: "운영외매출",
                    data: nonOps,
                    backgroundColor: "#FC8181",
                    borderColor: "#FEB2B2",
                    borderWidth: 1,
                    stack: "stack",
                    order: 2
                },
                // ③ 운영 매출 꺾은선 (성장 추이 강조)
                {
                    type: "line",
                    label: "운영매출 추이",
                    data: ops,
                    borderColor: "#C53030",
                    backgroundColor: "#C53030",
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: "#C53030",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    tension: 0.3,
                    order: 1,
                    datalabels: {
                        anchor: "end",
                        align: "top",
                        formatter: (v) => v + "억",
                        color: "#C53030",
                        font: { weight: "bold", size: 11 }
                    }
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "top" },
                tooltip: {
                    mode: "index",
                    callbacks: {
                        label: (ctx) =>
                            ctx.dataset.label + ": " +
                            parseFloat(ctx.raw).toFixed(1) + "억"
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    title: { display: true, text: "매출액 (억원)" },
                    ticks: {
                        callback: (v) => v + "억"
                    }
                }
            }
        }
    });
}
```

> **참고 데이터 (엑셀 기준):**
> ```
> 2020: 운영 7.9억  / 운영외 3.2억
> 2021: 운영 22.2억 / 운영외 5.0억
> 2022: 운영 30.8억 / 운영외 12.2억
> 2023: 운영 32.5억 / 운영외 25.8억
> 2024: 운영 37.5억 / 운영외 11.2억
> 2025: 운영 29.0억 / 운영외 16.0억
> 2026: 운영 42.5억 / 운영외 0.0억 (예상)
> ```

---

## 6. 렌더링 로직 (main.js)

### 6-1. 사업 현황 테이블 행 렌더링 (v2.1과 동일)

```javascript
// 계획대비실적 포맷 (v2.2 — 천단위 콤마 + 부호)
function formatVsPlan(value) {
    if (!value || value === 0) return "—";
    const sign = value >= 0 ? "+" : "";
    return sign + value.toLocaleString("ko-KR") + "원";
}

function renderHistoryRow(p) {
    // 제외 항목은 표시 안 함
    if (p.is_excluded) return "";

    const rowClass = p.is_total ? "row-total" : "";
    const vsPlanClass = (p.vs_plan >= 0) ? "profit-pos" : "profit-neg";

    return `
        <tr class="${rowClass}">
            <td class="td-type">${p.project_type || ""}</td>
            <td>${p.name}</td>
            <td class="td-muted">${p.client || ""}</td>
            <td class="td-muted">${p.period || ""}</td>
            <td class="td-money">${formatRevenue(p.revenue)}</td>
            <td class="td-money">${formatRevenue(p.cost)}</td>
            <td class="td-money ${p.gross_profit >= 0 ? "profit-pos" : "profit-neg"}">
                ${formatRevenue(p.gross_profit)}</td>
            <td class="${p.gross_profit >= 0 ? "profit-pos" : "profit-neg"}">
                ${p.gross_rate || ""}</td>
            <td class="td-money">${formatRevenue(p.overhead)}</td>
            <td class="td-money ${p.op_profit >= 0 ? "profit-pos" : "profit-neg"}">
                ${formatRevenue(p.op_profit)}</td>
            <td class="${p.op_profit >= 0 ? "profit-pos" : "profit-neg"}">
                ${p.op_rate || ""}</td>
            <td class="td-money ${vsPlanClass}">
                ${p.is_total ? formatVsPlan(p.vs_plan) : formatVsPlan(p.vs_plan)}
            </td>
        </tr>
    `;
}
```

### 6-2. 연도별 매출 합계 요약 — 전년대비 포맷 (v2.2 신규)

```javascript
// 전년대비 포맷: +7.1억 (▲12.2%) 또는 -3.7억 (▼7.6%)
function formatYoY(amount, rate) {
    if (amount === null || amount === undefined) return "—";

    const absAmount = Math.abs(amount / 1e8).toFixed(1);
    const absRate   = Math.abs(rate).toFixed(1);
    const isUp      = amount >= 0;

    const arrow     = isUp ? "▲" : "▼";
    const sign      = isUp ? "+" : "-";
    const colorClass = isUp ? "yoy-up" : "yoy-down";

    return `<span class="${colorClass}">
        ${sign}${absAmount}억 (${arrow}${absRate}%)
    </span>`;
}

// 요약 테이블 행 렌더링
function renderSummaryRow(s, prev) {
    return `
        <tr>
            <td>${s.year}년</td>
            <td class="td-money">${(s.revenue / 1e8).toFixed(1)}억</td>
            <td>${formatYoY(s.yoy_amount, s.yoy_rate)}</td>
            <td class="td-money ${s.op_profit >= 0 ? "profit-pos" : "profit-neg"}">
                ${(s.op_profit / 1e8).toFixed(1)}억
            </td>
        </tr>
    `;
}
```

---

## 7. HTML 테이블 헤더 (index.html — 12컬럼, v2.1과 동일)

```html
<colgroup>
    <col style="width:6%">   <!-- 사업구분 -->
    <col style="width:18%">  <!-- 사업명 -->
    <col style="width:9%">   <!-- 고객사 -->
    <col style="width:7%">   <!-- 기간 -->
    <col style="width:7%">   <!-- 매출액 -->
    <col style="width:7%">   <!-- 매출원가 -->
    <col style="width:7%">   <!-- 매출이익 -->
    <col style="width:5%">   <!-- 매출이익률 -->
    <col style="width:7%">   <!-- 공통비 -->
    <col style="width:7%">   <!-- 영업이익 -->
    <col style="width:5%">   <!-- 영업이익률 -->
    <col style="width:7%">   <!-- 계획대비 -->
</colgroup>
<thead>
    <tr>
        <th>구분</th><th>사업명</th><th>고객사</th><th>기간</th>
        <th>매출액</th><th>매출원가</th><th>매출이익</th><th>매출이익률</th>
        <th>공통비</th><th>영업이익</th><th>영업이익률</th><th>계획대비실적</th>
    </tr>
</thead>
```

---

## 8. 제외 처리 요약 (v2.1과 동일)

| 처리 위치 | 동작 |
|----------|------|
| 표 렌더링 | is_excluded=true 행 skip |
| 합계 재계산 | 제외 항목 빼고 sum |
| 그래프 | 제외 항목 매출 집계에서 제외 |

**노션에서 사업구분을 "제외"로 바꾸기만 하면 자동 반영됨.**

---

## 9. CSS 추가 (style.css)

```css
/* 전년대비 색상 (v2.2) */
.yoy-up   { color: #2B6CB0; font-weight: bold; }   /* 증가 — 파란색 */
.yoy-down { color: #C53030; font-weight: bold; }   /* 감소 — 빨간색 */
```

---

## 10. 클로드 코드 프롬프트

```
현재 app.py, templates/index.html, static/main.js, static/style.css 파일 읽고
Phase 5 세종사업히스토리 탭을 v2.2로 업데이트해줘.

docs/PRD_LOGIC_Phase5_세종사업히스토리_v2.2.md 참고.

변경 내용 (v2.1 → v2.2, 반드시 모두 적용):

1. app.py — 데이터 소스 노션 DB API로 전환
   - HISTORY_DB_ID 상수 추가 (신규 DB ID)
   - fetch_history_db() 함수 추가: 노션 DB 페이지네이션 전체 조회
   - parse_db_record() 함수 추가: 노션 DB 레코드 → dict 변환
   - 매출이익/매출이익률/영업이익률/계획대비실적 웹앱에서 자동계산
   - get_history_data() 함수 수정: DB 기반 그룹핑 + 전년대비 계산 포함
   - calc_year_total(), build_chart_data() 함수는 v2.1 유지

2. main.js — formatVsPlan 함수 추가
   - 계획대비실적: 천단위 콤마 + 부호 (+1,234,567원 / -1,234,567원)
   - renderHistoryRow의 vs_plan 셀에 formatVsPlan 적용

3. main.js — formatYoY 함수 추가 (신규)
   - 전년대비: +7.1억 (▲12.2%) 형식
   - 증가: yoy-up 클래스 / 감소: yoy-down 클래스
   - 연도별 요약 테이블 전년대비 열에 적용

4. main.js — drawChart 수정 (v2.2)
   - 기존 3개 막대 → 스택 막대(운영+운영외) + 꺾은선(운영추이) 복합차트
   - 운영: #E53E3E (진한 빨간), 운영외: #FC8181 (연한 빨간)
   - 꺾은선: #C53030, 두께 3px, 포인트 위 레이블 표시 (xx.x억)
   - stacked: true

5. style.css — 전년대비 색상 추가
   - .yoy-up { color: #2B6CB0; font-weight: bold; }
   - .yoy-down { color: #C53030; font-weight: bold; }

반드시 지켜야 할 것:
- Phase 1~4, 6~9 코드 절대 건드리지 마
- CACHE_TTL, NOTION_TOKEN 기존 상수 재사용
- 한국어 주석 포함
- 기존 마크다운 파싱 코드(fetch_block_children, fetch_table_rows 등)는 다른 Phase에서 쓰므로 삭제 금지
```

---

## 11. 아테나 코드 프롬프트

```
@app.py @templates/index.html @static/main.js @static/style.css
@docs/PRD_LOGIC_Phase5_세종사업히스토리_v2.2.md

Phase 5 세종사업히스토리 탭을 v2.2로 업데이트해줘.

변경 내용:
1. app.py
   - HISTORY_DB_ID 상수 추가
   - fetch_history_db(): 노션 DB 전체 조회 (페이지네이션)
   - parse_db_record(): DB 레코드 → dict (매출이익/이익률/계획대비 웹앱 계산)
   - get_history_data(): DB 기반 연도별 그룹핑 + 전년대비 포함
   - calc_year_total(), build_chart_data() v2.1 유지

2. main.js
   - formatVsPlan(): 계획대비실적 천단위 콤마 + 부호
   - formatYoY(): +7.1억 (▲12.2%) 형식, yoy-up/yoy-down 클래스
   - drawChart(): 스택막대(운영#E53E3E + 운영외#FC8181) + 꺾은선(운영추이#C53030)
   - renderHistoryRow() vs_plan에 formatVsPlan 적용

3. style.css
   - .yoy-up, .yoy-down 색상 추가

반드시 지켜야 할 것:
- Phase 1~4, 6~9 코드 절대 건드리지 마
- fetch_block_children 등 기존 함수 삭제 금지
- 한국어 주석 포함
```

---

## 12. 작업 순서

```
① 노션에서 [AX]세종사업히스토리_v2 DB 신규 생성 (컬럼 17개)
② 노션 DB에 2020~2026년 전체 데이터 입력 (Claude 또는 수동)
   - 2024/2025 철도 30%/70% 분리 주의
③ 생성된 DB ID를 HISTORY_DB_ID에 입력
④ Claude Code 또는 아테나 코드로 위 프롬프트 실행
⑤ 검증:
   - 연도별 합계 일치 확인
   - 전년대비 계산 정확성 확인
   - 그래프 색상/꺾은선 확인
   - 계획대비실적 콤마 확인
```

---

*작성: 익스 + Claude | 2026.06.17 v2.2 | AX Sejong Command Phase 5*
