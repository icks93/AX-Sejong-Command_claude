# PRD_LOGIC_Phase6_조직도.md
> 작성: 익스 + Claude | 2026.05.21
> Phase 6: 조직도 탭

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 탭 이름 | 조직도 |
| 목적 | 세종개발본부 인력 현황 조회 (사업별 배치 + 인물 상세) |
| 데이터 소스 | 노션 DB 2개 + 사진 파일 (static/images/) |
| 뷰 구성 | 사업별 뷰 / 인물사전 뷰 (토글) |
| 클릭 동작 | 정직원 클릭 → 우측 상세 패널 슬라이드인 |

---

## 2. 노션 DB 구조

### [AX]세종인력 DB
- **DB ID**: `7d93242628714413b4c31bffbadd3e03`
- **Data Source ID**: `109e029f-f80d-4a90-a67d-7b714e4628d1`
- **API**: `GET /api/org`로 전체 인력 리스트 반환

| 속성명 | 타입 | 비고 |
|--------|------|------|
| 이름 | title | |
| 직급 | select | 이사/수석/책임/선임/주임/개발/콘텐츠/민원응대 |
| 직책 | select | 본부장/팀원(PM)/팀원/팀원(휴직)/외주 |
| 소속사업 | select | 안전신문고/해외홍보시스템/공직자통합메일/AI과제/공통 |
| 구분 | select | 정직원/외주 |
| 입사일 | date | |
| 생년월일 | text | |
| 전화번호 | phone | |
| 이메일1 | email | |
| 이메일2 | email | |
| 이메일3 | email | |
| 주소 | text | |
| 사진파일명 | text | ex) nowoonguk.png |
| 표시순서 | number | 오름차순 정렬 기준 |

### [AX]세종사업구조 DB
- **DB ID**: `e22b899799494b4e9a9edb8521d2084f`
- **Data Source ID**: `e759ce0a-9a38-472f-86ae-f5f592e95a31`
- **API**: `GET /api/org`에 포함해서 반환

| 속성명 | 타입 | 비고 |
|--------|------|------|
| 사업명 | title | |
| 색상코드 | text | hex 코드 ex) #4A9EE0 |
| 설명 | text | ex) 2026 유지관리 |
| 고객사 | text | ex) 행안부 |
| 표시순서 | number | 오름차순 정렬 기준 |

---

## 3. 사진 파일 위치

```
AX-Sejong-Command/
└── static/
    └── images/
        ├── noseungik.png
        ├── nowoonguk.png
        ├── parkjungsu.png
        ├── jangeunnyoung.jpg
        ├── kimchanghwan.png
        ├── shininsoon.png
        ├── kimhyungjung.png
        ├── kimseunghwan.png
        ├── seominwook.png
        ├── jungwoosung.png
        ├── ohyunjung.png
        ├── yeonsonmo.png
        ├── kimjaehoon.png
        ├── kimjunghyun.png
        ├── kimyounggun.jpg
        ├── yunsunhyung.png
        ├── yunjiyun.png
        └── kwakseulgi.png
```

**서빙 경로**: `/static/images/{사진파일명}`
- FastAPI StaticFiles로 마운트됨 (기존 설정 그대로)
- 사진 없는 경우: 이름 첫 글자 이니셜 아바타로 fallback

---

## 4. API 설계

### `GET /api/org?refresh=0`

**반환 구조**:
```json
{
  "projects": [
    {
      "name": "안전신문고",
      "color": "#4A9EE0",
      "description": "2026 유지관리",
      "client": "행안부",
      "order": 1
    },
    ...
  ],
  "staff": [
    {
      "name": "노승익",
      "grade": "이사",
      "role": "본부장",
      "project": "공통",
      "type": "정직원",
      "join_date": "2002-05-03",
      "birth": "1974.08.07",
      "phone": "010-5645-8122",
      "email1": "",
      "email2": "",
      "email3": "",
      "address": "세종시 새롬중앙로 19 새뜸마을5단지",
      "photo": "noseungik.png",
      "order": 1
    },
    ...
  ]
}
```

**캐싱**: CACHE_TTL (10분), 기존 패턴 동일

---

## 5. app.py 추가 내용

