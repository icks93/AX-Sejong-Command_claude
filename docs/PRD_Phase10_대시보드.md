# PRD_Phase10_대시보드.md — AX Sejong Command
> 작성: 익스 + Claude | 2026.06.07
> 수정: 2026.06.07 v2 — KPI/레이아웃 개선

---

## 1. 목적

AX Sejong Command 진입 시 첫 화면으로 표시되는 종합 대시보드.
각 탭의 핵심 정보를 한눈에 파악할 수 있도록 요약 표시.
별도 노션 API 호출 없이 기존 Phase 1~9 API를 재활용.

---

## 2. 데이터 소스 (기존 API 재활용)

| 섹션 | API | 비고 |
|------|-----|------|
| KPI | /api/projects | 준비중 별도 집계 |
| 수행 사업 현황 | /api/projects | 진행중+종료 목록 + 준비중 하단 |
| 사업별 인력 현황 | /api/org | 사업별 정직원 수 집계 + 파이차트 |
| RISK 알림 | /api/risk | 최신 주차, 최대 5건만 표시 |
| 주간회의 집중 확인 | /api/risk | RISK와 동일 데이터, focus 필드만 별도 표시 |
| 영업보고 | /api/sales | 최신 주차 [수주]/[세종] 태그 항목만 |
| 세미나 알림 | /api/seminar | 최신 주차 행사 목록 |

모든 API 동시 호출 (Promise.all) → 로딩 속도 최적화

---

## 3. 전체 레이아웃

