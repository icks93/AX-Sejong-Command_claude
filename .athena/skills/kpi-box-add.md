# KPI 박스 추가 스킬

## 설명

세종사업현황 탭에 새로운 KPI 박스를 추가합니다.

---

## 작업 단계

### 1. 관련 파일 읽기

- [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md:1)
- [`templates/index.html`](templates/index.html:1)
- [`static/main.js`](static/main.js:1)

### 2. KPI 박스 추가

세종사업현황 탭 KPI에 "[KPI명]" 박스를 추가합니다.

#### 추가 정보

- **색상**: `kpi-blue` / `kpi-green` / `kpi-red` / `kpi-amber`
- **ID**: `kpi-[xxx]`
- **계산 방법**: [계산 방법 설명]
- **위치**: 기존 KPI 박스 [앞 / 뒤]

### 3. 구현 규칙

**HTML (`index.html`)**
```html
<!-- KPI 박스 추가 -->
<div class="kpi-card kpi-[색상]" id="kpi-[id]">
  <div class="kpi-title">[KPI명]</div>
  <div class="kpi-value">0</div>
</div>
```

**JavaScript (`main.js`)**
```javascript
// KPI 업데이트 함수에 추가
function updateKPIs(data) {
  // [계산 방법 설명]
  const [변수명] = data.filter(...).reduce(...);
  
  // KPI 값 업데이트
  document.getElementById('kpi-[id]').textContent = [계산결과];
}
```

---

## 완료 기준

- [ ] HTML에 KPI 박스가 추가됨
- [ ] JavaScript에 계산 로직이 추가됨
- [ ] KPI 값이 올바르게 표시됨
- [ ] 색상이 올바르게 적용됨
- [ ] 위치가 올바름

---

## 참고

- 색상 클래스: `kpi-blue` (파랑), `kpi-green` (초록), `kpi-red` (빨강), `kpi-amber` (주황)
- KPI 박스 스펙은 [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md:1)를 참고하세요.
