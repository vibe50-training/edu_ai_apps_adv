# 수업 준비 도우미

교사가 수업 준비 시간을 줄이도록 돕는 웹앱입니다. 기능과 수용 기준은 [spec.md](spec.md)에 있습니다.

- **퀴즈 생성기**: 주제를 입력하면 정답과 해설이 붙은 퀴즈를 만듭니다. 선택형 보기가 도형이면 도형 그림(SVG)도 함께 보여줍니다.
- **학습활동 추천**: 학습 목표와 시간을 입력하면 교실 활동 3가지를 추천합니다.
- 두 기능 모두 결과를 **전체 복사**하거나 **엑셀(CSV)**로 내려받을 수 있습니다.

AI가 만든 내용의 정확성과 수업 적합성은 사용 전에 교사가 확인해 주세요.

## 로컬에서 실행

Node.js 22 이상이 필요합니다.

1. 의존성 설치: `npm install`
2. 프로젝트 폴더에 `.env.local` 파일을 만들고 AI 연결 정보를 적습니다. 이 파일은 Git에 올라가지 않습니다.

   ```
   AI_ENDPOINT=OpenAI 호환 API 주소
   AI_API_KEY=API 키
   AI_DEPLOYMENT=모델(배포) 이름
   ```

3. 서버 실행: `npm start` 후 http://127.0.0.1:3000 접속

## 테스트

```bash
npm test
```

입력 검증, AI 응답 형식 검사, CSV 변환, 복사 텍스트를 확인합니다. GitHub에 올리면 GitHub Actions에서도 자동으로 실행됩니다.

## 폴더 구조

| 경로 | 내용 |
| --- | --- |
| `public/` | 화면(HTML·CSS·JavaScript) |
| `api/generate.js` | 서버 함수: 입력 검증 → AI 요청 → 응답 검증 |
| `api/validate.js` | 입력·응답 검증 규칙 |
| `api/_prompt.js` | AI 시스템 프롬프트 |
| `server.js` | 로컬 개발용 서버 |
| `tests/` | `node:test` 테스트 |
| `mock/` | 테스트용 예시 데이터 |
