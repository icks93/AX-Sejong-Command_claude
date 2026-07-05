# LOGIC.md — AX Sejong Command (Phase 1)
> 작성: 익스 + Claude | 2026.05.10

---

## 1. 전체 데이터 흐름

```
브라우저 접속 (localhost:8000)
        │
        ▼
① GET /  →  index.html 반환
        │
        ▼
② 브라우저가 main.js 실행
   → loadProjects() 자동 호출
        │
        ▼
③ GET /api/projects 요청
        │
        ▼
④ app.py → 노션 API 호출
   NOTION_API_KEY 사용
   DB ID: 35c963cc-8170-803a-bad2-000bf4161108
        │
        ▼
⑤ 노션 응답 → 파싱 → JSON 변환
        │
        ▼
⑥ 브라우저가 JSON 받아서
   renderKPI() + renderTable() 실행
        │
        ▼
⑦ 화면에 데이터 표시 완료
```

---

## 2. 노션 API 호출 방법

### 요청 형식
```python
url = f"https://api.notion.com/v1/databases/{NOTION_DB_ID}/query"

headers = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

body = {
    "sorts": [
        {
            "property": "매출액",
            "direction": "descending"   # 매출액 높은 순 정렬
        }
    ]
}

response = requests.post(url, headers=headers, json=body)
```

### 노션 응답 구조 (원본)
```json
{
  "results": [
    {
      "id": "페이지 UUID",
      "properties": {
        "사업명": {
          "title": [{ "plain_text": "2026년 안전신문고 시스템 유지관리 사업" }]
        },
        "고객사": {
          "rich_text": [{ "plain_text": "행정안전부 안전개선과" }]
        },
        "담당부서": {
          "rich_text": [{ "plain_text": "행정안전부" }]
        },
        "PM": {
          "rich_text": [{ "plain_text": "노원국" }]
        },
        "매출액": {
          "number": 1522800000
        },
        "계약기간": {
          "rich_text": [{ "plain_text": "2026.01.01 ~ 2026.12.31 (12개월)" }]
        },
        "운영대상": {
          "rich_text": [{ "plain_text": "홈페이지(safetyreport.go.kr) / Android·iOS 앱" }]
        },
        "사업요약": {
          "rich_text": [{ "plain_text": "생활불편신고, 주정차 위반 신고 앱/통합분석시스템 운영..." }]
        },
        "상태": {
          "select": { "name": "운영중" }
        }
      }
    }
  ]
}
```

---

## 3. 노션 응답 파싱 함수

```python
def get_notion_projects():
    """노션 API에서 세종사업현황 데이터를 가져와 파싱합니다"""

    url = f"https://api.notion.com/v1/databases/{NOTION_DB_ID}/query"
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }
    body = {
        "sorts": [{"property": "매출액", "direction": "descending"}]
    }

    response = requests.post(url, headers=headers, json=body)
    data = response.json()

    projects = []
    for page in data.get("results", []):
        props = page["properties"]

        # 각 속성 타입에 맞게 값 추출
        project = {
            "id": page["id"],
            "name":    extract_title(props, "사업명"),
            "client":  extract_text(props, "고객사"),
            "dept":    extract_text(props, "담당부서"),
            "pm":      extract_text(props, "PM"),
            "revenue": extract_number(props, "매출액"),
            "period":  extract_text(props, "계약기간"),
            "target":  extract_text(props, "운영대상"),
            "summary": extract_text(props, "사업요약"),
            "status":  extract_select(props, "상태"),
        }
        projects.append(project)

    return projects


# 속성 타입별 추출 헬퍼 함수
def extract_title(props, key):
    """title 타입 속성 추출"""
    try:
        return props[key]["title"][0]["plain_text"]
    except:
        return ""

def extract_text(props, key):
    """rich_text 타입 속성 추출"""
    try:
        return props[key]["rich_text"][0]["plain_text"]
    except:
        return ""

def extract_number(props, key):
    """number 타입 속성 추출"""
    try:
        return props[key]["number"] or 0
    except:
        return 0

def extract_select(props, key):
    """select 타입 속성 추출"""
    try:
        return props[key]["select"]["name"]
    except:
        return ""
```

---

## 4. 매출액 변환 함수

```python
def format_revenue(amount):
    """숫자를 억 단위 문자열로 변환합니다
    예: 1522800000 → '15.2억'
        5000000    → '0.05억'
    """
    if not amount:
        return "0억"
    eok = amount / 100_000_000
    if eok >= 1:
        return f"{eok:.1f}억"
    else:
        man = amount / 10_000
        return f"{man:.0f}만"
```

---

## 5. /api/projects 엔드포인트

```python
@app.get("/api/projects")
def api_projects():
    """세종사업현황 데이터를 JSON으로 반환합니다"""
    try:
        projects = get_notion_projects()
        return {"success": True, "data": projects}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}
```

