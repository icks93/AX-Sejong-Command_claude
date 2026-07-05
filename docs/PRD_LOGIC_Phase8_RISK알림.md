# PRD_LOGIC — Phase 8: RISK 알림 탭
> AX Sejong Command | 작성: 2026.05.24

---

## 1. 목적

매주 Cowork가 저장하는 [AX]리스크알람 노션 페이지를 주차별 카드로 표시한다.
드롭다운 선택 없이 전체 주차를 펼친 상태로 나열한다.

---

## 2. 노션 데이터 구조

### 소스 페이지
- 페이지명: [AX]리스크알람
- 페이지 ID: 369963cc-8170-81bd-adc2-d4340f24a2d6

### 실제 블록 구조 (노션 확인 기준)

```
heading_2: "[2026년 5월 4주차] 리스크 알람"  → color: yellow_background
paragraph: "05/21 기준 | 분석 범위: 노션 3주차 + 슬랙 21일"
divider
heading_3: "장기 미해결 이슈 (2주 이상 반복)"   ← 없으면 섹션 자체 생략
bulleted_list: "[사업명] 이슈 내용 — N주째 지속"
heading_3: "악화 감지"                          ← 없으면 섹션 자체 생략
bulleted_list: "[사업명] 이슈 내용 — 변화 추이"
heading_3: "보고 누락 의심"                     ← 없으면 섹션 자체 생략
bulleted_list: "슬랙 언급 내용 — 주간보고 미반영"
heading_3: "일정 리스크"                        ← 없으면 섹션 자체 생략
bulleted_list: "[사업명] 만료일·납기일 임박 항목"
heading_3: "오늘 주간회의 집중 확인 필요"
bulleted_list: "우선순위 순으로 1~3개"
paragraph: "자동 생성: YYYY년 MM월 DD일 HH:MM | risk_alarm"  (italic)
divider
```

### 주차 헤더 파싱 규칙
- heading_2 텍스트가 "[20XX년" 으로 시작하면 주차 구분자로 인식
- 정규식: \[(\d{4}년\s*\d+월\s*\d+주차)\]
- heading_2 ~ 다음 heading_2 직전까지를 한 주차 블록으로 수집

### 섹션 구분 규칙
- heading_3 텍스트로 섹션 식별 (키워드 매칭)
  - "장기 미해결" → long_issues
  - "악화 감지"   → worsening
  - "보고 누락"   → missing
  - "일정 리스크" → schedule
  - "집중 확인"   → focus
- heading_3 ~ 다음 heading_3 또는 divider 직전까지 bulleted_list 수집

### 파싱 방어 규칙
- 섹션 자체가 없으면 빈 배열 [] 반환 (키 누락 금지)
- "이번 주 특이 리스크 없음" paragraph → no_risk: true 플래그로 처리

---

## 3. 백엔드 로직 (app.py 추가)

### 상수 / 캐시

```python
# ── PHASE 8: RISK 알림 ──────────────────────────────────────
RISK_PAGE_ID = "369963cc-8170-81bd-adc2-d4340f24a2d6"
_risk_cache  = {"data": None, "timestamp": 0}
```

### 헬퍼 함수

```python
def parse_risk_blocks(top_blocks: list) -> list[dict]:
    """
    heading_2 기준으로 주차 분리 후 각 주차 파싱
    반환: [
      {
        "label":        "2026년 5월 4주차",
        "base_date":    "05/21 기준",
        "scope":        "노션 3주차 + 슬랙 21일",
        "no_risk":      False,
        "long_issues":  ["[안전신문고] 매시 정각 WAS 정체 — 3주째 지속"],
        "worsening":    ["[안전신문고] 동영상·썸네일 관련 항목 병행 — 과부하 리스크"],
        "missing":      ["[철도] 5월2주차까지 2주 연속 누락 후 복귀 — 내용 확인 필요"],
        "schedule":     ["[공직메일] 서버 OS 재설치 1차 ~5/30 — 잔여 10일"],
        "focus":        ["안전신문고 WAS 정체 트래픽 분석 결과 확인"],
        "generated":    "자동 생성: 2026년 05월 24일 | risk_alarm"
      },
      ...  # 최신순 정렬
    ]
    """

def get_risk_data(force_refresh: bool = False) -> list[dict]:
    """
    캐시 확인 → 만료 시 노션 API 호출 → parse_risk_blocks 실행
    CACHE_TTL 상수 재사용
    """
```

