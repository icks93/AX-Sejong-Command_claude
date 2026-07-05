# PRD_LOGIC_Phase5_세종사업히스토리_v2.3.md
> 작성: 익스 + Claude | 2026.06.21
> 수정: 2026.06.21 v2.3 — 최상단 KPI 타일 5개 + 캐시카우 강조 배너 신규 추가, 컬러풀 토글 추가

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|---------|
| v1~v2.2 | ~2026.06.17 | (생략, 기존 문서 참고) |
| **v2.3** | **2026.06.21** | **최상단 KPI 타일 5개 + 캐시카우 강조 배너 신규 추가, 컬러풀 모드 토글 추가** |

선행 자료: `mockup_세종사업히스토리_KPI.html` (UI 레퍼런스, 기존 화면과 동일한 라이트 테마 사용)

---

## 1. 개요

기존 "연도별 사업 현황 요약" 표/그래프 위쪽에, 선택된 연도(기본값: 최신연도) 기준 핵심 지표를 KPI 타일 5개 + 강조 배너 1개로 보여준다. v1.0(손익현황 Phase 11)에서 만든 KPI 타일 패턴과 톤을 맞춘다.

---

## 2. 신규 UI 구성

```
┌─ 세종사업히스토리                                   🎨 컬러풀 ON ─┐
├────────────────────────────────────────────────────────────────────┤
│ [수행조직대비 14.3%][매출 50.6억][전년대비 ▲12.4%][매출이익률 16.2%][전년대비 ▼0.5%p] │
├────────────────────────────────────────────────────────────────────┤
│ 🐄 CASH COW   42.5억                                               │
│    2026년 운영매출 — 역대 최고, 최초 40억 돌파                       │
│    (직전 최고 2024년 37.5억 대비 +5.0억)                            │
│    "안정적인 운영매출이 꾸준히 늘며 세종의 핵심 수익 기반이          │
│     더 단단해지고 있습니다."                                       │
├────────────────────────────────────────────────────────────────────┤
│  (기존 그래프 + 연도별 사업 현황 요약 표, 변경 없음)                  │
└────────────────────────────────────────────────────────────────────┘
```

타일 5개는 **선택된 연도 기준**으로 표시되며, 연도 탭(전체/2026년/2025년/…)을 바꾸면 KPI도 같이 갱신된다. "전체" 탭 선택 시에는 최신연도(2026년) 기준으로 고정 표시.

---

## 3. KPI 계산 정의

| # | 타일 | 계산 |
|---|------|------|
| 1 | 수행조직대비 매출 비중 | `세종_매출[선택연도] ÷ 수행조직_매출[선택연도] × 100` — **타 DB 참조 필요, 3-1절 참고** |
| 2 | 매출 | `summary_rows[선택연도].revenue` (기존 계산값, 단위 변환만) |
| 3 | 전년대비 매출 | 기존 `formatYoY()` 로직 그대로 재사용 (이미 구현됨) |
| 4 | 매출이익률 | `calc_year_total().gross_rate` (기존 계산값) |
| 5 | 전년대비 매출이익률(%p) | **신규 계산** — `gross_rate[선택연도] − gross_rate[선택연도-1]` (소수1자리, %p 단위) |

| 배너 | 계산 |
|---|---|
| 운영매출(캐시카우) | `build_chart_data()`의 `ops` 값 (기존 계산값) |
| 역대 최고 여부 | `ops[선택연도] == max(ops[2020..선택연도])` |
| 직전 최고 | `max(ops[연도 < 선택연도])`, 그 연도 라벨도 같이 표시 |
| 증가분 | `ops[선택연도] − 직전최고` |

### 3-1. 수행조직대비 비중 — 타 DB 참조 (중요)

"수행조직_매출"은 이 화면의 DB(`[AX]세종사업히스토리_v2`)에는 없는 값이다. Phase 11(손익현황)에서 만든 **`[AX]세종손익현황_연도별`** DB의 `수행조직_매출` 컬럼에 있다.

