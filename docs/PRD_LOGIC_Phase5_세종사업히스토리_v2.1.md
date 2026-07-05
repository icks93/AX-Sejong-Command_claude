# PRD_LOGIC_Phase5_세종사업히스토리_v2.md
> 작성: 익스 + Claude | 2026.06.13
> 수정: 2026.06.14 v2.1 — 사업구분 컬럼 추가, 제외 처리, 그래프 운영/운영외 분리

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|---------|
| v1 | 2026.05.17 | 최초 작성 |
| v2 | 2026.06.13 | 노션 테이블 전면 재작성 (엑셀 기준), 컬럼 구조 변경, 그래프 3분할 |
| v2.1 | 2026.06.14 | 사업구분 컬럼 첫째로 추가 (12컬럼), 파싱 인덱스 수정, 제외 처리, 그래프 운영/운영외 변경 |

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 탭 이름 | 세종사업히스토리 |
| 노션 페이지 | [AX]세종사업히스토리_연도별 |
| 페이지 ID | 363963cc-8170-81de-a362-d9294436af0b |

---

## 2. 노션 테이블 구조 (v2.1 — 12컬럼)

### 연도별 사업 현황 테이블

| 인덱스 | 컬럼명 | 설명 |
|--------|--------|------|
| [0] | **사업구분** | 운영 / 개발 / 과제 / 운영_조폐 / **제외** |
| [1] | 사업명 | 프로젝트 전체 이름 |
| [2] | 고객사 | 발주처 |
| [3] | 기간 | 예: 1/1~12/31(12M) |
| [4] | 매출액 | 최종 확정 매출액 |
| [5] | 매출원가 | 내부인건비+외부인건비+외부SW+제경비/기타 합계 |
| [6] | 매출이익 | 매출액 - 매출원가 |
| [7] | 매출이익률 | 매출이익 / 매출액 (%) |
| [8] | 공통비 | 전사 공통비 배분액 |
| [9] | 영업이익 | 매출이익 - 공통비 |
| [10] | 영업이익률 | 영업이익 / 매출액 (%) |
| [11] | 계획대비실적 | 최종 영업이익 - 최초계획 영업이익 |

### 사업구분 값 정의

| 값 | 의미 | 그래프 분류 |
|----|------|-----------|
| 운영 | 일반 SI운영 사업 | 운영매출 |
| 개발 | 고도화/기능보강/구축 | 운영외매출 |
| 과제 | 연구과제/컨설팅 | 운영외매출 |
| 운영_조폐 | KOMSCO 등 특수 운영 | 운영외매출 |
| **제외** | 집계/표시 제외 항목 | 제외 (표시 안 함) |

### 합계 행 인식
- 사업명([1])에 "합계" 포함 시 is_total = True
- **제외 처리 시 합계 행은 노션 값 무시 → 웹앱이 직접 재계산**

---

## 3. 파싱 로직 (app.py 수정)

```python
def parse_history_row(row: list) -> dict | None:
    """
    12컬럼 행 파싱 (v2.1 — 사업구분 첫 컬럼)
    [0]사업구분 [1]사업명 [2]고객사 [3]기간
    [4]매출액 [5]매출원가 [6]매출이익 [7]매출이익률
    [8]공통비 [9]영업이익 [10]영업이익률 [11]계획대비실적
    """
    if not row or not row[0]:
        return None

    project_type = row[0].strip() if row[0] else ""
    name         = row[1].strip() if len(row) > 1 else ""

    # 빈 행 skip
    if not name and not project_type:
        return None

    is_total  = "합계" in name
    is_excluded = project_type == "제외"

    return {
        "project_type":  project_type,
        "name":          name,
        "client":        row[2]  if len(row) > 2  else "",
        "period":        row[3]  if len(row) > 3  else "",
        "revenue":       parse_number(row[4])  if len(row) > 4  else 0,
        "cost":          parse_number(row[5])  if len(row) > 5  else 0,
        "gross_profit":  parse_number(row[6])  if len(row) > 6  else 0,
        "gross_rate":    row[7]                if len(row) > 7  else "",
        "overhead":      parse_number(row[8])  if len(row) > 8  else 0,
        "op_profit":     parse_number(row[9])  if len(row) > 9  else 0,
        "op_rate":       row[10]               if len(row) > 10 else "",
        "vs_plan":       parse_number(row[11]) if len(row) > 11 else 0,
        "is_total":      is_total,
        "is_excluded":   is_excluded,
    }


def build_chart_data(projects: list) -> dict:
    """
    그래프 데이터 집계 (v2.1)
    - 총매출 = 운영매출 + 운영외매출
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
    제외 항목 빼고 합계 재계산
    노션 합계 행은 제외 처리 시 부정확하므로 웹앱이 직접 계산
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
    """세종사업히스토리 전체 데이터 반환 (v2.1)"""
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
                # 제외 항목 반영한 합계 재계산
                recalc = calc_year_total(cur_projects)
                # 기존 합계 행 교체
                cur_projects = [p for p in cur_projects if not p.get("is_total")]
                cur_projects.append(recalc)
                years.append({
                    "year":     cur_year,
                    "projects": cur_projects,
                    "chart":    build_chart_data(cur_projects)
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
                for row in rows[1:]:
                    parsed = parse_summary_row(row)
                    if parsed:
                        summary.append(parsed)
            elif cur_year:
                for row in rows[1:]:
                    parsed = parse_history_row(row)
                    if parsed:
                        cur_projects.append(parsed)

    # 마지막 연도
    if cur_year and cur_projects:
        recalc = calc_year_total(cur_projects)
        cur_projects = [p for p in cur_projects if not p.get("is_total")]
        cur_projects.append(recalc)
        years.append({
            "year":     cur_year,
            "projects": cur_projects,
            "chart":    build_chart_data(cur_projects)
        })

    return {"success": True, "data": {"summary": summary, "years": years}}
```

