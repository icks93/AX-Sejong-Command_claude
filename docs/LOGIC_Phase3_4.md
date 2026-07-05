# LOGIC_Phase3_4.md — AX Sejong Command (Phase 3 + Phase 4)
> 작성: 익스 + Claude | 2026.05.15
> Phase 3: 회사 월간보고 파싱 로직
> Phase 4: 세종 월간분석 파싱 로직

---

## 핵심 차이점 — Phase 2 대비

| 항목 | Phase 2 (주간회의) | Phase 3, 4 (월간보고) |
|------|-----------------|---------------------|
| 자식 블록 | has_children=True 다수 | **없음** |
| 병렬 fetch | ThreadPoolExecutor 필요 | **불필요** |
| 테이블 블록 | 없음 | **있음 (table 타입)** |
| API 호출 횟수 | 수십 번 | **단 1번** |
| 예상 속도 | 20초 | **2~3초** |

---

## 공통 헬퍼 함수 (Phase 3, 4 공유)

```python
def parse_table_block(block: dict) -> list:
    """
    노션 table 블록에서 2차원 배열을 추출합니다.
    
    노션 table 블록 구조:
    {
      "type": "table",
      "table": {
        "has_column_header": true,
        "has_row_header": false
      },
      "has_children": true  ← 자식이 table_row 블록들
    }
    
    주의: table 블록 자체에 행 데이터가 없고
          자식 블록(table_row)에 있습니다.
          하지만 Phase 3,4 페이지에서는
          테이블 자식이 이미 최상위에 평탄화되어 있으므로
          별도 fetch 없이 순서대로 처리합니다.
    """
    rows = []
    # table_row 블록에서 각 셀 추출
    for row_content in block.get("table", {}).get("rows", []):
        cells = []
        for cell in row_content.get("cells", []):
            # 셀 내부의 rich_text 배열에서 plain_text 추출
            text = "".join(t.get("plain_text", "") for t in cell)
            cells.append(text.strip())
        if any(cells):  # 빈 행 제외
            rows.append(cells)
    return rows


def get_block_text(block: dict) -> str:
    """블록에서 plain_text를 추출합니다."""
    btype = block.get("type", "")
    rich  = block.get(btype, {}).get("rich_text", [])
    return "".join(t.get("plain_text", "") for t in rich)


def is_bold_block(block: dict) -> bool:
    """블록 텍스트가 볼드인지 확인합니다."""
    btype = block.get("type", "")
    rich  = block.get(btype, {}).get("rich_text", [])
    return any(t.get("annotations", {}).get("bold") for t in rich)


def extract_number_from_text(text: str, keyword: str) -> int:
    """
    텍스트에서 키워드 뒤의 숫자를 추출합니다.
    예: "진행 프로젝트 : 6건" + "진행 프로젝트 :" → 6
    """
    import re
    if keyword not in text:
        return 0
    after = text[text.index(keyword) + len(keyword):]
    m = re.search(r"\d+", after)
    return int(m.group()) if m else 0
```

---

## 중요: 노션 table 블록 처리 방식

노션 API에서 table 블록은 특이하게 동작합니다.

```
# 최상위 블록 조회 결과:
[
  {"type": "table", "has_children": True, ...},  ← 테이블 껍데기
  # table_row 블록들은 자식으로 들어있음
]

# BUT: 실제 확인 결과 [AX]회사 월간보고, [AX]세종 월간분석는
# Notion MCP fetch로 읽으면 table 안에 rows가 이미 포함되어 있음

# app.py에서 노션 REST API로 가져올 때는:
# table 블록의 has_children=True → 자식 블록이 table_row
# 하지만 우리는 fetch_block_children()으로
# 최상위 블록만 가져오므로 table_row가 포함되지 않을 수 있음

# 해결책: table 블록 만나면 자식 fetch 1회 실행
def fetch_table_rows(table_block: dict) -> list:
    """table 블록의 자식(table_row) 블록을 가져옵니다."""
    if not table_block.get("has_children"):
        return []
    children = fetch_block_children(table_block["id"])
    rows = []
    for row_block in children:
        if row_block.get("type") == "table_row":
            cells = []
            for cell in row_block.get("table_row", {}).get("cells", []):
                text = "".join(t.get("plain_text", "") for t in cell)
                cells.append(text.strip())
            if any(cells):
                rows.append(cells)
    return rows
```

