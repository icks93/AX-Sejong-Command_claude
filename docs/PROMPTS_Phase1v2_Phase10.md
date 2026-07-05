# PROMPTS — Phase 1 v2 + Phase 10 대시보드
> 작성: 익스 + Claude | 2026.06.07
> 수정: 2026.06.07 v2 — Phase 10 레이아웃/KPI 개선 반영

---

## Phase 1 v2 — 세종사업현황 개선

### 클로드 코드 프롬프트
```
현재 app.py, templates/index.html, static/main.js, static/style.css 파일 읽고
기존 Phase 1 세종사업현황 탭을 아래 내용으로 개선해줘.

docs/PRD_Phase1_v2.md 참고.

변경 내용 4가지:
1. KPI 5개로 확장
   - 총 매출액, 총 수행 사업에서 status="준비중" 제외
   - "준비중" KPI 박스 새로 추가 (id="kpi-ready", 색상 amber, 서브텍스트 "매출 미반영")

2. 상단 2컬럼 영역 추가 (KPI 아래, 테이블 위)
   - 좌: 매출 구성 도넛차트 (canvas id="revenue-donut", 130x130px)
     - 준비중 제외한 사업만 렌더링
     - 가운데에 총 매출액 표시
     - 아래에 사업별 범례 (색상 dot + 사업명 + 매출 + %)
     - 하단 "* 준비중 사업은 확정 후 반영" 주석
   - 우: 예정 사업 현황 카드
     - status="준비중" 사업 목록 (점선 테두리 카드)
     - 각 카드에 사업명/고객사/PM/기간/예상매출 표시
     - 하단에 "수주 확정 시 예상 총액 = 현재 + 준비중 합산" 표시

3. 테이블 변경
   - 준비중 제외 사업 먼저 렌더링
   - 구분선 행 추가: "▼ 준비중 사업 — 매출 총액 미반영" (노란 배경)
   - 준비중 행: row-ready 클래스, 매출액에 "(예상)" 표기

4. renderBadge에 "준비중" 추가
   - 노란 계열 배지 (badge-ready)

반드시 지켜야 할 것:
- Phase 2~9 코드 절대 건드리지 마
- 기존 loadProjects, renderKPI, renderTable 함수 수정 (재작성 금지)
- CACHE_TTL, 기존 헬퍼 함수 그대로 재사용
- 한국어 주석 포함
```

---

### 아테나 코드 프롬프트
```
@app.py @templates/index.html @static/main.js @static/style.css
@docs/PRD_Phase1_v2.md
@docs/UI_COMPONENTS.md

위 파일 읽고 Phase 1 세종사업현황 탭을 개선해줘.

변경 내용 4가지:
1. KPI 5개로 확장
   - 총 매출액, 총 수행 사업에서 status="준비중" 제외
   - "준비중" KPI 박스 새로 추가 (id="kpi-ready", 색상 amber, 서브텍스트 "매출 미반영")

2. 상단 2컬럼 영역 추가 (KPI 아래, 테이블 위)
   - 좌: 매출 구성 도넛차트 (canvas id="revenue-donut", 130x130px)
     - 준비중 제외한 사업만 렌더링
     - 가운데에 총 매출액 표시
     - 아래에 사업별 범례 (색상 dot + 사업명 + 매출 + %)
     - 하단 "* 준비중 사업은 확정 후 반영" 주석
   - 우: 예정 사업 현황 카드
     - status="준비중" 사업 목록 (점선 테두리 카드)
     - 각 카드에 사업명/고객사/PM/기간/예상매출 표시
     - 하단에 "수주 확정 시 예상 총액 = 현재 + 준비중 합산" 표시

3. 테이블 변경
   - 준비중 제외 사업 먼저 렌더링
   - 구분선 행 추가: "▼ 준비중 사업 — 매출 총액 미반영" (노란 배경)
   - 준비중 행: row-ready 클래스, 매출액에 "(예상)" 표기

4. renderBadge에 "준비중" 추가
   - 노란 계열 배지 (badge-ready)

반드시 지켜야 할 것:
- Phase 2~9 코드 절대 건드리지 마
- 기존 loadProjects, renderKPI, renderTable 함수 수정 (재작성 금지)
- CACHE_TTL, 기존 헬퍼 함수 그대로 재사용
- 한국어 주석 포함
```

---

## Phase 10 — 대시보드 탭 신규 추가