```python
# ── 상수
STAFF_DB_ID   = "7d93242628714413b4c31bffbadd3e03"
PROJECT_DB_ID = "e22b899799494b4e9a9edb8521d2084f"
_org_cache    = {"data": None, "timestamp": 0}

# ── 노션 DB 쿼리 헬퍼 (신규)
# 기존 fetch_block_children()과 별개로
# Notion Databases API 사용: POST /v1/databases/{id}/query
async def query_notion_db(db_id: str) -> list:
    """노션 DB를 쿼리해서 페이지 목록 반환"""
    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }
    # 표시순서 오름차순 정렬
    body = {
        "sorts": [{"property": "표시순서", "direction": "ascending"}]
    }
    # 페이지네이션 처리 (has_more 있을 경우 반복)
    results = []
    while True:
        resp = requests.post(url, headers=headers, json=body)
        data = resp.json()
        results.extend(data.get("results", []))
        if not data.get("has_more"):
            break
        body["start_cursor"] = data["next_cursor"]
    return results

# ── 파싱 헬퍼
def parse_select(prop) -> str:
    """select 속성 값 추출"""
    try:
        return prop["select"]["name"] if prop.get("select") else ""
    except:
        return ""

def parse_text(prop) -> str:
    """text/rich_text 속성 값 추출"""
    try:
        rt = prop.get("rich_text") or prop.get("title") or []
        return "".join(t["plain_text"] for t in rt)
    except:
        return ""

def parse_email(prop) -> str:
    """email 속성 값 추출"""
    try:
        return prop.get("email") or ""
    except:
        return ""

def parse_phone(prop) -> str:
    """phone_number 속성 값 추출"""
    try:
        return prop.get("phone_number") or ""
    except:
        return ""

def parse_date(prop) -> str:
    """date 속성 값 추출 (start만)"""
    try:
        d = prop.get("date")
        return d["start"] if d else ""
    except:
        return ""

def parse_number(prop) -> float:
    """number 속성 값 추출"""
    try:
        return prop.get("number") or 0
    except:
        return 0

# ── 메인 데이터 조합
async def get_org_data(force_refresh: bool = False):
    """사업구조 + 인력 데이터 조합하여 반환"""
    now = time.time()
    if not force_refresh and _org_cache["data"] and (now - _org_cache["timestamp"]) < CACHE_TTL:
        return _org_cache["data"]

    # 두 DB 병렬 조회
    project_pages = await query_notion_db(PROJECT_DB_ID)
    staff_pages   = await query_notion_db(STAFF_DB_ID)

    # 사업구조 파싱
    projects = []
    for page in project_pages:
        props = page["properties"]
        projects.append({
            "name":        parse_text(props.get("사업명", {})),
            "color":       parse_text(props.get("색상코드", {})),
            "description": parse_text(props.get("설명", {})),
            "client":      parse_text(props.get("고객사", {})),
            "order":       int(parse_number(props.get("표시순서", {})))
        })

    # 인력 파싱
    staff = []
    for page in staff_pages:
        props = page["properties"]
        staff.append({
            "name":      parse_text(props.get("이름", {})),
            "grade":     parse_select(props.get("직급", {})),
            "role":      parse_select(props.get("직책", {})),
            "project":   parse_select(props.get("소속사업", {})),
            "type":      parse_select(props.get("구분", {})),
            "join_date": parse_date(props.get("입사일", {})),
            "birth":     parse_text(props.get("생년월일", {})),
            "phone":     parse_phone(props.get("전화번호", {})),
            "email1":    parse_email(props.get("이메일1", {})),
            "email2":    parse_email(props.get("이메일2", {})),
            "email3":    parse_email(props.get("이메일3", {})),
            "address":   parse_text(props.get("주소", {})),
            "photo":     parse_text(props.get("사진파일명", {})),
            "order":     int(parse_number(props.get("표시순서", {})))
        })

    result = {"projects": projects, "staff": staff}
    _org_cache["data"] = result
    _org_cache["timestamp"] = now
    return result

# ── API 엔드포인트
@app.get("/api/org")
async def api_org(refresh: int = 0):
    """GET /api/org?refresh=0"""
    try:
        data = await get_org_data(force_refresh=bool(refresh))
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

> **주의**: `query_notion_db()`는 `async` 함수.
> 기존 `get_notion_projects()` 등은 `requests` (동기) 사용 중.
> 기존 코드 패턴에 따라 동기/비동기 통일할 것.
> 기존 코드가 동기라면 `async def` → `def`, `await` → 제거.

---

## 6. 화면 구성

```
┌──────────────────────────────────────────────────────────┐
│ 조직도        [사업별 | 인물사전]        [↻ 새로고침]     │
│ 세종개발본부 · 2026.02 기준 · 정직원 18명 / 총 30명      │
├──────────────────────────────────────────────────────────┤
│ [총 인원 30명] [정직원 18명] [외주 12명] [수행 사업 5개]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ══ 뷰1: 사업별 (기본) ══                                 │
│                                                          │
│ ┌─ 안전신문고 (행안부)    15명 (정직원6+외주9) ──────┐   │
│ │ ┌───────────┐  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │   │
│ │ │ [노원국PM]│  │ 주진남 장순표 김차은 김남기   │ │   │
│ │ │ [김형중]  │  │ 최미리 정승은 장은희 최현아   │ │   │
│ │ │ [김재훈]  │  │ 정소라                       │ │   │
│ │ │ [김영건]  │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │   │
│ │ │ [김정현]  │  (점선=외주, 왼쪽=정직원)         │   │
│ │ │ [연순모]  │                                   │   │
│ │ └───────────┘                                   │   │
│ └────────────────────────────────────────────────┘   │
│                                                          │
│ ┌─ 해외홍보시스템 (문체부)  5명 ─────────────────────┐   │
│ │  [장은영PM] [김성환] [곽슬기] │ 김동유 김소현      │   │
│ └────────────────────────────────────────────────┘   │
│                                                          │
│ ... 공직자통합메일 / AI과제 / 공통 ...                   │
│                                                          │
│ ══ 뷰2: 인물사전 ══                                      │
│                                                          │
│ [정직원 18명]                                            │
│ ┌──────┐ ┌──────┐ ┌──────┐ ... (6열 그리드)            │
│ │ 사진 │ │ 사진 │ │ 사진 │                              │
│ │노승익│ │노원국│ │박정수│                              │
│ └──────┘ └──────┘ └──────┘                              │
│                                                          │
│ [외주 인력 12명]                                         │
│ ┌──────┐ ┌──────┐ ... (점선 카드)                       │
└──────────────────────────────────────────────────────────┘
```

---

## 7. 인터랙션 규칙

| 대상 | 동작 | 결과 |
|------|------|------|
| 정직원 카드 클릭 | openDetail(name) | 우측 패널 슬라이드인 |
| 외주 카드 | 클릭 불가 (cursor:default) | 아무 반응 없음 |
| 뷰 토글 버튼 | switchView('org'\|'photo') | 뷰 전환 |
| 새로고침 버튼 | loadOrg(1) | refresh=1로 API 재호출 |
| 상세 패널 닫기 | closeDetail() | 패널 슬라이드아웃 |

---

## 8. index.html 추가 내용

### 사이드바 메뉴 추가
```html
<div class="menu-item" data-tab="org">
    <i class="ti ti-sitemap"></i>
    <span>조직도</span>
