/**
 * AX Sejong Command - 메인 JavaScript
 * 세종사업현황 대시보드 동작 로직
 */

// 현재 활성 탭 저장
let currentTab = "projects";

// Phase 5: 히스토리 전역 데이터 (탭 전환 후 재렌더링에 사용)
let _historyYears = [];
let _historyChart = null;  // Chart.js 인스턴스 (재생성 전 destroy용)
let _historySummary = [];   // v2.3: KPI용 summary 전역 저장
let _historySelectedYear = null; // v2.3: 현재 선택된 연도

// Phase 6: 조직도 전역 데이터 { projects: [], staff: [] }
let _orgData = null;

// Phase 1 v2: 매출 구성 도넛 차트 인스턴스 (재생성 전 destroy용)
let _revenueDonut = null;

// Phase 10: 대시보드 수행사업 현황 도넛 차트 인스턴스
let _dashProjDonut = null;

// PHASE DL: 현재 탭 다운로드 URL (triggerDownload()에서 사용)
let _downloadUrl      = "";
let _downloadFilename = "";

// 페이지 로드 시 자동 실행
document.addEventListener("DOMContentLoaded", () => {
    initTabs();    // 탭 전환 초기화
    initTooltip();  // 툴팁 초기화
    switchTab("dashboard");  // 초기 탭: 대시보드
});

// 새로고침 버튼 클릭 이벤트
document.getElementById("btn-refresh").addEventListener("click", () => {
    if (currentTab === "dashboard") {
        loadDashboard(true);
    } else if (currentTab === "projects") {
        loadProjects();
    } else if (currentTab === "weekly") {
        const weekSelect = document.getElementById("week-select");
        loadWeekly(parseInt(weekSelect.value), true);
    } else if (currentTab === "monthly") {
        const monthSelect = document.getElementById("month-select");
        loadMonthly(parseInt(monthSelect.value), true);
    } else if (currentTab === "sejong") {
        const sejongSelect = document.getElementById("sejong-month-select");
        loadSejong(parseInt(sejongSelect.value), true);
    } else if (currentTab === "history") {
        // 히스토리 탭 강제 새로고침
        loadHistory(true);
    } else if (currentTab === "org") {
        // Phase 6: 조직도 탭 새로고침 (탭 내부 버튼과 동일 동작)
        loadOrg(1);
    } else if (currentTab === "sales") {
        loadSales(true);
    } else if (currentTab === "risk") {
        loadRisk(true);
    } else if (currentTab === "seminar") {
        loadSeminar(true);
    } else if (currentTab === "profitloss") {
        loadProfitLoss(true);
    }
});

// Phase 5: 그래프 보기/닫기 버튼 클릭
document.getElementById("btn-chart").addEventListener("click", () => {
    const area   = document.getElementById("chart-area");
    const btn    = document.getElementById("btn-chart");
    const isOpen = area.classList.toggle("chart-open");
    btn.textContent = isOpen ? "📊 그래프 닫기" : "📊 그래프 보기";
    // 열릴 때만 차트 렌더링 (연도별 총매출/운영/개발 집계 사용)
    if (isOpen && _historyYears.length > 0) drawChart(_historyYears);
});

// v2.3: 컬러풀 토글
document.getElementById("btn-hist-colorful").addEventListener("click", () => {
    document.body.classList.toggle("hist-colorful");
    const on = document.body.classList.contains("hist-colorful");
    document.getElementById("btn-hist-colorful").textContent = on ? "🌙 다크모드 ON" : "☀️ 다크모드 OFF";
});

/* ───────────────────────────────
   툴팁 초기화 — position:fixed JS 방식
   (overflow:hidden 영향 없이 항상 표시됨)
─────────────────────────────── */
function initTooltip() {
    const box = document.getElementById("tooltip-box");
    if (!box) return;

    // 마우스 이동 시 사업명 셀 감지
    document.addEventListener("mouseover", e => {
        const cell = e.target.closest(".name-cell");
        if (!cell) {
            box.classList.remove("visible");
            return;
        }

        // data 속성에서 툴팁 내용 가져오기
        const name    = cell.dataset.name    || "—";
        const client  = cell.dataset.client  || "—";
        const target  = cell.dataset.target  || "—";
        const summary = cell.dataset.summary || "—";

        // 툴팁 내용 채우기
        box.innerHTML = `
            <div class="tooltip-title">${name}</div>
            <div class="tooltip-row"><b>고객사</b>${client}</div>
            <div class="tooltip-row"><b>운영대상</b>${target}</div>
            <div class="tooltip-row"><b>요약</b>${summary}</div>
        `;

        // 위치 계산 (셀 아래쪽)
        const r = cell.getBoundingClientRect();
        let left = r.left;
        let top  = r.bottom + 6;

        // 화면 오른쪽 넘치면 왼쪽으로 당기기
        if (left + 300 > window.innerWidth - 10) {
            left = window.innerWidth - 310;
        }

        box.style.left = left + "px";
        box.style.top  = top  + "px";
        box.classList.add("visible");
    });

    // 사업명 셀 벗어나면 툴팁 숨기기
    document.addEventListener("mouseout", e => {
        const cell = e.target.closest(".name-cell");
        if (cell && !cell.contains(e.relatedTarget)) {
            box.classList.remove("visible");
        }
    });
}