---

## 4. API 응답 구조

```json
{
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
          "project_type": "",
          "name": "합계 (6건)",
          "revenue": 5057248818,
          "is_total": true,
          "is_excluded": false
        }
      ],
      "chart": {
        "total": 5057248818,
        "ops": 3244849818,
        "non_ops": 1812399000
      }
    }
  ]
}
```

---

## 5. 그래프 (v2.1 — 운영매출 / 운영외매출)

```javascript
function drawChart(years) {
    const labels   = years.map(y => y.year + "년");
    const total    = years.map(y => y.chart.total);
    const ops      = years.map(y => y.chart.ops);
    const non_ops  = years.map(y => y.chart.non_ops);

    const ctx = document.getElementById("history-chart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "총매출",
                    data: total,
                    backgroundColor: "rgba(74, 158, 224, 0.8)",
                    borderColor: "#4A9EE0",
                    borderWidth: 1
                },
                {
                    label: "운영매출",
                    data: ops,
                    backgroundColor: "rgba(124, 182, 82, 0.8)",
                    borderColor: "#7CB652",
                    borderWidth: 1
                },
                {
                    label: "운영외매출",
                    data: non_ops,
                    backgroundColor: "rgba(245, 158, 11, 0.8)",
                    borderColor: "#F59E0B",
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "top" },
                tooltip: {
                    callbacks: {
                        label: (ctx) =>
                            ctx.dataset.label + ": " +
                            (ctx.raw / 100_000_000).toFixed(1) + "억"
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (v) => (v / 100_000_000).toFixed(0) + "억"
                    }
                }
            }
        }
    });
}
```

---

## 6. 렌더링 로직 (main.js)

```javascript
// 사업 현황 테이블 행 렌더링 (v2.1)
function renderHistoryRow(p) {
    // 제외 항목은 표시 안 함
    if (p.is_excluded) return "";

    return `
        <tr class="${p.is_total ? "row-total" : ""}">
            <td class="td-type">${p.project_type || ""}</td>
            <td>${p.name}</td>
            <td class="td-muted">${p.client || ""}</td>
            <td class="td-muted">${p.period || ""}</td>
            <td class="td-money">${formatRevenue(p.revenue)}</td>
            <td class="td-money">${formatRevenue(p.cost)}</td>
            <td class="td-money ${(p.gross_profit >= 0) ? "profit-pos" : "profit-neg"}">
                ${formatRevenue(p.gross_profit)}</td>
            <td class="${(p.gross_profit >= 0) ? "profit-pos" : "profit-neg"}">
                ${p.gross_rate || ""}</td>
            <td class="td-money">${formatRevenue(p.overhead)}</td>
            <td class="td-money ${(p.op_profit >= 0) ? "profit-pos" : "profit-neg"}">
                ${formatRevenue(p.op_profit)}</td>
            <td class="${(p.op_profit >= 0) ? "profit-pos" : "profit-neg"}">
                ${p.op_rate || ""}</td>
            <td class="td-money ${(p.vs_plan >= 0) ? "profit-pos" : "profit-neg"}">
                ${p.vs_plan === 0 ? "0" : (p.vs_plan > 0 ? "+" : "") + formatRevenue(p.vs_plan)}
            </td>
        </tr>
    `;
}
```