### 응답 JSON 형식
```json
{
  "success": true,
  "data": [
    {
      "id": "35c963cc-...",
      "name": "2026년 안전신문고 시스템 유지관리 사업",
      "client": "행정안전부 안전개선과",
      "dept": "행정안전부",
      "pm": "노원국",
      "revenue": 1522800000,
      "period": "2026.01.01 ~ 2026.12.31 (12개월)",
      "target": "홈페이지(safetyreport.go.kr) / Android·iOS 앱",
      "summary": "생활불편신고, 주정차 위반 신고 앱/통합분석시스템 운영...",
      "status": "운영중"
    }
  ]
}
```

---

## 6. KPI 계산 로직 (JavaScript)

```javascript
function renderKPI(projects) {
    // 총 수행 사업
    const total = projects.length;

    // 총 매출액 (억 단위 변환)
    const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const revenueText = (totalRevenue / 100_000_000).toFixed(1) + "억";

    // 운영중 (운영중 + 신규 모두 포함)
    const activeCount = projects.filter(
        p => p.status === "운영중" || p.status === "신규"
    ).length;

    // 종료
    const closedCount = projects.filter(
        p => p.status === "종료"
    ).length;

    // 화면에 반영
    document.getElementById("kpi-total").textContent = total;
    document.getElementById("kpi-revenue").textContent = revenueText;
    document.getElementById("kpi-active").textContent = activeCount;
    document.getElementById("kpi-closed").textContent = closedCount;
}
```

---

## 7. 테이블 렌더링 로직 (JavaScript)

```javascript
function renderTable(projects) {
    const tbody = document.getElementById("projects-tbody");
    tbody.innerHTML = "";   // 기존 내용 초기화

    projects.forEach(project => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="name-cell">
                <span class="name-text">${project.name}</span>
                <div class="tooltip">
                    ${renderTooltip(project)}
                </div>
            </td>
            <td class="muted">${project.client}</td>
            <td>${project.pm || "—"}</td>
            <td class="money">${formatRevenue(project.revenue)}</td>
            <td class="muted">${formatPeriod(project.period)}</td>
            <td>${renderBadge(project.status)}</td>
        `;
        tbody.appendChild(tr);
    });

    // 건수 배지 업데이트
    document.getElementById("project-count").textContent = projects.length + "건";
}
```

---

## 8. 툴팁 렌더링 로직 (JavaScript)

```javascript
function renderTooltip(project) {
    return `
        <div class="tooltip-title">${project.name}</div>
        <div class="tooltip-row">
            <b>고객사</b>${project.client || "—"}
        </div>
        <div class="tooltip-row">
            <b>운영대상</b>${project.target || "—"}
        </div>
        <div class="tooltip-row">
            <b>요약</b>${project.summary || "—"}
        </div>
    `;
}
```

---

## 9. 상태 배지 렌더링 (JavaScript)

```javascript
function renderBadge(status) {
    const badgeMap = {
        "운영중":   '<span class="badge badge-green">운영중</span>',
        "신규":     '<span class="badge badge-blue">신규</span>',
        "종료":     '<span class="badge badge-gray">종료</span>',
        "종료예정": '<span class="badge badge-amber">종료예정</span>',
    };
    return badgeMap[status] || `<span class="badge badge-gray">${status}</span>`;
}
```

---

## 10. 매출액 표시 형식 변환 (JavaScript)

```javascript
function formatRevenue(amount) {
    if (!amount) return "—";
    const eok = amount / 100_000_000;
    if (eok >= 1) return eok.toFixed(1) + "억";
    const man = amount / 10_000;
    return Math.round(man) + "만";
}
```

---

## 11. 계약기간 표시 형식 변환 (JavaScript)

```javascript
function formatPeriod(period) {
    // "2026.01.01 ~ 2026.12.31 (12개월)" → "~26.12.31"
    if (!period) return "—";
    const match = period.match(/~\s*(\d{4})\.(\d{2})\.(\d{2})/);
    if (match) {
        return `~${match[1].slice(2)}.${match[2]}.${match[3]}`;
    }
    return period;
}
```

---

## 12. 새로고침 로직 (JavaScript)

```javascript
async function loadProjects() {
    const btn = document.getElementById("btn-refresh");
    btn.disabled = true;
    btn.textContent = "로딩 중...";

    try {
        const response = await fetch("/api/projects");
        const result = await response.json();

        if (result.success) {
            renderKPI(result.data);
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

// 페이지 로드 시 자동 실행
document.addEventListener("DOMContentLoaded", loadProjects);

// 새로고침 버튼 클릭
document.getElementById("btn-refresh").addEventListener("click", loadProjects);
```

---

## 13. 에러 처리 케이스

| 상황 | 원인 | 처리 방법 |
|------|------|---------|
| 노션 API 응답 없음 | API 키 오류 또는 네트워크 | "데이터를 불러오지 못했습니다" 메시지 표시 |
| 특정 속성값이 비어있음 | 노션 DB에 값 미입력 | "—" 표시 (에러 아님) |
| 매출액이 0 또는 null | 노션 DB 미입력 | "—" 표시 |
| 서버 미실행 상태에서 접속 | app.py 미실행 | "서버 연결에 실패했습니다" 메시지 표시 |

---

*작성: 익스 + Claude | 2026.05.10 | AX Sejong Command Phase 1*
