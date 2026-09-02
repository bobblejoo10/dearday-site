# dearday-site

디어데이클래스 홈페이지입니다. `ai-leaders-site` 와 같은 규격을 씁니다.

## 폴더

| 폴더 | 무엇 |
|---|---|
| `src/pages` | 고치는 원본 HTML |
| `src/assets` | 공용 js · css |
| `src/static` | `_headers` · `robots.txt` · `sitemap.xml` · `shared.css` · 이미지 · 영상 |
| `functions/img` | Supabase 이미지 중계 |
| `tools` | 빌드 · 검사 |

## 명령

```
node tools/build-cloudflare-pages.mjs      dist 만들기
node tools/verify-security-boundaries.mjs  보안 규격 검사
node tools/verify-dist-links.mjs           만들어진 링크 검사
node tools/static-server.mjs dist 8080     로컬에서 열어보기
```

주소는 `tools/build-cloudflare-pages.mjs` 의 `pageRoutes` 표에 등록하면 생깁니다.

## 지금 상태

1단계 — 틀만 만든 상태입니다. 페이지는 임시 한 장뿐이고,
원본은 `../디어데이_원본` 에 그대로 있습니다.
