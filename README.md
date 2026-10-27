# billim-app

읽고 싶은 책이 내 주변 공공도서관에 있는지, 대출할 수 있는지 지도에서 한 번에 확인하는 모바일 웹.

- 기획: [docs/spec.md](docs/spec.md)
- 개발 규칙: [CLAUDE.md](CLAUDE.md)

## 시작하기

```bash
nvm use            # .nvmrc (Node 24)
npm ci
cp .env.example .env.local   # 값 채우기
npm run dev
```

## 확인

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