### API 엔드포인트

```python
@app.get("/api/risk")
async def api_risk(refresh: int = 0):
    """
    전체 주차 데이터를 최신순 배열로 반환
    refresh=1: 캐시 무시
    """
```

### 반환 JSON 구조

```json
[
  {
    "label":       "2026년 5월 4주차",
    "base_date":   "05/21 기준",
    "scope":       "노션 3주차 + 슬랙 21일",
    "no_risk":     false,
    "long_issues": ["[안전신문고] 매시 정각 WAS 정체 이슈 — 3주째 지속"],
    "worsening":   ["[안전신문고] 동영상·썸네일 항목 5건 이상 병행 — 과부하 리스크"],
    "missing":     ["[철도] 5월2주차까지 2주 연속 누락 후 복귀 — 내용 확인 필요"],
    "schedule":    ["[공직메일] 서버 OS 재설치 1차 ~5/30 — 잔여 10일"],
    "focus":       ["안전신문고 WAS 정체 트래픽 분석 결과 및 근본 원인 파악 현황"],
    "generated":   "자동 생성: 2026년 05월 24일 | risk_alarm"
  }
]
```

---

## 4. 프론트엔드 구성

### 사이드 메뉴 추가 (index.html)

```html
<li class="menu-item" data-tab="risk">
  <span class="menu-icon">⚑</span> RISK 알림
</li>
```

### 탭 컨텐츠 영역 (index.html)

```html
<div id="tab-risk" class="tab-content" style="display:none;">
  <div class="page-header">
    <div>
      <h1 class="page-title">RISK 알림</h1>
      <p class="page-sub">노션 실시간 연동 · 주차별 리스크 집계</p>
    </div>
    <button class="refresh-btn" onclick="loadRisk(true)">↻ 새로고침</button>
  </div>
  <div id="risk-list" class="risk-list"></div>
</div>
```

### 화면 레이아웃 (카드 전체 펼침)

```
┌─ RISK 알림                              [↻ 새로고침] ─┐
│  노션 실시간 연동 · 주차별 리스크 집계                 │
├────────────────────────────────────────────────────────┤
│  ┌─ 2026년 5월 4주차  05/21 기준 ───────────────────┐  │
│  │  분석 범위: 노션 3주차 + 슬랙 21일               │  │
│  │ ──────────────────────────────────────────────── │  │
│  │  장기 미해결 이슈     │  일정 리스크              │  │
│  │  · [안전신문고] WAS   │  · [공직메일] OS재설치    │  │
│  │    정체 3주째 지속    │    ~5/30 잔여 10일        │  │
│  │  · [AI과제] CPU 입고  │  · [공직메일] 본인인증    │  │
│  │    지연 2주째         │    API v2 ~6/30           │  │
│  │ ─────────────────────┤─────────────────────────  │  │
│  │  악화 감지            │  오늘 주간회의 집중 확인  │  │
│  │  · [안전신문고] 동영  │  · WAS 정체 트래픽 분석  │  │
│  │    상 5건 병행 과부하 │  · AI과제 CPU 대응방안    │  │
│  │ ─────────────────────┤─────────────────────────  │  │
│  │  보고 누락 의심                                   │  │
│  │  · [철도] 2주 연속 누락 후 복귀 — 내용 확인 필요 │  │
│  │ ──────────────────────────────────────────────── │  │
│  │  자동 생성: 2026년 05월 24일 | risk_alarm         │  │
│  └───────────────────────────────────────────────┘  │
│                                                        │
│  ┌─ 2026년 5월 3주차  05/14 기준 ───────────────────┐  │
│  │  ... (동일 구조)                                  │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 섹션 배치 규칙

```
카드 내부 2컬럼 그리드:
  좌상단: 장기 미해결 이슈
  우상단: 일정 리스크
  좌하단: 악화 감지
  우하단: 오늘 주간회의 집중 확인 필요
  하단 풀폭: 보고 누락 의심

no_risk=true 인 경우:
  카드 내부에 "이번 주 특이 리스크 없음" 중앙 표시
```

### JS 함수 (main.js 추가)

```javascript
// ── PHASE 8: RISK 알림 ──────────────────────────────────────

async function loadRisk(forceRefresh = false) {
    // GET /api/risk?refresh=1 호출
    // renderRiskList(data) 실행
}

function renderRiskList(weeks) {
    // weeks 배열 순서대로 카드 렌더링 (전체 펼침)
    const html = weeks.map(w => renderRiskCard(w)).join('');
    document.getElementById('risk-list').innerHTML = html;
}

