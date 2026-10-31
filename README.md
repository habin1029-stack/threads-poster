# Threads Poster

휴대폰 판매점 홍보를 위한 Threads 자동 게시 프로그램.

## 특징

- **AI 게시글 생성**: 키워드만 입력하면 자연스러운 휴대폰 홍보 게시글 자동 생성
- **다양한 스타일**: 일상 대화형, 가볍게 추천형, 친구에게 알려주는 말투
- **모바일 최적화**: 스마트폰에서 편하게 사용할 수 있는 깔끔한 UI
- **Threads API 연동**: 공식 Threads API를 통해 실제 게시

## 기술 스택

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- OpenAI API (게시글 생성)
- Meta Threads API (게시)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 `.env`로 복사하고, 실제 API 키를 입력합니다.

```bash
cp .env.example .env
```

- `OPENAI_API_KEY`: OpenAI API 키 (https://platform.openai.com/api-keys)
- `THREADS_APP_ID`, `THREADS_APP_SECRET`: Meta 개발자 포털에서 생성
- `THREADS_ACCESS_TOKEN`: Threads API 액세스 토큰

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 4. Vercel에 배포

```bash
vercel --prod
```

## 사용 방법

1. 핵심 키워드 입력 (예: "휴대폰 성지", "강변 쪽")
2. 지역, 매장 정보 선택
3. 게시글 스타일, 개수, 길이 선택
4. "AI 게시글 생성" 클릭
5. 생성된 게시글 확인 및 수정
6. Threads에 게시

## 주의사항

- API 키는 `.env` 파일에 저장하고, 절대 코드에 하드코딩하지 마세요.
- `.env` 파일은 `.gitignore`에 포함되어 있습니다.
- Threads API는 Meta 개발자 포털에서 신청해야 합니다.

## 라이선스

MIT