---

## Phase 3 — 회사 월간보고 파싱

### 3-1. 월 목록 추출

```python
MONTHLY_PAGE_ID = "353963cc-8170-8177-835b-deeb188c2a0f"

def get_monthly_blocks(force_refresh=False) -> list:
    """회사 월간보고 최상위 블록을 가져옵니다 (캐시 포함)."""
    # Phase 2의 get_top_blocks()와 동일한 캐시 패턴 사용
    # 단, 별도 캐시 변수 사용 (_monthly_cache)
    ...

def get_months_company(top_blocks: list) -> list:
    """heading_2에서 월 목록 추출."""
    months = []
    for block in top_blocks:
        if block.get("type") == "heading_2":
            text = get_block_text(block)
            if "[26-" in text and "월" in text:
                months.append(text)
    return months
```

### 3-2. 특정 월 블록 자르기

```python
def get_month_blocks_company(top_blocks: list, month_index: int = 0) -> list:
    """특정 월의 블록만 자릅니다 (Phase 2의 get_week_blocks와 동일 패턴)."""
    positions = [i for i, b in enumerate(top_blocks)
                 if b.get("type") == "heading_2"
                 and "[26-" in get_block_text(b)]
    
    if not positions or month_index >= len(positions):
        return []
    
    s = positions[month_index]
    e = positions[month_index + 1] if month_index + 1 < len(positions) else len(top_blocks)
    return top_blocks[s:e]
```

### 3-3. 월 데이터 파싱