function renderRiskCard(week) {
    // no_risk=true → 심플 카드 (리스크 없음 메시지)
    // no_risk=false → 2컬럼 그리드 카드
}

function renderRiskSection(title, items, cssClass) {
    // 섹션 타이틀 + 항목 리스트
    // items 빈 배열이면 섹션 자체 렌더링 생략
}
```

### CSS 클래스 (style.css 추가)

```css
/* Phase 8 — RISK 알림 */
.risk-list { display: flex; flex-direction: column; gap: 16px; }

.risk-card { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; }

.risk-card-header {
    padding: 12px 18px;
    background: #fef2f2;
    border-bottom: 1px solid #fecaca;
    display: flex; align-items: center; gap: 10px;
}
.risk-card-accent { width: 4px; height: 22px; background: #ef4444; border-radius: 2px; }
.risk-card-title  { font-size: 14px; font-weight: 700; color: #1e293b; }
.risk-card-meta   { font-size: 12px; color: #94a3b8; }

.risk-card-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    border-bottom: 1px solid #f1f5f9;
}
.risk-col { padding: 14px 18px; }
.risk-col + .risk-col { border-left: 1px solid #f1f5f9; }
.risk-col-full {
    grid-column: 1 / -1;
    padding: 14px 18px;
    border-top: 1px solid #f1f5f9;
}

.risk-section-title {
    font-size: 11px; font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.04em;
    margin-bottom: 8px; padding-bottom: 5px;
    border-bottom: 1px solid #f1f5f9;
}
.risk-item     { display: flex; gap: 6px; margin-bottom: 5px; font-size: 12px; color: #475569; line-height: 1.5; }
.risk-item-dot { width: 5px; height: 5px; background: #fca5a5; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }

/* 섹션별 강조색 */
.risk-col.long-issues .risk-item-dot  { background: #f97316; }  /* 주황 - 장기미해결 */
.risk-col.worsening   .risk-item-dot  { background: #ef4444; }  /* 빨강 - 악화감지 */
.risk-col.schedule    .risk-item-dot  { background: #eab308; }  /* 노랑 - 일정리스크 */
.risk-col.focus       .risk-item-dot  { background: #3b82f6; }  /* 파랑 - 집중확인 */
.risk-col-full.missing .risk-item-dot { background: #8b5cf6; }  /* 보라 - 누락의심 */

.risk-no-risk { padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; }

.risk-card-footer {
    padding: 6px 18px;
    font-size: 10px; color: #cbd5e1; font-style: italic;
}
```

---

## 5. 개발 원칙

1. 노션 원본 텍스트 그대로 표시 — 요약/축약 없음
2. 캐싱 10분 — CACHE_TTL 상수 재사용
3. Phase 1~7 코드 건드리지 않음
4. 전체 주차 펼침 — 토글/드롭다운 없음
5. 빈 섹션은 렌더링 생략 (리스크알람 SKILL 규칙과 동일)

---

## 6. 클로드 코드 프롬프트

```
현재 app.py, index.html, main.js, style.css 파일 읽고
기존 Phase 1~7 구조 파악한 후 Phase 8 RISK 알림 탭을 추가해줘.

docs/PRD_LOGIC_Phase8_RISK알림.md 참고.

반드시 지켜야 할 것:
- fetch_block_children(), get_block_text() 이미 있으면 재사용
- Phase 1~7 코드 절대 건드리지 마
- CACHE_TTL 상수 그대로 재사용
- 전체 주차 카드 펼침 상태로 나열 (토글 없음)
- 빈 섹션은 렌더링 생략
- 한국어 주석 포함
```

## 7. 아테나 코드 프롬프트

```
@app.py @templates/index.html @static/main.js @static/style.css
@docs/PRD_LOGIC_Phase8_RISK알림.md
@docs/UI_COMPONENTS.md

위 문서 읽고 Phase 8 RISK 알림 탭 구현해줘.

반드시 지켜야 할 것:
- fetch_block_children(), get_block_text() 이미 있으면 재사용
- Phase 1~7 코드 절대 건드리지 마
- CACHE_TTL 상수 그대로 재사용
- 전체 주차 카드 펼침 상태로 나열 (토글 없음)
- 빈 섹션은 렌더링 생략
- 한국어 주석 포함
```

---

*작성: 익스 + Claude | 2026.05.24*
