# PRD_Phase1_v2.md — AX Sejong Command (Phase 1 개선)
> 작성: 익스 + Claude | 2026.05.10
> 수정: 2026.06.07 — 준비중 분리, 도넛차트, 예정사업 섹션 추가

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|---------|
| v1 | 2026.05.10 | 최초 작성 |
| v2 | 2026.06.07 | 준비중 상태 총 매출액 제외, KPI 5개로 확장, 도넛차트 추가, 예정사업 섹션 추가 |

---

## 1. 변경 배경

노션 [AX]세종사업현황 DB에 "준비중" 상태의 사업(철도공사 모바일 승무일지 고도화)이 추가됨.
준비중 사업은 아직 계약 확정 전이므로 총 매출액에 포함되면 안 됨.
또한 예정 사업 현황을 별도로 시각화할 필요가 생겨 UI 개선.

---

## 2. 노션 상태 값 정의 (업데이트)

| 상태값 | 의미 | 총 매출액 포함 여부 |
|--------|------|------------------|
| 운영중 | 계약 완료, 진행 중 | ✅ 포함 |
| 신규 | 신규 착수 | ✅ 포함 |
| 종료 | 계약 완료 및 종료 | ✅ 포함 |
| 종료예정 | 곧 종료 예정 | ✅ 포함 |
| 준비중 | 수주 준비 중, 미계약 | ❌ 제외 |

---

## 3. KPI 박스 (5개로 확장)

| 박스 | ID | 색상 | 계산 방법 | v2 변경 |
|------|-----|------|---------|---------|
| 총 수행 사업 | `kpi-total` | blue | 준비중 제외한 전체 수 | 준비중 제외 |
| 총 매출액 | `kpi-revenue` | green | 준비중 제외 SUM | 준비중 제외 |
| 진행중 | `kpi-active` | blue | 운영중+신규 COUNT | 변경 없음 |
| 준비중 | `kpi-ready` | amber | 준비중 COUNT | **신규 추가** |
| 종료 | `kpi-closed` | red | 종료 COUNT | 변경 없음 |

### KPI 계산 로직 (JavaScript)

```javascript
function renderKPI(projects) {
    // 준비중 제외한 사업만
    const active = projects.filter(p => p.status !== "준비중");

    // 총 수행 사업 (준비중 제외)
    document.getElementById("kpi-total").textContent = active.length;

    // 총 매출액 (준비중 제외)
    const totalRevenue = active.reduce((sum, p) => sum + (p.revenue || 0), 0);
    document.getElementById("kpi-revenue").textContent =
        (totalRevenue / 100_000_000).toFixed(1) + "억";

    // 진행중 (운영중 + 신규)
    const activeCount = active.filter(
        p => p.status === "운영중" || p.status === "신규"
    ).length;
    document.getElementById("kpi-active").textContent = activeCount;

    // 준비중
    const readyCount = projects.filter(p => p.status === "준비중").length;
    document.getElementById("kpi-ready").textContent = readyCount;

    // 종료
    const closedCount = active.filter(p => p.status === "종료").length;
    document.getElementById("kpi-closed").textContent = closedCount;
}
```

---

## 4. 화면 구성 (v2)

```
┌──────────────────────────────────────────────────────────┐
│  세종사업현황                            [↻ 새로고침]     │
│  2026년 수행 사업 기준                                    │
├──────────────────────────────────────────────────────────┤
│  KPI 5개                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │총 사업│ │매출액 │ │진행중│ │준비중│ │ 종료 │          │
│  │  6   │ │50.3억│ │  5  │ │  1  │ │  1  │          │
│  │      │ │      │ │      │ │*미반영│ │      │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
├──────────────────────────────────────────────────────────┤
│  [2컬럼 상단 영역]                                         │
│  ┌─ 매출 구성 (도넛차트) ─┐  ┌─ 예정 사업 현황 ─────────┐ │
│  │                       │  │  준비중 1건               │ │
│  │    [도넛 130px]        │  │  ┌────────────────────┐  │ │
│  │    50.3억 총매출        │  │  │철도공사 승무일지    │  │ │
│  │                       │  │  │5.0억 (예상)        │  │ │
│  │  범례:                 │  │  │수주준비 30%        │  │ │
│  │  ■ 안전신문고 30%       │  │  └────────────────────┘  │ │
│  │  ■ 재외문화원 34%       │  │                          │ │
│  │  ■ AI과제 16%          │  │  확정 시 총액 55.3억      │ │
│  │  ■ 해외홍보 14%         │  └───────────────────────┘ │
│  │  ■ 공직메일  6%         │                             │
│  │  * 준비중 미포함        │                             │
│  └───────────────────────┘                              │
├──────────────────────────────────────────────────────────┤
│  사업 목록                                   [6건]        │
│  사업명 | 고객사 | PM | 매출액 | 계약기간 | 상태          │
│  ──────────────────────────────────────────────────────  │
│  재외한국문화원...        장은영   16.9억  ~26.12.31  운영중 │
│  안전신문고...            노원국   15.2억  ~26.12.31  운영중 │
│  AI기반 안전신고...       김창환    7.8억  ~26.12.31  운영중 │
│  해외홍보시스템...        장은영    7.1억  ~26.12.31  운영중 │
│  공직자통합메일...        박정수    3.2억  ~26.12.31  운영중 │
│  안전신문고-어린이...      —        500만  ~26.05.15   종료  │
│  ─── 준비중 사업 — 매출 총액 미반영 ───────────────────  │
│  철도공사 승무일지 고도화  신인순  5.0억(예상) 2026.7~  준비중│
└──────────────────────────────────────────────────────────┘
```

