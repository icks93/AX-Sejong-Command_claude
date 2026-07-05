# UI 개선 초안
> 작성: 2026.05.10
> Phase 1 UI 개선 방안

---

## 1. 테이블 행 높이 최적화

### 현재 문제
- 테이블 행 높이가 너무 높아 레이아웃이 깨져 있음
- 각 행이 한 줄로 깔끔게 표시되지 않음

### 개선 방안

#### 1.1 테이블 행 높이 줄이기
```css
.projects-table td {
    padding: 6px 12px;  /* 10px → 6px로 감소 */
}
```

#### 1.2 테이블 행 헤더 추가
```css
.projects-table thead th {
    border-top: 1px solid #E5E7EB;  /* 헤더 구분선 추가 */
}
```

#### 1.3 테이블 호버 효과 개선
```css
.projects-table tbody tr {
    transition: background-color 0.2s;  /* 부드러운 호버 효과 */
}
```

---

## 2. 로딩 스피너 추가

### 현재 문제
- 데이터 로딩 중에 로딩 스피너가 없음
- 사용자가 로딩 상태를 알 수 없음

### 개선 방안

#### 2.1 로딩 스피너 생성
```javascript
// loadProjects() 함수 시작 부분에 추가
document.getElementById("projects-tbody").innerHTML = `
    <tr>
        <td colspan="6" class="loading-cell">
            <div class="loading-spinner"></div>
            <span>데이터를 불러오는 중...</span>
        </td>
    </tr>
`;
```

#### 2.2 로딩 스피너 CSS
```css
.loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #E5E7EB;
    border-top: 2px solid #E5E7EB;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
}

.loading-cell {
    display: flex;
    align-items: center;
    justify-content: center;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

---

## 3. 테이블 헤더 개선

### 현재 문제
- 테이블 헤더 스타일이 단순함
- 컬럼 정렬이 명확하지 않음

### 개선 방안

#### 3.1 컬럼 정렬 개선
```css
.projects-table th {
    text-align: left;
    font-weight: 500;
}

.projects-table th.col-name { text-align: left; }
.projects-table th.col-client { text-align: left; }
.projects-table th.col-pm { text-align: left; }
.projects-table th.col-revenue { text-align: left; }
.projects-table th.col-period { text-align: left; }
.projects-table th.col-status { text-align: center; }
```

#### 3.2 컬럼 너비 개선
```css
.projects-table th.col-name { width: 32%; }
.projects-table th.col-client { width: 16%; }
.projects-table th.col-pm { width: 10%; }
.projects-table th.col-revenue { width: 14%; }
.projects-table th.col-period { width: 16%; }
.projects-table th.col-status { width: 12%; }
```

---

## 4. 사이드바 개선

### 현재 문제
- 사이드바 메뉴 스타일이 단순함
- 비활성 메뉴의 호버 효과가 미약함

### 개선 방안

#### 4.1 메뉴 호버 효과 개선
```css
.menu-item {
    transition: all 0.3s ease;  /* 기존 0.2s → 0.3s ease로 개선 */
}

.menu-item:hover {
    background-color: rgba(255, 255, 255, 0.08);  /* 기존 0.06 → 0.08로 개선 */
    transform: translateX(2px);  /* 미세한 우측 이동 효과 */
}
```

#### 4.2 하단 사용자 정보 개선
```css
.sidebar-footer {
    padding: 16px;  /* 기존 16px 유지 */
}

.user-info {
    gap: 12px;  /* 아바타와 이름 사이 간격 추가 */
}

