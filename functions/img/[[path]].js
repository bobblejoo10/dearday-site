/**
 * 이미지 중계
 *
 * newaileaders.co.kr/img/<경로> 로 들어온 요청을 Supabase 저장소의
 * 공개 파일로 대신 다녀와서 돌려줍니다.
 *
 * 왜 두었나
 *  1. 방문자 브라우저에 Supabase 주소가 안 보입니다.
 *     세 브랜드 홈페이지가 같은 곳을 쓴다는 흔적이 소스에 남지 않습니다.
 *  2. Cloudflare 가 한 번 받아 캐시해두고 대신 내려줍니다.
 *     같은 이미지를 여러 사람이 봐도 Supabase 전송량은 거의 안 늘어납니다.
 *
 * 안전
 *  - 열쇠를 붙이지 않습니다. 원래 공개된 파일만 나갑니다.
 *  - /object/public/ 아래만 봅니다. 서명 주소나 로그인 전용 주소로는 못 갑니다.
 *  - 경로에 .. 이 있으면 거절합니다.
 *
 * 되돌리기
 *  이 functions 폴더를 지우면 /img/ 주소가 사라지고 원래대로 돌아갑니다.
 */

const SUPABASE_ORIGIN = 'https://wdghlbswlvwlmkywiibr.supabase.co';
const PUBLIC_PREFIX = '/storage/v1/object/public/';

const ONE_DAY = 60 * 60 * 24;
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function onRequestGet(context) {
  const raw = context.params && context.params.path;
  const parts = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  const path = parts.filter(Boolean).join('/');

  if (!path || path.includes('..') || path.startsWith('/')) {
    return new Response('Not found', { status: 404 });
  }

  const target = SUPABASE_ORIGIN + PUBLIC_PREFIX + path;

  let upstream;
  try {
    upstream = await fetch(target, {
      cf: { cacheEverything: true, cacheTtl: ONE_DAY * 30 }
    });
  } catch (error) {
    return new Response('Bad gateway', { status: 502 });
  }

  if (!upstream.ok) {
    return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers();
  const type = upstream.headers.get('Content-Type');
  if (type) headers.set('Content-Type', type);
  const length = upstream.headers.get('Content-Length');
  if (length) headers.set('Content-Length', length);

  headers.set('Cache-Control', `public, max-age=${ONE_DAY}, stale-while-revalidate=${ONE_DAY * 7}`);
  headers.set('Cloudflare-CDN-Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(upstream.body, { status: 200, headers });
}