---

## 7. HTML 테이블 헤더 (index.html — 12컬럼)

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

## 8. 제외 처리 요약

| 처리 위치 | 동작 |
|----------|------|
| 표 렌더링 | is_excluded=true 행 skip (표시 안 함) |
| 합계 재계산 | 제외 항목 빼고 sum (노션 합계 행 무시) |
| 그래프 | 제외 항목 매출 집계에서 제외 |
| 요약 테이블 | (요약은 별도 섹션이므로 별도 처리 불필요) |

**노션에서 사업구분을 "제외"로 바꾸기만 하면 자동 반영됨.**

---

## 9. 클로드 코드 프롬프트

```
현재 app.py, templates/index.html, static/main.js, static/style.css 파일 읽고
Phase 5 세종사업히스토리 탭을 v2.1로 업데이트해줘.

docs/PRD_LOGIC_Phase5_세종사업히스토리_v2.1.md 참고.

변경 내용 (중요 — 반드시 모두 적용):
1. app.py — parse_history_row 12컬럼으로 수정
   - [0]사업구분 [1]사업명 [2]고객사 [3]기간
   - [4]매출액 [5]매출원가 [6]매출이익 [7]매출이익률
   - [8]공통비 [9]영업이익 [10]영업이익률 [11]계획대비실적
   - is_excluded: project_type == "제외" 이면 True
   - calc_year_total 함수 추가: 제외 항목 제거하고 합계 재계산
   - build_chart_data 수정:
     ops = project_type == "운영" 합계
     non_ops = project_type != "운영" 이고 is_excluded=False 합계
     (제외 항목은 ops/non_ops 모두 포함 안 됨)

2. main.js — renderHistoryRow 수정
   - is_excluded=true 이면 빈 문자열 반환 (표시 안 함)
   - 첫 번째 셀에 project_type 표시 (td-type 클래스)

3. main.js — drawChart 수정
   - 총매출 / 운영매출 / 운영외매출 3개 막대
   - ops → y.chart.ops (운영매출)
   - non_ops → y.chart.non_ops (운영외매출)
   - 범례: "총매출" / "운영매출" / "운영외매출"

4. index.html — 테이블 헤더 12컬럼으로 수정
   - 첫 번째 헤더: "구분" (사업구분)

반드시 지켜야 할 것:
- Phase 1~4, 6~9 코드 절대 건드리지 마
- fetch_table_rows, get_block_text, CACHE_TTL 재사용
- 한국어 주석 포함
```

---

## 10. 아테나 코드 프롬프트

```
@app.py @templates/index.html @static/main.js @static/style.css
@docs/PRD_LOGIC_Phase5_세종사업히스토리_v2.1.md

위 파일 읽고 Phase 5 세종사업히스토리 탭을 v2.1로 업데이트해줘.

변경 내용:
1. app.py — parse_history_row 12컬럼으로 수정
   [0]사업구분 [1]사업명 [2]고객사 [3]기간 [4]매출액 [5]매출원가
   [6]매출이익 [7]매출이익률 [8]공통비 [9]영업이익 [10]영업이익률 [11]계획대비실적
   is_excluded: project_type == "제외"
   calc_year_total 함수 추가 (제외 빼고 합계 재계산)
   build_chart_data: ops(운영만), non_ops(운영 아닌것), 제외 제외

2. main.js — renderHistoryRow: is_excluded=true 시 skip, 구분 셀 추가

3. main.js — drawChart: 총매출/운영매출/운영외매출 3분할

4. index.html — 테이블 헤더 12컬럼 ("구분" 첫 번째)

반드시 지켜야 할 것:
- Phase 1~4, 6~9 코드 절대 건드리지 마
- fetch_table_rows, get_block_text, CACHE_TTL 재사용
- 한국어 주석 포함
```

---

## 11. 2026년 재외문화원 사업구분 수정

노션에서 2026년 재외한국문화원 행정지원시스템의 사업구분을
**"개발" → "운영"** 으로 변경 필요.

---

*작성: 익스 + Claude | 2026.06.14 v2.1 | AX Sejong Command Phase 5*