/* ───────────────────────────────
   데이터 로딩
─────────────────────────────── */
async function loadProjects() {
    const btn   = document.getElementById("btn-refresh");
    const tbody = document.getElementById("projects-tbody");

    // 로딩 표시
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="loading-cell">데이터를 불러오는 중...</td>
        </tr>
    `;
    btn.disabled = true;
    btn.innerHTML = '<i class="ti ti-refresh"></i> 로딩 중...';

    try {
        const [response, historyRes] = await Promise.all([
            fetch("/api/projects"),
            fetch("/api/history"),
        ]);
        const result  = await response.json();
        const history = await historyRes.json();

        if (result.success) {
            renderKPI(result.data, history);
            renderTable(result.data);
        } else {
            showError("데이터를 불러오지 못했습니다. 새로고침 해주세요.");
        }
    } catch (e) {
        showError("서버 연결에 실패했습니다. app.py가 실행 중인지 확인해주세요.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-refresh"></i> 새로고침';
    }
}

/* ───────────────────────────────
   KPI 박스 렌더링
─────────────────────────────── */
function renderKPI(projects, history) {
    // 준비중 분리
    const active = projects.filter(p => p.status !== "준비중");
    const ready  = projects.filter(p => p.status === "준비중");

    // 총 수행 사업 (준비중 제외)
    document.getElementById("kpi-total").textContent = active.length;

    // 총 매출액 (준비중 제외, 억 단위 변환)
    const activeRevenue = active.reduce((sum, p) => sum + (p.revenue || 0), 0);
    document.getElementById("kpi-revenue").textContent =
        (activeRevenue / 100_000_000).toFixed(1) + "억";

    // 전년대비 서브텍스트 (빨간색)
    const yoyText = getLatestYoYText(history);
    const subEl   = document.getElementById("kpi-revenue-sub");
    if (subEl && yoyText) {
        subEl.innerHTML = yoyText;
        subEl.style.color      = "#DC2626";
        subEl.style.fontWeight = "600";
        subEl.style.fontSize   = "11px";
    }

    // 진행중 (운영중 + 신규 포함)
    document.getElementById("kpi-active").textContent = active.filter(
        p => p.status === "운영중" || p.status === "신규"
    ).length;

    // 종료
    document.getElementById("kpi-closed").textContent = active.filter(
        p => p.status === "종료"
    ).length;

    // 준비중
    document.getElementById("kpi-ready").textContent = ready.length;

    // 인사이트 영역: 사업이 있을 때만 표시
    const insight = document.getElementById("projects-insight");
    if (insight && active.length > 0) {
        insight.style.display = "grid";
        renderRevenueDonut(active);
        renderReadyCards(ready, activeRevenue);
    }
}

/* ───────────────────────────────
   테이블 렌더링
   - 준비중 제외 사업 먼저, 이후 구분선 + 준비중 행
   - name-cell 에 data-* 속성으로 툴팁 데이터 저장
─────────────────────────────── */
function renderTable(projects) {
    const tbody  = document.getElementById("projects-tbody");
    tbody.innerHTML = "";

    const active = projects.filter(p => p.status !== "준비중");
    const ready  = projects.filter(p => p.status === "준비중");

    // 준비중 제외 사업 렌더링
    active.forEach(project => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="name-cell"
                data-name="${escape(project.name)}"
                data-client="${escape(project.client)}"
                data-target="${escape(project.target)}"
                data-summary="${escape(project.summary)}">
                <span class="name-text">${project.name || "—"}</span>
            </td>
            <td class="td-muted">${project.client  || "—"}</td>
            <td>${project.pm || "—"}</td>
            <td class="td-money">${formatRevenue(project.revenue)}</td>
            <td class="td-muted">${formatPeriod(project.period)}</td>
            <td>${renderBadge(project.status)}</td>
        `;
        tbody.appendChild(tr);
    });

    // 준비중 사업이 있으면 구분선 행 + 준비중 행 추가
    if (ready.length > 0) {
        const divTr = document.createElement("tr");
        divTr.className = "ready-divider";
        divTr.innerHTML = `<td colspan="6">▼ 준비중 사업 — 매출 총액 미반영</td>`;
        tbody.appendChild(divTr);

        ready.forEach(project => {
            const tr = document.createElement("tr");
            tr.className = "row-ready";
            const revText = project.revenue
                ? formatRevenue(project.revenue) + " (예상)"
                : "—";
            tr.innerHTML = `
                <td class="name-cell"
                    data-name="${escape(project.name)}"
                    data-client="${escape(project.client)}"
                    data-target="${escape(project.target)}"
                    data-summary="${escape(project.summary)}">
                    <span class="name-text">${project.name || "—"}</span>
                </td>
                <td class="td-muted">${project.client  || "—"}</td>
                <td>${project.pm || "—"}</td>
                <td class="td-money">${revText}</td>
                <td class="td-muted">${formatPeriod(project.period)}</td>
                <td>${renderBadge(project.status)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 건수 배지 업데이트 (전체 건수)
    document.getElementById("project-count").textContent = projects.length + "건";
}

/* ───────────────────────────────
   상태 배지 렌더링
─────────────────────────────── */
function renderBadge(status) {
    const map = {
        "진행중": '<span class="status-badge badge-blue">진행중</span>',
        "종료":   '<span class="status-badge badge-red">종료</span>',
        "예정":   '<span class="status-badge badge-green">예정</span>',
        "준비중": '<span class="status-badge badge-ready">준비중</span>',
    };
    return map[status] || `<span class="status-badge badge-gray">${status || "—"}</span>`;
}

/* ───────────────────────────────
   매출 구성 도넛 차트 렌더링
   - 준비중 제외 사업만 대상
   - 중앙에 총 매출액 표시, 우측에 범례
─────────────────────────────── */
function renderRevenueDonut(activeProjects) {
    // 매출액이 있는 사업만 차트에 포함
    const withRevenue = activeProjects.filter(p => p.revenue > 0);
    if (withRevenue.length === 0) return;

    const total = withRevenue.reduce((sum, p) => sum + p.revenue, 0);

    // 사업별 색상 팔레트
    const COLORS = [
        "#4A9EE0", "#3B6D11", "#185FA5", "#854F0B",
        "#A32D2D", "#6366F1", "#0891B2", "#059669",
        "#D97706", "#DC2626"
    ];

    const labels = withRevenue.map(p => p.name);
    const data   = withRevenue.map(p => p.revenue);
    const colors = withRevenue.map((_, i) => COLORS[i % COLORS.length]);

    // 기존 차트 destroy 후 재생성
    if (_revenueDonut) { _revenueDonut.destroy(); _revenueDonut = null; }

    const canvas = document.getElementById("revenue-donut");
    if (!canvas) return;

    _revenueDonut = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: "#fff",
            }]
        },
        options: {
            cutout: "65%",
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { duration: 400 },
        }
    });

    // 중앙 총 매출액 표시
    const centerEl = document.getElementById("donut-center");
    if (centerEl) {
        const eok = total / 100_000_000;
        centerEl.innerHTML = eok >= 1
            ? eok.toFixed(1) + "억"
            : Math.round(total / 10_000) + "만";
    }

    // 범례 렌더링: dot + 사업명 전체 표시(줄바꿈 허용) + 매출+% + 하단 합계
    const legendEl = document.getElementById("donut-legend");
    if (legendEl) {
        const items = withRevenue.map((p, i) => {
            const pct = ((p.revenue / total) * 100).toFixed(0);
            return `
                <div class="legend-item">
                    <span class="legend-dot" style="background:${colors[i]}"></span>
                    <span class="legend-name">${escape(p.name)}</span>
                    <span class="legend-val">${formatRevenue(p.revenue)}</span>
                    <span class="legend-pct">${pct}%</span>
                </div>
            `;
        }).join("");

        // 하단 합계 행 (볼드, 붉은색, 큰 폰트)
        const totalEok = (total / 100_000_000).toFixed(1) + "억";
        const totalRow = `
            <div class="legend-total">
                합계 <span class="legend-total-val">${totalEok}</span>
            </div>
        `;
        legendEl.innerHTML = items + totalRow;
    }
}

/* ───────────────────────────────
   준비중 사업 현황 카드 렌더링
─────────────────────────────── */
function renderReadyCards(readyProjects, activeRevenue) {
    const cardsEl  = document.getElementById("ready-cards");
    const footerEl = document.getElementById("ready-footer");
    if (!cardsEl) return;

    if (readyProjects.length === 0) {
        cardsEl.innerHTML = `<div style="font-size:11px;color:#94A3B8;padding:8px 0;">준비중 사업 없음</div>`;
        if (footerEl) footerEl.innerHTML = "";
        return;
    }

    cardsEl.innerHTML = readyProjects.map(p => `
        <div class="ready-card">
            <div class="ready-card-name">${escape(p.name)}</div>
            <div class="ready-card-meta">
                <span>고객사: ${escape(p.client || "—")}</span>
                <span>PM: ${escape(p.pm || "—")}</span>
                ${p.period ? `<span>기간: ${escape(p.period)}</span>` : ""}
            </div>
            ${p.revenue ? `<div class="ready-card-revenue">예상 매출: ${formatRevenue(p.revenue)}</div>` : ""}
        </div>
    `).join("");

    // 수주 확정 시 예상 총액 = 현재 + 준비중 합산
    if (footerEl) {
        const readyRevenue   = readyProjects.reduce((sum, p) => sum + (p.revenue || 0), 0);
        const combined       = (activeRevenue + readyRevenue) / 100_000_000;
        const combinedText   = combined.toFixed(1) + "억";
        footerEl.innerHTML   = `수주 확정 시 예상 총액 = 현재 + 준비중 합산 <strong>${combinedText}</strong>`;
    }
}

/* ───────────────────────────────
   매출액 포맷 변환
   예: 1522800000 → "15.2억" / 5000000 → "500만"
─────────────────────────────── */
function formatRevenue(amount) {
    if (!amount) return "—";
    const eok = amount / 100_000_000;
    if (eok >= 1) return eok.toFixed(1) + "억";
    return Math.round(amount / 10_000) + "만";
}

/* ───────────────────────────────
   계약기간 포맷 변환
   예: "2026.01.01 ~ 2026.12.31 (12개월)" → "~26.12.31"
─────────────────────────────── */
function formatPeriod(period) {
    if (!period) return "—";
    const match = period.match(/~\s*(\d{4})\.(\d{2})\.(\d{2})/);
    if (match) return `~${match[1].slice(2)}.${match[2]}.${match[3]}`;
    return period;
}

/* ───────────────────────────────
   특수문자 이스케이프 (data 속성용)
─────────────────────────────── */
function escape(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* ───────────────────────────────
   에러 메시지 표시
─────────────────────────────── */
function showError(message) {
    document.getElementById("projects-tbody").innerHTML = `
        <tr>
            <td colspan="6" class="error-cell">${message}</td>
        </tr>
    `;
}

/* ───────────────────────────────
   탭 전환 기능
────────────────────────────── */
function initTabs() {
    // 모든 메뉴 아이템에 클릭 이벤트 등록
    document.querySelectorAll(".menu-item[data-tab]").forEach(item => {
        item.addEventListener("click", () => {
            const tabName = item.dataset.tab;
            switchTab(tabName);
            // 모바일: 탭 전환 시 사이드바 닫기
            if (window.innerWidth <= 767) closeSidebar();
        });
    });
}

function switchTab(tabName) {
    console.log("[DEBUG] switchTab 호출됨, tabName:", tabName);
    currentTab = tabName;
    
    // 모든 탭 숨기기
    document.querySelectorAll(".tab-content").forEach(t => {
        t.classList.remove("active");
    });
    // 모든 메뉴 비활성
    document.querySelectorAll(".menu-item").forEach(m => {
        m.classList.remove("active");
    });
    
    // 선택한 탭 활성
    const tabElement = document.getElementById("tab-" + tabName);
    const menuItem = document.querySelector(`[data-tab="${tabName}"]`);
    
    console.log("[DEBUG] tabElement:", tabElement);
    console.log("[DEBUG] menuItem:", menuItem);
    
    if (tabElement) tabElement.classList.add("active");
    if (menuItem) menuItem.classList.add("active");
    
    console.log("[DEBUG] tabElement.classList:", tabElement?.classList?.toString());
    console.log("[DEBUG] menuItem.classList:", menuItem?.classList?.toString());
    
    // 탭별 초기화
    const allSelects = ["week-select", "month-select", "sejong-month-select"];

    // Phase 5: 그래프 버튼 숨김 (항상 표시), 다크모드 토글은 히스토리 탭에서만
    document.getElementById("btn-chart").style.display = "none";
    document.getElementById("btn-hist-colorful").style.display = tabName === "history" ? "flex" : "none";
    // Phase 6: 조직도 탭은 내부 버튼 사용 → 전역 새로고침 버튼 숨김
    document.getElementById("btn-refresh").style.display = tabName === "org" ? "none" : "flex";

    // PHASE DL: 다운로드 버튼 표시 여부 및 URL 설정
    const DL_TABS = ["dashboard","projects","weekly","monthly","history","org","sales","profitloss"];
    const dlBtn = document.getElementById("btn-download");
    if (dlBtn) {
        if (DL_TABS.includes(tabName)) {
            dlBtn.style.display = "flex";
            // 조직도가 아니면 버튼 텍스트를 "다운로드"로 초기화 (조직도 분기에서 덮어씀)
            if (tabName !== "org") {
                dlBtn.innerHTML = '<i class="ti ti-download"></i> 다운로드';
            }
        } else {
            dlBtn.style.display = "none";
            _downloadUrl = "";
        }
    }

    if (tabName === "dashboard") {
        // Phase 10: 대시보드 탭 초기화
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.querySelector(".topbar-title").textContent = "대시보드";
        document.querySelector(".topbar-subtitle").textContent = "세종개발본부 종합 현황  ※ 2026년 6월 기준";
        _downloadUrl = "/api/dashboard/download";
        loadDashboard();
    } else if (tabName === "projects") {
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.querySelector(".topbar-title").textContent = "세종사업현황";
        document.querySelector(".topbar-subtitle").textContent = "2026년 수행 사업 기준  ※ 2026년 6월 기준";
        _downloadUrl = "/api/projects/download";
        loadProjects();
    } else if (tabName === "weekly") {
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.getElementById("week-select").style.display = "block";
        document.querySelector(".topbar-title").textContent = "PM 주간회의";
        document.querySelector(".topbar-subtitle").textContent = "최신 회의 기준";
        _downloadUrl = "/api/weekly/download?week=0";
        loadWeekly(0);
    } else if (tabName === "monthly") {
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.getElementById("month-select").style.display = "block";
        document.querySelector(".topbar-title").textContent = "회사 월간보고";
        document.querySelector(".topbar-subtitle").textContent = "최신 월 기준";
        _downloadUrl = "/api/monthly/download?month=0";
        loadMonthly(0);
    } else if (tabName === "sejong") {
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.getElementById("sejong-month-select").style.display = "block";
        document.querySelector(".topbar-title").textContent = "세종 월간분석";
        document.querySelector(".topbar-subtitle").textContent = "최신 월 기준";
        loadSejong(0);
    } else if (tabName === "history") {
        // Phase 5: 히스토리 탭 초기화
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.querySelector(".topbar-title").textContent = "세종사업히스토리";
        document.querySelector(".topbar-subtitle").textContent = "연도별 사업 이력";
        _downloadUrl = "/api/history/download";
        loadHistory();
    } else if (tabName === "org") {
        // Phase 6: 조직도 탭 초기화 — 최초 1회만 API 호출
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.querySelector(".topbar-title").textContent = "조직도";
        document.querySelector(".topbar-subtitle").textContent = "세종개발본부 인력 현황  ※ 2026년 6월 기준";
        _downloadUrl = "/api/org/download-pdf";
        if (dlBtn) dlBtn.innerHTML = '<i class="ti ti-download"></i> PDF 다운로드';
        if (!_orgData) loadOrg(0);
    } else if (tabName === "sales") {
        // Phase 7: 영업보고 탭 초기화 — 탭 전환 시마다 로드 (백엔드 캐시가 처리)
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.querySelector(".topbar-title").textContent = "영업보고 분석";
        document.querySelector(".topbar-subtitle").textContent = "노션 실시간 연동 · 주차별 자동 집계";
        _downloadUrl = "/api/sales/download?week=0";
        loadSales();
    } else if (tabName === "risk") {
        // Phase 8: RISK 알림 탭 초기화
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.querySelector(".topbar-title").textContent = "RISK 알림";
        document.querySelector(".topbar-subtitle").textContent = "노션 실시간 연동 · 주차별 리스크 집계";
        loadRisk();
    } else if (tabName === "seminar") {
        // Phase 9: 세미나 알림 탭 초기화
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.querySelector(".topbar-title").textContent = "세미나 알림";
        document.querySelector(".topbar-subtitle").textContent = "AI · 공공IT 세미나 · 컨퍼런스 자동 수집";
        loadSeminar();
    } else if (tabName === "profitloss") {
        // Phase 11: 손익현황 탭 초기화
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.querySelector(".topbar-title").textContent = "손익현황";
        document.querySelector(".topbar-subtitle").textContent = "2021~2026년 · 수행조직 vs 세종개발본부  ※ 2026년 6월 기준";
        _downloadUrl = "/api/profit-loss/download";
        loadProfitLoss();
    } else if (tabName === "automation") {
        // 자동화 실행 탭 초기화
        allSelects.forEach(id => document.getElementById(id).style.display = "none");
        document.querySelector(".topbar-title").textContent = "자동화 실행";
        document.querySelector(".topbar-subtitle").textContent = "SKILL 바로가기 · 클릭 → 클립보드 복사 → Claude 새 탭";
        document.getElementById("btn-refresh").style.display = "none";
        renderAutomationCards();
    }
}

/* ───────────────────────────────
   Phase 2: PM 주간회의 데이터 로딩
────────────────────────────── */
async function loadWeekly(weekIndex = 0, refresh = false) {
    const btn   = document.getElementById("btn-refresh");
    const container = document.getElementById("weekly-projects");
    
    // 로딩 표시
    container.innerHTML = '<div class="loading-cell">데이터를 불러오는 중...</div>';
    btn.disabled = true;
    btn.innerHTML = '<i class="ti ti-refresh"></i> 로딩 중...';
    
    try {
        // refresh=true이면 강제 새로고침 파라미터 추가
        const url = refresh
            ? `/api/weekly?week=${weekIndex}&refresh=1`
            : `/api/weekly?week=${weekIndex}`;
        const response = await fetch(url);
        const result   = await response.json();
        
        if (result.success) {
            renderWeeklyKPI(result.data.kpi);
            renderWeekSelect(result.data.weeks, weekIndex);
            renderProjectCards(result.data.projects);
            renderAnalysis(result.data.analysis);
        } else {
            showWeeklyError(result.error);
        }
    } catch (e) {
        showWeeklyError("서버 연결에 실패했습니다. app.py가 실행 중인지 확인해주세요.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-refresh"></i> 새로고침';
    }
}

/* ───────────────────────────────
   Phase 2: 주간회의 KPI 렌더링
────────────────────────────── */
function renderWeeklyKPI(kpi) {
    document.getElementById("kpi-w-total").textContent    = kpi.total;
    document.getElementById("kpi-w-issue").textContent    = kpi.issue;
    document.getElementById("kpi-w-risk").textContent     = kpi.risk;
    document.getElementById("kpi-w-special").textContent  = kpi.special;
    // 마감임박 KPI 박스가 존재할 때만 업데이트 (HTML 주석 처리 시 에러 방지)
    const deadlineEl = document.getElementById("kpi-w-deadline");
    if (deadlineEl) {
        deadlineEl.textContent = kpi.deadline;
    }
}

/* ───────────────────────────────
   Phase 2: 주차 선택 드롭다운 렌더링
────────────────────────────── */
function renderWeekSelect(weeks, currentIndex) {
    const select = document.getElementById("week-select");
    select.innerHTML = weeks.map((w, i) =>
        `<option value="${i}" ${i === currentIndex ? "selected" : ""}>${w}</option>`
    ).join("");
    
    // 드롭다운 변경 이벤트
    select.onchange = () => {
        const idx = parseInt(select.value);
        _downloadUrl = `/api/weekly/download?week=${idx}`;
        loadWeekly(idx);
    };
}

/* ───────────────────────────────
   Phase 2: 사업별 카드 렌더링
────────────────────────────── */
function renderProjectCards(projects) {
    const container = document.getElementById("weekly-projects");
    container.innerHTML = "";
    
    if (projects.length === 0) {
        container.innerHTML = '<div class="loading-cell">이번 주 데이터가 없습니다.</div>';
        return;
    }
    
    projects.forEach(p => {
        const statusMap = {
            "이슈":    { icon: "🔴", cls: "card-issue" },
            "위험":    { icon: "🟡", cls: "card-risk" },
            "마감임박": { icon: "🟠", cls: "card-deadline" },
            "정상":    { icon: "🟢", cls: "card-normal" },
        };
        const s = statusMap[p.status] || statusMap["정상"];
        
        // 진행사항 (전체 항목 표시)
        const progressHTML = p.progress && p.progress.length > 0
            ? p.progress.map(item => `<li>${escape(item)}</li>`).join("")
            : '<li style="color: #9CA3AF;">— 진행사항 없음 —</li>';
        
        // 특이사항 (전체 항목 표시)
        // 특이사항 (전체 항목 표시)
        const specialHTML = p.special && p.special.length > 0
            ? `<div class="card-special-section">
                 <div class="card-section-title">특이사항</div>
                 ${p.special.map(item => `<div class="card-special-item">${escape(item)}</div>`).join("")}
               </div>`
            : "";
        
        // 이슈사항 (전체 항목 표시)
        const issuesHTML = p.issues && p.issues.length > 0
            ? `<div class="card-issues-section">
                 <div class="card-section-title">이슈사항</div>
                 ${p.issues.map(item => `<div class="card-issues-item">${escape(item)}</div>`).join("")}
               </div>`
            : "";
        
        const card = document.createElement("div");
        card.className = `project-card ${s.cls}`;
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">${s.icon}</span>
                <span class="card-name">${escape(p.name)} (${escape(p.pm)})</span>
                <span class="card-badge">${escape(p.status)}</span>
            </div>
            <ul class="card-progress">${progressHTML}</ul>
            ${specialHTML}
            ${issuesHTML}
        `;
        container.appendChild(card);
    });
}

/* ───────────────────────────────
   Phase 2: 분석 섹션 렌더링
────────────────────────────── */
function renderAnalysis(analysis) {
    const box = document.getElementById("analysis-box");
    const list = document.getElementById("analysis-list");
    
    // 분석 섹션 초기화 (탭 전환 시 이전 데이터 남지 않도록)
    box.style.display = "none";
    
    if (!analysis || analysis.length === 0) {
        return;
    }
    
    box.style.display = "block";
    list.innerHTML = analysis.map(a => `<li>${escape(a)}</li>`).join("");
}

/* ───────────────────────────────
   Phase 2: 주간회의 에러 메시지 표시
────────────────────────────── */
function showWeeklyError(message) {
    const container = document.getElementById("weekly-projects");
    container.innerHTML = `<div class="error-cell">${message}</div>`;
    
    // 분석 섹션 숨기기
    document.getElementById("analysis-box").style.display = "none";
}

