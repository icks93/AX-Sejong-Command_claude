# 새 탭 콘텐츠 추가 스킬

## 설명

새로운 탭을 구현합니다. [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md:1)의 스펙을 따르며, [`style.css`](static/style.css:1)는 건드리지 않습니다.

---

## 작업 단계

### 1. 관련 파일 읽기

- [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md:1) - UI 컴포넌트 스펙
- [`templates/index.html`](templates/index.html:1)
- [`static/main.js`](static/main.js:1)

### 2. 탭 구현

[탭명] 탭(`id="tab-[탭ID]"`)을 구현합니다.

#### 화면 구성

**KPI 박스 [N]개**
- [KPI1명] (`id="kpi-[id]"`)
- [KPI2명]
- ...

**테이블**
- 컬럼: [컬럼1] / [컬럼2] / ...

**API**
- 엔드포인트: `GET /api/[엔드포인트명]`

### 3. 구현 규칙

- ✅ **UI_COMPONENTS.md 스펙 그대로 사용**
- ❌ **style.css는 건드리지 마세요**
- ✅ **기존 탭 코드는 보존하세요**

---

## 완료 기준

- [ ] 새 탭이 index.html에 추가됨
- [ ] 탭 클릭 시 정상적으로 전환됨
- [ ] KPI 박스가 올바르게 표시됨
- [ ] 테이블이 올바르게 표시됨
- [ ] API 엔드포인트가 연동됨
- [ ] style.css는 변경되지 않음

---

## 참고

- 기존 탭 코드는 삭제하지 말고 추가만 하세요.
- 새로운 API 엔드포인트는 [`api-endpoint-add.md`](.athena/skills/api-endpoint-add.md:1) 스킬을 참고하세요.