</div>
```
> 위치: 세종사업히스토리 메뉴 아래

### 탭 콘텐츠 추가
```html
<div id="tab-org" class="tab-content">

    <!-- Topbar -->
    <div class="topbar">
        <div>
            <div class="topbar-title">조직도</div>
            <div class="topbar-subtitle" id="org-subtitle">
                세종개발본부 · 2026.02 기준
            </div>
        </div>
        <div class="topbar-actions">
            <!-- 뷰 전환 토글 -->
            <div class="view-toggle">
                <button class="view-btn active" id="btn-view-org"
                        onclick="switchOrgView('org', this)">사업별</button>
                <button class="view-btn" id="btn-view-photo"
                        onclick="switchOrgView('photo', this)">인물사전</button>
            </div>
            <button class="btn-refresh" id="btn-org-refresh"
                    onclick="loadOrg(1)">
                <i class="ti ti-refresh"></i> 새로고침
            </button>
        </div>
    </div>

    <div class="content">
        <!-- KPI -->
        <div class="kpi-grid">
            <div class="kpi-card kpi-blue">
                <div class="kpi-label">총 인원</div>
                <div class="kpi-value" id="org-kpi-total">—</div>
                <div class="kpi-sub">외주 포함</div>
            </div>
            <div class="kpi-card kpi-green">
                <div class="kpi-label">정직원</div>
                <div class="kpi-value" id="org-kpi-staff">—</div>
                <div class="kpi-sub">정규직 기준</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">외주 인력</div>
                <div class="kpi-value" id="org-kpi-out">—</div>
                <div class="kpi-sub">개발/콘텐츠/민원</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">수행 사업</div>
                <div class="kpi-value" id="org-kpi-projects">—</div>
                <div class="kpi-sub">운영 중</div>
            </div>
        </div>

        <!-- 뷰1: 사업별 -->
        <div id="org-view-org" class="org-view-panel active">
            <div id="org-grid" class="org-grid">
                <tr><td colspan="1" class="loading-cell">데이터를 불러오는 중...</td></tr>
            </div>
        </div>

        <!-- 뷰2: 인물사전 -->
        <div id="org-view-photo" class="org-view-panel" style="display:none">
            <div id="photo-staff-section" class="photo-section"></div>
            <div id="photo-out-section" class="photo-section"></div>
        </div>
    </div>
