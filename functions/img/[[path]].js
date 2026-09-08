/**
 * 이미지·영상 중계
 *
 * <홈페이지 주소>/img/<경로> 로 들어온 요청에 파일을 돌려줍니다.
 *
 * 어디서 가져오나
 *   1. Cloudflare R2 (바인딩 이름 MEDIA) 에 있으면 R2 에서
 *   2. 없으면 Supabase 저장소에서 가져다 주고, 가져온 김에 R2 에 넣어둡니다
 *      → 방문자가 보는 파일이 보는 순간 하나씩 R2 로 옮겨집니다
 *   3. 바인딩이 없으면 예전처럼 Supabase 에서만 가져옵니다 (배포 순서 상관없음)
 *
 * 왜 두었나
 *   1. 방문자 브라우저에 Supabase 도, R2 도 안 보입니다.
 *      세 브랜드 홈페이지가 같은 곳을 쓴다는 흔적이 소스에 남지 않습니다.
 *   2. Cloudflare 가 한 번 받아 캐시해두고 대신 내려줍니다.
 *
 * 안전
 *   - 열쇠를 붙이지 않습니다. 원래 공개된 파일만 나갑니다.
 *   - /object/public/ 아래만 봅니다. 서명 주소나 로그인 전용 주소로는 못 갑니다.
 *   - 경로에 .. 이 있으면 거절합니다.
 *
 * 되돌리기
 *   이 functions 폴더를 지우면 /img/ 주소가 사라지고 원래대로 돌아갑니다.
 *   R2 만 끄고 싶으면 Pages 설정에서 MEDIA 바인딩을 지우면 3번으로 돌아갑니다.
 */

const SUPABASE_ORIGIN = 'https://wdghlbswlvwlmkywiibr.supabase.co';
const PUBLIC_PREFIX = '/storage/v1/object/public/';

const ONE_DAY = 60 * 60 * 24;
const ONE_YEAR = 60 * 60 * 24 * 365;

// 방문자에게 붙여 보내는 캐시 규칙. R2 에서 왔든 Supabase 에서 왔든 같습니다.
function outHeaders(extra) {
  const headers = new Headers(extra || {});
  headers.set('Cache-Control', `public, max-age=${ONE_DAY}, stale-while-revalidate=${ONE_DAY * 7}`);
  headers.set('Cloudflare-CDN-Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Accept-Ranges', 'bytes');
  return headers;
}

function keyOf(context) {
  const raw = context.params && context.params.path;
  const parts = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  const key = parts.filter(Boolean).join('/');
  if (!key || key.includes('..') || key.startsWith('/')) return '';
  return key;
}

// Supabase 에서 파일 전체를 받아 R2 에 넣어둡니다.
// 실패해도 방문자 화면에는 영향이 없습니다. 다음 요청에서 다시 시도합니다.
async function warmR2(bucket, key) {
  try {
    const upstream = await fetch(SUPABASE_ORIGIN + PUBLIC_PREFIX + key);
    if (!upstream.ok || !upstream.body) return;
    await bucket.put(key, upstream.body, {
      httpMetadata: { contentType: upstream.headers.get('Content-Type') || 'application/octet-stream' }
    });
  } catch (error) {
    // 조용히 넘어갑니다.
  }
}

async function fromR2(bucket, key, request) {
  const wantsRange = !!request.headers.get('Range');
  let object;
  try {
    object = await bucket.get(key, wantsRange ? { range: request.headers } : undefined);
  } catch (error) {
    return null;
  }
  if (!object) return null;

  const headers = outHeaders();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);

  // 구간 요청(영상 되감기)이면 206 으로, 아니면 200 으로.
  // R2 는 구간을 세 모양 중 하나로 알려줍니다 : {offset,length} / {offset} / {suffix}
  if (wantsRange && object.range) {
    const size = object.size;
    let offset;
    let length;
    if (object.range.suffix != null) {
      length = Math.min(object.range.suffix, size);
      offset = size - length;
    } else {
      offset = object.range.offset || 0;
      length = object.range.length == null ? size - offset : object.range.length;
    }
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${size}`);
    headers.set('Content-Length', String(length));
    return new Response(request.method === 'HEAD' ? null : object.body, { status: 206, headers });
  }

  headers.set('Content-Length', String(object.size));
  return new Response(request.method === 'HEAD' ? null : object.body, { status: 200, headers });
}

async function fromSupabase(context, key, bucket) {
  const { request, waitUntil } = context;
  const target = SUPABASE_ORIGIN + PUBLIC_PREFIX + key;
  const rangeHeader = request.headers.get('Range');

  // 구간 요청은 Supabase 에 그대로 넘깁니다. 조각을 R2 에 넣으면 안 되니
  // R2 채우기는 따로 전체 파일을 받아서 합니다.
  if (rangeHeader) {
    if (bucket && waitUntil) waitUntil(warmR2(bucket, key));
    let upstream;
    try {
      upstream = await fetch(target, { headers: { Range: rangeHeader } });
    } catch (error) {
      return new Response('Bad gateway', { status: 502 });
    }
    if (!upstream.ok && upstream.status !== 206) {
      return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 });
    }
    const headers = outHeaders();
    ['Content-Type', 'Content-Length', 'Content-Range'].forEach(function (name) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    });
    return new Response(upstream.body, { status: upstream.status, headers });
  }

  let upstream;
  try {
    upstream = await fetch(target, { cf: { cacheEverything: true, cacheTtl: ONE_DAY * 30 } });
  } catch (error) {
    return new Response('Bad gateway', { status: 502 });
  }
  if (!upstream.ok) {
    return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 });
  }

  const type = upstream.headers.get('Content-Type') || 'application/octet-stream';
  const headers = outHeaders({ 'Content-Type': type });
  const length = upstream.headers.get('Content-Length');
  if (length) headers.set('Content-Length', length);

  // 같은 물줄기를 둘로 갈라 하나는 방문자에게, 하나는 R2 에 넣습니다.
  if (bucket && waitUntil && upstream.body) {
    const [toVisitor, toBucket] = upstream.body.tee();
    waitUntil(bucket.put(key, toBucket, { httpMetadata: { contentType: type } }).catch(function () {}));
    return new Response(toVisitor, { status: 200, headers });
  }

  return new Response(upstream.body, { status: 200, headers });
}

async function handle(context) {
  const key = keyOf(context);
  if (!key) return new Response('Not found', { status: 404 });

  const bucket = context.env && context.env.MEDIA ? context.env.MEDIA : null;

  if (bucket) {
    const hit = await fromR2(bucket, key, context.request);
    if (hit) return hit;
  }

  return fromSupabase(context, key, bucket);
}

export const onRequestGet = handle;
export const onRequestHead = handle;