```python
def parse_month_company(month_blocks: list) -> dict:
    """
    회사 월간보고 한 달치 블록을 파싱합니다.
    
    파싱 순서:
    1. heading_2: 월 제목
    2. paragraph "진행 프로젝트 :": 진행 사업 수
    3. paragraph "이슈 프로젝트현황 :": 이슈 수
    4. paragraph "03." 또는 "사업 확산": 미팅 섹션
    5. table: 인력투입현황 (첫 번째 테이블)
    6. table: 이슈사항 테이블 (두 번째 테이블 — 7컬럼)
    7. table: 착수/완료 보고 계획 (이후 테이블)
    8. heading_3 "※ 분석": 분석 섹션
    """
    import re
    
    result = {
        "month_title": "",
        "kpi": {"total": 0, "issue": 0, "meeting": 0},
        "workforce": [],       # 인력투입현황 테이블
        "issue_table": [],     # 이슈사항 테이블
        "meetings": [],        # 고객/협력사 미팅 목록
        "analysis": [],        # ※ 분석
    }
    
    in_meeting_section = False
    in_analysis = False
    table_count = 0  # 테이블 순서 추적
    
    for block in month_blocks:
        btype = block.get("type", "")
        text  = get_block_text(block).strip()
        
        # ── 월 제목
        if btype == "heading_2" and "[26-" in text:
            result["month_title"] = text
        
        # ── 분석 섹션 감지
        elif btype == "heading_3" and text.startswith("※"):
            in_analysis = True
            in_meeting_section = False
            continue
        
        # ── 분석 내용 수집
        elif in_analysis and btype == "bulleted_list_item" and text:
            result["analysis"].append(text)
        
        # ── KPI 수치 추출
        elif btype == "paragraph" and "진행 프로젝트 :" in text:
            result["kpi"]["total"] = extract_number_from_text(text, "진행 프로젝트 :")
        
        elif btype == "paragraph" and "이슈 프로젝트현황 :" in text:
            result["kpi"]["issue"] = extract_number_from_text(text, "이슈 프로젝트현황 :")
        
        # ── 미팅 섹션 진입
        elif btype == "paragraph" and ("03." in text or "사업 확산" in text):
            in_meeting_section = True
        
        # ── 미팅 내용 수집 (paragraph, 볼드 아닌 것)
        elif in_meeting_section and btype == "paragraph" and text and not is_bold_block(block):
            # 다음 섹션("04." 등) 만나면 미팅 섹션 종료
            if re.match(r"^0[4-9]\.", text) or "인력투입" in text:
                in_meeting_section = False
            else:
                result["meetings"].append(text)
                result["kpi"]["meeting"] += 1
        
        # ── 테이블 파싱
        elif btype == "table":
            rows = fetch_table_rows(block)
            table_count += 1
            
            if table_count == 1:
                # 첫 번째 테이블: 인력투입현황
                # 헤더: [구분, 3월, 4월, 5월, 6월]
                # 데이터행: [세종개발본부, 97%, 91%, 87%, 87%]
                if len(rows) >= 2:
                    headers = rows[0]
                    for row in rows[1:]:
                        if "세종개발본부" in (row[0] if row else ""):
                            for i, h in enumerate(headers[1:], 1):
                                if i < len(row):
                                    result["workforce"].append({
                                        "label": h,
                                        "value": row[i]
                                    })
            
            elif table_count == 2:
                # 두 번째 테이블: 이슈사항
                # 헤더: [고객사, 프로젝트명, 사업비, 기간, PM, 이슈현황, 해결현황]
                if len(rows) >= 2:
                    for row in rows[1:]:
                        if len(row) >= 6 and any(row):
                            result["issue_table"].append({
                                "client":     row[0] if len(row) > 0 else "",
                                "project":    row[1] if len(row) > 1 else "",
                                "budget":     row[2] if len(row) > 2 else "",
                                "period":     row[3] if len(row) > 3 else "",
                                "pm":         row[4] if len(row) > 4 else "",
                                "issue":      row[5] if len(row) > 5 else "",
                                "resolution": row[6] if len(row) > 6 else "",
                            })
    
    return result
```

### 3-4. API 엔드포인트

```python
# ── 캐시
_monthly_company_cache = {"top_blocks": None, "timestamp": 0}

@app.get("/api/monthly")
def api_monthly(month: int = 0, refresh: int = 0):
    """Phase 3: 회사 월간보고."""
    try:
        return get_monthly_data_company(month_index=month, force_refresh=bool(refresh))
    except Exception as e:
        return {"success": False, "error": str(e), "data": {}}

def get_monthly_data_company(month_index=0, force_refresh=False):
    global _monthly_company_cache
    now = time.time()
    
    if (not force_refresh
            and _monthly_company_cache["top_blocks"] is not None
            and now - _monthly_company_cache["timestamp"] < CACHE_TTL):
        top_blocks = _monthly_company_cache["top_blocks"]
    else:
        top_blocks = fetch_block_children(MONTHLY_COMPANY_PAGE_ID)
        _monthly_company_cache = {"top_blocks": top_blocks, "timestamp": now}
    
    months       = get_months_company(top_blocks)
    month_blocks = get_month_blocks_company(top_blocks, month_index)
    data         = parse_month_company(month_blocks)
    data["months"] = months
    
    return {"success": True, "data": data}
```

---

## Phase 4 — 세종 월간분석 파싱

### 4-1. 노션 블록 구조 상세

