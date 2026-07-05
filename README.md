# AX Sejong Command

세종개발본부 업무 현황 대시보드. 노션 API에서 데이터를 실시간 연동해 한 화면에 표시한다.

---

## 기술 스택

| 구분 | 내용 |
|------|------|
| 백엔드 | Python 3.10+ / FastAPI / Uvicorn |
| 프론트엔드 | HTML + CSS + Vanilla JS |
| 데이터 소스 | Notion API (읽기 전용) |
| 캐싱 | 메모리 캐시 10분 (`CACHE_TTL = 600`) |

---

## 탭 구성 (Phase 별)

| Phase | 탭명 | 노션 소스 |
|-------|------|-----------|
| 1 | 세종사업현황 | 세종사업현황 DB |
| 2 | PM 주간회의 | [AX]주간회의 페이지 |
| 3 | 회사 월간보고 | [AX]월간보고(회사) 페이지 |
| 4 | 세종 월간분석 | [AX]월간보고(세종) 페이지 |
| 5 | 세종사업히스토리 | [AX]세종사업히스토리 페이지 |
| 6 | 조직도 | 직원 DB / 프로젝트 DB |
| 7 | 영업보고 분석 | [AX]영업보고 페이지 |
| 8 | RISK 알림 | [AX]리스크알람 페이지 |
| 9 | 세미나 알림 | [AX]세미나브리핑 페이지 |

---

## 파일 구조

```
AX-Sejong-Command_claude/
├── app.py                  # FastAPI 백엔드 (Phase 1~9 전체)
├── requirements.txt
├── .env                    # 환경변수 (git 제외)
├── templates/
│   └── index.html          # 단일 페이지 SPA
├── static/
│   ├── style.css
│   └── main.js
└── docs/                   # PRD · 설계 문서
```

---

## 실행 방법

**1. 환경변수 설정**

`.env` 파일 생성:

```
NOTION_API_KEY=secret_xxxx
NOTION_PROJECTS_DB_ID=xxxx
```

**2. 패키지 설치**

```bash
pip install -r requirements.txt
```

**3. 서버 실행**

```bash
python app.py
```

접속: `http://localhost:8001`

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/projects` | 세종사업현황 |
| GET | `/api/weekly` | PM 주간회의 |
| GET | `/api/monthly` | 회사 월간보고 |
| GET | `/api/sejong` | 세종 월간분석 |
| GET | `/api/history` | 세종사업히스토리 |
| GET | `/api/org` | 조직도 |
| GET | `/api/sales` | 영업보고 |
| GET | `/api/risk` | RISK 알림 |
| GET | `/api/seminar` | 세미나 알림 |

캐시 강제 갱신: `?refresh=1` 파라미터 추가

---

## 개발 원칙

- 노션 원본 텍스트 그대로 표시 — 요약·축약 없음
- 각 Phase는 독립적으로 추가, 기존 코드 수정 금지
- `fetch_block_children()` / `get_block_text()` 공용 헬퍼 재사용
- 백엔드 함수는 동기(synchronous) — `requests` 라이브러리 사용
- 한국어 주석 포함
