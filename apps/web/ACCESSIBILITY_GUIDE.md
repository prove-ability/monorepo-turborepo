# 접근성 가이드 (WCAG AA 준수)

## ✅ 적용된 접근성 개선 사항

### 🎯 색상 대비 (WCAG AA)

#### 텍스트 색상 대비 기준
- **일반 텍스트**: 최소 4.5:1 대비율
- **큰 텍스트** (18pt 이상 또는 14pt 굵게): 최소 3:1 대비율

#### 개선된 색상 조합

**Toast 알림:**
```tsx
// Before: text-green-800 (대비율 부족)
// After: text-green-900 (대비율 7:1 이상)
success: "bg-green-50 border-green-200 text-green-900"
error: "bg-red-50 border-red-200 text-red-900"
warning: "bg-yellow-50 border-yellow-200 text-yellow-900"
info: "bg-blue-50 border-blue-200 text-blue-900"
```

**에러 메시지:**
```tsx
// Before: text-red-800
// After: text-red-900 font-medium (대비율 개선 + 가독성 향상)
<p className="text-sm text-red-900 font-medium">{error}</p>
```

**빈 상태 텍스트:**
```tsx
// 제목: text-gray-900 (높은 대비)
// 설명: text-gray-600 (충분한 대비)
<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
<p className="text-sm text-gray-600">{description}</p>
```

---

### ⌨️ 키보드 네비게이션

#### Focus 스타일

**하단 네비게이션:**
```tsx
// Focus 시 명확한 링 표시
focus:outline-none 
focus:ring-2 
focus:ring-blue-500 
focus:ring-inset
```

**Toast 닫기 버튼:**
```tsx
focus:outline-none 
focus:ring-2 
focus:ring-offset-2 
focus:ring-gray-500 
rounded
```

**로그인 버튼:**
```tsx
focus:ring-2 
focus:ring-blue-500 
focus:ring-offset-2
```

#### 키보드 단축키

**Tab**: 다음 요소로 이동  
**Shift + Tab**: 이전 요소로 이동  
**Enter/Space**: 버튼/링크 활성화  
**Esc**: 모달/토스트 닫기

---

### 🏷️ ARIA 속성

#### role 속성
- `role="navigation"`: 네비게이션 영역
- `role="banner"`: 페이지 헤더
- `role="alert"`: 중요 알림 (Toast, 에러 메시지)
- `role="tab"`: 탭 네비게이션
- `role="tablist"`: 탭 목록

#### aria-label
```tsx
// 컨텍스트 제공
aria-label="주요 네비게이션"
aria-label="홈 페이지"
aria-label="알림 닫기"
```

#### aria-live
```tsx
// 동적 콘텐츠 알림
aria-live="polite"      // 일반 알림
aria-live="assertive"   // 긴급 알림 (에러)
```

#### aria-hidden
```tsx
// 장식용 요소 숨김
<div aria-hidden="true">{icon}</div>
```

#### aria-selected
```tsx
// 현재 선택된 탭
aria-selected={isActive}
```

#### aria-describedby
```tsx
// 입력 필드와 에러 메시지 연결
<Input aria-describedby="login-error" />
<div id="login-error">{error}</div>
```

---

### 🔤 autoComplete 속성

**로그인 폼:**
```tsx
<Input autoComplete="username" />      // 아이디
<Input autoComplete="current-password" />  // 비밀번호
```

**이점:**
- 브라우저 자동완성 지원
- 비밀번호 관리자 연동
- 모바일에서 적절한 키보드 표시

---

## 📊 WCAG AA 체크리스트

### ✅ 인식 (Perceivable)

- [x] **1.1** 텍스트 대안: 모든 아이콘에 aria-label 또는 aria-hidden
- [x] **1.3** 적응성: 올바른 시맨틱 HTML 사용
- [x] **1.4** 구별성: 색상 대비 4.5:1 이상

### ✅ 운용 (Operable)

- [x] **2.1** 키보드 접근성: 모든 요소 Tab으로 접근 가능
- [x] **2.4** 네비게이션: 명확한 포커스 표시 (focus:ring)
- [x] **2.5** 입력 방식: 터치와 키보드 모두 지원

### ✅ 이해 (Understandable)

- [x] **3.1** 읽기 쉬움: lang="ko" 설정
- [x] **3.2** 예측 가능: 일관된 네비게이션
- [x] **3.3** 입력 지원: 에러 메시지 명확, aria-describedby 연결

### ✅ 견고성 (Robust)

- [x] **4.1** 호환성: 올바른 ARIA 사용, 유효한 HTML

---

## 🎯 테스트 방법

### 키보드만으로 테스트
```bash
1. Tab 키로 모든 요소 접근 가능한지 확인
2. Enter/Space로 버튼/링크 작동 확인
3. Esc로 모달/토스트 닫기 확인
4. 포커스 링이 명확하게 보이는지 확인
```

### 스크린 리더 테스트
```bash
# macOS VoiceOver
Cmd + F5: VoiceOver 켜기/끄기

# Windows NVDA
Ctrl + Alt + N: NVDA 시작

# 확인 사항:
- 모든 버튼/링크가 읽히는지
- 동적 콘텐츠(Toast) 알림이 들리는지
- 폼 에러가 자동으로 읽히는지
```

### 색상 대비 도구
- Chrome DevTools > Lighthouse (Accessibility)
- WAVE (웹 접근성 평가 도구)
- Color Contrast Analyzer

---

## 💡 베스트 프랙티스

### 1. 의미있는 HTML 사용
```tsx
// ❌ Bad
<div onClick={handleClick}>클릭</div>

// ✅ Good
<button onClick={handleClick}>클릭</button>
```

### 2. 포커스 스타일 제거 금지
```tsx
// ❌ Bad
outline: none; // 포커스 완전 제거

// ✅ Good
focus:outline-none focus:ring-2 focus:ring-blue-500
```

### 3. 색상만으로 정보 전달 금지
```tsx
// ❌ Bad
<div className="text-red-500">에러</div>

// ✅ Good
<div className="text-red-900" role="alert">
  <AlertIcon /> 에러: 입력값을 확인하세요
</div>
```

### 4. 충분한 터치 영역
```tsx
// 최소 44x44px 터치 영역 보장
<button className="w-full h-16">큰 버튼</button>
```

---

## 🔍 추가 개선 권장사항

### High Priority
- [ ] Skip to main content 링크 추가
- [ ] 랜드마크 영역 추가 (main, aside, footer)
- [ ] 페이지 타이틀 동적 업데이트

### Medium Priority
- [ ] 폼 유효성 검사 실시간 피드백
- [ ] 로딩 상태 aria-busy 속성
- [ ] 모달 트랩 포커스 (tab 순환)

### Low Priority
- [ ] 다크모드 색상 대비 확인
- [ ] 애니메이션 reduced-motion 지원
- [ ] 고대비 모드 지원

---

## 📚 참고 자료

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Accessibility](https://developer.mozilla.org/ko/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**마지막 업데이트**: 2025-10-05  
**준수 레벨**: WCAG 2.1 AA