```
┌─ 대시보드        2026년 5월 4주차 · 기준일 06/07   [↻ 새로고침] ─┐
├──────────────────────────────────────────────────────────────────┤
│  KPI 5개                                                         │
│  수행사업(6) │ 총매출(50.3억) │ 팀인원(18명) │ 이번주영업(12건) │ 준비중(1건) │
├──────────────────────────────────────────────────────────────────┤
│  상단 2컬럼                                                       │
│  ┌─ 수행 사업 현황 ──────────────────┐ ┌─ 사업별 인력 현황 ──────┐ │
│  │ 재외문화원  장은영  16.9억  운영중 │ │ [파이차트 80px]         │ │
│  │ 안전신문고  노원국  15.2억  운영중 │ │ 안전신문고 ████  6명   │ │
│  │ AI과제     김창환   7.8억  운영중 │ │ 공통       ███   4명   │ │
│  │ 해외홍보   장은영   7.1억  운영중 │ │ 해외홍보   ██    3명   │ │
│  │ 공직메일   박정수   3.2억  운영중 │ │ 공직메일   ██    3명   │ │
│  │ 어린이자가진단  —   500만   종료  │ │ AI과제     █     2명   │ │
│  │ ─── 준비중 ─────────────────── │ │                        │ │
│  │ 철도공사 승무일지  5.0억  준비중  │ │                        │ │
│  └──────────────────────────────┘ └───────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  하단 4섹션 (2+2 그리드)                                          │
│  ┌─ RISK 알림 ────────────┐ ┌─ 주간회의 집중 확인 ─────────────┐ │
│  │ [장기] 안전신문고 WAS  │ │ 1. WAS 정체 트래픽 분석 결과     │ │
│  │ [악화] 동영상 과부하   │ │ 2. AI과제 CPU 대응방안           │ │
│  │ [일정] 공직메일 OS재설치│ │ 3. 공직메일 OS재설치 일정        │ │
│  │ [누락] 철도 보고누락   │ │                                 │ │
│  │ (최대 5건)             │ │                                 │ │
│  └────────────────────────┘ └───────────────────────────────┘ │
│  ┌─ 영업보고 ──────────────┐ ┌─ 세미나 알림 ────────────────────┐ │
│  │ 이번주 총 12건          │ │ 06/05 대전AI포럼    (근거리)     │ │
│  │ 한국고용정보원 [수주]   │ │ 06/11 AI EXPO KOREA             │ │
│  │ 행정안전부 [세종]       │ │ 06/18 공공클라우드 컨퍼런스      │ │
│  │ SK하이닉스              │ │ 06/25 전자정부 혁신 포럼         │ │
│  └────────────────────────┘ └───────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. KPI 5개 정의

| 박스 | ID | 색상 | 계산 | v2 변경 |
|------|-----|------|------|---------|
| 수행 사업 | `dash-kpi-projects` | blue | 준비중 제외 COUNT | 변경 없음 |
| 총 매출액 | `dash-kpi-revenue` | green | 준비중 제외 SUM | 변경 없음 |
| 팀 인원 | `dash-kpi-members` | amber | 정직원 18명 | 변경 없음 |
| 이번주 영업 | `dash-kpi-sales` | purple | 최신 주차 총건수 | 변경 없음 |
| 준비중 사업 | `dash-kpi-ready` | amber | 준비중 COUNT | **RISK → 준비중으로 교체** |

### KPI 계산 로직

```javascript
function renderDashKPI(projects, sales) {
    const data = projects.data || [];

    // 준비중 제외
    const active = data.filter(p => p.status !== "준비중");
    document.getElementById("dash-kpi-projects").textContent = active.length;

    // 총 매출액 (준비중 제외)
    const rev = active.reduce((s, p) => s + (p.revenue || 0), 0);
    document.getElementById("dash-kpi-revenue").textContent =
        (rev / 100_000_000).toFixed(1) + "억";

    // 팀 인원 → renderDashOrg에서 업데이트

    // 이번주 영업
    if (sales && sales.length > 0) {
        const latest = sales[0];
        document.getElementById("dash-kpi-sales").textContent = latest.total + "건";
        document.getElementById("dash-kpi-sales-sub").textContent = latest.label;
        document.getElementById("dash-week-label").textContent = latest.label;
    }

    // 준비중 사업
    const readyCnt = data.filter(p => p.status === "준비중").length;
    document.getElementById("dash-kpi-ready").textContent = readyCnt + "건";
}
```

---

## 5. 상단 2컬럼 — 수행 사업 현황

### 구성 규칙
- 진행중(운영중/신규) → 종료 → 구분선 → 준비중 순으로 표시
- 준비중 행: 점선 구분선 이후, 노란 배경, 매출에 "(예상)" 표기
- 사업명은 최대 20자 truncate

### JavaScript

```javascript
function renderDashProjects(projects) {
    const data = projects.data || [];
    const active = data.filter(p => p.status !== "준비중");
    const ready  = data.filter(p => p.status === "준비중");
    const el = document.getElementById("dash-projects-list");

    let html = active.map(p => `
        <div class="dash-proj-row">
            <span class="dash-proj-dot" style="background:${getProjectColor(p.name)};"></span>
            <span class="dash-proj-name">${truncate(p.name, 18)}</span>
            <span class="dash-proj-pm">${p.pm || "—"}</span>
            <span class="dash-proj-amt">${formatRevenue(p.revenue)}</span>
            ${renderSmallBadge(p.status)}
        </div>
    `).join("");

    if (ready.length > 0) {
        html += `<div class="dash-proj-sep">▼ 준비중</div>`;
        html += ready.map(p => `
            <div class="dash-proj-row dash-proj-ready">
                <span class="dash-proj-dot" style="background:#f59e0b; opacity:.5;"></span>
                <span class="dash-proj-name">${truncate(p.name, 18)}</span>
                <span class="dash-proj-pm">${p.pm || "—"}</span>
                <span class="dash-proj-amt" style="color:#d97706;">${formatRevenue(p.revenue)}<span class="dash-est">(예상)</span></span>
                ${renderSmallBadge(p.status)}
            </div>
        `).join("");
    }

    el.innerHTML = html;
}

