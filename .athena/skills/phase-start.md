# 새 Phase 시작 스킬

## 설명

새로운 Phase 작업을 시작할 때 사용합니다. 구현 계획을 세우고 준비합니다.

---

## 작업 단계

### 1. 관련 문서 읽기

- [`docs/PRD.md`](docs/PRD.md:1)
- [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md:1)
- [`_template/base.html`](_template/base.html:1)

### 2. Phase 작업 계획

Phase [N] 작업을 시작합니다.

#### 이번 Phase에서 추가할 것

**탭**
- 탭명: [탭명]
- ID: `tab-[탭ID]`

**API**
- 엔드포인트: `GET /api/[엔드포인트]`

**노션 DB**
- DB 이름: [DB 이름]
- DB ID: [DB ID]

### 3. 구현 계획 작성

Architect 모드로 구현 계획을 Todo List로 작성합니다.

---

## 주의사항

- ❌ **기존 Phase 1 코드는 건드리지 마세요**
- ✅ **새로운 Phase는 기존 파일에 ADD 방식으로만 추가하세요**

---

## 완료 기준

- [ ] Phase 작업 계획이 작성됨
- [ ] Todo List가 생성됨
- [ ] 추가할 기능 목록이 명확함
- [ ] 기존 Phase 코드 보호 계획이 수립됨

---

## 참고

- Phase 영역 주석을 확인하고 작업 중인 영역만 수정하세요.
- 필드명 변경은 절대 하지 마세요.
