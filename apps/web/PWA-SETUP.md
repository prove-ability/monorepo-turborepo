# PWA 설정 가이드

## ✅ 완료된 작업

1. ✅ `manifest.json` 생성
2. ✅ Service Worker (`sw.js`) 생성
3. ✅ Layout에 PWA 메타데이터 추가
4. ✅ PWAInstaller 컴포넌트 추가

---

## 🎨 아이콘 생성 필요

다음 아이콘 파일들을 `/public` 폴더에 추가해야 합니다:

### **필수 파일 (최소):**
```
/public/icon-192.png   (192x192px)  ⚠️ 필수
/public/icon-512.png   (512x512px)  ⚠️ 필수
```

### **권장 파일 (완벽한 지원):**
```
/public/icon-72.png              (72x72px)    - Android Chrome
/public/icon-96.png              (96x96px)    - Android Chrome
/public/icon-128.png             (128x128px)  - Android Chrome
/public/icon-144.png             (144x144px)  - Windows
/public/icon-152.png             (152x152px)  - iPad
/public/icon-192.png             (192x192px)  - Android (필수)
/public/icon-384.png             (384x384px)  - Android
/public/icon-512.png             (512x512px)  - Android (필수)
/public/apple-touch-icon.png     (180x180px)  - iOS
/public/icon-maskable-192.png    (192x192px)  - Android Adaptive Icon
/public/icon-maskable-512.png    (512x512px)  - Android Adaptive Icon
```

**총 11개 파일**

### **각 아이콘의 용도:**

| 크기 | 파일명 | 용도 | 플랫폼 |
|------|--------|------|---------|
| 72x72 | icon-72.png | 작은 타일 | Android Chrome |
| 96x96 | icon-96.png | 홈 화면 | Android Chrome |
| 128x128 | icon-128.png | 홈 화면 | Android Chrome, Desktop |
| 144x144 | icon-144.png | 중간 타일 | Windows |
| 152x152 | icon-152.png | iPad 홈 화면 | iOS iPad |
| 192x192 | icon-192.png | 표준 아이콘 | Android (필수) |
| 384x384 | icon-384.png | 큰 아이콘 | Android |
| 512x512 | icon-512.png | 고해상도 | Android (필수), Splash |
| 180x180 | apple-touch-icon.png | 홈 화면 | iOS iPhone |
| 192x192 | icon-maskable-192.png | Adaptive Icon | Android 8+ |
| 512x512 | icon-maskable-512.png | Adaptive Icon | Android 8+ |

**Maskable Icon이란?**
- Android 8.0+ 의 Adaptive Icon 시스템 지원
- 배경색을 추가하여 다양한 모양(원형, 모서리 둥근 사각형 등)에 대응
- 로고 주변에 20% 안전 영역(Safe Zone) 필요

### **아이콘 생성 방법:**

#### **옵션 1: 온라인 도구 사용 (추천)**
1. [Favicon Generator](https://realfavicongenerator.net/) 방문
2. 로고 이미지 업로드
3. PWA 아이콘 옵션 선택
4. 생성된 파일 다운로드

#### **옵션 2: Figma/디자인 툴**
1. 512x512px 캔버스 생성
2. 로고 디자인 (중앙에 배치, 여백 20% 권장)
3. PNG로 export (512x512)
4. 리사이즈하여 192x192 버전도 생성

---

## 📱 플랫폼별 테스트 방법

### **Android (Chrome)**
```
1. Chrome에서 웹사이트 접속
2. 자동으로 "앱 설치" 배너 표시
3. 또는: 메뉴 → "홈 화면에 추가"
4. 설치 후 앱 서랍에서 확인
```

### **iOS (Safari)**
```
1. Safari에서 웹사이트 접속
2. 공유 버튼 탭
3. "홈 화면에 추가" 선택
4. 이름 확인 후 추가
5. 홈 화면에서 아이콘 확인
```

### **macOS (Safari)**
```
1. Safari에서 웹사이트 접속
2. 파일 → "Dock에 추가"
3. 또는 주소창 옆 "설치" 아이콘 클릭
```

### **Windows (Edge/Chrome)**
```
1. Edge 또는 Chrome에서 접속
2. 주소창 우측 "+" 아이콘 클릭
3. "설치" 선택
4. 시작 메뉴에서 확인
```

---

## 🔍 PWA 체크리스트

### **필수 요구사항:**
- [x] HTTPS 사용 (localhost는 예외)
- [x] manifest.json 존재
- [x] Service Worker 등록
- [x] 아이콘 설정 (manifest.json)
- [ ] **아이콘 파일 생성** ⚠️
  - [ ] 필수: icon-192.png, icon-512.png
  - [ ] 권장: 11개 전체 아이콘

### **권장 사항:**
- [x] Offline 대응
- [x] 모바일 최적화
- [x] 빠른 로딩
- [ ] 푸시 알림 (선택)
- [ ] 백그라운드 동기화 (선택)

---

## 🚀 배포 후 확인사항

### **1. Lighthouse 테스트**
```
Chrome DevTools → Lighthouse → PWA 체크
목표: 100점
```

### **2. 설치 가능 여부 확인**
```
Chrome DevTools → Application → Manifest
- 오류 없이 로드되는지 확인
- Service Worker 등록 확인
```

### **3. 오프라인 테스트**
```
1. 앱 설치
2. Network 탭에서 Offline 체크
3. 페이지 새로고침
4. 여전히 작동하는지 확인
```

---

## 📊 플랫폼별 기능 지원

| 기능 | Android | iOS | macOS | Windows |
|------|---------|-----|-------|---------|
| 홈 화면 추가 | ✅ | ✅ | ✅ | ✅ |
| 오프라인 | ✅ | ✅ | ✅ | ✅ |
| 푸시 알림 | ✅ | ⚠️ | ⚠️ | ✅ |
| 백그라운드 동기화 | ✅ | ❌ | ❌ | ✅ |
| 자동 설치 프롬프트 | ✅ | ❌ | ✅ | ✅ |

---

## 🐛 문제 해결

### **"설치" 버튼이 안 보여요**
```
1. HTTPS 확인 (localhost는 가능)
2. manifest.json 문법 확인
3. Service Worker 등록 확인
4. 아이콘 파일 존재 확인
```

### **iOS에서 앱이 이상해요**
```
1. statusBarStyle: "black-translucent" 확인
2. viewport-fit="cover" 확인
3. Safe Area 고려한 디자인
```

### **오프라인이 안 돼요**
```
1. Service Worker 등록 확인
2. Cache API 작동 확인
3. Network First 전략 확인
```

---

## 📚 추가 자료

- [web.dev - PWA](https://web.dev/progressive-web-apps/)
- [MDN - PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Can I Use - PWA](https://caniuse.com/?search=pwa)
