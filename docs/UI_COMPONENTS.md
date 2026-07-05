# UI_COMPONENTS.md — AX Sejong Command
> 작성: 익스 + Claude | 2026.05.10  
> 용도: 아테나 코드에게 컴포넌트를 정확하게 전달하기 위한 카탈로그  
> 사용법: 새 기능 추가 시 이 파일을 @멘션으로 참조

---

## 사용 방법

아테나 코드에 이렇게 입력하면 됩니다.

```
@docs/UI_COMPONENTS.md

PM 주간회의 탭에
KPI 박스 3개와 테이블을 추가해줘.
컴포넌트는 이 파일의 스펙 그대로 사용해줘.
```

---

## 1. KPI 박스

### 기본 구조
```html
<div class="kpi-grid">
    <div class="kpi-card [색상변형]">
        <div class="kpi-label">[레이블]</div>
        <div class="kpi-value" id="[고유ID]">—</div>
        <div class="kpi-sub">[서브텍스트]</div>
    </div>
</div>
```

### 색상 변형 클래스
| 클래스 | 숫자 색상 | 용도 |
|--------|---------|------|
| `kpi-blue` | #185FA5 | 총계, 기본 수치 |
| `kpi-green` | #3B6D11 | 긍정적 수치 (매출, 완료) |
| `kpi-red` | #A32D2D | 위험, 종료, 이슈 |
| `kpi-amber` | #854F0B | 주의, 지연 |
| (없음) | #0F172A | 일반 수치 |

### 4개 예시 (세종사업현황 기준)
```html
<div class="kpi-grid">
    <div class="kpi-card kpi-blue">
        <div class="kpi-label">총 수행 사업</div>
        <div class="kpi-value" id="kpi-total">—</div>
        <div class="kpi-sub">2026년 기준</div>
    </div>
    <div class="kpi-card kpi-green">
        <div class="kpi-label">총 매출액</div>
        <div class="kpi-value" id="kpi-revenue">—</div>
        <div class="kpi-sub">부가세 제외</div>
    </div>
    <div class="kpi-card">
        <div class="kpi-label">운영중</div>
        <div class="kpi-value" id="kpi-active">—</div>
        <div class="kpi-sub">신규 포함</div>
    </div>
    <div class="kpi-card kpi-red">
        <div class="kpi-label">종료</div>
        <div class="kpi-value" id="kpi-closed">—</div>
        <div class="kpi-sub">5/15 완료</div>
    </div>
</div>
```

### JS에서 KPI 값 업데이트
```javascript
document.getElementById("kpi-total").textContent = 6;
document.getElementById("kpi-revenue").textContent = "50.3억";
document.getElementById("kpi-active").textContent = 5;
document.getElementById("kpi-closed").textContent = 1;
```

---

## 2. 테이블

### 기본 구조
```html
<div class="table-wrap">
    <div class="table-header">
        <span class="table-title">[테이블 제목]</span>
        <span class="table-count" id="[카운트ID]">—건</span>
    </div>
    <div class="table-container">
        <table class="projects-table">
            <colgroup>
                <!-- 컬럼 너비 합계 = 100% -->
                <col style="width:32%">
                <col style="width:17%">
                <col style="width:9%">
                <col style="width:12%">
                <col style="width:17%">
                <col style="width:13%">
            </colgroup>
            <thead>
                <tr>
                    <th>[컬럼1]</th>
                    <th>[컬럼2]</th>
                    ...
                </tr>
            </thead>
            <tbody id="[tbody ID]">
                <tr>
                    <td colspan="[컬럼수]" class="loading-cell">데이터를 불러오는 중...</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
```

### 테이블 행 (툴팁 있는 버전)
```html
<tr>
    <!-- 사업명: 마우스오버 툴팁 포함 -->
    <td class="name-cell"
        data-name="[사업명 전체]"
        data-client="[고객사]"
        data-target="[운영대상]"
        data-summary="[사업요약]">
        <span class="name-text">[사업명 표시용]</span>
    </td>
    <td class="td-muted">[고객사]</td>
    <td>[PM]</td>
    <td class="td-money">[매출액]</td>
    <td class="td-muted">[계약기간]</td>
    <td>[상태배지]</td>
</tr>
```

### 테이블 행 (툴팁 없는 버전)
```html
<tr>
    <td>[내용]</td>
    <td class="td-muted">[보조 텍스트]</td>
    <td class="td-money">[숫자]</td>
</tr>
```

