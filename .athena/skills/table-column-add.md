# 테이블 컬럼 추가 스킬

## 설명

테이블에 새로운 컬럼을 추가합니다.

---

## 작업 단계

### 1. 관련 파일 읽기

- [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md:1)
- [`static/main.js`](static/main.js:1)
- [`templates/index.html`](templates/index.html:1)

### 2. 컬럼 추가

`renderTable()` 함수와 테이블 구조에 "[컬럼명]" 컬럼을 추가합니다.

#### 추가 정보

- **위치**: [기준컬럼] 오른쪽
- **데이터 소스**: `project.[필드명]`
- **클래스**: `td-muted` / `td-money` / 없음
- **colgroup**: 너비도 같이 조정

### 3. 구현 규칙

**HTML (`index.html`)**
```html
<!-- colgroup에 추가 -->
<col width="[너비]">

<!-- 테이블 헤더에 추가 -->
<th>[컬럼명]</th>

<!-- 테이블 바디에 추가 (JavaScript에서 처리) -->
```

**JavaScript (`main.js`)**
```javascript
// renderTable 함수 내에서 컬럼 추가
const cell = document.createElement('td');
cell.textContent = project.[필드명] || '—';
cell.className = '[클래스명]'; // td-muted 또는 td-money
row.appendChild(cell);
```

---

## 주의사항

- ❌ **다른 함수는 건드리지 마세요**
- ✅ **renderTable() 함수만 수정하세요**
- ✅ **colgroup 너비를 같이 조정하세요**

---

## 완료 기준

- [ ] renderTable() 함수에 컬럼이 추가됨
- [ ] 테이블 헤더에 컬럼이 추가됨
- [ ] colgroup에 너비가 추가됨
- [ ] 데이터가 올바르게 표시됨
- [ ] 빈값이 "—"으로 표시됨
- [ ] 다른 함수는 변경되지 않음

---

## 참고

- 금액 컬럼은 `td-money` 클래스를 사용하세요.
- 보조 정보 컬럼은 `td-muted` 클래스를 사용하세요.