</div>

<!-- 상세 패널 (body 레벨) -->
<div class="org-overlay" id="org-overlay" onclick="closeDetail()"></div>
<div class="org-detail-panel" id="org-detail-panel">
    <div class="dp-head">
        <span class="dp-head-title">인력 상세</span>
        <button class="dp-close" onclick="closeDetail()">✕</button>
    </div>
    <div class="dp-body" id="org-detail-body"></div>
</div>
```

---

## 9. main.js 추가 함수

```javascript
/* ════════════════════════════════
   PHASE 6 — 조직도
════════════════════════════════ */

// ── 전역 상태
let _orgData = null;   // { projects: [], staff: [] }

// ── 진입점: 탭 전환 시 최초 1회 로드
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
            if (btn) btn.disabled = false;
        })
        .catch(err => {
            console.error("조직도 로드 실패", err);
            if (btn) btn.disabled = false;
        });
}

// ── KPI 업데이트
function renderOrgKPI(data) {
    const total    = data.staff.length;
    const staffCnt = data.staff.filter(s => s.type === "정직원").length;
    const outCnt   = data.staff.filter(s => s.type === "외주").length;
    const projCnt  = data.projects.length;

    document.getElementById("org-kpi-total").textContent    = total + "명";
    document.getElementById("org-kpi-staff").textContent    = staffCnt + "명";
    document.getElementById("org-kpi-out").textContent      = outCnt + "명";
    document.getElementById("org-kpi-projects").textContent = projCnt + "개";
}

// ── 뷰 전환
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
                <div class="mc ${isPM ? "pm" : ""}" onclick="openDetail('${s.name}')">
                    <div class="av" style="background:${proj.color}">
                        ${photoOrInitial(s)}
                    </div>
                    <div class="mc-info">
                        <div class="mc-name">${s.name}</div>
                        <div class="mc-grade">${s.grade}</div>
                    </div>
                    ${isPM ? '<div class="pm-badge">PM</div>' : ""}
                </div>`;
        }).join("");

        // 외주 카드 HTML
        const outCards = outList.map(s => `
            <div class="mc-out">
                <div class="av av-gray">${s.name.charAt(0)}</div>
                <div class="mc-info">
                    <div class="mc-name">${s.name}</div>
                    <div class="mc-grade-out">${s.grade}</div>
                </div>
                <div class="out-badge">외주</div>
            </div>`
        ).join("");

        // 외주 있으면 2열, 없으면 1열
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
                        <div class="project-name">${proj.name}${proj.client ? " (" + proj.client + ")" : ""}</div>
                        <div class="project-meta">${proj.description}</div>
                    </div>
                    <div class="project-count">${staffCount}명</div>
                </div>
                ${bodyHtml}
            </div>`;
    }).join("");

    container.innerHTML = html;
}

// ── 사진 or 이니셜 반환 (img 태그 or 텍스트)
function photoOrInitial(staff) {
    if (staff.photo) {
        return `<img src="/static/images/${staff.photo}"
                     onerror="this.parentNode.textContent='${staff.name.charAt(0)}'"
                     alt="${staff.name}">`;
    }
    return staff.name.charAt(0);
}