### td 클래스
| 클래스 | 용도 |
|--------|------|
| `td-muted` | 보조 텍스트 (색상 흐리게) |
| `td-money` | 숫자 (tabular-nums) |
| `name-cell` | 툴팁 트리거 셀 |

---

## 3. 상태 배지

### HTML
```html
<!-- 운영중 — 초록 -->
<span class="status-badge badge-green">운영중</span>

<!-- 신규 — 파란 -->
<span class="status-badge badge-blue">신규</span>

<!-- 종료 — 회색 -->
<span class="status-badge badge-gray">종료</span>

<!-- 종료예정 — 주황 -->
<span class="status-badge badge-amber">종료예정</span>

<!-- 이슈/위험 — 빨간 -->
<span class="status-badge badge-red">이슈</span>
```

### JS renderBadge() 패턴
```javascript
function renderBadge(status) {
    const map = {
        "운영중":   '<span class="status-badge badge-green">운영중</span>',
        "신규":     '<span class="status-badge badge-blue">신규</span>',
        "종료":     '<span class="status-badge badge-gray">종료</span>',
        "종료예정": '<span class="status-badge badge-amber">종료예정</span>',
        "이슈":     '<span class="status-badge badge-red">이슈</span>',
    };
    return map[status] || `<span class="status-badge badge-gray">${status || "—"}</span>`;
}
```

---

## 4. 툴팁

### 동작 방식
- `name-cell` 클래스를 가진 td에 마우스 오버 시 표시
- `data-name`, `data-client`, `data-target`, `data-summary` 속성값을 읽어서 표시
- body 레벨의 `#tooltip-box` div에 렌더링 (overflow 영향 없음)
- `position: fixed` + `getBoundingClientRect()`로 위치 계산

### HTML (index.html body 하단에 필수)
```html
<div id="tooltip-box" class="tooltip-box"></div>
```

### JS initTooltip() 패턴
```javascript
function initTooltip() {
    const box = document.getElementById("tooltip-box");
    if (!box) return;

    document.addEventListener("mouseover", e => {
        const cell = e.target.closest(".name-cell");
        if (!cell) { box.classList.remove("visible"); return; }

        const name    = cell.dataset.name    || "—";
        const client  = cell.dataset.client  || "—";
        const target  = cell.dataset.target  || "—";
        const summary = cell.dataset.summary || "—";

        box.innerHTML = `
            <div class="tooltip-title">${name}</div>
            <div class="tooltip-row"><b>고객사</b>${client}</div>
            <div class="tooltip-row"><b>운영대상</b>${target}</div>
            <div class="tooltip-row"><b>요약</b>${summary}</div>
        `;

        const r = cell.getBoundingClientRect();
        let left = r.left;
        let top  = r.bottom + 6;
        if (left + 300 > window.innerWidth - 10) left = window.innerWidth - 310;

        box.style.left = left + "px";
        box.style.top  = top  + "px";
        box.classList.add("visible");
    });

    document.addEventListener("mouseout", e => {
        const cell = e.target.closest(".name-cell");
        if (cell && !cell.contains(e.relatedTarget)) {
            box.classList.remove("visible");
        }
    });
}
```

---

## 5. 사이드바 메뉴 아이템

### 기본 메뉴 아이템
```html
<div class="menu-item" data-tab="[탭ID]">
    <i class="ti ti-[아이콘명]"></i>
    <span>[메뉴명]</span>
</div>
```

### 활성 상태
```html
<div class="menu-item active" data-tab="projects">
    <i class="ti ti-layout-dashboard"></i>
    <span>세종사업현황</span>
</div>
```

### 예정(비활성) 상태
```html
<div class="menu-item soon">
    <i class="ti ti-sitemap"></i>
    <span>조직도</span>
    <span class="sidebar-badge">예정</span>
</div>
```

### 자주 쓰는 Tabler 아이콘
| 메뉴 | 아이콘 클래스 |
|------|------------|
| 대시보드 | `ti-layout-dashboard` |
| 보고서 | `ti-report` |
| 경보/알림 | `ti-alert-triangle` |
| 조직도 | `ti-sitemap` |
| 손익/차트 | `ti-chart-line` |
| 실행/재생 | `ti-player-play` |
| 새로고침 | `ti-refresh` |
| 사람 | `ti-user` |
| 달력 | `ti-calendar` |
| 메일 | `ti-mail` |
| 설정 | `ti-settings` |

