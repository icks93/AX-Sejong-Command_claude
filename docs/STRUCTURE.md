# STRUCTURE.md — AX Sejong Command (Phase 1)
> 작성: 익스 + Claude | 2026.05.10

---

## 선택한 방식: Python FastAPI + HTML/CSS/JS (단일 서버)

> 이유: 설치 후 `python app.py` 한 줄로 실행. 프론트/백엔드 분리 없이 하나의 서버에서 화면과 API 모두 처리. 나중에 팀 공유 시 그대로 사용 가능.

---

## 전체 폴더 구조

```
AX-Sejong-Command/
│
├── app.py                  ← 서버 메인 파일 (FastAPI)
│
├── templates/
│   └── index.html          ← 전체 화면 HTML (탭 구조 포함)
│
├── static/
│   ├── style.css           ← 전체 스타일
│   └── main.js             ← 화면 동작 로직 (JavaScript)
│
├── .env                    ← API 키 저장 (노션 등) — git에 올리면 안 됨
├── .env.example            ← API 키 예시 형식 (공유용)
├── requirements.txt        ← 설치 패키지 목록
│
└── docs/                   ← 설계 문서 모음
    ├── PRD.md
    ├── STRUCTURE.md
    ├── UI.md
    ├── LOGIC.md
    └── RULES.md
```

---

## 각 파일 역할

| 파일 | 역할 |
|------|------|
| `app.py` | FastAPI 서버. 화면 반환 + 노션 API 호출 + JSON 응답 |
| `templates/index.html` | 전체 대시보드 화면. 사이드바 + 탭 + KPI + 테이블 |
| `static/style.css` | 색상, 레이아웃, 컴포넌트 스타일 전체 |
| `static/main.js` | API 호출, 화면 렌더링, 툴팁, 탭 전환 등 동작 처리 |
| `.env` | 노션 API 키 등 민감 정보 보관. 직접 편집 |
| `.env.example` | .env 형식 예시. 팀 공유 시 참고용 |
| `requirements.txt` | pip install 시 사용하는 패키지 목록 |

---

## app.py 내부 구조

```python
app.py
│
├── 라이브러리 임포트
│   ├── FastAPI, Jinja2Templates, StaticFiles
│   ├── requests (노션 API 호출용)
│   └── python-dotenv (.env 파일 읽기)
│
├── 앱 초기화
│   ├── FastAPI 앱 생성
│   ├── 정적 파일 경로 등록 (/static)
│   └── 템플릿 경로 등록 (templates/)
│
├── 노션 설정
│   ├── NOTION_API_KEY (.env에서 읽기)
│   └── NOTION_DB_ID (세종사업현황 DB ID)
│
├── 라우터
│   ├── GET /           → index.html 반환 (메인 화면)
│   └── GET /api/projects → 노션 DB 조회 → JSON 반환
│
└── 유틸 함수
    ├── get_notion_projects()  ← 노션 API 호출 + 데이터 파싱
    └── format_revenue()       ← 숫자 → "X.X억" 변환
```

---

## templates/index.html 내부 구조

```html
index.html
│
├── <head>
│   ├── CSS 링크 (static/style.css)
│   └── 아이콘 폰트 (Tabler Icons CDN)
│
└── <body>
    ├── .shell (전체 감싸는 컨테이너)
    │   │
    │   ├── .sidebar (왼쪽 사이드바 200px)
    │   │   ├── 로고 영역 (AX Sejong Command)
    │   │   ├── 현황 메뉴 그룹
    │   │   │   ├── 세종사업현황 (활성)
    │   │   │   ├── PM 주간회의
    │   │   │   ├── 이슈 조기경보
    │   │   │   ├── 조직도 (예정)
    │   │   │   └── 손익현황 (예정)
    │   │   ├── 실행 메뉴 그룹
    │   │   │   └── 자동화 실행
    │   │   └── 하단 사용자 정보 (노승익 본부장)
    │   │
    │   └── .main (오른쪽 메인 영역)
    │       ├── .topbar (상단 바 — 제목 + 새로고침 버튼)
    │       └── .content (탭별 콘텐츠 영역)
    │           └── #tab-projects (세종사업현황 탭)
    │               ├── .kpi-grid (KPI 박스 4개)
    │               └── .table-wrap (사업 목록 테이블)
    │
    └── <script src="static/main.js">
```

---

## static/main.js 내부 구조

```javascript
main.js
│
├── 초기화
│   └── DOMContentLoaded → loadProjects() 자동 실행
│
├── loadProjects()
│   ├── /api/projects 호출 (fetch)
│   ├── 로딩 스피너 표시
│   ├── 응답 성공 → renderKPI() + renderTable() 호출
│   └── 응답 실패 → 에러 메시지 표시
│
├── renderKPI(projects)
│   ├── 총 사업수 계산 및 표시
│   ├── 총 매출액 합산 및 "X.X억" 변환
│   ├── 운영중 사업 수 계산 (운영중 + 신규)
│   └── 종료 사업 수 계산
│
├── renderTable(projects)
│   ├── 테이블 tbody 초기화
│   ├── 각 사업 행(tr) 생성
│   │   ├── 사업명 셀 (툴팁 포함)
│   │   ├── 고객사 / PM / 매출액 / 계약기간 셀
│   │   └── 상태 배지 셀
│   └── tbody에 삽입
│
├── renderTooltip(project)
│   └── 사업명·고객사·운영대상·사업요약 HTML 반환
│
└── switchTab(tabName)
    ├── 모든 탭 콘텐츠 숨기기
    ├── 선택된 탭 콘텐츠 표시
    └── 사이드바 활성 메뉴 변경
```

---

## .env 파일 형식

```
# 노션 API 키 (노션 → 설정 → 연결 → API에서 발급)
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 세종사업현황 DB ID (고정값, 변경 불필요)
NOTION_PROJECTS_DB_ID=35c963cc-8170-803a-bad2-000bf4161108

# 서버 포트 (기본값 8000, 변경 필요 시 수정)
PORT=8000
```

---

## requirements.txt 내용

```
fastapi
uvicorn
requests
python-dotenv
jinja2
```

---

## 실행 명령어 요약

```bash
# 패키지 설치 (처음 한 번만)
pip install -r requirements.txt

# 서버 실행
python app.py

# 접속
브라우저 → http://localhost:8000
```

---

## Phase 2 이후 추가될 파일 예고

```
Phase 2 추가 예정:
└── (app.py에 /api/weekly 엔드포인트 추가)

Phase 3 추가 예정:
└── (app.py에 /api/issues 엔드포인트 추가)

Phase 4 추가 예정:
└── (app.py에 /api/run/{automation_name} 엔드포인트 추가)
```

> 각 Phase에서 기존 파일에 기능을 추가(ADD)하는 방식. 새 파일 생성 최소화.

---

*작성: 익스 + Claude | 2026.05.10 | AX Sejong Command Phase 1*