// ── 뷰2: 인물사전 렌더링
function renderPhotoView(data) {
    const staffList = data.staff.filter(s => s.type === "정직원");
    const outList   = data.staff.filter(s => s.type === "외주");

    // 프로젝트명 → 색상 맵
    const colorMap = {};
    data.projects.forEach(p => colorMap[p.name] = p.color);

    const makePhotoCard = (s, isOut) => {
        const tagColor = isOut ? "tag-gray" : "tag-blue";
        const imgHtml = s.photo
            ? `<img src="/static/images/${s.photo}" alt="${s.name}"
                    onerror="this.style.display='none'">`
            : s.name.charAt(0);
        return `
            <div class="pc${isOut ? " pc-out" : ""}"
                 ${!isOut ? `onclick="openDetail('${s.name}')"` : ""}>
                <div class="pc-img">${imgHtml}</div>
                <div class="pc-name">${s.name}</div>
                <div class="pc-grade">${s.grade}</div>
                <div class="pc-tag ${tagColor}">${s.project}</div>
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

// ── 상세 패널 열기
function openDetail(name) {
    if (!_orgData) return;
    const s = _orgData.staff.find(p => p.name === name);
    if (!s) return;

    const proj  = _orgData.projects.find(p => p.name === s.project);
    const color = proj ? proj.color : "#64748B";

    // 이메일 목록 (빈 것 제외)
    const emails = [s.email1, s.email2, s.email3].filter(e => e && e.trim());
    const emailHtml = emails.length
        ? `<div class="dp-emails">
               ${emails.map(e => `<span class="dp-email-item">✉ ${e}</span>`).join("")}
           </div>`
        : `<span class="dp-val" style="color:#94A3B8">—</span>`;

    // 사진 or 이니셜
    const photoHtml = s.photo
        ? `<img src="/static/images/${s.photo}" alt="${s.name}"
                style="width:96px;height:120px;object-fit:cover;border-radius:8px;"
                onerror="this.outerHTML='<div style=\\'width:96px;height:120px;background:${color}18;border-radius:8px;border:2px solid ${color}40;display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:700;color:${color};\\' >${s.name.charAt(0)}</div>'">`
        : `<div style="width:96px;height:120px;background:${color}18;border-radius:8px;
                border:2px solid ${color}40;display:flex;align-items:center;
                justify-content:center;font-size:38px;font-weight:700;color:${color};">
               ${s.name.charAt(0)}
           </div>`;

    document.getElementById("org-detail-body").innerHTML = `
        <div class="dp-photo-wrap">${photoHtml}</div>
        <div class="dp-name">${s.name}</div>
        <div class="dp-role">${s.grade} · ${s.role}</div>
        <div class="dp-hr"></div>
        <div class="dp-row">
            <span class="dp-label">수행 사업</span>
            <span class="dp-tag" style="background:${color}18;color:${color};font-weight:600;">
                ${s.project}
            </span>
        </div>
        <div class="dp-row">
            <span class="dp-label">입사일</span>
            <span class="dp-val">${s.join_date || "—"}</span>
        </div>
        <div class="dp-hr"></div>
        <div class="dp-row">
            <span class="dp-label">생년월일</span>
            <span class="dp-val">${s.birth || "—"}</span>
        </div>
        <div class="dp-row">
            <span class="dp-label">전화번호</span>
            <span class="dp-val">${s.phone || "—"}</span>
        </div>
        <div class="dp-row">
            <span class="dp-label">이메일</span>
            ${emailHtml}
        </div>
        <div class="dp-row" style="align-items:flex-start">
            <span class="dp-label">주소</span>
            <span class="dp-val" style="font-size:10px;line-height:1.7;">${s.address || "—"}</span>
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

// ── 탭 전환 시 초기화 (switchTab() 함수에 추가 필요)
// if (tabName === "org" && !_orgData) loadOrg(0);
```

> **주의**: 기존 `switchTab()` 함수에 아래 한 줄 추가 필요:
> ```javascript
> if (tabName === "org" && !_orgData) loadOrg(0);
> ```

---

## 10. style.css 추가 스타일

```css
/* ═══════════════════════════════
   PHASE 6 — 조직도
═══════════════════════════════ */

/* 사업별 뷰 */
.org-grid    { display: flex; flex-direction: column; gap: 10px; }
.org-view-panel { }

.project-block   { background: #fff; border: 0.5px solid #E5E7EB; border-radius: 10px; overflow: hidden; }
.project-header  { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 0.5px solid #E5E7EB; background: #F8FAFC; }
.project-color   { width: 4px; height: 32px; border-radius: 99px; flex-shrink: 0; }
.project-name    { font-size: 12px; font-weight: 600; color: #0F172A; }
.project-meta    { font-size: 10px; color: #64748B; margin-top: 1px; }
.project-count   { margin-left: auto; font-size: 10px; padding: 2px 8px; background: #E6F1FB; color: #185FA5; border-radius: 99px; white-space: nowrap; }

/* 2열 레이아웃: 정직원 | 외주 */
.member-body { display: grid; grid-template-columns: 1fr 1fr; }
.member-col  { padding: 12px 14px; display: flex; flex-wrap: wrap; gap: 7px; align-content: flex-start; }
.member-col.staff { border-right: 0.5px solid #E5E7EB; }
/* 외주 없을 때 — 정직원 열 혼자면 full width */
.member-col.staff:only-child { border-right: none; }

/* 정직원 카드 */
.mc { display: flex; align-items: center; gap: 8px; padding: 6px 10px 6px 6px; border-radius: 8px; border: 0.5px solid #E2E8F0; background: #fff; cursor: pointer; transition: all 0.15s; min-width: 136px; }
.mc:hover { border-color: #4A9EE0; background: #F0F7FF; box-shadow: 0 2px 8px rgba(74,158,224,0.12); }
.mc.pm    { border-color: #BFD9F2; background: #F0F7FF; }

/* 외주 카드 */
.mc-out { display: flex; align-items: center; gap: 8px; padding: 6px 10px 6px 6px; border-radius: 8px; border: 1px dashed #CBD5E1; background: #F8FAFC; cursor: default; min-width: 136px; }

/* 아바타 */
.av      { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; overflow: hidden; }
.av img  { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.av-gray { background: #CBD5E1 !important; color: #64748B !important; }

.mc-info     { min-width: 0; flex: 1; }
.mc-name     { font-size: 11px; font-weight: 500; color: #0F172A; white-space: nowrap; }
.mc-grade    { font-size: 10px; color: #64748B; margin-top: 1px; }
.mc-grade-out{ font-size: 10px; color: #94A3B8; margin-top: 1px; }

.pm-badge  { font-size: 9px; background: #4A9EE0; color: #fff; padding: 1px 6px; border-radius: 99px; flex-shrink: 0; font-weight: 500; }
.out-badge { font-size: 9px; background: #E2E8F0; color: #94A3B8; padding: 1px 6px; border-radius: 99px; flex-shrink: 0; }

/* 인물사전 뷰 */
.photo-section       { margin-bottom: 20px; }
.photo-section-title { font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 0.5px solid #E5E7EB; display: flex; align-items: center; gap: 6px; }
.section-badge  { font-size: 9px; padding: 1px 7px; border-radius: 99px; }
.badge-staff    { background: #E6F1FB; color: #185FA5; }
.badge-out      { background: #E2E8F0; color: #64748B; }
.photo-grid     { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }

.pc        { background: #fff; border: 0.5px solid #E5E7EB; border-radius: 10px; padding: 14px 8px 10px; text-align: center; cursor: pointer; transition: all 0.15s; }
.pc:hover  { border-color: #4A9EE0; box-shadow: 0 3px 12px rgba(74,158,224,0.18); transform: translateY(-2px); }
.pc.pc-out { border: 1px dashed #CBD5E1; background: #F8FAFC; cursor: default; }
.pc.pc-out:hover { transform: none; box-shadow: none; border-color: #CBD5E1; }

.pc-img    { width: 68px; height: 85px; border-radius: 6px; margin: 0 auto 9px; overflow: hidden; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #CBD5E1; }
.pc-img img{ width: 100%; height: 100%; object-fit: cover; }
.pc-name   { font-size: 11px; font-weight: 600; color: #0F172A; margin-bottom: 2px; }
.pc-grade  { font-size: 10px; color: #64748B; margin-bottom: 4px; }
.pc-tag    { font-size: 9px; padding: 2px 7px; border-radius: 99px; display: inline-block; }
.tag-blue  { background: #E6F1FB; color: #185FA5; }
.tag-gray  { background: #F1F5F9; color: #64748B; }
.tag-amber { background: #FEF3C7; color: #92400E; }

/* 뷰 전환 토글 */
.view-toggle { display: flex; background: #F1F5F9; border-radius: 6px; padding: 2px; gap: 2px; }
.view-btn    { padding: 4px 12px; font-size: 11px; border-radius: 4px; cursor: pointer; border: none; background: transparent; color: #475569; }
.view-btn.active { background: #fff; color: #0F172A; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 500; }

/* 상세 패널 */
.org-overlay      { display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.2); z-index: 200; }
.org-overlay.open { display: block; }
.org-detail-panel { position: fixed; right: -310px; top: 0; bottom: 0; width: 300px; background: #fff; border-left: 0.5px solid #E5E7EB; box-shadow: -4px 0 24px rgba(0,0,0,0.1); display: flex; flex-direction: column; z-index: 201; transition: right 0.22s ease; }
.org-detail-panel.open { right: 0; }
.dp-head       { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border-bottom: 0.5px solid #E5E7EB; }
.dp-head-title { font-size: 11px; color: #94A3B8; }
.dp-close      { width: 24px; height: 24px; border-radius: 50%; background: #F1F5F9; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #475569; }
.dp-close:hover{ background: #E5E7EB; }
.dp-body       { flex: 1; overflow-y: auto; padding: 20px 16px; }
.dp-photo-wrap { display: flex; justify-content: center; margin-bottom: 14px; }
.dp-name       { font-size: 18px; font-weight: 700; text-align: center; color: #0F172A; margin-bottom: 3px; }
.dp-role       { font-size: 11px; color: #64748B; text-align: center; margin-bottom: 16px; }
.dp-hr         { height: 0.5px; background: #E5E7EB; margin: 12px 0; }
.dp-row        { display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; }
.dp-label      { font-size: 10px; color: #94A3B8; min-width: 52px; flex-shrink: 0; padding-top: 2px; line-height: 1.6; }
.dp-val        { font-size: 11px; color: #0F172A; line-height: 1.6; }
.dp-tag        { display: inline-flex; font-size: 10px; padding: 2px 8px; border-radius: 99px; font-weight: 500; }
.dp-emails     { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.dp-email-item { font-size: 10px; color: #185FA5; word-break: break-all; line-height: 1.5; background: #F0F7FF; padding: 3px 7px; border-radius: 4px; display: block; }
```

---

## 11. 완료 기준

```
✅ 사이드바에 "조직도" 메뉴 표시 (ti-sitemap 아이콘)
✅ 탭 클릭 시 화면 전환 + 최초 1회 loadOrg(0) 자동 호출
✅ KPI 4개 (총인원/정직원/외주/수행사업) 노션 데이터 기반 표시
✅ 사업별 뷰: 5개 사업 블록, 각 1행
✅ 정직원 1열 / 외주 2열 구분 (세로 구분선)
✅ 외주 없는 사업: 정직원 full-width
✅ PM 카드 파란 강조 표시 (pm-badge)
✅ 외주 카드: 점선 테두리 + 회색 아바타 + 클릭 불가
✅ 정직원 카드 클릭 → 상세 패널 슬라이드인
✅ 상세 패널: 사진(없으면 이니셜) + 직급/직책/사업/입사일/생년월일/전화/이메일(최대3)/주소
✅ 인물사전 뷰: 정직원 18명 (6열 그리드) + 외주 12명 (점선 카드)
✅ 사진: /static/images/{파일명} 로드, 실패 시 이니셜 fallback
✅ 새로고침 버튼: refresh=1로 캐시 무효화
✅ Phase 1~5 코드 건드리지 않음
✅ 한국어 주석 포함
```

---

## 12. .env 추가 없음

노션 API Key는 기존 `NOTION_API_KEY` 그대로 사용.
새 DB ID는 app.py 상수로만 추가.

---

*작성: 익스 + Claude | 2026.05.21 | AX Sejong Command Phase 6*
