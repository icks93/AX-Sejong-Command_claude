# PRD — 자동화 실행 탭 (AX Sejong Command)

| 항목 | 내용 |
|---|---|
| 작성일 | 2026-06-25 |
| 버전 | v1.0 (C단계 구현용) |
| 대상 | Claude Code / 아테나 코드 |
| 범위 | 1단계(C: 딥링크 바로가기)만 지금 구현. 2단계(B: API 자동실행)는 구조만 대비, 별도 PRD에서 진행 |

---

## 1. 목적

AX Sejong Command 사이드바에 그동안 비어있던 **"자동화 실행"** 탭을 채운다. 기존에 채팅으로 트리거하던 SKILL 4개(세미나브리핑/영업보고분석/리스크알람/주간보고서)를 웹앱에서 카드+버튼으로 바로 실행할 수 있게 한다.

**1단계(C, 이번 작업)**: 버튼 클릭 → 클립보드에 트리거 문구 복사 + claude.ai 새 탭 열기. 실제 분석/전송은 익스가 새 탭에서 Claude에게 직접 실행시킴. 자동화가 아니라 "바로가기".

**2단계(B, 향후)**: 버튼 클릭 → 웹앱 백엔드가 Claude API를 직접 호출해서 SKILL 로직을 실행, 결과를 화면에 보여주거나 슬랙/노션에 자동 반영. 이번 PRD에서는 **이 단계로 전환하기 쉽도록 구조만 잡아둔다.**

---

## 2. 1단계(C) 상세 사양

### 2.1 화면 구성

```
┌─ 자동화 실행 ──────────────────────────────────────────────┐
│  카드 4개 (2x2 또는 1열, 반응형)                              │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │ 🗓 세미나브리핑 │ │ 📊 영업보고분석 │                         │
│  │ AI·공공IT 행사 │ │ 영업보고 메일  │                         │
│  │ 수집→슬랙·노션 │ │ 분석→슬랙·노션 │                         │
│  │  [실행하기]   │ │  [실행하기]   │                         │
│  └──────────────┘ └──────────────┘                         │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │ 🚨 리스크알람  │ │ 📋 주간보고서  │                         │
│  │ 이슈 조기경보  │ │ PM 주간보고   │                         │
│  │  [실행하기]   │ │  [실행하기]   │                         │
│  └──────────────┘ └──────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

각 카드: 아이콘 + SKILL명 + 한 줄 설명 + [실행하기] 버튼.

### 2.2 [실행하기] 클릭 시 동작

**중요**: `claude.ai/new?q=...` 같은 URL 파라미터로 프롬프트를 자동 채우는 방식에 **의존하지 않는다.** 이 기능은 보안 이슈로 제거/제한된 것으로 보고되어 안정적으로 동작한다고 보장할 수 없음.

대신 **클립보드 복사 + 새 탭 열기** 방식으로 구현:

```javascript
async function runSkill(skillTrigger) {
  // skillTrigger 예: "리스크 분석해줘"
  await navigator.clipboard.writeText(skillTrigger);
  window.open('https://claude.ai/new', '_blank');
  showToast(`"${skillTrigger}" 클립보드에 복사했어요. 새 탭에서 Ctrl+V 후 Enter를 눌러주세요.`);
}
```

- 클립보드 복사 실패 시(브라우저 권한 등) 화면에 트리거 문구를 텍스트로 표시 + "복사" 버튼 제공 (폴백)
- 토스트/안내 메시지는 5초 정도 유지, 닫기 가능

### 2.3 4개 SKILL의 트리거 문구 매핑

| 카드 | 클립보드에 복사될 문구 | 비고 |
|---|---|---|
| 세미나브리핑 | `세미나 브리핑 해줘` | SKILL_세미나브리핑.md 기존 트리거 |
| 영업보고분석 | `영업보고 분석해줘` | SKILL_영업보고분석.md 기존 트리거 |
| 리스크알람 | `리스크 분석해줘` | SKILL_리스크알람.md 기존 트리거 |
| 주간보고서 | `주간보고서 만들어줘` | SKILL_주간보고서.md 기존 트리거 |

> 트리거 문구는 코드에 하드코딩하지 말고 별도 설정 객체(`automationSkills` 배열 등)로 분리할 것 — 2단계(B) 전환 시 이 설정 객체에 `endpoint`, `systemPrompt` 같은 필드만 추가하면 되도록.

### 2.4 카드 데이터 구조 (2단계 대비 설계)

```javascript
const automationSkills = [
  {
    id: "seminar",
    name: "세미나브리핑",
    icon: "🗓",
    description: "AI·공공IT 행사 수집 → 슬랙·노션 등록",
    triggerText: "세미나 브리핑 해줘",
    mode: "deeplink"   // 2단계 전환 시 "api"로 변경
  },
  {
    id: "sales",
    name: "영업보고분석",
    icon: "📊",
    description: "영업보고 메일 분석 → 슬랙·노션 등록",
    triggerText: "영업보고 분석해줘",
    mode: "deeplink"
  },
  {
    id: "risk",
    name: "리스크알람",
    icon: "🚨",
    description: "PM 이슈 조기경보 → 슬랙·노션 등록",
    triggerText: "리스크 분석해줘",
    mode: "deeplink"
  },
  {
    id: "weekly",
    name: "주간보고서",
    icon: "📋",
    description: "PM 주간보고 취합 → 노션 등록",
    triggerText: "주간보고서 만들어줘",
    mode: "deeplink"
  }
];
```

`mode` 필드 기준으로 클릭 핸들러 분기:
```javascript
function handleRunClick(skill) {
  if (skill.mode === "deeplink") {
    runSkillDeeplink(skill.triggerText);       // 2.2절 함수
  } else if (skill.mode === "api") {
    runSkillViaApi(skill.id);                  // 2단계(B)에서 구현, 지금은 비워둠
  }
}
```

이렇게 분기 구조만 만들어두면, 2단계 PRD에서는 `mode`를 "api"로 바꾸고 `runSkillViaApi()` 함수만 채우면 됨 — 카드 UI, 데이터 구조는 그대로 재사용.

### 2.5 제외 범위 (1단계에서는 하지 않음)

- Claude API 호출 없음
- 백엔드에 새 엔드포인트 추가 없음
- 실행 결과를 웹앱에 표시하는 기능 없음 (실행은 새로 열린 claude.ai 탭에서 익스가 직접 진행)
- 예약 실행(스케줄) 없음

---

## 3. 클로드 코드 프롬프트

```
AX Sejong Command 사이드바의 "자동화 실행" 탭을 구현해줘.
현재 사이드바 메뉴 아이템만 있고 탭 콘텐츠가 없는 상태야 (PRD §2.1 참고).

