# 내 공간 - 개인 생산성 사이트

일정, 할일, 메모를 한곳에서 관리하는 나만의 대시보드.

## 기능

### 📅 일정 (캘린더)
- 월간 캘린더 뷰
- 일정 추가/수정/삭제
- **드래그 앤 드롭**으로 날짜 이동
- 카테고리별 색상 (업무, 개인, 건강, 공부, 기타)
- 종일 일정 지원
- 미니 캘린더 & 선택한 날짜 상세 보기
- 다크/라이트/자동 테마

### 🚧 coming soon
- 할일
- 메모
- 북마크

## 시작하기

```bash
npm install
npm run dev
```

http://localhost:3000 (또는 http://127.0.0.1:3000) 에서 확인

> **참고:** Next.js 16에서 Turbopack 사용 시 라우팅 이슈가 있을 수 있습니다. `package.json`에 `--webpack` 옵션이 설정되어 있어 Webpack으로 동작합니다.

## Supabase 연결 (선택)

클라우드 동기화를 원하면:

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. `.env.local` 파일 생성 후 아래 변수 설정:
   ```
   NEXT_PUBLIC_SUPABASE_URL=xxx
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
   ```
3. Supabase SQL Editor에서 `supabase/schema.sql` 실행

Supabase 없이도 **localStorage**로 로컬에서 동작합니다.

## 배포 (Vercel)

1. GitHub에 푸시
2. [Vercel](https://vercel.com)에 가입 후 프로젝트 import
3. Supabase 사용 시 Environment Variables 설정
4. Deploy!