---

## 5. 도넛 차트 (신규)

### HTML 추가
```html
<!-- 상단 2컬럼 영역 -->
<div class="projects-top-grid">

  <!-- 매출 구성 도넛 -->
  <div class="donut-card">
    <div class="donut-card-title">매출 구성
      <span class="donut-note">진행중 기준</span>
    </div>
    <div class="donut-wrap">
      <canvas id="revenue-donut" width="130" height="130"></canvas>
      <div class="donut-center">
        <div class="donut-total" id="donut-total-label">—</div>
        <div class="donut-sub">총 매출</div>
      </div>
    </div>
    <div class="donut-legend" id="donut-legend"></div>
    <div class="donut-footnote">* 준비중 사업은 확정 후 반영</div>
  </div>

  <!-- 예정 사업 -->
  <div class="ready-card">
    <div class="ready-card-title">
      예정 사업 현황
      <span class="ready-badge" id="ready-count-badge">준비중 0건</span>
    </div>
    <div id="ready-projects-list"></div>
    <div class="ready-total-preview" id="ready-total-preview" style="display:none;">
      <span class="ready-total-label">수주 확정 시 예상 총액</span>
      <span class="ready-total-value" id="ready-total-value"></span>
    </div>
  </div>

</div>
```

### JavaScript 도넛 차트 렌더링
```javascript
function renderDonut(projects) {
    // 준비중 제외
    const active = projects.filter(p => p.status !== "준비중");
    const totalRevenue = active.reduce((sum, p) => sum + (p.revenue || 0), 0);

    // 색상 매핑 (사업명 키워드 기준)
    const colorMap = [
        { keyword: "재외",     color: "#4A9EE0" },
        { keyword: "안전신문고",color: "rgba(74,158,224,0.55)" },
        { keyword: "AI기반",   color: "#8B5CF6" },
        { keyword: "해외홍보", color: "#7CB652" },
        { keyword: "공직",     color: "#F59E0B" },
    ];

    const canvas = document.getElementById("revenue-donut");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = 65, cy = 65, r = 58, ir = 38;

    let start = -Math.PI / 2;
    const legendHTML = [];

    active
        .filter(p => p.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .forEach((p, i) => {
            const colorEntry = colorMap.find(c => p.name.includes(c.keyword));
            const color = colorEntry ? colorEntry.color : `hsl(${i * 60}, 60%, 55%)`;
            const angle = (p.revenue / totalRevenue) * Math.PI * 2;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, start, start + angle - 0.03);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            start += angle;

            const pct = Math.round(p.revenue / totalRevenue * 100);
            const shortName = getShortName(p.name);
            legendHTML.push(
                `<div class="donut-leg">
                   <span class="donut-leg-dot" style="background:${color}"></span>
                   <span class="donut-leg-name">${shortName}</span>
                   <span class="donut-leg-amt">${formatRevenue(p.revenue)}</span>
                   <span class="donut-leg-pct">${pct}%</span>
                 </div>`
            );
        });

    // 가운데 구멍
    ctx.beginPath();
    ctx.arc(cx, cy, ir, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // 총액 레이블
    document.getElementById("donut-total-label").textContent =
        (totalRevenue / 100_000_000).toFixed(1) + "억";
    document.getElementById("donut-legend").innerHTML = legendHTML.join("");
}

function getShortName(name) {
    const map = {
        "재외한국문화원": "재외문화원",
        "안전신문고": "안전신문고",
        "AI기반": "AI과제",
        "해외홍보": "해외홍보",
        "공직자통합메일": "공직메일",
    };
    for (const [key, val] of Object.entries(map)) {
        if (name.includes(key)) return val;
    }
    return name.slice(0, 6);
}
```