.user-name {
    font-size: 11px;  /* 기존 12px → 11px로 미세 조정 */
    line-height: 1.3;  /* 줄간격 개선 */
}
```

---

## 5. KPI 박스 개선

### 현재 문제
- KPI 박스 간격이 일정하지 않음
- 숫자 폰트가 단순함

### 개선 방안

#### 5.1 KPI 박스 레이아웃 개선
```css
.kpi-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;  /* 상하단 여백 개선 */
    min-height: 80px;  /* 최소 높이 보장 */
}
```

#### 5.2 KPI 숫자 폰트 개선
```css
.kpi-value {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-feature-settings: "tnum";  /* 탭넘 숫자 폰트 사용 */
    letter-spacing: -0.5px;  /* 숫자 간격 조정 */
}
```

---

## 6. 상단 바 개선

### 현재 문제
- 상단 바 배경이 단조로움
- 새로고침 버튼 스타일이 단순함

### 개선 방안

#### 6.1 상단 바 배경 그라디언트 추가
```css
.topbar {
    background: linear-gradient(to right, #FFFFFF 0%, #F8FAFC 100%);  /* 미세한 그라디언트 */
}
```

#### 6.2 새로고침 버튼 개선
```css
.btn-refresh {
    gap: 8px;  /* 아이콘과 텍스트 간격 (기존 6px) */
    padding: 6px 12px;  /* 여백 조정 */
    font-weight: 500;  /* 폰트 굵게 */
}

.btn-refresh:hover {
    background-color: #EAF3DE;  /* 더 명확한 호버 색상 */
    transform: translateY(-1px);  /* 미세한 위로 이동 효과 */
}
```

---

## 7. 색상 시스템 개선

### 현재 문제
- 배지 색상 대비가 부족함
- 대비용 다크모드 스타일이 없음

### 개선 방안

#### 7.1 배지 색상 그라디언트 추가
```css
.badge {
    background: linear-gradient(135deg, #EAF3DE 0%, #D9E876 100%);
    box-shadow: 0 1px 2px rgba(229, 190, 94, 0.1);  /* 미세한 그림자 효과 */
}
```

#### 7.2 다크모드 대비
```css
/* 미래 대비: 다크모드 CSS 변수 */
:root {
    --bg-primary: #1E3A5F;
    --bg-secondary: #F4F6F9;
    --text-primary: #0F172A;
    --text-secondary: #475569;
}

/* 라이트모드 (현재) */
body.light-mode {
    --bg-primary: #1E3A5F;
    --bg-secondary: #F4F6F9;
    --text-primary: #0F172A;
    --text-secondary: #475569;
}
```

---

## 8. 반응형 기반 준비 (Phase 2 이후)

### 현재 문제
- 현재 데스크탑 전용으로 개발됨

### 개선 방안

#### 8.1 모바일 반응형 준비
```css
/* 미래 대비: 모바일 반응형 CSS */
@media (max-width: 768px) {
    .shell {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        position: relative;
        height: auto;
    }
    
    .main {
        width: 100%;
    }
    
    .kpi-grid {
        grid-template-columns: 1fr;
    }
    
    .table-wrap {
        overflow-x: auto;
    }
}
```

---

## 9. 애니메이션 개선

### 현재 문제
- 새로고침 버튼 클릭 시 애니메이션이 없음

### 개선 방안

#### 9.1 새로고침 버튼 애니메이션 추가
```css
@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.btn-refresh i {
    transition: transform 0.3s;
}

.btn-refresh:active i {
    transform: rotate(360deg);  /* 클릭 시 360도 회전 */
}
```

---

## 우선순위

1. **최우선** (즉시 개선 필요)
   - 1.1 테이블 행 높이 최적화
   - 2.1 로딩 스피너 추가

2. **우선순위 2** (개선 효과 큰 항목)
   - 3.1 테이블 헤더 개선
   - 4.1 사이드바 메뉴 호버 효과 개선
   - 6.1 상단 바 개선

3. **우선순위 3** (장기적 개선)
   - 5.1 KPI 박스 개선
   - 6.2 새로고침 버튼 개선
   - 7.1 색상 시스템 개선

4. **우선순위 4** (미래 대비)
   - 8.1 반응형 기반 준비
   - 9.1 애니메이션 개선

---

## 적용 방법

### 각 개선 항목별 적용

1. **테이블 행 높이 최적화**
   - [`static/style.css`](static/style.css:267) 수정: `.projects-table td`의 padding 조정
   - `.projects-table thead th`에 border-top 추가
   - `.projects-table tbody tr`에 transition 추가

2. **로딩 스피너 추가**
   - [`static/main.js`](static/main.js:163) 수정: `showError()` 함수 내용 변경
   - [`static/style.css`](static/style.css:371) 추가: `.loading-spinner`, `.loading-cell` 스타일

3. **테이블 헤더 개선**
   - [`static/style.css`](static/style.css:254) 수정: `.projects-table th`에 text-align 및 width 추가
   - `.col-name`, `.col-client` 등 각 컬럼에 너비 설정

4. **사이드바 개선**
   - [`static/style.css`](static/style.css:55) 수정: `.menu-item` 호버 효과 개선
   - [`static/style.css`](static/style.css:96) 수정: `.sidebar-footer`, `.user-info` 간격 개선

5. **KPI 박스 개선**
   - [`static/style.css`](static/style.css:188) 수정: `.kpi-card` 레이아웃 개선
   - [`static/style.css`](static/style.css:201) 수정: `.kpi-value` 폰트 개선

6. **상단 바 개선**
   - [`static/style.css`](static/style.css:127) 수정: `.topbar` 배경 그라디언트 추가
   - [`static/style.css`](static/style.css:152) 수정: `.btn-refresh` 스타일 개선

7. **색상 시스템 개선**
   - [`static/style.css`](static/style.css:342) 수정: `.badge` 그라디언트 추가
   - 다크모드 대비 CSS 변수 추가

8. **반응형 기반 준비**
   - 미래 대비: 모바일 반응형 CSS 추가
   - 데스크탑 최적화 유지

9. **애니메이션 개선**
   - 새로고침 버튼 아이콘 회전 애니메이션 추가

---

*작성: 2026.05.10 | UI 개선 초안 | Phase 1 완료 후 대비*