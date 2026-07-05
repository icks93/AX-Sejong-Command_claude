# 노션 API 엔드포인트 추가 스킬

## 설명

[`app.py`](app.py:1)에 새로운 노션 API 엔드포인트를 추가합니다.

---

## 작업 단계

### 1. 관련 파일 읽기

- [`app.py`](app.py:1)
- [`docs/LOGIC.md`](docs/LOGIC.md:1)

### 2. 엔드포인트 추가

`/api/[엔드포인트명]` 엔드포인트를 [`app.py`](app.py:1)에 추가합니다.

#### 조건

**노션 DB 설정**
- DB ID: [DB ID값]
- 정렬 기준: [정렬 기준]

**응답 형식**
```json
{
  "success": true,
  "data": [...]
}
```

**코드 구조**
- 기존 코드 구조 유지
- 한국어 주석 포함
- 에러 처리 필수

### 3. 구현 규칙

```python
@app.get("/api/[엔드포인트명]")
async def get_[엔드포인트명]():
    """
    [기능 설명]
    
    Returns:
        dict: API 응답
    """
    try:
        # 노션 API 호출 코드
        headers = {
            "Authorization": f"Bearer {NOTION_API_KEY}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json"
        }
        
        payload = {
            "database_id": NOTION_DB_ID,
            "sorts": [{"property": "[정렬기준]", "direction": "descending"}]
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {"success": True, "data": data}
        else:
            return {"success": False, "error": "API 호출 실패"}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

---

## 완료 기준

- [ ] 새로운 엔드포인트가 app.py에 추가됨
- [ ] API 응답 형식이 올바름
- [ ] 한국어 docstring이 포함됨
- [ ] 에러 처리가 구현됨
- [ ] timeout=10 설정이 포함됨
- [ ] 기존 코드 구조가 유지됨

---

## 참고

- Phase 영역 주석을 확인하고 해당 Phase 영역에만 추가하세요.
- 필드명 변경은 절대 하지 마세요.
