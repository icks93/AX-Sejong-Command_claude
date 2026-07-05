# LOGIC_Phase2.md — AX Sejong Command (Phase 2)
> 작성: 익스 + Claude | 2026.05.10  
> Phase 2: PM 주간회의 탭 — 노션 블록 파싱 로직

---

## 1. 노션 블록 API 호출

Phase 1과 달리 일반 페이지라서 **블록 목록**을 가져와야 합니다.

```python
def get_weekly_blocks():
    """노션 주간회의 페이지 블록 전체를 가져옵니다"""

    PAGE_ID = "1f4963cc-8170-8078-b4de-eca9dec4b465"
    url = f"https://api.notion.com/v1/blocks/{PAGE_ID}/children"

    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Notion-Version": "2022-06-28"
    }

    all_blocks = []
    cursor = None

    # 페이지네이션 처리 (블록 100개씩)
    while True:
        params = {"page_size": 100}
        if cursor:
            params["start_cursor"] = cursor

        response = requests.get(url, headers=headers, params=params, timeout=10)
        data = response.json()

        all_blocks.extend(data.get("results", []))

        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")

    return all_blocks
```

---

## 2. 블록에서 텍스트 추출

```python
def extract_text(block):
    """블록에서 순수 텍스트를 추출합니다"""
    block_type = block.get("type", "")
    content = block.get(block_type, {})
    rich_text = content.get("rich_text", [])
    return "".join([t.get("plain_text", "") for t in rich_text])

def is_bold_text(block):
    """블록이 볼드 텍스트인지 확인합니다 (진행사항/특이사항 구분용)"""
    block_type = block.get("type", "")
    content = block.get(block_type, {})
    rich_text = content.get("rich_text", [])
    if rich_text:
        return rich_text[0].get("annotations", {}).get("bold", False)
    return False
```

---

## 3. 주차 목록 추출

```python
def extract_weeks(blocks):
    """블록에서 주차 목록을 추출합니다
    예: ["[26-5월1주차] 2026년 5월 7일(목)", "[26-4월5주차] 2026년 4월 30일(목)", ...]
    """
    weeks = []
    for block in blocks:
        if block.get("type") == "heading_2":
            text = extract_text(block)
            # "[26-" 으로 시작하는 주차 헤딩만 추출
            if text.startswith("[26-") or "주차" in text:
                weeks.append(text)
    return weeks
```

---

## 4. 특정 주차 블록 범위 추출

```python
def get_week_blocks(blocks, week_index=0):
    """특정 주차에 해당하는 블록들만 추출합니다
    week_index: 0 = 최신, 1 = 한 주 전, ...
    """
    week_starts = []

    # heading_2 위치 찾기
    for i, block in enumerate(blocks):
        if block.get("type") == "heading_2":
            text = extract_text(block)
            if "[26-" in text or "주차" in text:
                week_starts.append(i)

    if not week_starts or week_index >= len(week_starts):
        return []

    start = week_starts[week_index]
    end = week_starts[week_index + 1] if week_index + 1 < len(week_starts) else len(blocks)

    return blocks[start:end]
```

---

## 5. 주차 블록에서 사업 파싱