---

## 6. 탭 전환

### HTML 구조
```html
<!-- 사이드바 메뉴에 data-tab 지정 -->
<div class="menu-item" data-tab="projects">...</div>
<div class="menu-item" data-tab="weekly">...</div>

<!-- 콘텐츠 영역에 tab-content + id 지정 -->
<div id="tab-projects" class="tab-content active">...</div>
<div id="tab-weekly" class="tab-content">...</div>
```

### JS switchTab() 패턴
```javascript
function switchTab(tabName) {
    // 모든 탭 숨기기
    document.querySelectorAll(".tab-content").forEach(t => {
        t.classList.remove("active");
    });
    // 모든 메뉴 비활성
    document.querySelectorAll(".menu-item").forEach(m => {
        m.classList.remove("active");
    });
    // 선택한 탭 활성
    document.getElementById("tab-" + tabName)?.classList.add("active");
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add("active");
}

// 메뉴 클릭 이벤트 등록
document.querySelectorAll(".menu-item[data-tab]").forEach(item => {
    item.addEventListener("click", () => {
        switchTab(item.dataset.tab);
    });
});
```

---

## 7. 빈 상태 (미구현 탭)

```html
<div class="empty-state">
    <i class="ti ti-[아이콘]"></i>
    <p>[설명 텍스트]</p>
</div>
```

```html
<!-- 예시 -->
<div class="empty-state">
    <i class="ti ti-report"></i>
    <p>PM 주간회의 — Phase 2에서 구현 예정</p>
</div>
```

---

## 8. 로딩 / 에러 셀

```html
<!-- 로딩 중 -->
<tr>
    <td colspan="[컬럼수]" class="loading-cell">데이터를 불러오는 중...</td>
</tr>

<!-- 에러 -->
<tr>
    <td colspan="[컬럼수]" class="error-cell">데이터를 불러오지 못했습니다. 새로고침 해주세요.</td>
</tr>
```

---

## 9. 유틸 함수 모음

### 매출액 포맷
```javascript
// 1522800000 → "15.2억" / 5000000 → "500만"
function formatRevenue(amount) {
    if (!amount) return "—";
    const eok = amount / 100_000_000;
    if (eok >= 1) return eok.toFixed(1) + "억";
    return Math.round(amount / 10_000) + "만";
}
```

### 계약기간 포맷
```javascript
// "2026.01.01 ~ 2026.12.31 (12개월)" → "~26.12.31"
function formatPeriod(period) {
    if (!period) return "—";
    const match = period.match(/~\s*(\d{4})\.(\d{2})\.(\d{2})/);
    if (match) return `~${match[1].slice(2)}.${match[2]}.${match[3]}`;
    return period;
}
```

### data 속성 특수문자 이스케이프
```javascript
function escape(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
```

---

## 10. 아테나 코드 활용 프롬프트 예시

### 새 탭 추가 시
```
@docs/UI_COMPONENTS.md @templates/index.html @static/main.js

PM 주간회의 탭(tab-weekly)을 구현해줘.

화면 구성:
- KPI 박스 3개: 총 보고건수(kpi-weekly-total) / 완료(kpi-weekly-done) / 미완료(kpi-weekly-pending)
- 테이블: PM명 / 사업명 / 보고내용 / 상태
- API: GET /api/weekly

컴포넌트는 UI_COMPONENTS.md 스펙 그대로 사용.
style.css는 건드리지 마.
```

### 테이블 컬럼 추가 시
```
@docs/UI_COMPONENTS.md @static/main.js

renderTable() 함수에서
테이블에 "담당부서" 컬럼을 추가해줘.
위치: PM 컬럼 오른쪽.
colgroup 너비도 같이 조정해줘.
다른 함수는 건드리지 마.
```

### KPI 박스 추가 시
```
@docs/UI_COMPONENTS.md @templates/index.html @static/main.js

세종사업현황 탭 KPI에
"종료예정" 박스를 추가해줘.
색상: kpi-amber / ID: kpi-ending
데이터: status === "종료예정" 인 건수.
```

---

*작성: 익스 + Claude | 2026.05.10 | AX Sejong Command Phase 1 완성 기준*
