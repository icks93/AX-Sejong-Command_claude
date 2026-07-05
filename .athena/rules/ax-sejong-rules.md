# AX Sejong Command - 개발 규칙

> 프로젝트: AX Sejong Command (Phase 1)
> 작성: 익스 + Claude | 2026.05.10
> 적용 범위: 모든 모드 (architect, code, ask)

---

## 개요

AX Sejong Command는 세종사업현황을 관리하는 대시보드 애플리케이션입니다. 본 규칙 파일은 프로젝트의 모든 개발 활동에 적용되는 필수 가이드라인을 정의합니다.

### 프로젝트 특성
- **백엔드**: Python 3.10+ (FastAPI)
- **프론트엔드**: HTML + CSS + Vanilla JS (React/Vue 금지)
- **데이터 저장소**: Notion API (별도 DB 금지)
- **구조**: 단일 FastAPI 서버 (프론트/백엔드 분리 금지)

---

## 1. 금지 사항 (절대 하지 말 것)

### R-01 별도 데이터베이스 설치 금지
MySQL, PostgreSQL 등 별도 데이터베이스를 설치하거나 연결하지 마세요. Notion이 유일한 데이터 저장소입니다.

### R-02 프론트엔드/백엔드 분리 구조 금지
단일 FastAPI 서버에서 모든 것을 처리하세요. 별도의 프론트엔드 서버를 구축하지 마세요.

### R-03 JS 프레임워크 사용 금지
React, Vue, Angular 등 JavaScript 프레임워크를 사용하지 마세요. 순수 HTML + Vanilla JS로 구현하세요.

### R-04 npm/node_modules 사용 금지
npm 패키지 매니저와 node_modules 폴더를 사용하지 마세요. Python 기반으로만 구성하세요.

### R-05 API Key 하드코딩 금지
Notion API Key를 코드 안에 직접 작성(하드코딩)하지 마세요. 반드시 `.env` 파일에서 읽어오세요.

### R-06 .env 파일 공유 금지
`.env` 파일을 git에 올리거나 공유하지 마세요. 대신 `.env.example`을 사용하여 형식만 공유하세요.

### R-07 노션 DB 데이터 수정/삭제 금지
Notion DB 데이터를 수정하거나 삭제하는 요청을 보내지 마세요. 읽기(READ) 전용으로만 사용하세요.

### R-08 외부 CDN 과도 의존 금지
외부 CDN 이미지나 폰트를 과도하게 의존하지 마세요. 오프라인 환경을 대비해야 합니다.

### R-09 position: fixed 사용 금지
`position: fixed`를 사용하지 마세요. 툴팁 등은 `position: absolute`로 처리하세요.

### R-10 전체 Phase 기능 동시 구현 금지
한 번에 모든 Phase 기능을 구현하지 마세요. 현재 작업 중인 Phase 범위만 구현하세요.

---

## 2. 필수 사항 (반드시 지킬 것)

### R-11 한 줄 실행 가능
`python app.py` 한 줄로 서버가 실행되어야 합니다.

### R-12 즉시 접속 가능
브라우저에서 `http://localhost:8000` 접속 시 화면이 바로 나와야 합니다.

### R-13 Python 함수 docstring 필수
모든 Python 함수에 한국어 docstring(설명)을 작성해야 합니다.

```python
def get_notion_projects():
    """
    노션 데이터베이스에서 프로젝트 목록을 조회합니다.
    
    Returns:
        list: 프로젝트 데이터 리스트
    """
    pass
```

### R-14 JS 함수 주석 필수
모든 JavaScript 함수에 한국어 주석을 작성해야 합니다.

```javascript
// 테이블 렌더링 함수
function renderTable(data) {
    // 데이터를 테이블 형식으로 표시
}
```

### R-15 API 응답 형식 통일
API 응답은 항상 다음 형식을 유지해야 합니다.

```json
{
  "success": true,
  "data": [...]
}
```

### R-16 API 오류 처리 필수
노션 API 오류 시 서버가 죽지 않고 에러 메시지를 반환해야 합니다.

```python
try:
    response = requests.post(url, ...)
except Exception as e:
    return {"success": False, "error": str(e)}
```

### R-17 빈값 표시 처리
속성값이 비어있는 경우 에러가 아닌 "—" 으로 표시해야 합니다.

### R-18 중복 클릭 방지
새로고침 버튼 클릭 중 중복 클릭을 방지해야 합니다. 버튼을 비활성화하세요.

### R-19 미구현 탭 표시
Phase 2~5 미구현 탭은 사이드바에 "예정" 뱃지로 표시하고 클릭을 비활성화하세요.

### R-20 requirements.txt 필수
`requirements.txt`에 사용하는 모든 패키지를 명시해야 합니다.

---

## 3. 코드 스타일 규칙

### 언어 버전
- **Python**: 3.10+ (백엔드)
- **HTML/CSS/JS**: 표준 웹 기술 (프론트)

### 주석 언어
모든 주석과 docstring은 **한국어**로 작성하세요.

### 명명 규칙

| 언어 | 규칙 | 예시 |
|------|------|------|
| Python 함수 | snake_case | `get_notion_projects` |
| JavaScript 함수 | camelCase | `renderTable` |
| CSS 클래스 | kebab-case | `kpi-card`, `name-cell` |
| 변수명 | 의미 있는 이름 | `projects`, `status_data` (금지: `x`, `tmp`, `data2`) |