/* ───────────────────────────────
   Phase 3: 회사 월간보고 데이터 로딩
────────────────────────────── */
async function loadMonthly(monthIndex = 0, refresh = false) {
    const btn = document.getElementById("btn-refresh");

    ["monthly-workforce", "monthly-issues", "monthly-meetings", "monthly-analysis-box"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    ["kpi-m-total", "kpi-m-issue", "kpi-m-meeting"].forEach(id => {
        document.getElementById(id).textContent = "—";
    });

    btn.disabled = true;
    btn.innerHTML = '<i class="ti ti-refresh"></i> 로딩 중...';

    try {
        const url = refresh
            ? `/api/monthly?month=${monthIndex}&refresh=1`
            : `/api/monthly?month=${monthIndex}`;
        const response = await fetch(url);
        const result   = await response.json();

        if (result.success) {
            const d = result.data;
            renderMonthlyKPI(d.kpi);
            renderMonthSelect(d.months, monthIndex);
            renderWorkforce(d.workforce);
            renderIssueTable(d.issue_table);
            renderMeetings(d.meetings);
            renderMonthlyAnalysis(d.analysis);
            document.querySelector(".topbar-subtitle").textContent = d.month_title || "최신 월 기준";
        } else {
            showMonthlyError(result.error || "데이터를 불러오지 못했습니다.");
        }
    } catch (e) {
        showMonthlyError("서버 연결에 실패했습니다. app.py가 실행 중인지 확인해주세요.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-refresh"></i> 새로고침';
    }
}

function renderMonthlyKPI(kpi) {
    document.getElementById("kpi-m-total").textContent   = kpi.total;
    document.getElementById("kpi-m-issue").textContent   = kpi.issue;
    document.getElementById("kpi-m-meeting").textContent = kpi.meeting;
}

function renderMonthSelect(months, currentIndex) {
    const select = document.getElementById("month-select");
    select.innerHTML = months.map((m, i) =>
        `<option value="${i}" ${i === currentIndex ? "selected" : ""}>${m}</option>`
    ).join("");
    select.onchange = () => {
        const idx = parseInt(select.value);
        _downloadUrl = `/api/monthly/download?month=${idx}`;
        loadMonthly(idx);
    };
}

function renderWorkforce(workforce) {
    const section = document.getElementById("monthly-workforce");
    const wrap    = document.getElementById("workforce-wrap");
    if (!workforce || workforce.length === 0) { section.style.display = "none"; return; }

    wrap.innerHTML = workforce.map(w => {
        const pct = parseInt(w.value) || 0;
        return `
            <div class="workforce-row">
                <div class="workforce-label">${escape(w.label)}</div>
                <div class="workforce-value">${escape(w.value)}</div>
                <div class="workforce-bar-wrap">
                    <div class="workforce-bar" style="width:${Math.min(pct, 100)}%"></div>
                </div>
            </div>`;
    }).join("");
    section.style.display = "block";
}

function renderIssueTable(issues) {
    const section = document.getElementById("monthly-issues");
    const tbody   = document.getElementById("issues-tbody");
    if (!issues || issues.length === 0) { section.style.display = "none"; return; }

    tbody.innerHTML = issues.map(row => `
        <tr>
            <td>${escape(row.client)}</td>
            <td>${escape(row.project)}</td>
            <td class="td-muted">${escape(row.period)}</td>
            <td>${escape(row.pm)}</td>
            <td>${escape(row.issue)}</td>
            <td class="td-muted">${escape(row.resolution)}</td>
        </tr>`).join("");
    section.style.display = "block";
}

function renderMeetings(meetings) {
    const section = document.getElementById("monthly-meetings");
    const list    = document.getElementById("meeting-list");
    if (!meetings || meetings.length === 0) { section.style.display = "none"; return; }

    list.innerHTML = meetings.map(m => `<li>${escape(m)}</li>`).join("");
    section.style.display = "block";
}

function renderMonthlyAnalysis(analysis) {
    const box  = document.getElementById("monthly-analysis-box");
    const list = document.getElementById("monthly-analysis-list");
    if (!analysis || analysis.length === 0) { box.style.display = "none"; return; }

    list.innerHTML = analysis.map(a => `<li>${escape(a)}</li>`).join("");
    box.style.display = "block";
}

function showMonthlyError(message) {
    ["monthly-workforce", "monthly-issues", "monthly-meetings", "monthly-analysis-box"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    document.getElementById("kpi-m-total").textContent   = "—";
    document.getElementById("kpi-m-issue").textContent   = "—";
    document.getElementById("kpi-m-meeting").textContent = "—";
    console.error("[monthly]", message);
}

/* ───────────────────────────────
   Phase 4: 세종 월간분석 데이터 로딩
────────────────────────────── */
async function loadSejong(monthIndex = 0, refresh = false) {
    const btn = document.getElementById("btn-refresh");

    // 섹션 초기화
    document.getElementById("sejong-kpi-section").style.display = "none";
    document.getElementById("sejong-projects").innerHTML = "";
    document.getElementById("sejong-analysis-box").style.display = "none";

    btn.disabled = true;
    btn.innerHTML = '<i class="ti ti-refresh"></i> 로딩 중...';

    try {
        const url = refresh
            ? `/api/monthly-sejong?month=${monthIndex}&refresh=1`
            : `/api/monthly-sejong?month=${monthIndex}`;
        const response = await fetch(url);
        const result   = await response.json();

        if (result.success) {
            const d = result.data;
            renderSejongMonthSelect(d.months, monthIndex);
            renderSejongKPITable(d.kpi_table, d.period);
            renderSejongProjectCards(d.projects);
            renderSejongAnalysis(d.analysis);
            document.querySelector(".topbar-subtitle").textContent = d.month_title || "최신 월 기준";
        } else {
            document.getElementById("sejong-projects").innerHTML =
                `<div class="error-cell">${result.error || "데이터를 불러오지 못했습니다."}</div>`;
        }
    } catch (e) {
        document.getElementById("sejong-projects").innerHTML =
            `<div class="error-cell">서버 연결에 실패했습니다.</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-refresh"></i> 새로고침';
    }
}

function renderSejongMonthSelect(months, currentIndex) {
    const select = document.getElementById("sejong-month-select");
    select.innerHTML = months.map((m, i) =>
        `<option value="${i}" ${i === currentIndex ? "selected" : ""}>${m}</option>`
    ).join("");
    select.onchange = () => loadSejong(parseInt(select.value));
}

function renderSejongKPITable(kpiTable, period) {
    const section = document.getElementById("sejong-kpi-section");
    if (!kpiTable || kpiTable.length === 0) { section.style.display = "none"; return; }

    document.getElementById("sejong-period").textContent = period || "";
    const tbody = section.querySelector("tbody");
    tbody.innerHTML = kpiTable.map(row => `
        <tr>
            <td>${escape(row.label)}</td>
            <td>${escape(row.value)}</td>
        </tr>`).join("");
    section.style.display = "block";
}

function renderSejongProjectCards(projects) {
    const container = document.getElementById("sejong-projects");
    if (!projects || projects.length === 0) {
        container.innerHTML = '<div class="loading-cell">사업 데이터가 없습니다.</div>';
        return;
    }

    container.innerHTML = projects.map(p => {
        const completedHTML = p.completed && p.completed.length > 0
            ? p.completed.map(item => `<li>${escape(item)}</li>`).join("")
            : `<li class="sejong-empty">—</li>`;
        const progressHTML = p.in_progress && p.in_progress.length > 0
            ? p.in_progress.map(item => `<li>${escape(item)}</li>`).join("")
            : `<li class="sejong-empty">—</li>`;
        const issuesHTML = p.issues && p.issues.length > 0
            ? p.issues.map(item => `<li>${escape(item)}</li>`).join("")
            : `<li class="sejong-empty">—</li>`;

        return `
            <div class="sejong-card">
                <div class="sejong-card-header">
                    <span class="sejong-card-name">${escape(p.name)}</span>
                    <span class="sejong-card-pm">${escape(p.pm)}</span>
                </div>
                <div class="sejong-card-body">
                    <div class="sejong-section completed">
                        <div class="sejong-section-title">✅ 완료</div>
                        <ul>${completedHTML}</ul>
                    </div>
                    <div class="sejong-section in-progress">
                        <div class="sejong-section-title">🔄 진행중</div>
                        <ul>${progressHTML}</ul>
                    </div>
                    <div class="sejong-section issues">
                        <div class="sejong-section-title">⚠️ 이슈/특이</div>
                        <ul>${issuesHTML}</ul>
                    </div>
                </div>
            </div>`;
    }).join("");
}

function renderSejongAnalysis(analysis) {
    const box  = document.getElementById("sejong-analysis-box");
    const list = document.getElementById("sejong-analysis-list");
    if (!analysis || analysis.length === 0) { box.style.display = "none"; return; }

    list.innerHTML = analysis.map(a => `<li>${escape(a)}</li>`).join("");
    box.style.display = "block";
}

/* ───────────────────────────────
   Phase 5: 세종사업히스토리 데이터 로딩
────────────────────────────── */
async function loadHistory(refresh = false) {
    const btn = document.getElementById("btn-refresh");

    // 섹션 초기화
    document.getElementById("history-summary-section").style.display = "none";
    document.getElementById("year-tabs").innerHTML = "";
    document.getElementById("history-detail").innerHTML =
        '<div class="loading-cell">데이터를 불러오는 중...</div>';

    btn.disabled = true;
    btn.innerHTML = '<i class="ti ti-refresh"></i> 로딩 중...';

    try {
        const url    = `/api/history${refresh ? "?refresh=1" : ""}`;
        const res    = await fetch(url);
        const result = await res.json();

        if (result.success) {
            const { summary, years } = result.data;
            _historyYears = [...years].sort((a, b) => b.year.localeCompare(a.year));
            _historySummary = [...summary].sort((a, b) => a.year.localeCompare(b.year));
            _historySelectedYear = _historyYears.length > 0 ? _historyYears[0].year : null;

            renderSummaryTable(summary);
            renderYearTabs(_historyYears);
            renderHistoryDetail("latest");
            renderHistoryKPI(_historySelectedYear);
            renderCashCowBanner(_historySelectedYear);
            // 그래프 항상 표시
            const chartArea = document.getElementById("chart-area");
            if (chartArea && !chartArea.classList.contains("chart-open")) {
                chartArea.classList.add("chart-open");
            }
            if (_historyYears.length > 0) drawChart(_historyYears);
            document.querySelector(".topbar-subtitle").textContent =
                years.length > 0 ? `${_historySelectedYear}년 기준` : "연도별 사업 이력";
        } else {
            document.getElementById("history-detail").innerHTML =
                `<div class="error-cell">${result.error || "데이터를 불러오지 못했습니다."}</div>`;
        }
    } catch (e) {
        document.getElementById("history-detail").innerHTML =
            '<div class="error-cell">서버 연결에 실패했습니다.</div>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-refresh"></i> 새로고침';
    }
}

/* ───────────────────────────────
   Phase 5 v3.0: 연도별 사업 현황 요약 테이블 (내부원가현행화 기준 + 프로젝트합계 보조)
────────────────────────────── */
function renderSummaryTable(summary) {
    const section = document.getElementById("history-summary-section");
    const tbody   = document.getElementById("summary-tbody");
    if (!summary || summary.length === 0) { section.style.display = "none"; return; }

    const sorted = [...summary].sort((a, b) => b.year.localeCompare(a.year));

    tbody.innerHTML = sorted.map(s => {
        const hasRef = s.ref_cost !== undefined && s.ref_cost !== null;
        const refLine = hasRef
            ? `<tr class="summary-ref-row"><td></td><td colspan="6" class="summary-ref">※ 프로젝트합계 기준 ${formatAmount(s.ref_revenue || s.revenue)} / ${formatAmount(s.ref_cost)} / ${formatAmount(s.ref_gross_profit)} / ${s.ref_gross_rate || "—"}</td></tr>`
            : "";
        return `
        <tr class="${hasRef ? 'summary-has-ref' : ''}">
            <td>${escape(s.year)}년</td>
            <td class="td-money" style="font-weight:600">${formatAmount(s.revenue)}</td>
            <td class="td-money">${formatAmount(s.cost)}</td>
            <td class="td-money" style="font-weight:600">${formatAmount(s.gross_profit)}</td>
            <td>${s.gross_rate || "—"}</td>
            <td style="font-weight:600">${formatYoY(s.yoy_amount, s.yoy_rate)}</td>
            <td style="font-weight:600">${formatYoY(s.yoy_gp_amount, s.yoy_gp_rate)}</td>
        </tr>${refLine}`;
    }).join("");

    section.style.display = "block";
}

/* ───────────────────────────────
   Phase 5: 연도 선택 탭 렌더링
────────────────────────────── */
function renderYearTabs(years) {
    const tabs = document.getElementById("year-tabs");
    if (!years || years.length === 0) { tabs.innerHTML = ""; return; }

    // 전체 탭 + 연도별 탭 (기본 active는 최신 연도 — loadHistory에서 설정)
    const allBtn  = `<button class="year-tab" onclick="selectHistoryTab(event, 'all')">전체</button>`;
    const yearBtns = years.map((y, i) =>
        `<button class="year-tab ${i === 0 ? "active" : ""}" onclick="selectHistoryTab(event, '${y.year}')">${y.year}년</button>`
    ).join("");

    tabs.innerHTML = allBtn + yearBtns;
}

/* ───────────────────────────────
   Phase 5: 연도 탭 선택 처리
────────────────────────────── */
function selectHistoryTab(e, target) {
    document.querySelectorAll(".year-tab").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    renderHistoryDetail(target);
    // v2.3: KPI/배너 갱신 — "all"/"latest"면 최신연도, 아니면 선택된 연도
    const kpiYear = (target === "all" || target === "latest")
        ? (_historyYears.length > 0 ? _historyYears[0].year : null)
        : target;
    _historySelectedYear = kpiYear;
    // PHASE DL: 선택 연도 반영
    _downloadUrl = kpiYear ? `/api/history/download?year=${kpiYear}` : "/api/history/download";
    renderHistoryKPI(kpiYear);
    renderCashCowBanner(kpiYear);
}

/* ───────────────────────────────
   Phase 5: 연도별 상세 사업 테이블 렌더링
   target: "all" → 전체, "latest" → 최신 연도, "2026" 등 → 해당 연도
────────────────────────────── */
function renderHistoryDetail(target) {
    const container = document.getElementById("history-detail");

    let targetYears;
    if (target === "all") {
        targetYears = _historyYears;                               // 전체 연도
    } else if (target === "latest") {
        targetYears = _historyYears.slice(0, 1);                   // 최신 연도 1개
    } else {
        targetYears = _historyYears.filter(y => y.year === target); // 특정 연도
    }

    if (targetYears.length === 0) {
        container.innerHTML = '<div class="loading-cell">해당 연도 데이터가 없습니다.</div>';
        return;
    }

    // 연도별 섹션 렌더링
    container.innerHTML = targetYears.map(yearData => `
        <div class="year-section">
            <div class="year-section-title">${escape(yearData.year)}년 사업 현황</div>
            <div class="table-container">
                <table class="projects-table history-table">
                    <colgroup>
                        <col style="width:6%">
                        <col style="width:18%">
                        <col style="width:9%">
                        <col style="width:7%">
                        <col style="width:7%">
                        <col style="width:7%">
                        <col style="width:7%">
                        <col style="width:5%">
                        <col style="width:7%">
                        <col style="width:7%">
                        <col style="width:5%">
                        <col style="width:7%">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>구분</th>
                            <th>사업명</th>
                            <th>고객사</th>
                            <th>기간</th>
                            <th>매출액</th>
                            <th>매출원가</th>
                            <th>매출이익</th>
                            <th>매출이익률</th>
                            <th>공통비</th>
                            <th>영업이익</th>
                            <th>영업이익률</th>
                            <th>계획대비실적</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${yearData.projects.map(renderHistoryRow).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `).join("");
}

/* ───────────────────────────────
   Phase 5: 연도별 사업 현황 행 렌더링 (12컬럼, v2.1)
────────────────────────────── */
function renderHistoryRow(p) {
    // 제외 항목은 표시하지 않음
    if (p.is_excluded) return "";

    return `
        <tr class="${p.is_total ? "row-total" : ""}">
            <td class="td-type">${escape(p.project_type || "")}</td>
            <td>${escape(p.name)}</td>
            <td class="td-muted">${escape(p.client || "")}</td>
            <td class="td-muted">${escape(p.period || "")}</td>
            <td class="td-money">${formatAmount(p.revenue)}</td>
            <td class="td-money">${formatAmount(p.cost)}</td>
            <td class="td-money">${formatAmount(p.gross_profit)}</td>
            <td>${escape(p.gross_rate || "")}</td>
            <td class="td-money">${formatAmount(p.overhead)}</td>
            <td class="td-money">${formatAmount(p.op_profit)}</td>
            <td>${escape(p.op_rate || "")}</td>
            <td class="td-money">${formatVsPlan(p.vs_plan)}</td>
        </tr>`;
}

/* ───────────────────────────────
   Phase 5: 히스토리용 금액 포맷 (천만원 이상 억, 미만 만)
   예: 5030248818 → "50.3억" / 10000000 → "0.1억" / 2000000 → "200만" / 0 → "—"
────────────────────────────── */
function formatAmount(amount) {
    if (amount === 0 || amount === null || amount === undefined) return "—";
    const sign = amount < 0 ? "-" : "";
    const abs  = Math.abs(amount);
    if (abs >= 1e7) {
        const eok = abs / 1e8;
        return sign + eok.toFixed(1) + "억";
    }
    const man = Math.round(abs / 1e4);
    return man > 0 ? sign + man.toLocaleString() + "만" : "—";
}

/* ───────────────────────────────
   Phase 5: 계획대비실적 포맷 (v2.2 — 억/만 단위 + 부호)
   예: 74867190 → "+0.7억" / -2000000 → "-200만" / 0 → "—"
────────────────────────────── */
function formatVsPlan(value) {
    if (!value || value === 0) return "—";
    const sign = value > 0 ? "+" : "";
    return sign + formatAmount(value);
}

/* ───────────────────────────────
   Phase 5: 전년대비 포맷 (상승=빨간, 하락=파란)
   예: +7.1억 (▲12.2%) / -3.7억 (▼7.6%)
────────────────────────────── */
function formatYoY(amount, rate) {
    if (amount === null || amount === undefined) return "—";
    const absAmount = Math.abs(amount / 1e8).toFixed(1);
    const absRate   = Math.abs(rate).toFixed(1);
    const isUp      = amount >= 0;
    const arrow     = isUp ? "▲" : "▼";
    const sign      = isUp ? "+" : "-";
    const color     = isUp ? "#DC2626" : "#2563EB";
    return `<span style="color:${color}">${sign}${absAmount}억 (${arrow}${absRate}%)</span>`;
}

/* ───────────────────────────────
   Phase 5 v2.3: 전년대비 매출이익률(%p) 포맷
────────────────────────────── */
function formatMarginYoY(currRate, prevRate) {
    if (currRate === null || currRate === undefined || prevRate === null || prevRate === undefined) return "—";
    const curr = parseFloat(currRate);
    const prev = parseFloat(prevRate);
    if (isNaN(curr) || isNaN(prev)) return "—";
    const diff = curr - prev;
    const isUp = diff >= 0;
    const arrow = isUp ? "▲" : "▼";
    const color = isUp ? "#DC2626" : "#2563EB";
    return `<span style="color:${color}">${arrow}${Math.abs(diff).toFixed(1)}%p</span>`;
}

/* ───────────────────────────────
   Phase 5 v2.3: KPI 타일 5개 렌더링
────────────────────────────── */
function renderHistoryKPI(selectedYear) {
    const row = document.getElementById("hist-kpi-row");
    if (!row || !_historySummary.length || !selectedYear) { if (row) row.style.display = "none"; return; }

    const idx = _historySummary.findIndex(s => s.year === selectedYear);
    if (idx < 0) { row.style.display = "none"; return; }
    const curr = _historySummary[idx];
    const prev = idx > 0 ? _historySummary[idx - 1] : null;

    const sjRev = curr.revenue / 1e8;

    // 1. 매출
    document.getElementById("histKpiRevCap").textContent = selectedYear + "년 매출";
    document.getElementById("histKpiRev").textContent = sjRev.toFixed(1) + "억";

    // 2. 전년대비 매출
    if (curr.yoy_amount !== null && curr.yoy_amount !== undefined) {
        document.getElementById("histKpiRevYoy").innerHTML = formatYoY(curr.yoy_amount, curr.yoy_rate);
        document.getElementById("histKpiRevYoySub").textContent = prev ? prev.year + "년 " + (prev.revenue / 1e8).toFixed(1) + "억" : "";
    } else {
        document.getElementById("histKpiRevYoy").textContent = "—";
        document.getElementById("histKpiRevYoySub").textContent = "";
    }

    // 3. 매출이익
    const gpVal = curr.gross_profit;
    document.getElementById("histKpiGpCap").textContent = selectedYear + "년 매출이익";
    document.getElementById("histKpiGp").textContent = gpVal !== null && gpVal !== undefined ? (gpVal / 1e8).toFixed(1) + "억" : "—";

    // 4. 전년대비 매출이익
    if (curr.yoy_gp_amount !== null && curr.yoy_gp_amount !== undefined) {
        document.getElementById("histKpiGpYoy").innerHTML = formatYoY(curr.yoy_gp_amount, curr.yoy_gp_rate);
        const prevGp = prev ? prev.gross_profit : null;
        document.getElementById("histKpiGpYoySub").textContent = prev && prevGp !== null && prevGp !== undefined ? prev.year + "년 " + (prevGp / 1e8).toFixed(1) + "억" : "";
    } else {
        document.getElementById("histKpiGpYoy").textContent = "—";
        document.getElementById("histKpiGpYoySub").textContent = "";
    }

    row.style.display = "grid";
}

/* ───────────────────────────────
   Phase 5 v2.3: 캐시카우 강조 배너
────────────────────────────── */
function renderCashCowBanner(selectedYear) {
    const el = document.getElementById("hist-cashcow");
    if (!el || !_historyYears.length || !selectedYear) { if (el) el.style.display = "none"; return; }

    const sorted = [..._historyYears].sort((a, b) => a.year.localeCompare(b.year));
    const opsByYear = {};
    sorted.forEach(y => { opsByYear[y.year] = y.chart.ops / 1e8; });

    const selYr = selectedYear;
    const currentOps = opsByYear[selYr];
    if (!currentOps) { el.style.display = "none"; return; }

    const priorYears = sorted.filter(y => y.year < selYr);
    if (priorYears.length === 0) { el.style.display = "none"; return; }

    const priorMax = Math.max(...priorYears.map(y => opsByYear[y.year]));
    const priorMaxYear = priorYears.find(y => opsByYear[y.year] === priorMax)?.year;

    if (currentOps <= priorMax) { el.style.display = "none"; return; }

    const diff = currentOps - priorMax;
    const milestones = [];
    if (currentOps >= 40 && priorMax < 40) milestones.push("최초 40억 돌파");
    if (currentOps >= 50 && priorMax < 50) milestones.push("최초 50억 돌파");

    document.getElementById("histCashcowNum").textContent = currentOps.toFixed(1) + "억";
    let capText = `${selYr}년 운영매출 — 역대 최고`;
    if (milestones.length) capText += ", " + milestones.join(", ");
    capText += ` (직전 최고 ${priorMaxYear}년 ${priorMax.toFixed(1)}억 대비 +${diff.toFixed(1)}억)`;
    document.getElementById("histCashcowCap").textContent = capText;
    el.style.display = "flex";
}

/* ───────────────────────────────
   Phase 5: 히스토리 summary에서 최신 연도 전년대비 추출 → KPI 서브텍스트용
────────────────────────────── */
function getLatestYoYText(historyResult) {
    if (!historyResult || !historyResult.success) return null;
    const summary = (historyResult.data || {}).summary;
    if (!summary || summary.length === 0) return null;
    const sorted = [...summary].sort((a, b) => b.year.localeCompare(a.year));
    const latest = sorted[0];
    if (latest.yoy_amount === null || latest.yoy_amount === undefined) return null;
    return "전년대비: " + formatYoY(latest.yoy_amount, latest.yoy_rate);
}

/* ───────────────────────────────
   Phase 5: Chart.js 연도별 매출 그래프 (v2.2 — 남색 스택 막대 + 운영추이 꺾은선)
────────────────────────────── */
function drawChart(years) {
    const canvas = document.getElementById("history-chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (!years || years.length === 0) return;

    const sorted = [...years].sort((a, b) => a.year.localeCompare(b.year));
    const labels = sorted.map(y => y.year + "년");
    const ops    = sorted.map(y => +(y.chart.ops     / 1e8).toFixed(1));
    const nonOps = sorted.map(y => +(y.chart.non_ops / 1e8).toFixed(1));
    const totals = ops.map((v, i) => +(v + nonOps[i]).toFixed(1));

    if (_historyChart && typeof _historyChart.destroy === "function") {
        _historyChart.destroy();
    }

    // 꺾은선 라벨(검은색) + 총매출 라벨(막대 위) 플러그인
    const chartLabels = {
        id: "chartLabels",
        afterDatasetsDraw(c) {
            const { ctx: c2 } = c;
            // 운영매출 추이 꺾은선 라벨 (검은색)
            c.data.datasets.forEach((dataset, dsIdx) => {
                if (dataset.type !== "line") return;
                const meta = c.getDatasetMeta(dsIdx);
                meta.data.forEach((pt, i) => {
                    const v = dataset.data[i];
                    if (!v) return;
                    c2.save();
                    c2.fillStyle = "#1F2937";
                    c2.font      = "bold 11px sans-serif";
                    c2.textAlign = "center";
                    c2.fillText(v + "억", pt.x, pt.y - 12);
                    c2.restore();
                });
            });
            // 총매출 라벨 (스택 막대 맨 위)
            const barMeta = c.getDatasetMeta(1);
            barMeta.data.forEach((bar, i) => {
                const total = totals[i];
                if (!total) return;
                c2.save();
                c2.fillStyle = "#1F2937";
                c2.font      = "bold 11px sans-serif";
                c2.textAlign = "center";
                c2.fillText(total + "억", bar.x, bar.y - 6);
                c2.restore();
            });
        }
    };

    const chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    type: "bar", label: "운영매출", data: ops,
                    backgroundColor: "#1B3A5C", borderColor: "#122843", borderWidth: 1,
                    stack: "stack", order: 2
                },
                {
                    type: "bar", label: "운영외매출", data: nonOps,
                    backgroundColor: "#7EB8DA", borderColor: "#5DA0C5", borderWidth: 1,
                    stack: "stack", order: 2
                },
                {
                    type: "line", label: "운영매출 추이", data: ops,
                    borderColor: "#C53030", backgroundColor: "#C53030",
                    borderWidth: 3, pointRadius: 6,
                    pointBackgroundColor: "#C53030", pointBorderColor: "#fff", pointBorderWidth: 2,
                    tension: 0.3, order: 1
                }
            ]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: true,
            aspectRatio:         1.74,
            plugins: {
                legend: { position: "bottom" },
                tooltip: {
                    mode: "index",
                    callbacks: {
                        label: ctx => ctx.dataset.label + ": " + parseFloat(ctx.raw).toFixed(1) + "억"
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    ticks: { callback: v => v + "억" }
                },
                x: { stacked: true }
            }
        },
        plugins: [chartLabels]
    });

    _historyChart = chartInstance;
}

/* ════════════════════════════════
   PHASE 6 — 조직도
════════════════════════════════ */

// ── 진입점: 탭 전환 시 호출, refresh=1 이면 캐시 무효화
function loadOrg(refresh = 0) {
    const btn = document.getElementById("btn-org-refresh");
    if (btn) btn.disabled = true;

    fetch(`/api/org?refresh=${refresh}`)
        .then(r => r.json())
        .then(data => {
            _orgData = data;
            renderOrgKPI(data);
            renderOrgView(data);
            renderPhotoView(data);

            // 서브타이틀에 인원 현황 반영
            const staffCnt = data.staff.filter(s => s.type === "정직원").length;
            const total    = data.staff.length;
            const sub = document.getElementById("org-subtitle");
            if (sub) sub.textContent = `세종개발본부 · 정직원 ${staffCnt}명 / 총 ${total}명`;

            if (btn) btn.disabled = false;
        })
        .catch(err => {
            console.error("조직도 로드 실패", err);
            const grid = document.getElementById("org-grid");
            if (grid) grid.innerHTML = '<div class="error-cell">데이터를 불러오지 못했습니다.</div>';
            if (btn) btn.disabled = false;
        });
}

// ── KPI 4개 업데이트
function renderOrgKPI(data) {
    const total    = data.staff.length;
    const staffCnt = data.staff.filter(s => s.type === "정직원").length;
    const outCnt   = data.staff.filter(s => s.type === "외주").length;
    const projCnt  = data.projects.length;

    document.getElementById("org-kpi-total").textContent    = total    + "명";
    document.getElementById("org-kpi-staff").textContent    = staffCnt + "명";
    document.getElementById("org-kpi-out").textContent      = outCnt   + "명";
    document.getElementById("org-kpi-projects").textContent = projCnt  + "개";
}

// ── 뷰 전환 (사업별 ↔ 인물사전)
function switchOrgView(name, btn) {
    document.querySelectorAll(".org-view-panel").forEach(p => p.style.display = "none");
    document.querySelectorAll("#tab-org .view-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("org-view-" + name).style.display = "block";
    btn.classList.add("active");
}

// ── 뷰1: 사업별 렌더링
function renderOrgView(data) {
    const container = document.getElementById("org-grid");
    if (!container) return;

    const html = data.projects.map(proj => {
        // 해당 사업의 정직원 / 외주 분리
        const staffList = data.staff.filter(s => s.project === proj.name && s.type === "정직원");
        const outList   = data.staff.filter(s => s.project === proj.name && s.type === "외주");
        const staffCount = staffList.length + outList.length;

        // 정직원 카드 HTML
        const staffCards = staffList.map(s => {
            const isPM = s.role === "팀원(PM)" || s.role === "본부장";
            return `
                <div class="mc ${isPM ? "pm" : ""}" onclick="openDetail('${escape(s.name)}')">
                    <div class="av" style="background:${proj.color}">
                        ${photoOrInitial(s)}
                    </div>
                    <div class="mc-info">
                        <div class="mc-name">${escape(s.name)}</div>
                        <div class="mc-grade">${escape(s.grade)}</div>
                    </div>
                    ${isPM ? '<div class="pm-badge">PM</div>' : ""}
                </div>`;
        }).join("");

        // 외주 카드 HTML
        const outCards = outList.map(s => `
            <div class="mc-out">
                <div class="av av-gray">${s.name.charAt(0)}</div>
                <div class="mc-info">
                    <div class="mc-name">${escape(s.name)}</div>
                    <div class="mc-grade-out">${escape(s.grade)}</div>
                </div>
                <div class="out-badge">외주</div>
            </div>`
        ).join("");

        // 외주 있으면 2열 레이아웃, 없으면 정직원 full-width
        const bodyHtml = outList.length > 0
            ? `<div class="member-body">
                   <div class="member-col staff">${staffCards}</div>
                   <div class="member-col">${outCards}</div>
               </div>`
            : `<div class="member-col" style="padding:12px 14px;display:flex;flex-wrap:wrap;gap:7px;">
                   ${staffCards}
               </div>`;

        return `
            <div class="project-block">
                <div class="project-header">
                    <div class="project-color" style="background:${proj.color}"></div>
                    <div>
                        <div class="project-name">${escape(proj.name)}${proj.client ? " (" + escape(proj.client) + ")" : ""}</div>
                        <div class="project-meta">${escape(proj.description)}</div>
                    </div>
                    <div class="project-count">${staffCount}명</div>
                </div>
                ${bodyHtml}
            </div>`;
    }).join("");

    container.innerHTML = html || '<div class="loading-cell">사업 데이터가 없습니다.</div>';
}

// ── 사진 img 태그 or 이니셜 텍스트 반환
function photoOrInitial(s) {
    if (s.photo) {
        return `<img src="/static/images/${s.photo}"
                     onerror="this.parentNode.textContent='${s.name.charAt(0)}'"
                     alt="${escape(s.name)}">`;
    }
    return s.name.charAt(0);
}

// ── 뷰2: 인물사전 렌더링
function renderPhotoView(data) {
    const staffList = data.staff.filter(s => s.type === "정직원");
    const outList   = data.staff.filter(s => s.type === "외주");

    const makePhotoCard = (s, isOut) => {
        const imgHtml = s.photo
            ? `<img src="/static/images/${s.photo}" alt="${escape(s.name)}"
                    onerror="this.style.display='none'">`
            : s.name.charAt(0);
        const clickAttr = !isOut ? `onclick="openDetail('${escape(s.name)}')"` : "";
        return `
            <div class="pc${isOut ? " pc-out" : ""}" ${clickAttr}>
                <div class="pc-img">${imgHtml}</div>
                <div class="pc-name">${escape(s.name)}</div>
                <div class="pc-grade">${escape(s.grade)}</div>
                <div class="pc-tag ${isOut ? "tag-gray" : "tag-blue"}">${escape(s.project)}</div>
            </div>`;
    };

    const staffSection = document.getElementById("photo-staff-section");
    if (staffSection) {
        staffSection.innerHTML = `
            <div class="photo-section-title">
                정직원 <span class="section-badge badge-staff">${staffList.length}명</span>
            </div>
            <div class="photo-grid">
                ${staffList.map(s => makePhotoCard(s, false)).join("")}
            </div>`;
    }

    const outSection = document.getElementById("photo-out-section");
    if (outSection) {
        outSection.innerHTML = `
            <div class="photo-section-title">
                외주 인력 <span class="section-badge badge-out">${outList.length}명</span>
            </div>
            <div class="photo-grid">
                ${outList.map(s => makePhotoCard(s, true)).join("")}
            </div>`;
    }
}

// ── 상세 패널 열기 (정직원 클릭 시)
function openDetail(name) {
    if (!_orgData) return;
    const s = _orgData.staff.find(p => p.name === name);
    if (!s) return;

    const proj  = _orgData.projects.find(p => p.name === s.project);
    const color = proj ? proj.color : "#64748B";

    // 이메일 목록 (빈 항목 제외)
    const emails = [s.email1, s.email2, s.email3].filter(e => e && e.trim());
    const emailHtml = emails.length
        ? `<div class="dp-emails">
               ${emails.map(e => `<span class="dp-email-item">✉ ${escape(e)}</span>`).join("")}
           </div>`
        : `<span class="dp-val" style="color:#94A3B8">—</span>`;

    // 사진 or 이니셜 아바타
    const photoHtml = s.photo
        ? `<img src="/static/images/${s.photo}" alt="${escape(s.name)}"
                style="width:192px;height:240px;object-fit:cover;border-radius:10px;"
                onerror="this.outerHTML='<div style=\\'width:192px;height:240px;background:${color}18;border-radius:10px;border:2px solid ${color}40;display:flex;align-items:center;justify-content:center;font-size:72px;font-weight:700;color:${color};\\'>${s.name.charAt(0)}</div>'">`
        : `<div style="width:192px;height:240px;background:${color}18;border-radius:10px;
                border:2px solid ${color}40;display:flex;align-items:center;
                justify-content:center;font-size:72px;font-weight:700;color:${color};">
               ${s.name.charAt(0)}
           </div>`;

    document.getElementById("org-detail-body").innerHTML = `
        <div class="dp-photo-wrap">${photoHtml}</div>
        <div class="dp-name">${escape(s.name)}</div>
        <div class="dp-role">${escape(s.grade)} · ${escape(s.role)}</div>
        <div class="dp-hr"></div>
        <div class="dp-row">
            <span class="dp-label">수행 사업</span>
            <span class="dp-tag" style="background:${color}18;color:${color};font-weight:600;">
                ${escape(s.project)}
            </span>
        </div>
        <div class="dp-row">
            <span class="dp-label">입사일</span>
            <span class="dp-val">${escape(s.join_date) || "—"}</span>
        </div>
        <div class="dp-hr"></div>
        <div class="dp-row">
            <span class="dp-label">생년월일</span>
            <span class="dp-val">${escape(s.birth) || "—"}</span>
        </div>
        <div class="dp-row">
            <span class="dp-label">전화번호</span>
            <span class="dp-val">${escape(s.phone) || "—"}</span>
        </div>
        <div class="dp-row">
            <span class="dp-label">이메일</span>
            ${emailHtml}
        </div>
        <div class="dp-row" style="align-items:flex-start">
            <span class="dp-label">주소</span>
            <span class="dp-val" style="font-size:10px;line-height:1.7;">${escape(s.address) || "—"}</span>
        </div>
    `;

    document.getElementById("org-overlay").classList.add("open");
    document.getElementById("org-detail-panel").classList.add("open");
}

// ── 상세 패널 닫기
function closeDetail() {
    document.getElementById("org-overlay").classList.remove("open");
    document.getElementById("org-detail-panel").classList.remove("open");
}

/* ════════════════════════════════
   PHASE 7 — 영업보고
════════════════════════════════ */

// ── 진입점: 탭 전환 시 호출, forceRefresh=true 이면 캐시 무효화
async function loadSales(forceRefresh = false) {
    const list = document.getElementById("sales-list");
    const btn  = document.getElementById("btn-sales-refresh");
    if (list) list.innerHTML = '<div class="loading-cell">데이터를 불러오는 중...</div>';
    if (btn)  btn.disabled = true;

    try {
        const url  = `/api/sales${forceRefresh ? "?refresh=1" : ""}`;
        const res  = await fetch(url);
        const data = await res.json();
        renderSalesList(data);
    } catch (e) {
        console.error("영업보고 로드 실패", e);
        if (list) list.innerHTML = '<div class="error-cell">서버 연결에 실패했습니다.</div>';
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ── 전체 주차 카드 목록 렌더링 (펼침 상태 고정, 토글 없음)
function renderSalesList(weeks) {
    const list = document.getElementById("sales-list");
    if (!list) return;

    if (!weeks || weeks.length === 0) {
        list.innerHTML = '<div class="loading-cell">영업보고 데이터가 없습니다.</div>';
        return;
    }
    list.innerHTML = weeks.map(w => renderSalesCard(w)).join("");
}

// ── 주차 카드 HTML 반환
// 좌: 고객사별 접촉 현황 / 우: 세종본부 연관 기회 + 액션 필요 건 + 주목할 이슈·리스크
function renderSalesCard(week) {
    const clientsHtml = renderSalesItems(week.clients);
    const oppsHtml    = renderSalesItems(week.opps);
    const actionsHtml = renderSalesItems(week.actions);
    const risksHtml   = renderSalesItems(week.risks);

    const dateHtml  = week.range ? `<div class="sales-card-date">${escape(week.range)}</div>` : "";
    const badgeHtml = week.total ? `<div class="sales-card-badge">총 ${week.total}건</div>` : "";

    return `
        <div class="sales-card">
            <div class="sales-card-header">
                <div class="sales-card-accent"></div>
                <div class="sales-card-title">${escape(week.label)}</div>
                ${dateHtml}
                ${badgeHtml}
            </div>
            <div class="sales-card-body">
                <!-- 좌: 고객사별 접촉 현황 (노션 원본 전체 표시) -->
                <div class="sales-col-left">
                    <div class="sales-section-title">고객사별 접촉 현황</div>
                    ${clientsHtml}
                </div>
                <!-- 우: 세종본부 연관 기회 / 액션 필요 건 / 주목할 이슈·리스크 -->
                <div class="sales-col-right">
                    <div>
                        <div class="sales-section-title">세종본부 연관 기회</div>
                        ${oppsHtml}
                    </div>
                    <div>
                        <div class="sales-section-title">액션 필요 건</div>
                        ${actionsHtml}
                    </div>
                    <div>
                        <div class="sales-section-title">주목할 이슈·리스크</div>
                        ${risksHtml}
                    </div>
                </div>
            </div>
            ${week.generated ? `<div class="sales-card-footer">${escape(week.generated)}</div>` : ""}
        </div>`;
}

// ── 항목 목록을 HTML로 변환
// · "해당 없음" / "없음" → 회색 이탤릭 표시
// · [수주] / [세종] → 색상 뱃지로 치환
function renderSalesItems(items) {
    if (!items || items.length === 0) {
        return '<div class="sales-empty">—</div>';
    }

    return items.map(text => {
        // "해당 없음" / "없음" 그대로 표시 (skip 없음)
        if (text === "해당 없음" || text === "없음") {
            return `<div class="sales-empty">${escape(text)}</div>`;
        }
        // XSS 방지 이스케이프 후 태그 치환 ([수주]/[세종] 은 이스케이프 대상 문자 없음)
        const safeText = escape(text);
        const tagged   = safeText
            .replace(/\[수주\]/g, '<span class="tag tag-win">수주</span>')
            .replace(/\[세종\]/g, '<span class="tag tag-sejong">세종</span>');
        return `
            <div class="sales-item">
                <div class="sales-item-dot"></div>
                <div>${tagged}</div>
            </div>`;
    }).join("");
}


/* ───────────────────────────────
   Phase 8: RISK 알림
────────────────────────────── */

async function loadRisk(forceRefresh = false) {
    // RISK 알림 데이터 로드 (강제 새로고침 지원)
    const list = document.getElementById("risk-list");
    const btn  = document.getElementById("btn-risk-refresh");
    list.innerHTML = '<div class="loading-cell">데이터를 불러오는 중...</div>';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-refresh"></i> 로딩 중...'; }
    try {
        const url  = `/api/risk${forceRefresh ? "?refresh=1" : ""}`;
        const res  = await fetch(url);
        const data = await res.json();
        renderRiskList(Array.isArray(data) ? data : []);
    } catch (err) {
        list.innerHTML = `<div class="loading-cell" style="color:#ef4444;">오류: ${err.message}</div>`;
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-refresh"></i> 새로고침'; }
    }
}

function renderRiskList(weeks) {
    // 전체 주차 카드를 펼침 상태로 나열
    const list = document.getElementById("risk-list");
    if (!weeks.length) {
        list.innerHTML = '<div class="loading-cell">데이터가 없습니다.</div>';
        return;
    }
    list.innerHTML = weeks.map(w => renderRiskCard(w)).join("");
}

function renderRiskCard(week) {
    // no_risk=true 인 경우 심플 카드
    if (week.no_risk) {
        return `
        <div class="risk-card">
            <div class="risk-card-header">
                <div class="risk-card-accent"></div>
                <div class="risk-card-title">${escape(week.label)}</div>
                ${week.base_date ? `<div class="risk-card-meta">${escape(week.base_date)}</div>` : ""}
            </div>
            <div class="risk-no-risk">이번 주 특이 리스크 없음</div>
            ${week.generated ? `<div class="risk-card-footer">${escape(week.generated)}</div>` : ""}
        </div>`;
    }

    // 2컬럼 그리드 카드 (좌상: 장기미해결, 우상: 일정리스크, 좌하: 악화감지, 우하: 집중확인)
    const scopeHtml = week.scope ? `<div class="risk-card-scope">분석 범위: ${escape(week.scope)}</div>` : "";

    const longIssuesHtml = renderRiskSection("장기 미해결 이슈", week.long_issues || [], "long-issues");
    const scheduleHtml   = renderRiskSection("일정 리스크",      week.schedule    || [], "schedule");
    const worseningHtml  = renderRiskSection("악화 감지",        week.worsening   || [], "worsening");
    const focusHtml      = renderRiskSection("집중 확인 필요",   week.focus       || [], "focus");
    const missingHtml    = renderRiskSection("보고 누락 의심",   week.missing     || [], "missing");

    // 좌우 상하 섹션 모두 비어 있으면 body 자체 생략
    const bodyContent = [longIssuesHtml, scheduleHtml, worseningHtml, focusHtml].join("");
    const bodyHtml = bodyContent ? `
        <div class="risk-card-body">
            <div class="risk-col long-issues">${longIssuesHtml}</div>
            <div class="risk-col schedule">${scheduleHtml}</div>
            <div class="risk-col worsening">${worseningHtml}</div>
            <div class="risk-col focus">${focusHtml}</div>
        </div>` : "";

    const missingFullHtml = missingHtml ? `
        <div class="risk-col-full missing">${missingHtml}</div>` : "";

    return `
    <div class="risk-card">
        <div class="risk-card-header">
            <div class="risk-card-accent"></div>
            <div class="risk-card-title">${escape(week.label)}</div>
            ${week.base_date ? `<div class="risk-card-meta">${escape(week.base_date)}</div>` : ""}
        </div>
        ${scopeHtml}
        ${bodyHtml}
        ${missingFullHtml}
        ${week.generated ? `<div class="risk-card-footer">${escape(week.generated)}</div>` : ""}
    </div>`;
}

function renderRiskSection(title, items, cssClass) {
    // 빈 섹션은 렌더링 생략 (PRD 규칙)
    if (!items || !items.length) return "";
    const itemsHtml = items.map(text => `
        <div class="risk-item">
            <div class="risk-item-dot"></div>
            <div>${escape(text)}</div>
        </div>`).join("");
    return `
        <div class="risk-section-title">${title}</div>
        ${itemsHtml}`;
}


/* ───────────────────────────────
   Phase 9: 세미나 알림
────────────────────────────── */

async function loadSeminar(forceRefresh = false) {
    // 세미나 알림 데이터 로드
    const list = document.getElementById("seminar-list");
    list.innerHTML = '<div class="loading-cell">데이터를 불러오는 중...</div>';
    try {
        const url  = `/api/seminar${forceRefresh ? "?refresh=1" : ""}`;
        const res  = await fetch(url);
        const data = await res.json();
        renderSeminarList(Array.isArray(data) ? data : []);
    } catch (err) {
        list.innerHTML = `<div class="loading-cell" style="color:#ef4444;">오류: ${err.message}</div>`;
    }
}

function renderSeminarList(weeks) {
    // 전체 주차 카드를 펼침 상태로 나열
    const list = document.getElementById("seminar-list");
    if (!weeks.length) {
        list.innerHTML = '<div class="loading-cell">데이터가 없습니다.</div>';
        return;
    }
    list.innerHTML = weeks.map(w => renderSeminarCard(w)).join("");
}

function renderSeminarCard(week) {
    // no_event=true 인 경우 심플 카드
    const badgeHtml = week.count
        ? `<div class="seminar-card-badge">신규 ${week.count}건</div>` : "";

    const headerHtml = `
        <div class="seminar-card-header">
            <div class="seminar-card-accent"></div>
            <div class="seminar-card-title">${escape(week.label)}</div>
            ${week.base_date ? `<div class="seminar-card-meta">${escape(week.base_date)}</div>` : ""}
            ${badgeHtml}
        </div>`;

    if (week.no_event) {
        return `
        <div class="seminar-card">
            ${headerHtml}
            <div class="seminar-no-event">신규 행사 없음</div>
            ${week.generated ? `<div class="seminar-card-footer">${escape(week.generated)}</div>` : ""}
        </div>`;
    }

    // 근거리 행사 (풀폭 강조) — 없으면 섹션 생략
    const nearbyHtml = week.nearby && week.nearby.length
        ? `<div class="seminar-section">
               <div class="seminar-section-title">근거리 행사 (세종·대전·충청)</div>
               ${week.nearby.map(e => renderEventFull(e)).join("")}
           </div>` : "";

    // 기타 행사 (3열 그리드) — 없으면 섹션 생략
    const othersHtml = week.others && week.others.length
        ? `<div class="seminar-section">
               <div class="seminar-section-title">기타 행사</div>
               <div class="event-grid">
                   ${week.others.map(e => renderEventGrid(e)).join("")}
               </div>
           </div>` : "";

    return `
    <div class="seminar-card">
        ${headerHtml}
        <div class="seminar-card-body">
            ${nearbyHtml}
            ${othersHtml}
        </div>
        ${week.generated ? `<div class="seminar-card-footer">${escape(week.generated)}</div>` : ""}
    </div>`;
}

function renderEventFull(event) {
    // 근거리 행사 — 풀폭 강조 카드
    const linkHtml = event.link
        ? `<a class="event-link" href="${escape(event.link)}" target="_blank" rel="noopener">바로가기 →</a>` : "";
    return `
        <div class="event-nearby">
            <div class="event-nearby-info">
                <div class="event-nearby-name">${escape(event.name)}</div>
                <div class="event-nearby-meta">
                    ${event.date  ? `<span>📅 ${escape(event.date)}</span>` : ""}
                    ${event.place ? `<span>📍 ${escape(event.place)}</span>` : ""}
                </div>
            </div>
            ${linkHtml}
        </div>`;
}

function renderEventGrid(event) {
    // 기타 행사 — 그리드 카드
    const linkHtml = event.link
        ? `<a class="event-link" href="${escape(event.link)}" target="_blank" rel="noopener">바로가기 →</a>` : "";
    return `
        <div class="event-card">
            <div class="event-name">${escape(event.name)}</div>
            ${event.date  ? `<div class="event-date">📅 ${escape(event.date)}</div>` : ""}
            ${event.place ? `<div class="event-place">📍 ${escape(event.place)}</div>` : ""}
            ${linkHtml}
        </div>`;
}

/* ═══════════════════════════════════════
   PHASE 10 — 대시보드 v2
   기존 API 재활용, app.py 수정 없음
   레이아웃: 상단 2컬럼(사업현황|인력현황) + 하단 4섹션(2+2)
═══════════════════════════════════════ */

/* 사업명 → 짧은 이름 변환 */
function getShortName(name) {
    if (name.includes("안전신문고"))              return "안전신문고";
    if (name.includes("재외") || name.includes("문화원")) return "재외문화원";
    if (name.includes("AI") || name.includes("인공지능")) return "AI과제";
    if (name.includes("해외홍보"))                return "해외홍보";
    if (name.includes("공직") || name.includes("통합메일")) return "공직메일";
    if (name.includes("철도"))                    return "철도공단";
    return name.length > 8 ? name.slice(0, 8) + "…" : name;
}

/* 사업명 → 색상 매핑 */
function getProjectColor(name) {
    if (name.includes("안전신문고"))              return "#4A9EE0";
    if (name.includes("재외") || name.includes("문화원")) return "rgba(74,158,224,0.6)";
    if (name.includes("AI") || name.includes("인공지능")) return "#8B5CF6";
    if (name.includes("해외홍보"))                return "#7CB652";
    if (name.includes("공직") || name.includes("통합메일")) return "#F59E0B";
    return "#64748b";
}

/* 대시보드 메인 로더 — Promise.all로 5개 API 동시 호출 */
async function loadDashboard(forceRefresh = false) {
    const ref = forceRefresh ? 1 : 0;
    const btn = document.getElementById("btn-refresh");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-refresh"></i> 로딩 중...'; }

    try {
        const [projects, risk, sales, seminar, org, history] = await Promise.all([
            fetch("/api/projects").then(r => r.json()),
            fetch(`/api/risk?refresh=${ref}`).then(r => r.json()),
            fetch(`/api/sales?refresh=${ref}`).then(r => r.json()),
            fetch(`/api/seminar?refresh=${ref}`).then(r => r.json()),
            fetch(`/api/org?refresh=${ref}`).then(r => r.json()),
            fetch("/api/history").then(r => r.json()),
        ]);

        renderDashKPI(projects, sales, history);
        renderDashProjects(projects);      // v2: 준비중 구분선 추가
        renderDashProjDonut(projects);     // 수행사업 현황 매출 도넛 차트
        renderDashOrg(org);                // v2: 상단 2컬럼으로 이동
        renderDashRisk(risk);             // v2: 최대 5건, focus 제외
        renderDashFocus(risk);            // v2: 별도 집중확인 카드
        renderDashSales(sales);
        renderDashSeminar(seminar);

    } catch (e) {
        console.error("대시보드 로딩 실패:", e);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-refresh"></i> 새로고침'; }
    }
}

/* KPI 5개 업데이트 — v2: 5번째 KPI = 준비중 사업 */
function renderDashKPI(projects, sales, history) {
    const data = projects.data || [];

    // 준비중 제외 사업
    const active = data.filter(p => p.status !== "준비중");
    document.getElementById("dash-kpi-projects").textContent = active.length;

    // 총 매출액 (준비중 제외)
    const rev = active.reduce((s, p) => s + (p.revenue || 0), 0);
    document.getElementById("dash-kpi-revenue").textContent =
        (rev / 100_000_000).toFixed(1) + "억";

    // 전년대비 서브텍스트 (빨간색)
    const yoyText = getLatestYoYText(history);
    const subEl   = document.getElementById("dash-kpi-revenue-sub");
    if (subEl && yoyText) {
        subEl.innerHTML = yoyText;
        subEl.style.color      = "#DC2626";
        subEl.style.fontWeight = "600";
        subEl.style.fontSize   = "11px";
    }

    // 이번주 영업 + 주차 칩 업데이트
    if (Array.isArray(sales) && sales.length > 0) {
        const latest = sales[0];
        document.getElementById("dash-kpi-sales").textContent = (latest.total || 0) + "건";
        document.getElementById("dash-kpi-sales-sub").textContent = latest.label || "—";
        const chipEl = document.getElementById("dash-week-label");
        if (chipEl) chipEl.textContent = latest.label || "—";
    }

    // 준비중 사업 수
    const readyCnt = data.filter(p => p.status === "준비중").length;
    document.getElementById("dash-kpi-ready").textContent = readyCnt + "건";
}

/* 수행 사업 목록 — 사업 행 목록 제거, 도넛(renderDashProjDonut)에서 전체 표시 */
function renderDashProjects(projects) {
    const el = document.getElementById("dash-projects-list");
    if (el) el.innerHTML = "";
}

/* 수행사업 현황 매출 구성 도넛 — 세종사업현황 탭과 동일 방식 */
function renderDashProjDonut(projects) {
    const data   = projects.data || [];
    const active = data.filter(p => p.status !== "준비중" && p.revenue > 0);
    const ready  = data.filter(p => p.status === "준비중");

    if (active.length === 0) return;

    const total  = active.reduce((s, p) => s + p.revenue, 0);
    const COLORS = ["#4A9EE0","#3B6D11","#185FA5","#854F0B","#A32D2D","#6366F1","#0891B2","#059669","#D97706","#DC2626"];
    const colors = active.map((_, i) => COLORS[i % COLORS.length]);

    // 기존 인스턴스 destroy 후 재생성
    if (_dashProjDonut) { _dashProjDonut.destroy(); _dashProjDonut = null; }

    const canvas = document.getElementById("dash-proj-donut");
    if (!canvas) return;

    _dashProjDonut = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
            labels: active.map(p => p.name),
            datasets: [{ data: active.map(p => p.revenue), backgroundColor: colors, borderWidth: 1, borderColor: "#fff" }]
        },
        options: {
            cutout: "65%",
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { duration: 400 },
        }
    });

    // 중앙 총 매출액
    const centerEl = document.getElementById("dash-proj-donut-center");
    if (centerEl) {
        const eok = total / 100_000_000;
        centerEl.innerHTML = eok >= 1 ? eok.toFixed(1) + "억" : Math.round(total / 10_000) + "만";
    }

    // 범례: dot + 사업명 + 매출 + % + 하단 합계
    const legendEl = document.getElementById("dash-proj-legend");
    if (legendEl) {
        const items = active.map((p, i) => {
            const pct = ((p.revenue / total) * 100).toFixed(0);
            return `
                <div class="legend-item">
                    <span class="legend-dot" style="background:${colors[i]}"></span>
                    <span class="legend-name">${escape(p.name)}</span>
                    <span class="legend-val">${formatRevenue(p.revenue)}</span>
                    <span class="legend-pct">${pct}%</span>
                </div>
            `;
        }).join("");
        const totalEok = (total / 100_000_000).toFixed(1) + "억";
        legendEl.innerHTML = items +
            `<div class="legend-total">합계 <span class="legend-total-val">${totalEok}</span></div>`;
    }

    // 준비중 요약 한 줄
    const sumEl = document.getElementById("dash-proj-ready-sum");
    if (sumEl) {
        if (ready.length > 0) {
            const readyRev = ready.reduce((s, p) => s + (p.revenue || 0), 0);
            const combined = ((total + readyRev) / 100_000_000).toFixed(1) + "억";
            sumEl.innerHTML = `준비중 ${ready.length}건 / 예상 ${formatRevenue(readyRev)} · 수주 확정 시 합계 <strong>${combined}</strong>`;
        } else {
            sumEl.innerHTML = "";
        }
    }
}

/* RISK 알림 — v2: 최대 5건, focus 항목 제외 */
function renderDashRisk(risk) {
    const el = document.getElementById("dash-risk-content");
    if (!el) return;

    if (!Array.isArray(risk) || risk.length === 0) {
        el.innerHTML = `<div class="dash-empty">데이터 없음</div>`;
        return;
    }

    const latest = risk[0];
    const weekEl = document.getElementById("dash-risk-week");
    if (weekEl) weekEl.textContent = latest.label || "";

    if (latest.no_risk) {
        el.innerHTML = `<div class="dash-empty">이번 주 특이 리스크 없음</div>`;
        return;
    }

    const sections = [
        { key: "long_issues", label: "장기", cls: "lv-long"  },
        { key: "worsening",   label: "악화", cls: "lv-bad"   },
        { key: "schedule",    label: "일정", cls: "lv-sched"  },
        { key: "missing",     label: "누락", cls: "lv-miss"   },
    ];

    const items = [];
    sections.forEach(s => {
        (latest[s.key] || []).forEach(txt => {
            if (txt && items.length < 5) {  // 최대 5건만 표시
                items.push(`
                    <div class="dash-risk-item">
                        <span class="dash-risk-lv ${s.cls}">${s.label}</span>
                        <span class="dash-risk-txt">${escape(txt)}</span>
                    </div>
                `);
            }
        });
    });

    el.innerHTML = items.join("") ||
        `<div class="dash-empty">이번 주 특이 리스크 없음</div>`;
}

/* 주간회의 집중 확인 — v2: focus 필드만 번호 리스트 */
function renderDashFocus(risk) {
    const el = document.getElementById("dash-focus-content");
    if (!el) return;

    if (!Array.isArray(risk) || risk.length === 0) {
        el.innerHTML = `<div class="dash-empty">데이터 없음</div>`;
        return;
    }

    const focus = (risk[0].focus || []).filter(Boolean);

    if (focus.length === 0) {
        el.innerHTML = `<div class="dash-empty">집중 확인 항목 없음</div>`;
        return;
    }

    el.innerHTML = focus.map((f, i) => `
        <div class="dash-focus-item">
            <span class="dash-focus-num">${i + 1}</span>
            <span class="dash-focus-txt">${escape(f)}</span>
        </div>
    `).join("");
}

/* 영업보고 — [수주]/[세종] 태그 항목만 필터링 */
function renderDashSales(sales) {
    const el = document.getElementById("dash-sales-content");
    if (!el) return;

    if (!Array.isArray(sales) || sales.length === 0) {
        el.innerHTML = `<div class="dash-empty">데이터 없음</div>`;
        return;
    }

    const latest  = sales[0];
    const salesWk = document.getElementById("dash-sales-week");
    if (salesWk) salesWk.textContent = latest.label || "";

    let html = `<div class="dash-sales-total">이번 주 총 ${latest.total || 0}건 영업 접촉</div>`;

    const tagged = (latest.clients || []).filter(
        c => c.includes("[수주]") || c.includes("[세종]")
    );

    if (tagged.length > 0) {
        html += tagged.map(c => {
            const text = escape(c)
                .replace("[수주]", '<span class="tag tag-win">수주</span>')
                .replace("[세종]", '<span class="tag tag-sejong">세종</span>');
            return `<div class="dash-sale-item">${text}</div>`;
        }).join("");
    } else {
        html += `<div class="dash-empty">수주/세종 연관 건 없음</div>`;
    }

    el.innerHTML = html;
}

/* 세미나 알림 — 최신 주차 행사 최대 4개 */
function renderDashSeminar(seminar) {
    const el = document.getElementById("dash-seminar-content");
    if (!el) return;

    if (!Array.isArray(seminar) || seminar.length === 0) {
        el.innerHTML = `<div class="dash-empty">데이터 없음</div>`;
        return;
    }

    const latest = seminar[0];

    if (latest.no_event) {
        el.innerHTML = `<div class="dash-empty">신규 행사 없음</div>`;
        return;
    }

    const allEvents = [
        ...(latest.nearby || []).map(e => ({ ...e, isNear: true })),
        ...(latest.others || []),
    ];

    el.innerHTML = allEvents.slice(0, 4).map(e => {
        const month = (e.date || "").slice(5, 7);
        const day   = (e.date || "").slice(8, 10);
        return `
            <div class="dash-sem-item">
                <div class="dash-sem-date ${e.isNear ? "dash-sem-near" : ""}">
                    <div>${month ? month + "월" : "—"}</div>
                    <div style="font-size:15px;font-weight:700;">${day || "—"}</div>
                </div>
                <div>
                    <div class="dash-sem-name">${escape(e.name)}</div>
                    <div class="dash-sem-loc">${escape(e.place || "")}${e.isNear ? " · 근거리" : ""}</div>
                </div>
            </div>
        `;
    }).join("");
}

/* 인력 배치 v7 — 구분="외주"이면 직급으로 개발/콘텐츠/민원응대 분류 */
function renderDashOrg(org) {
    const el = document.getElementById("dash-org-content");
    if (!el || !org) return;

    const allStaff = org.staff    || [];
    const projects = org.projects || [];

    // 팀 인원 KPI 업데이트 (정직원 기준)
    const regularAll = allStaff.filter(s => !(s.type || "").includes("외주"));
    const kpiEl = document.getElementById("dash-kpi-members");
    if (kpiEl) kpiEl.textContent = regularAll.length + "명";

    // 사업별 집계
    // - 구분에 "외주" 없음 → 정직원(regMap)
    // - 구분에 "외주" 있음 → 직급으로 세분: 개발(devMap) / 콘텐츠(ctMap) / 민원응대(mrMap)
    const regMap = {};
    const devMap = {};
    const ctMap  = {};
    const mrMap  = {};
    projects.forEach(p => {
        regMap[p.name] = 0; devMap[p.name] = 0;
        ctMap[p.name]  = 0; mrMap[p.name]  = 0;
    });
    allStaff.forEach(s => {
        if (!s.project) return;
        const type  = s.type  || "";
        const grade = s.grade || "";
        if (!type.includes("외주")) {
            // 정직원
            if (regMap[s.project] !== undefined) regMap[s.project]++;
        } else {
            // 외주: 직급으로 종류 구분
            if      (grade.includes("개발"))    { if (devMap[s.project] !== undefined) devMap[s.project]++; }
            else if (grade.includes("콘텐츠"))  { if (ctMap[s.project]  !== undefined) ctMap[s.project]++;  }
            else if (grade.includes("민원"))     { if (mrMap[s.project]  !== undefined) mrMap[s.project]++;  }
        }
    });

    // 스케일 기준: 개별 바 최댓값 + 1
    // 콘텐츠+민원응대는 합산 후 하나의 바로 표시하므로 합산값도 포함
    const allBarCounts = projects.flatMap(p => {
        const reg  = regMap[p.name] || 0;
        const dev  = devMap[p.name] || 0;
        const ctmr = (ctMap[p.name] || 0) + (mrMap[p.name] || 0);
        return [reg, dev, ctmr].filter(v => v > 0);
    });
    const maxBar   = Math.max(...allBarCounts, 1);
    const maxScale = maxBar;  // 최대 인원 = 100% (기존 +1 제거)

    // 안내 텍스트
    const outsideTotal = allStaff.length - regularAll.length;
    const infoText = `정직원 ${regularAll.length}명 (외주 ${outsideTotal}명 포함 총 ${allStaff.length}명)`;

    el.innerHTML = `
        <div class="dash-org-wrap">
            <div class="dash-org-total">${infoText}</div>
            <div class="dash-org-legend">
                ${projects.map(p => {
                    const reg  = regMap[p.name] || 0;
                    const dev  = devMap[p.name] || 0;
                    const ct   = ctMap[p.name]  || 0;
                    const mr   = mrMap[p.name]  || 0;
                    const ctmr = ct + mr;
                    const total = reg + dev + ctmr;
                    const color = p.color || "#64748b";
                    const pctReg  = Math.round(reg  / maxScale * 100);
                    const pctDev  = Math.round(dev  / maxScale * 100);
                    const pctCtmr = Math.round(ctmr / maxScale * 100);

                    // 콘텐츠/민원응대 라벨 결정
                    // - 둘 다 있으면: 외주(콘텐츠,민원응대)
                    // - 콘텐츠만: 외주(콘텐츠)
                    // - 민원응대만: 외주(민원응대)
                    const ctmrLabel = ct > 0 && mr > 0 ? "외주(콘텐츠,민원응대)"
                                    : ct > 0            ? "외주(콘텐츠)"
                                    :                     "외주(민원응대)";

                    return `
                        <div class="dash-org-leg">
                            <div class="dash-org-nm-cell">
                                <span class="dash-org-dot" style="background:${color};"></span>
                                <span class="dash-org-proj-nm">${escape(p.name)} (${total}명)</span>
                            </div>
                            <!-- 정규직: reg-bg 클래스로 두께 2배 적용 -->
                            <div class="dash-org-bar-bg dash-org-bar-reg-bg">
                                <div class="dash-org-bar-fill" style="width:${pctReg}%;background:${color};"></div>
                            </div>
                            <span class="dash-org-cnt-lbl">정규직 ${reg}명</span>

                            ${dev > 0 ? `
                            <div></div>
                            <!-- 외주: 색상은 CSS 회색으로 통일, 인라인 색상 제거 -->
                            <div class="dash-org-bar-bg">
                                <div class="dash-org-bar-fill dash-org-bar-dev" style="width:${pctDev}%;"></div>
                            </div>
                            <span class="dash-org-cnt-lbl">외주(개발) ${dev}명</span>
                            ` : ""}

                            ${ctmr > 0 ? `
                            <div></div>
                            <div class="dash-org-bar-bg">
                                <div class="dash-org-bar-fill dash-org-bar-ct" style="width:${pctCtmr}%;"></div>
                            </div>
                            <span class="dash-org-cnt-lbl">${ctmrLabel} ${ctmr}명</span>
                            ` : ""}
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}




/* ===== 반응형: 모바일 햄버거 사이드바 ===== */

/* 사이드바 열기/닫기 토글 */
function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const isOpen  = sidebar.classList.toggle("sidebar-open");
    overlay.style.display        = isOpen ? "block" : "none";
    document.body.style.overflow = isOpen ? "hidden" : "";
}

/* 사이드바 닫기 (오버레이 클릭 / 탭 전환 시 호출) */
function closeSidebar() {
    document.querySelector(".sidebar").classList.remove("sidebar-open");
    const overlay = document.getElementById("sidebar-overlay");
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";
}


/* ════════════════════════════════
   PHASE 11 — 손익현황 (v2.0)
════════════════════════════════ */

let _plData = null;
let _plMode = "org";

function plK(mode) {
    const p = mode === "org" ? "수행조직" : "전사";
    const s = mode === "org" ? "" : "_전사";
    return {
        label: p, 인력: p+"_인력", 매출: p+"_매출", 매출원가: p+"_매출원가", 매출이익: p+"_매출이익",
        인력비중: "인력비중_"+(mode==="org"?"수행조직대비":"전사대비"),
        매출비중: "매출비중_"+(mode==="org"?"수행조직대비":"전사대비"),
        매출원가비중: "매출원가비중_"+(mode==="org"?"수행조직대비":"전사대비"),
        매출이익비중: "매출이익비중_"+(mode==="org"?"수행조직대비":"전사대비"),
        매출이익률: p+"_매출이익률",
        exRevAmt: "수행인력대비_매출"+s+"_금액", exRevPp: "수행인력대비_매출"+s+"_pp",
        exCostAmt: "수행인력대비_매출원가"+s+"_금액", exCostPp: "수행인력대비_매출원가"+s+"_pp",
        exProfitAmt: "수행인력대비_매출이익"+s+"_금액", exProfitPp: "수행인력대비_매출이익"+s+"_pp",
    };
}
function plV(d, k) { const v = d[k]; return v === null || v === undefined ? 0 : v; }
function plR(d, k) { return d[k]; }

async function loadProfitLoss(refresh = false) {
    const btn = document.getElementById("btn-refresh");
    ["pl-kpi-row","pl-cards-section","pl-charts-section","pl-highlight","pl-table-section"].forEach(id => {
        const el = document.getElementById(id); if (el) el.style.display = "none";
    });
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-refresh"></i> 로딩 중...'; }
    try {
        const res = await fetch(`/api/profit-loss${refresh ? "?refresh=1" : ""}`);
        const result = await res.json();
        if (result.success && result.data) {
            _plData = result.data;
            plRenderAll();
        }
    } catch (e) { console.error("손익현황 로드 실패", e); }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-refresh"></i> 새로고침'; } }
}

function plInitTabs() {
    const label = document.querySelector("#pl-mode-tabs .pl-mode-tab[data-mode='org']");
    const switchBtn = document.getElementById("pl-btn-all");
    if (switchBtn) {
        switchBtn.addEventListener("click", () => {
            _plMode = _plMode === "org" ? "all" : "org";
            if (label) label.textContent = _plMode === "org" ? "수행조직대비" : "전사대비";
            if (_plData) plRenderAll();
        });
    }
    const ct = document.getElementById("pl-colorful-toggle");
    if (ct) ct.addEventListener("click", () => {
        document.body.classList.toggle("pl-colorful");
        ct.textContent = document.body.classList.contains("pl-colorful") ? "🌙 다크모드 ON" : "☀️ 다크모드 OFF";
        if (_plData) plRenderAll();
    });
}
if (document.getElementById("pl-mode-tabs")) plInitTabs();

function plRenderAll() {
    if (!_plData || !_plData.length) return;
    const K = plK(_plMode);
    plRenderKPI(_plData, K);
    plRenderCards(_plData, K);
    plRenderMiniCharts(_plData, K);
    plRenderHighlight(_plData, K);
    plRenderTable(_plData, K);
}

/* ── KPI 타일 8개 (4열×2행) ── */
function plRenderKPI(data, K) {
    const el = document.getElementById("pl-kpi-row");
    if (!el) return;
    const last = data[data.length - 1];
    const lastYr = last["연도"].replace("년","");

    // 매출 효율배수
    const revEffs = data.map(d => {
        const lR = plR(d, K.인력비중), rR = plR(d, K.매출비중);
        if (!lR || lR === 0 || rR === null || rR === undefined) return null;
        return rR / lR;
    });
    const lastRevEff = revEffs[revEffs.length - 1];
    const validRevEffs = revEffs.filter(v => v !== null);
    const avgRevEff = validRevEffs.length ? validRevEffs.reduce((a,b) => a+b, 0) / validRevEffs.length : 0;

    // 매출이익 효율배수
    const profitEffs = data.map(d => {
        const lR = plR(d, K.인력비중), pR = plR(d, K.매출이익비중);
        const base = plV(d, K.매출이익);
        if (base < 0 || !lR || lR === 0 || pR === null || pR === undefined) return null;
        return pR / lR;
    });
    const lastProfitEff = profitEffs[profitEffs.length - 1];
    const validProfitEffs = profitEffs.filter(v => v !== null);
    const avgProfitEff = validProfitEffs.length ? validProfitEffs.reduce((a,b) => a+b, 0) / validProfitEffs.length : 0;
    const profitExcluded = profitEffs.length - validProfitEffs.length;
    const profitCapExtra = profitExcluded > 0 ? ` (${K.label} 적자해 제외)` : "";

    // 초과 금액
    const revExcess = data.map(d => plV(d, K.exRevAmt));
    const profitExcess = data.map(d => plR(d, K.exProfitAmt));
    const lastRevEx = revExcess[revExcess.length - 1];
    const lastProfitEx = profitExcess[profitExcess.length - 1];
    const totalRevEx = revExcess.reduce((a,b) => a + b, 0);
    const validProfitEx = profitExcess.filter(v => v !== null && v !== undefined);
    const totalProfitEx = validProfitEx.reduce((a,b) => a + b, 0);

    const fmtSign = v => v === null || v === undefined ? "—" : (v >= 0 ? "+" : "") + v.toFixed(1) + "억";
    const fmtEff = v => v !== null ? v.toFixed(2) + "x" : "—";

    el.innerHTML = `
        <div class="pl-kpi rev"><div class="pl-kpi-stripe current"></div><div class="pl-kpi-period">${lastYr}년</div><div class="pl-kpi-val">${fmtEff(lastRevEff)}</div><div class="pl-kpi-cap">매출 효율배수</div></div>
        <div class="pl-kpi rev"><div class="pl-kpi-stripe current"></div><div class="pl-kpi-period">${lastYr}년</div><div class="pl-kpi-val">${fmtSign(lastRevEx)}</div><div class="pl-kpi-cap">초과 매출</div></div>
        <div class="pl-kpi profit"><div class="pl-kpi-stripe current"></div><div class="pl-kpi-period">${lastYr}년</div><div class="pl-kpi-val">${fmtEff(lastProfitEff)}</div><div class="pl-kpi-cap">매출이익 효율배수</div></div>
        <div class="pl-kpi profit"><div class="pl-kpi-stripe current"></div><div class="pl-kpi-period">${lastYr}년</div><div class="pl-kpi-val">${fmtSign(lastProfitEx)}</div><div class="pl-kpi-cap">초과 매출이익</div></div>
        <div class="pl-kpi rev"><div class="pl-kpi-stripe cumul"></div><div class="pl-kpi-period">누적(21~26)</div><div class="pl-kpi-val">${avgRevEff.toFixed(2)}x</div><div class="pl-kpi-cap">평균 매출 효율배수</div></div>
        <div class="pl-kpi rev"><div class="pl-kpi-stripe cumul"></div><div class="pl-kpi-period">누적(21~26)</div><div class="pl-kpi-val">${fmtSign(totalRevEx)}</div><div class="pl-kpi-cap">총 초과 매출</div></div>
        <div class="pl-kpi profit"><div class="pl-kpi-stripe cumul"></div><div class="pl-kpi-period">누적(21~26)</div><div class="pl-kpi-val">${avgProfitEff.toFixed(2)}x</div><div class="pl-kpi-cap">평균 매출이익 효율배수${profitCapExtra}</div></div>
        <div class="pl-kpi profit"><div class="pl-kpi-stripe cumul"></div><div class="pl-kpi-period">누적(21~26)</div><div class="pl-kpi-val">${fmtSign(totalProfitEx)}</div><div class="pl-kpi-cap">총 초과 매출이익</div></div>`;
    el.style.display = "grid";
}

/* ── 효율배수 카드 6개 ── */
function plRenderCards(data, K) {
    const container = document.getElementById("pl-year-cards");
    if (!container) return;
    container.innerHTML = data.map(d => {
        const yr = d["연도"];
        const lR = plV(d, K.인력비중), rR = plV(d, K.매출비중), cR = plV(d, K.매출원가비중);
        const pR = plR(d, K.매출이익비중);
        const baseProfit = plV(d, K.매출이익);
        const isDeficit = baseProfit < 0;
        const revEff = (lR > 0 && rR) ? (rR / lR).toFixed(2) + "x" : "—";
        let profitEffTxt;
        if (isDeficit) profitEffTxt = "흑자전환 기여";
        else if (lR > 0 && pR !== null && pR !== undefined) profitEffTxt = (pR / lR).toFixed(2) + "x";
        else profitEffTxt = "—";
        const profitEffBadge = isDeficit;
        const maxS = Math.max(lR, rR, cR, isDeficit ? 0 : (pR||0)) * 1.18 || 1;
        const baseW = (lR / maxS * 100).toFixed(1);
        const rows = [{tag:"인력",val:lR,cls:"steel"},{tag:"매출",val:rR,cls:"steel"},{tag:"매출원가",val:cR,cls:"steel"}];
        if (!isDeficit && pR !== null) rows.push({tag:"매출이익",val:pR,cls:"gold"});
        let rh = rows.map(r => `<div class="pl-card-row"><span class="pl-card-tag">${r.tag}</span><span class="pl-card-track"><span class="pl-card-base" style="left:${baseW}%"></span><span class="pl-card-fill pl-fill-${r.cls}" style="width:${(r.val/maxS*100).toFixed(1)}%"></span></span><span class="pl-card-pct ${r.cls==='gold'?'pl-gold':''}">${r.val.toFixed(1)}%</span></div>`).join("");
        if (isDeficit) rh += `<div class="pl-deficit-note">${K.label} 적자 속 세종 흑자 (하단 참고)</div>`;
        return `<div class="pl-yc"><div class="pl-yc-year">${escape(yr)}</div>
            <div class="pl-eff-duo">
                <div class="pl-eff-box"><div class="pl-eff-label">매출</div><div class="pl-eff-num">${revEff}</div></div>
                <div class="pl-eff-box ${profitEffBadge?'pl-eff-box-badge':''}"><div class="pl-eff-label">매출이익</div><div class="pl-eff-num">${profitEffTxt}</div></div>
            </div>
            <div class="pl-card-rows">${rh}</div></div>`;
    }).join("");
    document.getElementById("pl-cards-title").textContent = `연도별 수행인력 효율배수 (${K.label}대비)`;
    document.getElementById("pl-cards-foot").innerHTML = `※ 막대는 <b>${K.label}</b> 대비 세종 비중(%). 점선 = 인력 비중 기준선. 효율배수 = 매출이익비중 / 인력비중.`;
    document.getElementById("pl-cards-section").style.display = "block";
}

/* ── 미니차트 4개 ── */
function plRenderMiniCharts(data, K) {
    if (!data.length) return;
    const metrics = [{id:"pl-chart-labor",m:"labor"},{id:"pl-chart-revenue",m:"revenue"},{id:"pl-chart-cost",m:"cost"},{id:"pl-chart-profit",m:"profit"}];
    metrics.forEach(x => plRenderMiniChart(x.id, data, x.m, K));
    document.getElementById("pl-charts-title").textContent = `연도별 ${K.label}대비 매출/매출원가/매출이익`;
    document.getElementById("pl-charts-note").textContent = `2021~2026 · ${K.label} vs 세종`;
    document.getElementById("pl-legend").innerHTML = `
        <span class="pl-legend-item"><span class="pl-dot pl-dot-steel"></span>${K.label} 합계</span>
        <span class="pl-legend-item"><span class="pl-dot pl-dot-gold"></span>세종개발본부 (괄호 = ${K.label} 대비 비중)</span>
        <span class="pl-legend-item">⋯ 점선 = 인력비중만큼의 기준 위치</span>
        <span class="pl-legend-item"><span style="color:#DC2626">▲</span> 초과 <span style="color:#2563EB">▼</span> 미달</span>`;
    document.getElementById("pl-charts-section").style.display = "block";
}

function plRenderMiniChart(containerId, data, metric, K) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const km = {
        labor:  {base:K.인력, sj:"세종_인력", ratio:K.인력비중, unit:"명", dec:1, exAmt:null, exPp:null},
        revenue:{base:K.매출, sj:"세종_매출", ratio:K.매출비중, unit:"억", dec:1, exAmt:K.exRevAmt, exPp:K.exRevPp},
        cost:   {base:K.매출원가, sj:"세종_매출원가", ratio:K.매출원가비중, unit:"억", dec:1, exAmt:K.exCostAmt, exPp:K.exCostPp},
        profit: {base:K.매출이익, sj:"세종_매출이익", ratio:K.매출이익비중, unit:"억", dec:1, exAmt:K.exProfitAmt, exPp:K.exProfitPp},
    }[metric];
    const dark = document.body.classList.contains("pl-colorful");
    const C = dark
        ? { grid:"#212B40", axis:"#7C879E", bar:"#4C5C7C", barNeg:"#E2574C", barLbl:"#9aa6c0", sj:"#E8B84B", ref:"#EAEDF5", yr:"#7C879E", zero:"#212B40", red:"#E2574C", blue:"#6E9CE8" }
        : { grid:"#E2E8F0", axis:"#94A3B8", bar:"#64748B", barNeg:"#DC2626", barLbl:"#64748B", sj:"#B8860B", ref:"#0F172A", yr:"#64748B", zero:"#CBD5E1", red:"#DC2626", blue:"#2563EB" };

    const bVals = data.map(d => plV(d, km.base)), sVals = data.map(d => plV(d, km.sj));
    const all = [...bVals, ...sVals];
    const rMax = Math.max(...all) * 1.25, rMin = Math.min(...all, 0);
    const yMax = rMax, yMin = rMin < 0 ? rMin * 1.3 : 0;
    const W=900,H=200,pL=50,pR=20,pT=30,pB=24;
    const iW=W-pL-pR, iH=H-pT-pB;
    const yS = v => pT+iH*(1-(v-yMin)/(yMax-yMin||1));
    const zY = yS(0), gW=iW/data.length, bW=gW*0.16, gp=gW*0.05;
    let grid="",bars="",xa="";
    for(let s=0;s<=4;s++){const v=yMin+(yMax-yMin)*s/4;const gy=yS(v);grid+=`<line x1="${pL}" x2="${W-pR}" y1="${gy}" y2="${gy}" stroke="${C.grid}" stroke-width="1" stroke-dasharray="2 4"/><text x="${pL-6}" y="${gy+3}" text-anchor="end" font-size="9" fill="${C.axis}">${Math.round(v)}</text>`;}
    data.forEach((d,i) => {
        const gx=pL+gW*i+gW*0.15, bV=plV(d,km.base), sV=plV(d,km.sj), ratio=plR(d,km.ratio), lR=plV(d,K.인력비중);
        const baseProfit=plV(d,K.매출이익), isD=metric==="profit"&&baseProfit<0;
        const bC=bV>=0?C.bar:C.barNeg;
        const bY1=Math.min(yS(bV),zY), bH=Math.abs(yS(bV)-zY);
        bars+=`<rect x="${gx}" y="${bY1}" width="${bW}" height="${Math.max(bH,1)}" rx="2" fill="${bC}"/>`;
        const bLY=bV>=0?bY1-6:bY1+bH+12;
        bars+=`<text x="${gx+bW/2}" y="${bLY}" text-anchor="middle" font-size="9" fill="${bV>=0?C.barLbl:C.barNeg}">${bV.toFixed(km.dec)}${km.unit}</text>`;
        const sx=gx+bW+gp, sY1=Math.min(yS(sV),zY), sH=Math.abs(yS(sV)-zY);
        bars+=`<rect x="${sx}" y="${sY1}" width="${bW}" height="${Math.max(sH,1)}" rx="2" fill="${C.sj}"/>`;
        if(metric!=="labor"&&bV>0){const rV=bV*lR/100;bars+=`<line x1="${sx-2}" x2="${sx+bW+2}" y1="${yS(rV)}" y2="${yS(rV)}" stroke="${C.ref}" stroke-width="1.3" stroke-dasharray="2.5 2"/>`;}
        const rTxt = isD ? "흑자" : (ratio===null?"—":ratio.toFixed(1)+"%");
        const l1=sV>=0?sY1-17:sY1+sH+14, l2=l1+11;
        bars+=`<text x="${sx+bW/2}" y="${l1}" text-anchor="middle" font-size="9.5" font-weight="600" fill="${C.sj}">${sV.toFixed(km.dec)}${km.unit}</text>`;
        bars+=`<text x="${sx+bW/2}" y="${l2}" text-anchor="middle" font-size="8.3" fill="${C.sj}">(${rTxt})</text>`;
        if(metric!=="labor"&&km.exAmt){
            const diff=plR(d,km.exAmt), exX=sx+bW+10;
            const effX = (!isD&&ratio!==null&&ratio!==undefined&&lR>0) ? (ratio/lR) : null;
            if(diff!==null&&diff!==undefined){
                const up=diff>=0, tc=up?C.red:C.blue, tri=up?"▲":"▼";
                bars+=`<text x="${exX}" y="${l1}" font-size="9.3" fill="${tc}">${tri} ${Math.abs(diff).toFixed(km.dec)}${km.unit}</text>`;
                if(effX===null) bars+=`<text x="${exX}" y="${l2}" font-size="8.3" fill="${C.sj}">(흑자전환 기여)</text>`;
                else bars+=`<text x="${exX}" y="${l2}" font-size="8.3" fill="${tc}">(${effX.toFixed(2)}x)</text>`;
            } else if(isD){
                bars+=`<text x="${exX}" y="${l1}" font-size="9" fill="${C.red}">${K.label} 적자</text>`;
                bars+=`<text x="${exX}" y="${l2}" font-size="9" font-weight="600" fill="${C.sj}">속 세종 흑자</text>`;
            }
        }
        xa+=`<text x="${gx+bW+gp/2}" y="${H-6}" text-anchor="middle" font-size="10" fill="${C.yr}">${d["연도"].replace("년","")}</text>`;
    });
    const zL=yMin<0?`<line x1="${pL}" x2="${W-pR}" y1="${zY}" y2="${zY}" stroke="${C.zero}" stroke-width="1"/>`:"";
    el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="100%">${grid}${zL}${bars}${xa}</svg>`;
}

/* ── 하이라이트 배너 (탭별 분기) ── */
function plRenderHighlight(data, K) {
    const el = document.getElementById("pl-highlight");
    if (!el) return;
    const d2025 = data.find(d => d["연도"].includes("2025"));
    if (!d2025) { el.style.display = "none"; return; }

    if (_plMode === "org") {
        if (plV(d2025, "수행조직_매출이익") >= 0) { el.style.display = "none"; return; }
        const siP = plV(d2025, "수행조직_매출이익"), sjP = plV(d2025, "세종_매출이익");
        const siR = plR(d2025, "수행조직_매출이익률"), sjR = plR(d2025, "세종_매출이익률");
        el.innerHTML = `
            <div class="pl-hl-head"><span class="pl-hl-title">2025년 — 수행조직이 적자였던 해</span><span class="pl-hl-note">매출이익 기준 · 억원</span></div>
            <div class="pl-hl-grid"><div class="pl-hl-cell"><div class="pl-hl-num pl-hl-red">${siP.toFixed(1)}억</div><div class="pl-hl-cap">수행조직 전체 매출이익 (세종 포함)</div></div><div class="pl-hl-mid">＋</div><div class="pl-hl-cell"><div class="pl-hl-num pl-hl-gold">+${sjP.toFixed(1)}억</div><div class="pl-hl-cap">세종개발본부 단독 매출이익</div></div></div>
            <div class="pl-hl-text">회사가 어려웠던 2025년, 수행조직 전체는 <b>적자(매출이익률 ${siR!==null?siR.toFixed(1)+"%":"—"})</b>였지만 세종개발본부는 홀로 <b>매출이익률 ${sjR!==null?sjR.toFixed(1)+"%":"—"}</b>를 지켜냈습니다.</div>`;
    } else {
        const allRate = plR(d2025, "전사_매출이익률"), sjR = plR(d2025, "세종_매출이익률");
        el.innerHTML = `
            <div class="pl-hl-head"><span class="pl-hl-title">2025년 — 전사 매출이익률이 가장 낮았던 해</span><span class="pl-hl-note">매출이익률 기준</span></div>
            <div class="pl-hl-grid"><div class="pl-hl-cell"><div class="pl-hl-num pl-hl-red">${allRate!==null?allRate.toFixed(1)+"%":"—"}</div><div class="pl-hl-cap">전사 매출이익률 (전체 기간 중 최저)</div></div><div class="pl-hl-mid">vs</div><div class="pl-hl-cell"><div class="pl-hl-num pl-hl-gold">${sjR!==null?sjR.toFixed(1)+"%":"—"}</div><div class="pl-hl-cap">세종개발본부 매출이익률</div></div></div>
            <div class="pl-hl-text">회사 전체 매출이익률이 가장 낮았던 2025년에도, 세종개발본부는 <b>${sjR!==null?sjR.toFixed(1)+"%":"—"}</b>의 매출이익률을 유지했습니다. 회사 평균(${allRate!==null?allRate.toFixed(1)+"%":"—"})보다 <b>3배 이상</b> 높은 수치입니다.</div>`;
    }
    el.style.display = "block";
}

/* ── 요약 표 ── */
function plRenderTable(data, K) {
    const tbody = document.getElementById("pl-table-body");
    if (!tbody || !data.length) return;

    const exLabel = _plMode === "org" ? "수행인력대비" : "전사인력대비";
    const thead = document.getElementById("pl-table-head");
    if (thead) thead.innerHTML = `<th>연도</th><th>구분</th><th>인력</th><th>매출</th><th>매출원가</th><th>매출이익</th><th>매출이익률</th><th class="pl-grp">${exLabel} 매출</th><th>${exLabel} 매출원가</th><th>${exLabel} 매출이익</th>`;

    const desc = [...data].sort((a,b) => b["연도"].localeCompare(a["연도"]));

    function exCell(amtVal, effMultiple) {
        if (amtVal === null || amtVal === undefined) return "—";
        const up = amtVal >= 0, c = up ? "#DC2626" : "#2563EB", tri = up ? "▲" : "▼";
        const amtStr = `${tri}${Math.abs(amtVal).toFixed(1)}억`;
        if (effMultiple === null || effMultiple === undefined) return `<span style="color:${c}">${amtStr}</span> <span class="pl-gold-badge">(흑자전환 기여)</span>`;
        return `<span style="color:${c}">${amtStr}(${effMultiple.toFixed(2)}x)</span>`;
    }

    tbody.innerHTML = desc.map(d => {
        const yr = d["연도"];
        const bL=plV(d,K.인력), bR=plV(d,K.매출), bC=plV(d,K.매출원가), bP=plV(d,K.매출이익);
        const bM = bR ? (bP/bR*100) : 0;
        const sL=plV(d,"세종_인력"), sR=plV(d,"세종_매출"), sC=plV(d,"세종_매출원가"), sP=plV(d,"세종_매출이익");
        const sM = sR ? (sP/sR*100) : 0;
        const lR=plR(d,K.인력비중), rR=plR(d,K.매출비중), cR=plR(d,K.매출원가비중), pR=plR(d,K.매출이익비중);
        const isD = bP < 0;
        const pRTxt = pR===null ? (isD?"흑자":"—") : pR.toFixed(1)+"%";

        return `
        <tr class="pl-grp-top">
            <td class="pl-yr" rowspan="2">${escape(yr)}</td>
            <td class="pl-tag">${K.label}</td>
            <td><div class="pl-val">${bL}명</div></td>
            <td><div class="pl-val">${bR.toFixed(1)}억</div></td>
            <td><div class="pl-val">${bC.toFixed(1)}억</div></td>
            <td><div class="pl-val">${bP.toFixed(1)}억</div></td>
            <td><div class="pl-val">${bM.toFixed(1)}%</div></td>
            <td class="pl-grp" colspan="3" style="color:#94A3B8;">—</td>
        </tr>
        <tr class="pl-grp-bottom">
            <td class="pl-tag pl-tag-gold">세종개발본부</td>
            <td><div class="pl-val">${sL}명</div><div class="pl-pct">(${lR!==null?lR.toFixed(1)+"%":"—"})</div></td>
            <td><div class="pl-val pl-bold">${sR.toFixed(1)}억</div><div class="pl-pct">(${rR!==null?rR.toFixed(1)+"%":"—"})</div></td>
            <td><div class="pl-val">${sC.toFixed(1)}억</div><div class="pl-pct">(${cR!==null?cR.toFixed(1)+"%":"—"})</div></td>
            <td><div class="pl-val pl-bold">${sP.toFixed(1)}억</div><div class="pl-pct">(${pRTxt})</div></td>
            <td><div class="pl-val pl-bold">${sM.toFixed(1)}%</div></td>
            <td class="pl-grp pl-bold">${exCell(plR(d,K.exRevAmt), (rR!==null&&lR>0)?(rR/lR):null)}</td>
            <td class="pl-bold">${exCell(plR(d,K.exCostAmt), (cR!==null&&lR>0)?(cR/lR):null)}</td>
            <td class="pl-bold">${exCell(plR(d,K.exProfitAmt), (pR!==null&&pR!==undefined&&lR>0&&!isD)?(pR/lR):null)}</td>
        </tr>`;
    }).join("");
    document.getElementById("pl-table-section").style.display = "block";
}


/* ========================================
   자동화 실행 탭
======================================== */

// SKILL 설정 배열 (PRD §2.4)
const automationSkills = [
    {
        id: "seminar",
        name: "세미나브리핑",
        icon: "ti-calendar-event",
        description: "AI·공공IT 행사 수집 → 슬랙·노션 등록",
        triggerText: "세미나 브리핑 해줘",
        mode: "deeplink"
    },
    {
        id: "sales",
        name: "영업보고분석",
        icon: "ti-briefcase",
        description: "영업보고 메일 분석 → 슬랙·노션 등록",
        triggerText: "영업보고 분석해줘",
        mode: "deeplink"
    },
    {
        id: "risk",
        name: "리스크알람",
        icon: "ti-alert-circle",
        description: "PM 이슈 조기경보 → 슬랙·노션 등록",
        triggerText: "리스크 분석해줘",
        mode: "deeplink"
    },
    {
        id: "weekly",
        name: "주간보고서",
        icon: "ti-report",
        description: "PM 주간보고 취합 → 노션 등록",
        triggerText: "주간보고서 만들어줘",
        mode: "deeplink"
    }
];

// 카드 렌더링
function renderAutomationCards() {
    const grid = document.getElementById("auto-grid");
    if (!grid) return;
    grid.innerHTML = automationSkills.map(skill => `
        <div class="auto-card">
            <div class="auto-card-icon"><i class="ti ${skill.icon}"></i></div>
            <div class="auto-card-name">${escape(skill.name)}</div>
            <div class="auto-card-desc">${escape(skill.description)}</div>
            <button class="auto-card-btn" onclick="handleRunClick('${skill.id}')">실행하기</button>
        </div>
    `).join("");
}

// 클릭 핸들러 — mode 기반 분기
function handleRunClick(skillId) {
    const skill = automationSkills.find(s => s.id === skillId);
    if (!skill) return;
    if (skill.mode === "deeplink") {
        runSkillDeeplink(skill.triggerText);
    } else if (skill.mode === "api") {
        runSkillViaApi(skill.id);
    }
}

// 1단계(C): 딥링크 바로가기
async function runSkillDeeplink(triggerText) {
    try {
        await navigator.clipboard.writeText(triggerText);
        window.open("https://claude.ai/new", "_blank");
        showAutoToast("클립보드에 복사했어요. 새 탭에서 Ctrl+V 후 Enter를 눌러주세요.");
    } catch (e) {
        showFallback(triggerText);
    }
}

// 2단계(B): API 자동실행 — 구조만 대비, 다음 PRD에서 구현
function runSkillViaApi(skillId) {
    // 향후 구현 예정
}

/* ───────────────────────────────────────────────────────────────────
   PHASE DL: 다운로드 공통 함수
─────────────────────────────────────────────────────────────────── */

/**
 * 현재 탭의 다운로드 URL로 파일을 내려받습니다.
 * 백엔드가 Content-Disposition 헤더로 파일명을 지정합니다.
 */
function triggerDownload() {
    if (!_downloadUrl) return;

    const btn = document.getElementById("btn-download");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ti ti-loader"></i> 생성 중...';
    }

    // <a> 태그로 다운로드 트리거 (파일명은 서버 헤더 사용)
    const a = document.createElement("a");
    a.href  = _downloadUrl;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 2초 후 버튼 복원 (다운로드는 비동기라 완료 감지 불가)
    setTimeout(() => {
        if (btn) {
            btn.disabled = false;
            // 조직도 탭은 "PDF 다운로드", 나머지는 "다운로드"
            const isPdf = _downloadUrl.includes("download-pdf");
            btn.innerHTML = isPdf
                ? '<i class="ti ti-download"></i> PDF 다운로드'
                : '<i class="ti ti-download"></i> 다운로드';
        }
    }, 2000);
}

// 토스트 표시
function showAutoToast(msg) {
    const el = document.getElementById("auto-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("auto-toast-show");
    setTimeout(() => el.classList.remove("auto-toast-show"), 5000);
}

// 폴백: 트리거 문구 직접 표시 + 수동 복사
function showFallback(triggerText) {
    document.getElementById("auto-fallback-text").textContent = triggerText;
    document.getElementById("auto-fallback-overlay").classList.add("auto-fallback-open");
    document.getElementById("auto-fallback").classList.add("auto-fallback-open");
    document.getElementById("auto-fallback-copy").onclick = async () => {
        try {
            await navigator.clipboard.writeText(triggerText);
            showAutoToast("복사 완료! claude.ai에서 붙여넣기 해주세요.");
            closeFallback();
        } catch (e2) {
            // 클립보드 완전 실패 시 사용자가 직접 선택 복사
        }
    };
}

function closeFallback() {
    document.getElementById("auto-fallback-overlay").classList.remove("auto-fallback-open");
    document.getElementById("auto-fallback").classList.remove("auto-fallback-open");
}
