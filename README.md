# MathMind AI

Gemini 기반 수학 문제 생성 및 학습 지원 웹 서비스

## 프로젝트 소개

MathMind AI는 Google Gemini API를 활용해 사용자가 원하는 주제나 유형의 수학 문제를 생성하고, 그에 대한 풀이를 제공하는 웹 서비스입니다. 사용자는 직접 문제를 요청하거나, 자동 생성된 문제를 풀어보며 실력을 향상시킬 수 있습니다.

## 주요 기능

- 📘 문제 생성 요청: 원하는 수학 주제에 대한 문제 자동 생성
- 🧠 해답 보기: 문제 풀이 과정 및 정답 제공
- ✅ 정답 여부 체크: 사용자의 답안 채점
- 📂 문제 기록 저장: 학습 이력 관리
- 🔁 관련 문제 다시 풀기: 유사 유형 문제 재생성

## 기술 스택

- Frontend: React, TailwindCSS
- Backend: Node.js (Express.js)
- AI: Google Gemini API
- Storage: LocalStorage
- Deployment: Vercel

## 설치 및 실행 방법

1. 저장소 클론
```bash
git clone [repository-url]
cd landing2
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
- `.env` 파일을 프로젝트 루트에 생성하고 다음 내용 추가:
```
GEMINI_API_KEY=your_api_key_here
```

4. 개발 서버 실행
```bash
npm run dev
```

## 프로젝트 구조

```
landing2/
├── src/
│   ├── components/     # React 컴포넌트
│   ├── pages/         # 페이지 컴포넌트
│   ├── services/      # API 서비스
│   ├── utils/         # 유틸리티 함수
│   └── App.js         # 메인 앱 컴포넌트
├── public/            # 정적 파일
├── .env              # 환경 변수
└── package.json      # 프로젝트 설정
```

## 라이선스

MIT License 