### 클로드 코드 프롬프트
```
현재 app.py, templates/index.html, static/main.js, static/style.css 파일 읽고
Phase 10 대시보드 탭을 추가해줘.

docs/PRD_Phase10_대시보드.md 참고.

추가 내용:
1. 사이드 메뉴 최상단에 "대시보드" 항목 추가 (data-tab="dashboard")
   - 앱 최초 진입 시 대시보드가 기본 활성 탭 (기존 첫 탭 비활성화)

2. index.html에 tab-dashboard 컨텐츠 영역 추가
   - KPI 5개: 수행사업 / 총매출액 / 팀인원 / 이번주영업 / 준비중사업
   - 상단 2컬럼: 수행사업현황(준비중 하단 구분선 후 별도 표시) | 사업별 인력현황(파이차트)
   - 하단 4섹션 (2+2 그리드):
     - RISK 알림 (최대 5건, focus 항목 제외)
     - 주간회의 집중 확인 (focus 항목만, 번호 리스트)
     - 영업보고 ([수주]/[세종] 태그 항목만 필터링)
     - 세미나 알림 (최대 4건)

3. main.js에 함수 추가
   - loadDashboard(forceRefresh): Promise.all로 5개 API 동시 호출
     (/api/projects, /api/risk, /api/sales, /api/seminar, /api/org)
   - renderDashKPI(projects, sales): KPI 5개 업데이트 (준비중 제외 계산)
   - renderDashProjects(projects): 사업 목록 (진행중→종료→구분선→준비중)
   - renderDashOrg(org): canvas 파이차트(80px) + 사업별 인원 막대
   - renderDashRisk(risk): 최대 5건, focus 제외
   - renderDashFocus(risk): focus 필드만 번호 리스트
   - renderDashSales(sales): [수주]/[세종] 태그 항목만
   - renderDashSeminar(seminar): 최대 4건
   - DOMContentLoaded 시 loadDashboard() 자동 호출

4. style.css에 대시보드 전용 클래스 추가
   - PRD_Phase10_대시보드.md CSS 섹션 그대로 적용

반드시 지켜야 할 것:
- app.py 건드리지 마 (기존 API 재활용만)
- Phase 1~9 코드 절대 건드리지 마
- switchTab 함수 재활용 (더보기 클릭 연동)
- canvas 파이차트는 requestAnimationFrame 사용
- 한국어 주석 포함
```

---

### 아테나 코드 프롬프트
```
@app.py @templates/index.html @static/main.js @static/style.css
@docs/PRD_Phase10_대시보드.md
@docs/UI_COMPONENTS.md

위 파일 읽고 Phase 10 대시보드 탭을 추가해줘.

추가 내용:
1. 사이드 메뉴 최상단에 "대시보드" 항목 추가 (data-tab="dashboard")
   - 앱 최초 진입 시 대시보드가 기본 활성 탭 (기존 첫 탭 비활성화)

2. index.html에 tab-dashboard 컨텐츠 영역 추가
   - KPI 5개: 수행사업 / 총매출액 / 팀인원 / 이번주영업 / 준비중사업
   - 상단 2컬럼: 수행사업현황(준비중 하단 구분선 후 별도 표시) | 사업별 인력현황(파이차트)
   - 하단 4섹션 (2+2 그리드):
     - RISK 알림 (최대 5건, focus 항목 제외)
     - 주간회의 집중 확인 (focus 항목만, 번호 리스트)
     - 영업보고 ([수주]/[세종] 태그 항목만 필터링)
     - 세미나 알림 (최대 4건)

3. main.js에 함수 추가
   - loadDashboard(forceRefresh): Promise.all로 5개 API 동시 호출
     (/api/projects, /api/risk, /api/sales, /api/seminar, /api/org)
   - renderDashKPI(projects, sales): KPI 5개 업데이트 (준비중 제외 계산)
   - renderDashProjects(projects): 사업 목록 (진행중→종료→구분선→준비중)
   - renderDashOrg(org): canvas 파이차트(80px) + 사업별 인원 막대
   - renderDashRisk(risk): 최대 5건, focus 제외
   - renderDashFocus(risk): focus 필드만 번호 리스트
   - renderDashSales(sales): [수주]/[세종] 태그 항목만
   - renderDashSeminar(seminar): 최대 4건
   - DOMContentLoaded 시 loadDashboard() 자동 호출

4. style.css에 대시보드 전용 클래스 추가
   - PRD_Phase10_대시보드.md CSS 섹션 그대로 적용

반드시 지켜야 할 것:
- app.py 건드리지 마 (기존 API 재활용만)
- Phase 1~9 코드 절대 건드리지 마
- switchTab 함수 재활용 (더보기 클릭 연동)
- canvas 파이차트는 requestAnimationFrame 사용
- 한국어 주석 포함
```

---

## 작업 순서

```
1단계: Phase 1 v2 먼저 구현 + 동작 확인
       → 준비중 분리 + 도넛차트 + 예정사업 카드
       → 체크포인트 저장

2단계: Phase 10 대시보드 구현
       → Phase 1 v2 완료 후 진행 (org API 등 의존)
       → 체크포인트 저장
```

---

*작성: 익스 + Claude | 2026.06.07 v2*