---

## 6. 예정 사업 섹션 (신규)

### JavaScript 렌더링
```javascript
function renderReadyProjects(projects) {
    const ready = projects.filter(p => p.status === "준비중");
    const activeRevenue = projects
        .filter(p => p.status !== "준비중")
        .reduce((sum, p) => sum + (p.revenue || 0), 0);

    // 배지 업데이트
    document.getElementById("ready-count-badge").textContent =
        `준비중 ${ready.length}건`;

    const list = document.getElementById("ready-projects-list");

    if (ready.length === 0) {
        list.innerHTML = `<div class="ready-empty">현재 준비중인 사업 없음</div>`;
        return;
    }

    list.innerHTML = ready.map(p => `
        <div class="ready-item">
            <div class="ready-item-name">${p.name}</div>
            <div class="ready-item-meta">
                <span>고객사: <strong>${p.client || "—"}</strong></span>
                <span>PM: <strong>${p.pm || "—"}</strong></span>
                <span>기간: <strong>${formatPeriod(p.period) || "미정"}</strong></span>
            </div>
            <div class="ready-item-revenue">${formatRevenue(p.revenue)} (예상)</div>
        </div>
    `).join("");

    // 확정 시 예상 총액
    const readyRevenue = ready.reduce((sum, p) => sum + (p.revenue || 0), 0);
    if (readyRevenue > 0) {
        const preview = document.getElementById("ready-total-preview");
        preview.style.display = "flex";
        document.getElementById("ready-total-value").textContent =
            (( activeRevenue + readyRevenue) / 100_000_000).toFixed(1) + "억";
    }
}
```

---

## 7. 테이블 변경 (v2)

### 준비중 구분선 추가 로직
```javascript
function renderTable(projects) {
    const tbody = document.getElementById("projects-tbody");
    tbody.innerHTML = "";

    // 준비중 제외 먼저
    const activeProjects = projects.filter(p => p.status !== "준비중");
    const readyProjects  = projects.filter(p => p.status === "준비중");

    // 일반 사업 렌더링
    activeProjects.forEach(p => {
        tbody.appendChild(createProjectRow(p));
    });

    // 준비중 구분선 + 준비중 사업
    if (readyProjects.length > 0) {
        const sepRow = document.createElement("tr");
        sepRow.className = "sep-row";
        sepRow.innerHTML = `
            <td colspan="6">▼ 준비중 사업 — 매출 총액 미반영</td>
        `;
        tbody.appendChild(sepRow);

        readyProjects.forEach(p => {
            const row = createProjectRow(p, true); // isReady=true
            tbody.appendChild(row);
        });
    }

    // 건수 배지 (준비중 제외)
    document.getElementById("project-count").textContent =
        activeProjects.length + "건";
}

function createProjectRow(p, isReady = false) {
    const tr = document.createElement("tr");
    if (isReady) tr.classList.add("row-ready");
    tr.innerHTML = `
        <td class="name-cell"
            data-name="${escape(p.name)}"
            data-client="${escape(p.client)}"
            data-target="${escape(p.target)}"
            data-summary="${escape(p.summary)}">
            <span class="name-text">${p.name}</span>
        </td>
        <td class="td-muted">${p.client || "—"}</td>
        <td>${p.pm || "—"}</td>
        <td class="td-money">${isReady ? formatRevenue(p.revenue) + ' <span class="est-label">(예상)</span>' : formatRevenue(p.revenue)}</td>
        <td class="td-muted">${formatPeriod(p.period)}</td>
        <td>${renderBadge(p.status)}</td>
    `;
    return tr;
}
```

---

## 8. 상태 배지 추가 (v2)

```javascript
function renderBadge(status) {
    const map = {
        "운영중":   '<span class="status-badge badge-green">운영중</span>',
        "신규":     '<span class="status-badge badge-blue">신규</span>',
        "종료":     '<span class="status-badge badge-gray">종료</span>',
        "종료예정": '<span class="status-badge badge-amber">종료예정</span>',
        "준비중":   '<span class="status-badge badge-ready">준비중</span>', // 신규
    };
    return map[status] || `<span class="status-badge badge-gray">${status || "—"}</span>`;
}
```

---

## 9. CSS 추가 (style.css)

