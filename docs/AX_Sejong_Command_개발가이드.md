# AX Sejong Command — VSCode + 아테나 코드 개발 가이드
> 작성: 익스 + Claude | 2026.05.10  
> 아테나 코드 v1.0 사용자 메뉴얼 기반

---

## 전체 흐름

```
[클로드에서]                         [VSCode + 아테나 코드에서]
설계 문서 5개 완성         →         Rules 등록 → 설계 확인 → 코드 생성 → 수정 반복
  docs/PRD.md                          ↓
  docs/STRUCTURE.md             0단계: /create-rules (Rules 등록)
  docs/UI.md                           ↓
  docs/LOGIC.md                 1단계: Architect 모드 (설계 검토)
  docs/RULES.md                        ↓
                                2단계: Code 모드 (코드 생성)
                                         ↓
                                3단계: 브라우저 동작 확인
                                         ↓
                                4단계: 수정 반복 → 완성
```

---

## 사전 준비 — 폴더 구조 만들기

VSCode 열기 전에 탐색기에서 폴더를 먼저 만듭니다.

```
C:\Users\icks\ICKS93\31.세종업무자동화\AX-Sejong-Command\
└── docs\
    ├── PRD.md
    ├── STRUCTURE.md
    ├── UI.md
    ├── LOGIC.md
    ├── RULES.md
    └── AX_Sejong_Command_개발가이드.md
```

VSCode 실행 → `파일 > 폴더 열기` → `AX-Sejong-Command` 폴더 선택

---

## 0단계 — Rules 등록 (처음 한 번만)

Rules를 등록해두면 매 세션마다 규칙을 붙여넣지 않아도 자동 적용됩니다.

**방법:**
```
아테나 코드 채팅창에서 /create-rules 입력 → Enter
→ AI가 어떤 규칙을 만들지 물어봄
→ 아래 내용 붙여넣기
```

**붙여넣을 내용:**
```
@docs/RULES.md 파일을 읽고 Rules를 생성해줘.
모든 모드에 적용하고, 하나의 통합 파일로 만들어줘.
파일명은 ax-sejong-rules.md 로 해줘.
```

> 이후 모든 세션에서 RULES.md의 규칙이 자동으로 적용됩니다.

---

## 1단계 — Architect 모드로 설계 검토

모드를 **Architect**로 변경 후 입력합니다.

> Architect 모드: 계획만 수립. MD 파일만 만들고 코드는 생성하지 않음.  
> 설계 문서를 제대로 이해했는지 먼저 확인하는 단계.

```
@docs/PRD.md @docs/STRUCTURE.md @docs/UI.md @docs/LOGIC.md

위 설계 문서를 읽고 Phase 1 구현 계획을 세워줘.
만들어야 할 파일 목록과 각 파일의 역할을 정리하고,
작업 순서를 todo list로 만들어줘.
```

**확인할 것:**
- 만들 파일 목록이 STRUCTURE.md와 일치하는지
- 작업 순서가 논리적인지
- 이상한 내용이 없는지

문제 없으면 2단계로 진행합니다.

---

## 2단계 — Code 모드로 코드 생성

모드를 **Code**로 변경 후 입력합니다.

> Code 모드: 실제 코드 작성 및 파일 생성. 모든 파일 수정 가능.

```
@docs/PRD.md @docs/STRUCTURE.md @docs/UI.md @docs/LOGIC.md

1단계 계획대로 Phase 1 코드를 생성해줘.

생성할 파일:
- app.py
- templates/index.html
- static/style.css
- static/main.js
- .env.example
- requirements.txt

한국어 주석 포함. 파일을 직접 생성해줘.
```

> RULES.md는 0단계에서 이미 Rules로 등록했으니 프롬프트에 포함하지 않아도 됩니다.

---

## 3단계 — 처음 실행하기

파일 생성 확인 후 VSCode 터미널을 열고 (`Ctrl + ~`) 순서대로 입력합니다.

```bash
# 1. 필요한 패키지 설치 (처음 한 번만)
pip install -r requirements.txt

# 2. .env 파일 만들기
copy .env.example .env

# 3. .env 파일 열어서 노션 API 키 직접 입력
# NOTION_API_KEY=여기에_키_입력

# 4. 서버 실행
python app.py
```

브라우저에서 `http://localhost:8000` 접속하면 화면이 나옵니다.

---

## 4단계 — 수정할 때 프롬프트 패턴