### 들여쓰기
- **Python**: 4칸
- **HTML/CSS/JS**: 2칸

### 문자열
- **Python**: 큰따옴표(`"`) 사용
- **JavaScript**: 작은따옴표(`'`) 또는 백틱(\`) 사용

---

## 4. 파일 구조 규칙

### 신규 파일 생성 최소화
기능 추가 시 기존 파일에 추가(ADD)하는 방식을 우선하세요. 불필요한 파일 생성을 피하세요.

### 설계 문서 위치
모든 설계 문서는 반드시 `docs/` 폴더 안에 보관하세요.

### 정적 파일 위치
- **CSS**: `static/style.css`
- **JavaScript**: `static/main.js`

### 템플릿 위치
`templates/index.html` 단일 파일로 관리하세요.

### 환경 변수 파일
- `.env`: 실제 API 키 (git 제외)
- `.env.example`: 형식 예시 (git 포함)

---

## 5. 노션 API 규칙

### API 버전
`Notion-Version: 2022-06-28` 고정 사용

### DB ID
`.env`의 `NOTION_PROJECTS_DB_ID` 변수에서 읽어오세요.

```python
import os
NOTION_DB_ID = os.getenv("NOTION_PROJECTS_DB_ID")
```

### 정렬 기준
매출액 내림차순 (`descending`)으로 정렬하세요.

### 읽기 전용
`POST /query` API만 사용하세요. 수정/ 삭제 API는 사용 금지입니다.

### 응답 파싱
try/except로 감싸서 빈값 처리를 필수로 수행하세요.

### 타임아웃 설정
requests 호출 시 `timeout=10`을 설정하세요.

```python
response = requests.post(url, headers=headers, json=payload, timeout=10)
```

---

## 6. UI 규칙

### 색상 시스템
`docs/UI.md`에 정의된 색상 시스템을 그대로 사용하세요. 임의 변경은 금지입니다.

### 아이콘
Tabler Icons CDN만 사용하세요 (`ti-` 접두사).

```html
<i class="ti ti-home"></i>
```

### 폰트
시스템 기본 폰트를 사용하세요. 웹폰트 추가는 금지입니다.

### 반응형 디자인
구현 금지. 데스크탑 1280px 기준 고정으로 개발하세요.

### 다크모드
구현 금지. 라이트모드 고정으로 개발하세요.

### 애니메이션
툴팁 외에는 불필요한 애니메이션을 추가하지 마세요.

---

## 7. 보안 규칙

### API Key 노출 방지
브라우저 응답(HTML, JS)에 노션 API Key를 포함하지 마세요.

### CORS 설정
localhost 전용이므로 별도 CORS 설정이 불필요합니다.

### 입력값 검증
Phase 1은 사용자 입력이 없으므로 검증이 불필요합니다.

### 에러 메시지 처리
내부 에러의 상세 내용을 브라우저에 노출하지 마세요.

---

## 8. Phase 1 완료 기준 체크리스트

개발 완료 후 아래 항목을 직접 확인하세요.

```markdown
[ ] python app.py 실행 시 에러 없이 서버 시작됨
[ ] http://localhost:8000 접속 시 화면 정상 표시
[ ] 사이드바 메뉴 6개 정상 표시 (예정 뱃지 2개 포함)
[ ] KPI 박스 4개 — 수치 정확히 표시
[ ] 테이블 — 노션 데이터 6건 정상 표시
[ ] 테이블 — 상태 배지 색상 올바름 (운영중/신규/종료)
[ ] 사업명 마우스오버 — 툴팁 팝업 정상 동작
[ ] 새로고침 버튼 — 클릭 시 최신 데이터 반영
[ ] 새로고침 중 — 버튼 비활성화 및 "로딩 중..." 표시
[ ] 노션 API 오류 시 — 에러 메시지 표시 (서버 죽지 않음)
[ ] .env 파일 없을 때 — 명확한 안내 메시지 출력
```

---

## 9. 다음 Phase 작업 가이드

### Phase 2 작업 시
- `app.py`에 `/api/weekly` 엔드포인트 추가만 할 것
- `index.html`에 PM 주간회의 탭 콘텐츠 추가만 할 것
- 기존 세종사업현황 탭 코드를 건드리지 말 것

### Phase 3, 4 작업 시
동일한 방식으로 기존 파일에 ADD 방식으로만 추가하세요.

---

## 10. 모드별 가이드라인

### Architect 모드
- 시스템 아키텍처 설계 시 단일 FastAPI 서버 구조 유지
- 새로운 Phase 기획 시 기존 파일 구조 변경 최소화
- 노션 API 통합 방안 설계 시 읽기 전용 원칙 준수

### Code 모드
- 코드 작성 시 모든 규칙(R-01 ~ R-20) 준수
- 함수 작성 시 docstring/주석 필수 포함
- API 오류 처리와 빈값 처리 잊지 않기

### Ask 모드
- 사용자 질문 응답 시 본 규칙 참조
- 코드 예시 제공 시 스타일 가이드라인 준수
- 기술적 결정 시 본 규칙 우선

---

## 참고 문서

- `docs/PRD.md` - 제품 요구사항
- `docs/UI.md` - UI 가이드라인
- `docs/STRUCTURE.md` - 프로젝트 구조
- `docs/LOGIC.md` - 비즈니스 로직
- `docs/AX_Sejong_Command_개발가이드.md` - 전체 개발 가이드

---

*마지막 수정: 2026.05.10 | AX Sejong Command Phase 1*