```css
/* ── Phase 1 v2 추가 ─────────────────────────────────── */

/* 상단 2컬럼 */
.projects-top-grid {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 12px;
    margin-bottom: 14px;
}

/* 도넛 카드 */
.donut-card {
    background: #fff;
    border: 0.5px solid #E5E7EB;
    border-radius: 8px;
    padding: 16px;
}
.donut-card-title {
    font-size: 12px; font-weight: 500; color: #0F172A;
    margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
}
.donut-note { font-size: 10px; color: #94a3b8; font-weight: 400; }
.donut-wrap {
    position: relative; width: 130px; height: 130px; margin: 0 auto 14px;
}
.donut-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.donut-total { font-size: 20px; font-weight: 600; color: #0F172A; }
.donut-sub   { font-size: 10px; color: #94a3b8; }
.donut-leg {
    display: flex; align-items: center; gap: 6px;
    margin-bottom: 5px; font-size: 11px;
}
.donut-leg-dot  { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.donut-leg-name { flex: 1; color: #475569; }
.donut-leg-amt  { font-weight: 600; color: #0F172A; }
.donut-leg-pct  { color: #94a3b8; width: 28px; text-align: right; }
.donut-footnote { font-size: 10px; color: #94a3b8; margin-top: 8px; }

/* 예정 사업 카드 */
.ready-card {
    background: #fff;
    border: 0.5px solid #E5E7EB;
    border-radius: 8px;
    padding: 16px;
}
.ready-card-title {
    font-size: 12px; font-weight: 500; color: #0F172A;
    margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;
}
.ready-badge {
    font-size: 10px; background: #fef9c3; color: #a16207;
    border: 0.5px solid #fde047; padding: 2px 8px; border-radius: 10px; font-weight: 600;
}
.ready-item {
    border: 1px dashed #E5E7EB; border-radius: 6px;
    padding: 10px 12px; margin-bottom: 8px; background: #fafafa;
}
.ready-item-name    { font-size: 12px; font-weight: 600; color: #0F172A; margin-bottom: 5px; }
.ready-item-meta    { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11px; color: #64748b; }
.ready-item-meta strong { color: #0F172A; }
.ready-item-revenue { font-size: 13px; font-weight: 600; color: #d97706; margin-top: 5px; }
.ready-total-preview {
    display: flex; align-items: baseline; gap: 6px;
    margin-top: 12px; padding: 10px 12px;
    background: #fffbeb; border: 0.5px solid #fde047; border-radius: 6px;
}
.ready-total-label { font-size: 11px; color: #a16207; }
.ready-total-value { font-size: 18px; font-weight: 700; color: #d97706; margin-left: auto; }
.ready-empty { font-size: 12px; color: #94a3b8; font-style: italic; text-align: center; padding: 16px; }

/* 준비중 구분선 */
.sep-row td {
    background: #fffbeb; font-size: 11px; color: #92400e; font-weight: 600;
    padding: 6px 12px;
    border-top: 0.5px solid #fde047;
    border-bottom: 0.5px solid #fde047;
}

/* 준비중 행 */
.row-ready td { background: #fffdf0; }
.est-label { font-size: 10px; color: #94a3b8; font-weight: 400; }

/* 준비중 배지 */
.badge-ready {
    background: #fef9c3; color: #a16207;
    border: 0.5px solid #fde047;
}
```

---

## 10. API 변경 없음

`/api/projects` 엔드포인트는 변경 없음.
"준비중" 상태 포함하여 전체 데이터 그대로 반환.
KPI 계산 및 테이블 구분은 프론트엔드에서 처리.

---

## 11. 클로드 코드 프롬프트

```
현재 app.py, index.html, main.js, style.css 파일 읽고
Phase 1 세종사업현황 탭을 아래 내용으로 개선해줘.

docs/PRD_Phase1_v2.md 참고.

변경 내용:
1. KPI 5개로 확장 — 준비중 KPI 추가, 총 매출액에서 준비중 제외
2. 상단 2컬럼 추가 — 도넛차트(canvas) + 예정사업 카드
3. 테이블 — 준비중 구분선 + row-ready 클래스
4. renderBadge — 준비중 배지 추가
5. CSS — 도넛/예정사업 관련 클래스 추가

반드시 지켜야 할 것:
- Phase 2~9 코드 절대 건드리지 마
- 기존 renderBadge, renderTable 함수 수정 (재작성 아님)
- 한국어 주석 포함
```

---

*작성: 익스 + Claude | 2026.06.07 | AX Sejong Command Phase 1 v2*