```python
def parse_projects(week_blocks):
    """주차 블록에서 사업별 데이터를 파싱합니다"""
    import re

    projects = []
    current_project = None
    current_section = None  # "progress" | "special" | "issues"

    for block in week_blocks:
        block_type = block.get("type", "")
        text = extract_text(block).strip()

        # ── 사업 섹션 시작 (heading_3 + "숫자. ")
        if block_type == "heading_3":
            # 분석 섹션 감지
            if "분석" in text or text.startswith("※"):
                if current_project:
                    projects.append(current_project)
                current_project = None
                current_section = "analysis"
                continue

            # "1. 사업명 (PM이름)" 패턴 파싱
            match = re.match(r"^\d+\.\s+(.+?)\s*[\(（](.+?)[\)）]", text)
            if match:
                if current_project:
                    projects.append(current_project)

                full_name = match.group(1).strip()
                pm_name   = match.group(2).strip()

                # 짧은 사업명 추출 (괄호 앞 핵심 단어)
                short_name = extract_short_name(full_name)

                current_project = {
                    "name":       full_name,
                    "short_name": short_name,
                    "pm":         pm_name,
                    "progress":   [],
                    "special":    [],
                    "issues":     [],
                    "status":     "정상",
                    "issue_count":    0,
                    "risk_count":     0,
                    "deadline_count": 0,
                    "has_special":    False,
                }
                current_section = None

        # ── 섹션 구분 (볼드 텍스트)
        elif block_type in ["paragraph", "bulleted_list_item"] and is_bold_text(block):
            if "진행사항" in text:
                current_section = "progress"
            elif "특이사항" in text:
                current_section = "special"
                if current_project:
                    current_project["has_special"] = True
            elif "이슈사항" in text:
                current_section = "issues"

        # ── 항목 내용 수집
        elif block_type == "bulleted_list_item" and current_project and current_section:
            if text and not is_bold_text(block):
                if current_section == "progress":
                    current_project["progress"].append(text)
                elif current_section == "special":
                    current_project["special"].append(text)
                elif current_section == "issues":
                    current_project["issues"].append(text)

        # ── 구분선: 사업 끝
        elif block_type == "divider":
            if current_project and current_section != "analysis":
                pass  # 다음 heading_3에서 저장

    # 마지막 사업 저장
    if current_project:
        projects.append(current_project)

    return projects


def extract_short_name(full_name):
    """사업명에서 핵심 짧은 이름을 추출합니다
    예: "2026 안전신문고 시스템 유지관리 사업" → "안전신문고"
        "AI기반 안전신고 정보의 과학적 분석 서비스 기술개발" → "AI과제"
    """
    name_map = {
        "안전신문고": "안전신문고",
        "공직자통합메일": "공직메일",
        "공직메일": "공직메일",
        "해외홍보": "해외홍보",
        "AI기반": "AI과제",
        "철도": "철도",
    }
    for key, short in name_map.items():
        if key in full_name:
            return short
    # 매핑 없으면 앞 10글자
    return full_name[:10]
```

---

## 6. 키워드 감지 및 상태 판정

```python
# 키워드 정의
ISSUE_KEYWORDS   = ["오류", "실패", "미작동", "장애", "중단", "이슈", "오작동", "미재현"]
RISK_KEYWORDS    = ["지연", "집중 관리 필요", "확인 필요", "모니터링 필요", "우려", "주의", "시급", "차질"]
DEADLINE_PATTERN = r"[~～]\s*(\d{1,2})/(\d{1,2})"


def detect_keywords(project):
    """사업 데이터에서 키워드를 감지하고 상태를 판정합니다"""
    from datetime import date
    import re

    today = date.today()
    all_text = " ".join(
        project["progress"] + project["special"] + project["issues"]
    )

    # 이슈 감지
    issue_count = sum(1 for kw in ISSUE_KEYWORDS if kw in all_text)

    # 위험 감지
    risk_count = sum(1 for kw in RISK_KEYWORDS if kw in all_text)

    # 마감임박 감지 (7일 이내)
    deadline_count = 0
    for match in re.finditer(DEADLINE_PATTERN, all_text):
        month = int(match.group(1))
        day   = int(match.group(2))
        try:
            deadline = date(today.year, month, day)
            diff = (deadline - today).days
            if 0 <= diff <= 7:
                deadline_count += 1
        except:
            pass

    # 상태 판정 (우선순위: 이슈 > 위험 > 마감임박 > 정상)
    if issue_count > 0:
        status = "이슈"
    elif risk_count > 0:
        status = "위험"
    elif deadline_count > 0:
        status = "마감임박"
    else:
        status = "정상"

    project["issue_count"]    = issue_count
    project["risk_count"]     = risk_count
    project["deadline_count"] = deadline_count
    project["status"]         = status

    return project
```

---

## 7. 분석 섹션 파싱

```python
def parse_analysis(week_blocks):
    """※ 분석 섹션의 내용을 추출합니다"""
    analysis = []
    in_analysis = False

    for block in week_blocks:
        block_type = block.get("type", "")
        text = extract_text(block).strip()

        if block_type == "heading_3" and ("분석" in text or text.startswith("※")):
            in_analysis = True
            continue

        if in_analysis:
            if block_type == "heading_2":
                break  # 다음 주차 시작
            if block_type == "bulleted_list_item" and text:
                analysis.append(text)

    return analysis
```

---

## 8. KPI 계산

```python
def calculate_kpi(projects):
    """파싱된 사업 데이터에서 KPI를 계산합니다"""
    return {
        "total":    len(projects),
        "issue":    sum(1 for p in projects if p["status"] == "이슈"),
        "risk":     sum(1 for p in projects if p["status"] == "위험"),
        "special":  sum(1 for p in projects if p["has_special"]),
        "deadline": sum(1 for p in projects if p["deadline_count"] > 0),
    }
```

---

## 9. 전체 파싱 흐름 (메인 함수)