```
## [26-4월] 2026년 4월 ... (heading_2)
  paragraph: "기간: 4월 1일 ~ 4월 30일 | 작성: 노승익 본부장"

  heading_3: "1. KPI 요약"
  table: KPI 테이블
    [구분, 수치]
    [총 수행 사업 수, 5개]
    [SR 완료 건수, 48건]
    [이슈 발생 건수, 3건]
    [특이사항 건수, 6건]

  heading_3: "2. 사업별 월간 현황"

  heading_4: "1) 2026 안전신문고 시스템 유지관리 사업 (노원국 → 김형중)"
    bulleted_list_item (bold): "완료 항목"
    bulleted_list_item: 완료 항목들
    bulleted_list_item (bold): "진행 중"
    bulleted_list_item: 진행 중 항목들
    bulleted_list_item (bold): "이슈/특이사항"
    bulleted_list_item: 이슈 항목들

  heading_4: "2) 공직자통합메일..."
  ... (반복)

  heading_3: "3. 월간 종합 분석"
  heading_3: "※ 분석"
  bulleted_list_item: 분석 내용들 (볼드 없음)
```

### 4-2. 사업별 파싱 함수

```python
MONTHLY_SEJONG_PAGE_ID = "352963cc-8170-8146-bf57-ee1c87d96ba7"

def parse_month_sejong(month_blocks: list) -> dict:
    """
    세종 월간분석 한 달치 블록을 파싱합니다.

    사업 섹션 구분자: heading_4 (#### 1) 사업명...)
    완료/진행중/이슈: bold bulleted_list_item
    실제 항목: 일반(non-bold) bulleted_list_item
    """
    result = {
        "month_title": "",
        "period":      "",
        "kpi_table":   [],   # KPI 요약 테이블 행
        "projects":    [],   # 사업별 현황
        "analysis":    [],   # ※ 분석
    }
    
    cur_project  = None
    cur_section  = None   # "completed" | "in_progress" | "issues"
    in_kpi       = False
    in_projects  = False
    in_analysis  = False
    
    for block in month_blocks:
        btype = block.get("type", "")
        text  = get_block_text(block).strip()
        
        # ── 월 제목
        if btype == "heading_2" and "[26-" in text:
            result["month_title"] = text
        
        # ── 기간/작성자 paragraph
        elif btype == "paragraph" and "기간:" in text:
            result["period"] = text
        
        # ── heading_3 감지
        elif btype == "heading_3":
            in_kpi      = "KPI 요약" in text or "1." in text
            in_projects = "사업별" in text or "2." in text
            in_analysis = text.startswith("※")
            
            if in_analysis and cur_project:
                result["projects"].append(cur_project)
                cur_project = None
        
        # ── KPI 테이블
        elif in_kpi and btype == "table":
            rows = fetch_table_rows(block)
            for row in rows[1:]:  # 헤더 제외
                if len(row) >= 2 and row[0]:
                    result["kpi_table"].append({
                        "label": row[0],
                        "value": row[1] if len(row) > 1 else ""
                    })
            in_kpi = False  # 테이블 하나만
        
        # ── heading_4: 사업 섹션 시작 (#### 1) 사업명...)
        elif btype == "heading_4" and in_projects:
            import re
            if cur_project:
                result["projects"].append(cur_project)
            
            # "1) 사업명 (PM이름)" 패턴
            m = re.match(r"^\d+\)\s+(.+?)\s*[\(（](.+?)[\)）]\s*$", text)
            if m:
                name = m.group(1).strip()
                pm   = m.group(2).strip()
            else:
                name = text
                pm   = ""
            
            cur_project = {
                "name":        name,
                "pm":          pm,
                "completed":   [],
                "in_progress": [],
                "issues":      [],
            }
            cur_section = None
        
        # ── 볼드 불릿: 섹션 구분자
        elif btype == "bulleted_list_item" and is_bold_block(block) and cur_project:
            if "완료" in text:
                cur_section = "completed"
            elif "진행" in text:
                cur_section = "in_progress"
            elif "이슈" in text or "특이" in text:
                cur_section = "issues"
        
        # ── 일반 불릿: 실제 항목 수집
        elif btype == "bulleted_list_item" and not is_bold_block(block) and text:
            if in_analysis:
                result["analysis"].append(text)
            elif cur_project and cur_section:
                cur_project[cur_section].append(text)
    
    # 마지막 사업 저장
    if cur_project:
        result["projects"].append(cur_project)
    
    return result
```