**권장 방식**: 새 Notion 호출을 또 만들지 말고, Phase 11에서 이미 만든 `/api/profit-loss` 엔드포인트를 백엔드 내부에서 재사용(같은 서버 안에서 함수 호출 또는 캐시 공유)해서 선택연도의 `수행조직_매출` 값을 가져온다. 프론트에서 별도 API를 추가로 호출해도 되지만, 가능하면 `/api/history` 응답에 이 값을 포함시켜 한 번의 응답으로 끝내는 것을 권장.

별도 API 호출이 부담되면 **차선책**: 연도별 수행조직_매출 값을 상수 테이블로 백엔드에 하드코딩(연 1회 수동 갱신) — 다만 손익현황 데이터가 바뀔 때 여기도 같이 바꿔야 하는 걸 잊기 쉬우므로 권장하지 않음.

---

## 4. 신규 데이터 (참고용, 2026년 기준 실제 값)

```
세종_매출(2026)        = 50.6억
수행조직_매출(2026)     = 354.6억   ← [AX]세종손익현황_연도별 DB
수행조직대비 비중        = 50.6 / 354.6 × 100 = 14.3%

매출이익률(2026)        = 16.2%
매출이익률(2025)        = 16.7%
전년대비 매출이익률(%p)  = 16.2 − 16.7 = −0.5%p

운영매출 연도별: 2020=7.9, 2021=22.2, 2022=30.8, 2023=32.5,
                2024=37.5, 2025=29.0, 2026=42.5
→ 2026년이 역대 최고(직전 최고 2024년 37.5억), 최초 40억 돌파, 증가분 +5.0억
```

---

## 5. 렌더링 로직 추가 (main.js)

```javascript
// 전년대비 매출이익률(%p) 포맷 — v2.3 신규
function formatMarginYoY(curr, prev) {
    if (curr === null || prev === null || prev === undefined) return "—";
    const diff = (curr - prev);
    const isUp = diff >= 0;
    const arrow = isUp ? "▲" : "▼";
    const colorClass = isUp ? "yoy-up" : "yoy-down";
    return `<span class="${colorClass}">${arrow}${Math.abs(diff).toFixed(1)}%p</span>`;
}

// 캐시카우(역대 최고 운영매출) 판별 — v2.3 신규
function getCashCowInfo(opsByYear, selectedYear) {
    // opsByYear: {연도: 운영매출(억원)} 형태
    const years = Object.keys(opsByYear).map(Number).sort();
    const priorYears = years.filter(y => y < selectedYear);
    const priorMax = priorYears.length ? Math.max(...priorYears.map(y => opsByYear[y])) : null;
    const priorMaxYear = priorYears.find(y => opsByYear[y] === priorMax);
    const current = opsByYear[selectedYear];
    const isRecord = priorMax === null || current > priorMax;
    return { isRecord, current, priorMax, priorMaxYear, diff: priorMax !== null ? current - priorMax : null };
}

// KPI 타일 렌더링 — v2.3 신규
function renderKpiTiles(selectedYear, summaryRows, marginByYear, shareRatio) {
    const idx = summaryRows.findIndex(s => s.year === String(selectedYear));
    const curr = summaryRows[idx];
    const prevMargin = idx > 0 ? marginByYear[summaryRows[idx-1].year] : null;

    document.getElementById('kpiShare').textContent = shareRatio.toFixed(1) + '%';
    document.getElementById('kpiRevenue').textContent = (curr.revenue/1e8).toFixed(1) + '억';
    document.getElementById('kpiRevenueYoy').innerHTML = formatYoY(curr.yoy_amount, curr.yoy_rate);
    document.getElementById('kpiMargin').textContent = marginByYear[selectedYear].toFixed(1) + '%';
    document.getElementById('kpiMarginYoy').innerHTML = formatMarginYoY(marginByYear[selectedYear], prevMargin);
}
```

> 위 함수들은 로직 골격이며, 실제 변수명/데이터 구조는 기존 `app.py`·`main.js`의 변수명에 맞춰 조정할 것. 기존 `summary_rows`, `calc_year_total()` 등의 함수가 이미 비슷한 데이터를 들고 있으므로, **새 API를 만들기보다 기존 응답에 필드 추가하는 방식**을 권장.