`@파일명` 으로 범위를 한정하는 것이 핵심입니다.  
파일 지정 없이 수정 요청하면 관련 없는 파일까지 건드릴 수 있어요.

**특정 함수 수정 시**
```
@static/main.js

renderKPI 함수에서 운영중 카운트가
신규 사업을 포함하지 않아.
LOGIC.md 기준으로 수정해줘.
다른 함수는 건드리지 마.
```

**화면(UI) 수정 시**
```
@templates/index.html @static/style.css

KPI 박스 배경색을 조금 더 연하게 바꿔줘.
레이아웃은 건드리지 마.
```

**기능 추가 시**
```
@app.py @docs/LOGIC.md

app.py에 /api/projects 엔드포인트가 없어.
LOGIC.md 5번 항목 기준으로 추가해줘.
기존 코드 구조는 유지해줘.
```

**에러 해결 시**
```
@app.py

아래 에러가 나. 고쳐줘.

[터미널 에러 메시지 전체 복사 붙여넣기]
```

**코드 설명이 필요할 때** — Ask 모드로 전환 후
```
/explain app.py
```

**코드 개선 제안이 필요할 때**
```
/improve @static/main.js
```

---

## 아테나 코드 모드 정리

| 모드 | 용도 | 파일 수정 | 모드 전환 |
|------|------|---------|---------|
| **Architect** | 설계 검토, 계획 수립, todo list 작성 | MD 파일만 | `Ctrl + .` |
| **Code** | 실제 코드 작성, 파일 생성, 버그 수정 | 모든 파일 | `Ctrl + .` |
| **Ask** | 코드 설명, 개념 질문, 분석 | 불가 (읽기만) | `Ctrl + .` |

---

## @ 멘션 활용 정리

| 멘션 | 용도 | 사용 예시 |
|------|------|---------|
| `@docs/파일명.md` | 설계 문서 참조 | `@docs/LOGIC.md` |
| `@Add File` | 특정 파일 컨텍스트 추가 | 수정할 파일 지정 |
| `@Add Folder` | 폴더 전체 컨텍스트 추가 | `@docs` 폴더 전체 |
| `@Problems` | VSCode 오류 목록 참조 | 에러 일괄 해결 시 |
| `@Terminal` | 터미널 출력 참조 | 실행 오류 해결 시 |

---

## 핵심 팁

**① Rules 등록을 꼭 먼저 하기**
0단계 `/create-rules` 를 건너뛰면 매번 규칙을 프롬프트에 넣어야 해요.
한 번만 등록하면 모든 세션에서 자동 적용됩니다.

**② Architect → Code 순서 지키기**
바로 Code 모드로 가지 말고 Architect 모드로 계획 먼저 확인.
계획이 잘못되면 코드도 잘못 나옵니다.

**③ 수정 시 반드시 `@파일명` 으로 범위 한정**
파일 지정 없이 수정 요청하면 관련 없는 파일까지 건드릴 수 있어요.

**④ 잘 됐을 때 바로 체크포인트 생성**
아테나 코드 체크포인트 기능으로 동작하는 상태를 저장해두면
다음 수정에서 망가졌을 때 되돌릴 수 있어요.

---

## 막혔을 때 대처법

| 상황 | 해결 방법 |
|------|---------|
| 아테나 코드가 이상한 걸 만들었을 때 | 체크포인트로 되돌리고 → 클로드에게 프롬프트 개선 요청 |
| 아테나 코드 응답이 멈췄을 때 | 새 채팅 세션 시작 + `@docs` 폴더 다시 참조 |
| 에러 메시지가 났을 때 | `@Problems` 또는 에러 전체 복사 → 붙여넣기 |
| 코드가 뭘 하는지 모를 때 | Ask 모드에서 `/explain @파일명` |
| 전체가 너무 망가졌을 때 | 체크포인트 복원 또는 클로드에게 재설계 요청 |

---

## Phase별 개발 순서 참고

```
Phase 1 — 세종사업현황 탭 (현재)
  0단계: /create-rules 등록 (한 번만)
  1단계: Architect 모드 → 계획 확인
  2단계: Code 모드 → 파일 6개 생성
  3단계: 브라우저 동작 확인
  4단계: 수정 반복 → 완성 → 체크포인트 저장

Phase 2 — PM 주간회의 탭
  @app.py @templates/index.html 참조
  기존 파일에 기능 추가(ADD)

Phase 3, 4도 동일한 패턴 반복
```

---

*작성: 익스 + Claude | 2026.05.10 | 아테나 코드 v1.0 메뉴얼 기반 업데이트*