### 4-3. API 엔드포인트

```python
# ── 캐시
_monthly_sejong_cache = {"top_blocks": None, "timestamp": 0}

@app.get("/api/monthly-sejong")
def api_monthly_sejong(month: int = 0, refresh: int = 0):
    """Phase 4: 세종 월간분석."""
    try:
        return get_monthly_data_sejong(month_index=month, force_refresh=bool(refresh))
    except Exception as e:
        return {"success": False, "error": str(e), "data": {}}

def get_monthly_data_sejong(month_index=0, force_refresh=False):
    global _monthly_sejong_cache
    now = time.time()
    
    if (not force_refresh
            and _monthly_sejong_cache["top_blocks"] is not None
            and now - _monthly_sejong_cache["timestamp"] < CACHE_TTL):
        top_blocks = _monthly_sejong_cache["top_blocks"]
    else:
        top_blocks = fetch_block_children(MONTHLY_SEJONG_PAGE_ID)
        _monthly_sejong_cache = {"top_blocks": top_blocks, "timestamp": now}
    
    months       = get_months_sejong(top_blocks)
    month_blocks = get_month_blocks_sejong(top_blocks, month_index)
    data         = parse_month_sejong(month_blocks)
    data["months"] = months
    
    return {"success": True, "data": data}
```

---

## 아테나 코드 프롬프트 (Phase 3)

```
@app.py @docs/PRD_Phase3_4.md @docs/LOGIC_Phase3_4.md

Phase 3: 회사 월간보고 탭 추가해줘.

## 추가할 상수
MONTHLY_COMPANY_PAGE_ID = "353963cc-8170-8177-835b-deeb188c2a0f"
_monthly_company_cache = {"top_blocks": None, "timestamp": 0}

## 추가할 함수 (LOGIC 문서 코드 그대로 사용)
- fetch_table_rows(table_block)
- get_months_company(top_blocks)
- get_month_blocks_company(top_blocks, month_index)
- parse_month_company(month_blocks)
- get_monthly_data_company(month_index, force_refresh)

## 추가할 API
GET /api/monthly?month=0&refresh=0

## 주의사항
- fetch_block_children()은 이미 있음 — 새로 만들지 마
- get_block_text(), is_bold_block()도 이미 있음
- CACHE_TTL, time 모듈도 이미 있음
- Phase 1, 2 코드 절대 건드리지 마
- 한국어 주석 포함
```

---

## 아테나 코드 프롬프트 (Phase 4)

```
@app.py @docs/PRD_Phase3_4.md @docs/LOGIC_Phase3_4.md

Phase 4: 세종 월간분석 탭 추가해줘.

## 추가할 상수
MONTHLY_SEJONG_PAGE_ID = "352963cc-8170-8146-bf57-ee1c87d96ba7"
_monthly_sejong_cache = {"top_blocks": None, "timestamp": 0}

## 추가할 함수
- get_months_sejong(top_blocks)
- get_month_blocks_sejong(top_blocks, month_index)
- parse_month_sejong(month_blocks)
- get_monthly_data_sejong(month_index, force_refresh)

## 추가할 API
GET /api/monthly-sejong?month=0&refresh=0

## 주의사항
- fetch_table_rows()는 Phase 3에서 이미 추가됨
- Phase 1, 2, 3 코드 절대 건드리지 마
- 한국어 주석 포함
```

---

## 에러 처리

| 상황 | 처리 |
|------|------|
| 테이블 행 비어있음 | `any(cells)` 체크로 빈 행 제외 |
| 월 데이터 없음 | `{"success": False, "error": "월 데이터 없음"}` |
| 숫자 추출 실패 | `extract_number_from_text()` → 0 반환 |
| heading_4 패턴 불일치 | 전체 텍스트를 name으로, pm="" |

---

*작성: 익스 + Claude | 2026.05.15 | AX Sejong Command Phase 3+4*