---

## 6. HTML 추가 (index.html)

```html
<div class="kpi-row">
  <div class="kpi-tile share"><div class="kpi-cap">수행조직 대비 매출 비중</div><div class="kpi-val" id="kpiShare">—</div></div>
  <div class="kpi-tile rev"><div class="kpi-cap">매출</div><div class="kpi-val" id="kpiRevenue">—</div></div>
  <div class="kpi-tile rev"><div class="kpi-cap">전년대비 매출</div><div class="kpi-val" id="kpiRevenueYoy">—</div></div>
  <div class="kpi-tile margin"><div class="kpi-cap">매출이익률</div><div class="kpi-val" id="kpiMargin">—</div></div>
  <div class="kpi-tile margin"><div class="kpi-cap">전년대비 매출이익률</div><div class="kpi-val" id="kpiMarginYoy">—</div></div>
</div>

<div class="cashcow" id="cashCowBanner">
  <div class="cashcow-icon">🐄</div>
  <div>
    <div class="cashcow-tag">CASH COW</div>
    <div class="cashcow-num" id="cashCowNum">—</div>
    <div class="cashcow-cap" id="cashCowCap"></div>
    <div class="cashcow-text">안정적인 운영매출이 꾸준히 늘며, 세종개발본부의 핵심 수익 기반이 더 단단해지고 있습니다.</div>
  </div>
</div>

<button id="colorfulToggle" class="toggle active">🎨 컬러풀 ON</button>
```

캐시카우 배너는 `isRecord === false`인 연도를 선택했을 때는 숨기거나(`display:none`) "역대 최고 아님" 문구로 대체할지 결정 필요 — **1차 구현은 isRecord가 false면 배너 자체를 숨기는 것을 권장** (강조할 게 없는 해에 억지로 보여줄 필요 없음).

---

## 7. CSS 추가 (style.css)

`mockup_세종사업히스토리_KPI.html`의 `<style>` 블록 중 `.kpi-row`, `.kpi-tile`, `.cashcow`, `.toggle` 관련 클래스를 기존 `style.css`의 색상 변수(네이비/레드/블루 등 기존 차트 색상)에 맞춰 그대로 이식. 컬러풀 토글은 `body.colorful` 클래스 유무로 on/off (Phase 11과 동일한 패턴) — **이 구조를 그대로 유지할 것** (코드 수정 없이 디자인 원복 가능하게 하는 목적).

```css
.kpi-row{display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:18px;}
.kpi-tile{background:#fff; border:1px solid #E6E8EC; border-radius:12px; padding:16px 16px 14px;}
.kpi-val.up{color:#2B6CB0;} .kpi-val.down{color:#C53030;}
body.colorful .kpi-tile.share{background:linear-gradient(160deg, rgba(99,102,241,.10), #fff); border-color:rgba(99,102,241,.35);}
body.colorful .kpi-tile.share .kpi-val{color:#6366F1;}
body.colorful .kpi-tile.rev{background:linear-gradient(160deg, rgba(43,108,176,.10), #fff); border-color:rgba(43,108,176,.35);}
body.colorful .kpi-tile.margin{background:linear-gradient(160deg, rgba(13,148,136,.10), #fff); border-color:rgba(13,148,136,.35);}
.cashcow{border-radius:14px; padding:22px 26px; display:flex; align-items:center; gap:22px; background:#fff; border:1px solid #E6E8EC;}
body.colorful .cashcow{background:linear-gradient(120deg, rgba(214,158,46,.14), rgba(214,158,46,.03)); border-color:rgba(214,158,46,.45);}
```

---

## 8. 클로드 코드 프롬프트