```python
def get_weekly_data(week_index=0):
    """주간회의 데이터 전체를 가져와서 파싱합니다"""

    # 1. 노션 블록 가져오기
    blocks = get_weekly_blocks()

    # 2. 주차 목록 추출
    weeks = extract_weeks(blocks)

    # 3. 선택된 주차 블록 추출
    week_blocks = get_week_blocks(blocks, week_index)

    if not week_blocks:
        return {"success": False, "error": "주차 데이터를 찾을 수 없습니다."}

    week_title = extract_text(week_blocks[0]) if week_blocks else ""

    # 4. 사업 파싱
    projects = parse_projects(week_blocks)

    # 5. 키워드 감지
    projects = [detect_keywords(p) for p in projects]

    # 6. 분석 섹션 파싱
    analysis = parse_analysis(week_blocks)

    # 7. KPI 계산
    kpi = calculate_kpi(projects)

    return {
        "success":    True,
        "data": {
            "week_title": week_title,
            "weeks":      weeks,
            "projects":   projects,
            "analysis":   analysis,
            "kpi":        kpi,
        }
    }
```

---

## 10. /api/weekly 엔드포인트

```python
@app.get("/api/weekly")
def api_weekly(week: int = 0):
    """PM 주간회의 데이터를 JSON으로 반환합니다"""
    try:
        return get_weekly_data(week_index=week)
    except Exception as e:
        return {"success": False, "error": str(e), "data": {}}
```

---

## 11. JavaScript 렌더링 로직

```javascript
// 주간회의 데이터 로딩
async function loadWeekly(weekIndex = 0) {
    const res    = await fetch(`/api/weekly?week=${weekIndex}`);
    const result = await res.json();
    if (!result.success) { showWeeklyError(result.error); return; }

    renderWeeklyKPI(result.data.kpi);
    renderWeekSelect(result.data.weeks, weekIndex);
    renderProjectCards(result.data.projects);
    renderAnalysis(result.data.analysis);
}

// KPI 렌더링
function renderWeeklyKPI(kpi) {
    document.getElementById("kpi-w-total").textContent    = kpi.total;
    document.getElementById("kpi-w-issue").textContent    = kpi.issue;
    document.getElementById("kpi-w-risk").textContent     = kpi.risk;
    document.getElementById("kpi-w-special").textContent  = kpi.special;
    document.getElementById("kpi-w-deadline").textContent = kpi.deadline;
}

// 사업 카드 렌더링
function renderProjectCards(projects) {
    const container = document.getElementById("weekly-projects");
    container.innerHTML = "";

    projects.forEach(p => {
        const statusMap = {
            "이슈":    { icon: "🔴", cls: "card-issue" },
            "위험":    { icon: "🟡", cls: "card-risk" },
            "마감임박": { icon: "🟠", cls: "card-deadline" },
            "정상":    { icon: "🟢", cls: "card-normal" },
        };
        const s = statusMap[p.status] || statusMap["정상"];

        const progressHTML = p.progress.slice(0, 5)
            .map(item => `<li>${item}</li>`).join("");

        const specialHTML = p.special.length
            ? `<div class="card-special">
                 <b>특이사항</b> ${p.special[0]}
               </div>` : "";

        const card = document.createElement("div");
        card.className = `project-card ${s.cls}`;
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">${s.icon}</span>
                <span class="card-name">${p.short_name} (${p.pm})</span>
                <span class="card-badge">${p.status}</span>
            </div>
            <ul class="card-progress">${progressHTML}</ul>
            ${specialHTML}
        `;
        container.appendChild(card);
    });
}

// 주차 선택 드롭다운 렌더링
function renderWeekSelect(weeks, currentIndex) {
    const select = document.getElementById("week-select");
    select.innerHTML = weeks.map((w, i) =>
        `<option value="${i}" ${i === currentIndex ? "selected" : ""}>${w}</option>`
    ).join("");
}

// 분석 섹션 렌더링
function renderAnalysis(analysis) {
    const box = document.getElementById("analysis-list");
    box.innerHTML = analysis.map(a => `<li>${a}</li>`).join("");
}
```

---

## 12. 에러 처리

| 상황 | 처리 방법 |
|------|---------|
| 블록 API 응답 없음 | "데이터를 불러오지 못했습니다" 표시 |
| 주차 파싱 실패 | 빈 화면 + "주차 데이터 없음" 표시 |
| 날짜 파싱 오류 | 해당 마감일 건너뜀 (에러 아님) |
| 사업 섹션 없음 | "이번 주 데이터가 없습니다" 표시 |

---

*작성: 익스 + Claude | 2026.05.10 | AX Sejong Command Phase 2*