function truncate(str, n) {
    return str.length > n ? str.slice(0, n) + "..." : str;
}
```

---

## 6. 상단 2컬럼 — 사업별 인력 현황

### 구성 규칙
- 파이차트(canvas 80x80px) + 사업별 인원 막대+숫자
- 정직원만 집계
- 사업별 색상은 /api/org의 projects[].color 사용

### JavaScript

```javascript
function renderDashOrg(org) {
    if (!org) return;
    const staff    = (org.staff    || []).filter(s => s.type === "정직원");
    const projects = org.projects  || [];

    // 팀 인원 KPI 업데이트
    document.getElementById("dash-kpi-members").textContent = staff.length + "명";

    // 사업별 인원 집계
    const countMap = {};
    projects.forEach(p => { countMap[p.name] = 0; });
    staff.forEach(s => {
        if (countMap[s.project] !== undefined) countMap[s.project]++;
    });

    const max = Math.max(...Object.values(countMap), 1);
    const el  = document.getElementById("dash-org-content");

    el.innerHTML = `
        <div class="dash-org-wrap">
            <div class="dash-pie-wrap">
                <canvas id="dash-pie" width="80" height="80"></canvas>
            </div>
            <div class="dash-org-legend">
                ${projects.map(p => {
                    const cnt = countMap[p.name] || 0;
                    const pct = Math.round(cnt / max * 100);
                    return `
                        <div class="dash-org-leg">
                            <span class="dash-org-dot" style="background:${p.color || '#64748b'};"></span>
                            <span class="dash-org-name">${p.name}</span>
                            <span class="dash-org-cnt">${cnt}명</span>
                            <div class="dash-org-bar-bg">
                                <div class="dash-org-bar-fill" style="width:${pct}%;background:${p.color || '#64748b'};"></div>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;

    // 파이차트
    requestAnimationFrame(() => {
        const canvas = document.getElementById("dash-pie");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const vals   = projects.map(p => countMap[p.name] || 0);
        const colors = projects.map(p => p.color || "#64748b");
        const total  = vals.reduce((s, v) => s + v, 0) || 1;
        let start = -Math.PI / 2;
        const cx = 40, cy = 40, r = 36, ir = 18;

        vals.forEach((v, i) => {
            const angle = (v / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, start, start + angle - 0.04);
            ctx.closePath();
            ctx.fillStyle = colors[i];
            ctx.fill();
            start += angle;
        });

        ctx.beginPath();
        ctx.arc(cx, cy, ir, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    });
}
```

---

## 7. 하단 4섹션 — RISK 알림 (최대 5건)

### 구성 규칙
- 최신 주차 1개만 표시
- long_issues / worsening / schedule / missing 순으로 최대 5건만 표시
- **집중확인(focus) 항목은 이 카드에서 제외** → 별도 카드로 분리
- no_risk=true 이면 "이번 주 특이 리스크 없음"

### JavaScript

```javascript
function renderDashRisk(risk) {
    if (!risk || risk.length === 0) return;
    const latest = risk[0];
    const el = document.getElementById("dash-risk-content");
    document.getElementById("dash-risk-week").textContent = latest.label || "";

    if (latest.no_risk) {
        el.innerHTML = `<div class="dash-empty">이번 주 특이 리스크 없음</div>`;
        return;
    }

    const sections = [
        { key: "long_issues", label: "장기", cls: "lv-long" },
        { key: "worsening",   label: "악화", cls: "lv-bad" },
        { key: "schedule",    label: "일정", cls: "lv-sched" },
        { key: "missing",     label: "누락", cls: "lv-miss" },
    ];

    const items = [];
    sections.forEach(s => {
        (latest[s.key] || []).forEach(txt => {
            if (txt && items.length < 5) {  // 최대 5건
                items.push(`
                    <div class="dash-risk-item">
                        <span class="dash-risk-lv ${s.cls}">${s.label}</span>
                        <span class="dash-risk-txt">${txt}</span>
                    </div>
                `);
            }
        });
    });

    el.innerHTML = items.join("") ||
        `<div class="dash-empty">이번 주 특이 리스크 없음</div>`;
}
```

---

## 8. 하단 4섹션 — 주간회의 집중 확인 (별도 섹션)

### 구성 규칙
- /api/risk 데이터의 focus 필드만 사용
- 번호 리스트로 표시 (1. 2. 3.)
- 최신 주차 기준
- 항목 없으면 "집중 확인 항목 없음"

### JavaScript

```javascript
function renderDashFocus(risk) {
    if (!risk || risk.length === 0) return;
    const latest = risk[0];
    const el = document.getElementById("dash-focus-content");

    const focus = (latest.focus || []).filter(Boolean);
    if (focus.length === 0) {
        el.innerHTML = `<div class="dash-empty">집중 확인 항목 없음</div>`;
        return;
    }

    el.innerHTML = focus.map((f, i) => `
        <div class="dash-focus-item">
            <span class="dash-focus-num">${i + 1}</span>
            <span class="dash-focus-txt">${f}</span>
        </div>
    `).join("");
}
```

---

## 9. 하단 4섹션 — 영업보고

### 구성 규칙
- 최신 주차 총 건수 표시
- [수주]/[세종] 태그 포함 항목만 필터링 표시
- 태그 없는 주차는 "수주/세종 연관 건 없음"

```javascript
function renderDashSales(sales) {
    if (!sales || sales.length === 0) return;
    const latest = sales[0];
    const el = document.getElementById("dash-sales-content");
    document.getElementById("dash-sales-week").textContent = latest.label || "";

    let html = `<div class="dash-sales-total">이번 주 총 ${latest.total}건 영업 접촉</div>`;

    const tagged = (latest.clients || []).filter(
        c => c.includes("[수주]") || c.includes("[세종]")
    );

    if (tagged.length > 0) {
        html += tagged.map(c => {
            const text = c
                .replace("[수주]", '<span class="tag tag-win">수주</span>')
                .replace("[세종]", '<span class="tag tag-sejong">세종</span>');
            return `<div class="dash-sale-item">${text}</div>`;
        }).join("");
    } else {
        html += `<div class="dash-empty">수주/세종 연관 건 없음</div>`;
    }

    el.innerHTML = html;
}
```

---

## 10. 하단 4섹션 — 세미나 알림

### 구성 규칙
- 최신 주차 nearby + others 합쳐서 최대 4건
- 근거리 행사 날짜 칩 초록색 강조
- no_event=true 이면 "신규 행사 없음"

```javascript
function renderDashSeminar(seminar) {
    if (!seminar || seminar.length === 0) return;
    const latest = seminar[0];
    const el = document.getElementById("dash-seminar-content");

    if (latest.no_event) {
        el.innerHTML = `<div class="dash-empty">신규 행사 없음</div>`;
        return;
    }

    const all = [
        ...(latest.nearby || []).map(e => ({ ...e, isNear: true })),
        ...(latest.others || []),
    ];

    el.innerHTML = all.slice(0, 4).map(e => `
        <div class="dash-sem-item">
            <div class="dash-sem-date ${e.isNear ? "dash-sem-near" : ""}">
                <div>${e.date?.slice(5, 7)}월</div>
                <div class="dash-sem-day">${e.date?.slice(8, 10)}</div>
            </div>
            <div>
                <div class="dash-sem-name">${e.name}</div>
                <div class="dash-sem-loc">${e.place}${e.isNear ? " · 근거리" : ""}</div>
            </div>
        </div>
    `).join("");
}
```

---

## 11. HTML 구조 (index.html)

```html
<div id="tab-dashboard" class="tab-content active">
  <div class="page-header">
    <div>
      <h1 class="page-title">대시보드</h1>
      <p class="page-sub">세종개발본부 종합 현황 — 실시간 노션 연동</p>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <span class="week-chip" id="dash-week-label">—</span>
      <button class="refresh-btn" onclick="loadDashboard(true)">↻ 새로고침</button>
    </div>
  </div>

  <!-- KPI 5개 -->
  <div class="dash-kpi-row">
    <div class="dash-kpi" data-color="blue">
      <div class="dash-kpi-label">수행 사업</div>
      <div class="dash-kpi-value" id="dash-kpi-projects">—</div>
      <div class="dash-kpi-sub">준비중 제외</div>
    </div>
    <div class="dash-kpi" data-color="green">
      <div class="dash-kpi-label">총 매출액</div>
      <div class="dash-kpi-value" id="dash-kpi-revenue">—</div>
      <div class="dash-kpi-sub">진행중 기준</div>
    </div>
    <div class="dash-kpi" data-color="amber">
      <div class="dash-kpi-label">팀 인원</div>
      <div class="dash-kpi-value" id="dash-kpi-members">—</div>
      <div class="dash-kpi-sub">정직원 기준</div>
    </div>
    <div class="dash-kpi" data-color="purple">
      <div class="dash-kpi-label">이번주 영업</div>
      <div class="dash-kpi-value" id="dash-kpi-sales">—</div>
      <div class="dash-kpi-sub" id="dash-kpi-sales-sub">—</div>
    </div>
    <div class="dash-kpi" data-color="amber">
      <div class="dash-kpi-label">준비중 사업</div>
      <div class="dash-kpi-value" id="dash-kpi-ready">—</div>
      <div class="dash-kpi-sub">매출 미반영</div>
    </div>
  </div>

  <!-- 상단 2컬럼: 수행사업 | 인력현황 -->
  <div class="dash-grid-2" style="margin-bottom:12px;">

    <div class="dash-card">
      <div class="dash-card-hd">
        <div class="dash-accent" style="background:#3b82f6;"></div>
        <span class="dash-card-title">수행 사업 현황</span>
        <span class="dash-card-more" onclick="switchTab('projects')">더보기 →</span>
      </div>
      <div class="dash-card-bd" id="dash-projects-list"></div>
    </div>

    <div class="dash-card">
      <div class="dash-card-hd">
        <div class="dash-accent" style="background:#f59e0b;"></div>
        <span class="dash-card-title">사업별 인력 현황</span>
        <span class="dash-card-more" onclick="switchTab('org')">더보기 →</span>
      </div>
      <div class="dash-card-bd" id="dash-org-content"></div>
    </div>

  </div>

  <!-- 하단 4섹션: 2+2 그리드 -->
  <div class="dash-grid-4">

    <div class="dash-card">
      <div class="dash-card-hd">
        <div class="dash-accent" style="background:#ef4444;"></div>
        <span class="dash-card-title">RISK 알림</span>
        <span class="dash-card-week" id="dash-risk-week">—</span>
        <span class="dash-card-more" onclick="switchTab('risk')">더보기 →</span>
      </div>
      <div class="dash-card-bd" id="dash-risk-content"></div>
    </div>

    <div class="dash-card">
      <div class="dash-card-hd">
        <div class="dash-accent" style="background:#3b82f6;"></div>
        <span class="dash-card-title">주간회의 집중 확인</span>
        <span class="dash-card-more" onclick="switchTab('weekly')">더보기 →</span>
      </div>
      <div class="dash-card-bd" id="dash-focus-content"></div>
    </div>

    <div class="dash-card">
      <div class="dash-card-hd">
        <div class="dash-accent" style="background:#8b5cf6;"></div>
        <span class="dash-card-title">영업보고</span>
        <span class="dash-card-week" id="dash-sales-week">—</span>
        <span class="dash-card-more" onclick="switchTab('sales')">더보기 →</span>
      </div>
      <div class="dash-card-bd" id="dash-sales-content"></div>
    </div>

    <div class="dash-card">
      <div class="dash-card-hd">
        <div class="dash-accent" style="background:#22c55e;"></div>
        <span class="dash-card-title">세미나 알림</span>
        <span class="dash-card-more" onclick="switchTab('seminar')">더보기 →</span>
      </div>
      <div class="dash-card-bd" id="dash-seminar-content"></div>
    </div>

  </div>
</div>
```

---

## 12. CSS 추가 (style.css)

```css
/* ── PHASE 10: 대시보드 ──────────────────────────────── */

/* KPI */
.dash-kpi-row {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 10px; margin-bottom: 12px;
}
.dash-kpi {
    background: #fff; border: 0.5px solid #E5E7EB; border-radius: 8px;
    padding: 14px 16px; position: relative; overflow: hidden;
}
.dash-kpi::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
}
.dash-kpi[data-color="blue"]::before   { background:#3b82f6; }
.dash-kpi[data-color="green"]::before  { background:#22c55e; }
.dash-kpi[data-color="amber"]::before  { background:#f59e0b; }
.dash-kpi[data-color="purple"]::before { background:#8b5cf6; }
.dash-kpi-label { font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.dash-kpi-value { font-size:24px; font-weight:700; color:#0F172A; margin:4px 0 2px; }
.dash-kpi-sub   { font-size:10px; color:#94a3b8; }

/* 주차 칩 */
.week-chip {
    font-size:11px; font-weight:600;
    background:#EBF5FF; color:#185FA5;
    border:0.5px solid #BFDBFE;
    padding:4px 12px; border-radius:20px;
}

/* 그리드 */
.dash-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.dash-grid-4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; }

/* 카드 공통 */
.dash-card { background:#fff; border:0.5px solid #E5E7EB; border-radius:8px; overflow:hidden; }
.dash-card-hd {
    padding:10px 14px; border-bottom:0.5px solid #E5E7EB;
    display:flex; align-items:center; gap:8px;
}
.dash-accent     { width:3px; height:16px; border-radius:2px; flex-shrink:0; }
.dash-card-title { font-size:12px; font-weight:600; color:#0F172A; flex:1; }
.dash-card-week  { font-size:10px; color:#94a3b8; }
.dash-card-more  { font-size:11px; color:#185FA5; cursor:pointer; }
.dash-card-more:hover { text-decoration:underline; }
.dash-card-bd    { padding:12px 14px; }

/* 수행 사업 목록 */
.dash-proj-row {
    display:flex; align-items:center; gap:8px;
    padding:5px 0; border-bottom:0.5px solid #F8FAFC; font-size:12px;
}
.dash-proj-row:last-child { border:none; }
.dash-proj-dot   { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.dash-proj-name  { flex:1; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dash-proj-pm    { color:#94a3b8; font-size:11px; width:36px; }
.dash-proj-amt   { font-weight:600; color:#0F172A; font-size:12px; }
.dash-proj-sep {
    font-size:10px; color:#a16207; font-weight:600;
    padding:5px 0 4px; margin-top:2px;
    border-top:0.5px dashed #fde047;
    border-bottom:0.5px dashed #fde047;
}
.dash-proj-ready { background:#fffdf0; }
.dash-est { font-size:9px; color:#94a3b8; margin-left:2px; font-weight:400; }

/* 인력 현황 */
.dash-org-wrap  { display:flex; align-items:center; gap:14px; }
.dash-pie-wrap  { width:80px; height:80px; flex-shrink:0; }
.dash-org-legend { flex:1; display:flex; flex-direction:column; gap:5px; }
.dash-org-leg   { display:flex; align-items:center; gap:6px; }
.dash-org-dot   { width:7px; height:7px; border-radius:2px; flex-shrink:0; }
.dash-org-name  { font-size:11px; color:#475569; flex:1; }
.dash-org-cnt   { font-size:11px; font-weight:600; color:#0F172A; width:24px; }
.dash-org-bar-bg   { width:50px; height:4px; background:#F1F5F9; border-radius:2px; overflow:hidden; }
.dash-org-bar-fill { height:100%; border-radius:2px; }

/* RISK */
.dash-risk-item { display:flex; gap:7px; padding:5px 0; border-bottom:0.5px solid #F8FAFC; align-items:flex-start; }
.dash-risk-item:last-child { border:none; }
.dash-risk-lv   { font-size:9px; font-weight:700; padding:2px 5px; border-radius:3px; flex-shrink:0; margin-top:1px; }
.lv-long  { background:rgba(249,115,22,.12); color:#f97316; border:0.5px solid rgba(249,115,22,.2); }
.lv-bad   { background:rgba(239,68,68,.12);  color:#ef4444; border:0.5px solid rgba(239,68,68,.2); }
.lv-sched { background:rgba(234,179,8,.12);  color:#d97706; border:0.5px solid rgba(234,179,8,.2); }
.lv-miss  { background:rgba(139,92,246,.12); color:#8b5cf6; border:0.5px solid rgba(139,92,246,.2); }
.dash-risk-txt  { font-size:11px; color:#475569; line-height:1.5; }

/* 주간회의 집중 확인 */
.dash-focus-item { display:flex; gap:8px; padding:5px 0; border-bottom:0.5px solid #F8FAFC; align-items:flex-start; }
.dash-focus-item:last-child { border:none; }
.dash-focus-num  { font-size:11px; font-weight:700; color:#185FA5; flex-shrink:0; width:14px; }
.dash-focus-txt  { font-size:11px; color:#334155; line-height:1.5; }

/* 영업보고 */
.dash-sales-total { font-size:11px; color:#64748b; margin-bottom:8px; padding-bottom:6px; border-bottom:0.5px solid #F1F5F9; }
.dash-sale-item   { font-size:11px; color:#475569; padding:4px 0; border-bottom:0.5px solid #F8FAFC; line-height:1.5; }
.dash-sale-item:last-child { border:none; }

/* 세미나 */
.dash-sem-item  { display:flex; gap:10px; padding:6px 0; border-bottom:0.5px solid #F8FAFC; align-items:center; }
.dash-sem-item:last-child { border:none; }
.dash-sem-date  {
    width:36px; height:36px; border-radius:6px; flex-shrink:0;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    background:#F1F5F9; color:#64748b; font-size:9px; font-weight:600; line-height:1.2;
}
.dash-sem-near  { background:#ECFDF5; color:#16a34a; }
.dash-sem-day   { font-size:15px; font-weight:700; }
.dash-sem-name  { font-size:12px; color:#0F172A; font-weight:500; }
.dash-sem-loc   { font-size:10px; color:#94a3b8; margin-top:1px; }

/* 공통 */
.dash-empty { font-size:12px; color:#94a3b8; font-style:italic; padding:6px 0; }
```

---

## 13. loadDashboard 함수

```javascript
async function loadDashboard(forceRefresh = false) {
    const ref = forceRefresh ? 1 : 0;
    try {
        const [projects, risk, sales, seminar, org] = await Promise.all([
            fetch(`/api/projects`).then(r => r.json()),
            fetch(`/api/risk?refresh=${ref}`).then(r => r.json()),
            fetch(`/api/sales?refresh=${ref}`).then(r => r.json()),
            fetch(`/api/seminar?refresh=${ref}`).then(r => r.json()),
            fetch(`/api/org?refresh=${ref}`).then(r => r.json()),
        ]);

        renderDashKPI(projects, sales);
        renderDashProjects(projects);
        renderDashOrg(org);
        renderDashRisk(risk);
        renderDashFocus(risk);
        renderDashSales(sales);
        renderDashSeminar(seminar);

    } catch(e) {
        console.error("대시보드 로딩 실패:", e);
    }
}
```

---

## 14. 개발 원칙

1. **기존 API 재활용** — app.py 수정 없음
2. **Phase 1~9 코드 건드리지 않음**
3. **Promise.all 동시 호출** — 로딩 속도 최적화
4. **RISK 최대 5건** — 대시보드는 요약 표시
5. **집중확인은 별도 카드** — RISK 카드에서 분리
6. **더보기 클릭 시 해당 탭 이동** — switchTab() 활용
7. **대시보드가 기본 진입 탭** — DOMContentLoaded 시 loadDashboard() 호출

---

## 15. 클로드 코드 프롬프트

```
현재 app.py, templates/index.html, static/main.js, static/style.css 파일 읽고
Phase 10 대시보드 탭을 추가해줘.

docs/PRD_Phase10_대시보드.md 참고.

추가 내용:
1. 사이드 메뉴 최상단에 "대시보드" 항목 추가 (data-tab="dashboard")
   - 앱 최초 진입 시 대시보드가 기본 활성 탭 (기존 첫 탭 비활성화)

2. index.html에 tab-dashboard 컨텐츠 영역 추가
   - KPI 5개: 수행사업/총매출/팀인원/이번주영업/준비중사업
   - 상단 2컬럼: 수행사업현황(준비중 하단 구분) | 사업별 인력현황(파이차트)
   - 하단 4섹션: RISK알림(최대5건) | 주간회의 집중확인 | 영업보고 | 세미나알림

3. main.js에 함수 추가
   - loadDashboard(forceRefresh): Promise.all로 5개 API 동시 호출
   - renderDashKPI, renderDashProjects, renderDashOrg
   - renderDashRisk(최대5건), renderDashFocus(별도), renderDashSales, renderDashSeminar
   - DOMContentLoaded 시 loadDashboard() 자동 호출

4. style.css에 대시보드 전용 클래스 추가

반드시 지켜야 할 것:
- app.py 건드리지 마
- Phase 1~9 코드 절대 건드리지 마
- switchTab 함수 재활용
- canvas 파이차트는 requestAnimationFrame 사용
- 한국어 주석 포함
```

---

*작성: 익스 + Claude | 2026.06.07 v2 | AX Sejong Command Phase 10*