```
현재 app.py, templates/index.html, static/main.js, static/style.css 파일 읽고
Phase 5 세종사업히스토리 탭을 v2.3으로 업데이트해줘.

docs/PRD_LOGIC_Phase5_세종사업히스토리_v2.3.md 와
mockup_세종사업히스토리_KPI.html 참고.

변경 내용 (v2.2 → v2.3, 반드시 모두 적용):

1. 최상단 KPI 타일 5개 추가
   - 수행조직대비 매출 비중 / 매출 / 전년대비 매출 / 매출이익률 / 전년대비 매출이익률(%p)
   - 선택된 연도 탭(전체=최신연도 기준)에 따라 값 갱신
   - "수행조직대비 매출 비중"은 [AX]세종손익현황_연도별 DB(Phase 11에서 생성)의
     수행조직_매출 값이 필요함. 가능하면 새 API 호출 없이 백엔드에서
     해당 DB를 함께 조회해서 /api/history 응답에 필드 추가하는 방식으로 구현
     (PRD 3-1절 참고, 별도 호출이 부담되면 본인 판단으로 차선책 적용 가능하나
     반드시 먼저 알려줄 것)

2. 캐시카우 강조 배너 추가
   - 선택 연도의 운영매출(build_chart_data().ops)이 그 이전 연도들 중
     최고치를 넘었을 때만 표시
   - "역대 최고, 직전 최고 OOOO년 XX.X억 대비 +X.X억" 형식
   - 최고치가 아닌 연도 선택 시 배너 숨김

3. 컬러풀 모드 토글 추가
   - body.colorful 클래스 유무로 KPI 타일/배너 색상 on/off
   - 토글 버튼 클릭 시 클래스만 토글, 별도 API 호출 없음

4. formatMarginYoY() 함수 신규 추가 (PRD 5절 참고)
   - 매출이익률 전년대비(%p) 계산 및 색상(yoy-up/yoy-down 재사용)

반드시 지켜야 할 것:
- Phase 1~4, 6~9 코드 절대 건드리지 마
- 기존 그래프/표/연도 탭 동작 변경 금지 (KPI·배너만 추가)
- CACHE_TTL, NOTION_TOKEN 기존 상수 재사용
- 한국어 주석 포함
- 타 DB([AX]세종손익현황_연도별) 조회 방식을 직접 결정하기 애매하면
  구현 전에 먼저 질문할 것
```

---

## 9. 아테나 코드 프롬프트

```
@app.py @templates/index.html @static/main.js @static/style.css
@docs/PRD_LOGIC_Phase5_세종사업히스토리_v2.3.md
@mockup_세종사업히스토리_KPI.html

Phase 5 세종사업히스토리 탭을 v2.3으로 업데이트해줘.

변경 내용:
1. KPI 타일 5개 (수행조직대비 비중/매출/전년대비매출/매출이익률/전년대비매출이익률)
   - 수행조직대비 비중은 [AX]세종손익현황_연도별 DB의 수행조직_매출 필요
     (Phase 11에서 생성한 DB, 가능하면 /api/history 응답에 필드 추가로 해결)
2. 캐시카우 배너 (역대 최고 운영매출일 때만 표시, PRD 6절 조건 참고)
3. 컬러풀 토글 (body.colorful 클래스, Phase 11과 동일 패턴)
4. formatMarginYoY() 함수 추가

반드시 지켜야 할 것:
- Phase 1~4, 6~9 코드 절대 건드리지 마
- 기존 그래프/표/연도탭 동작 변경 금지
- 한국어 주석 포함
- 타 DB 조회 방식 애매하면 먼저 질문
```

---

## 10. 작업 순서

```
① mockup_세종사업히스토리_KPI.html 브라우저로 확인 (이미 완료)
② [AX]세종손익현황_연도별 DB 접근 방식 결정 (API 응답 필드 추가 vs 별도 호출)
③ Claude Code 또는 아테나 코드로 위 프롬프트 실행
④ 검증:
   - 연도 탭 전환 시 KPI 5개가 같이 갱신되는지
   - 캐시카우 배너가 역대 최고가 아닌 연도(예: 2025년)에서는 숨겨지는지
   - 컬러풀 토글 동작 확인
   - 수행조직대비 비중 숫자가 손익현황 탭과 일치하는지 (14.3%)
```

---

*작성: 익스 + Claude | 2026.06.21 v2.3 | AX Sejong Command Phase 5*