1. 탭에 카드 4개 추가 (세미나브리핑/영업보고분석/리스크알람/주간보고서)
   - 각 카드: 아이콘 + 이름 + 한 줄 설명 + [실행하기] 버튼
   - 데이터는 PRD §2.4의 automationSkills 배열 형태로 분리해서 관리 (하드코딩 금지)

2. [실행하기] 클릭 시:
   - navigator.clipboard.writeText()로 해당 skill의 triggerText를 클립보드에 복사
   - window.open('https://claude.ai/new', '_blank')로 새 탭 열기
   - "클립보드에 복사했어요. 새 탭에서 Ctrl+V 후 Enter를 눌러주세요" 토스트 표시
   - 클립보드 복사 실패 시 폴백: 트리거 문구를 화면에 텍스트로 보여주고 수동 복사 버튼 제공

3. mode 필드 기반 분기 구조로 구현 (PRD §2.4)
   - 지금은 전부 mode: "deeplink"
   - mode: "api"인 경우의 처리 함수(runSkillViaApi)는 빈 함수로 미리 만들어두되,
     실제 로직은 구현하지 마 (다음 PRD에서 채울 예정)

반드시 지켜야 할 것:
- Phase 1~11 기존 코드 건드리지 마
- claude.ai/new?q=... 같은 URL 파라미터로 프롬프트 자동 채우기 시도하지 마
  (보안 이슈로 제거/제한된 기능이라 신뢰할 수 없음 — PRD §2.2 참고)
- 한국어 주석 포함
```

---

## 4. 2단계(B) 예고 — 다음에 진행할 것 (이번엔 안 함)

- Claude API(console.anthropic.com 직접 가입) 연동
- 백엔드에 `/api/automation/run/{skill_id}` 엔드포인트 추가
- 각 SKILL.md 파일을 시스템 프롬프트로 구성해서 API 호출
- Notion/Slack 도구 호출은 백엔드 함수로 직접 구현 (tool calling)
- 실행 결과를 웹앱 화면에 진행 상태(로딩→완료) 표시
- `automationSkills`의 `mode`를 "api"로 변경, `runSkillViaApi()` 구현

이건 따로 PRD 만들 때 진행.
