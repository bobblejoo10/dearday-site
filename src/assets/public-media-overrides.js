(function (global) {
  'use strict';

  // Supabase 저장소의 공개 주소를 우리 도메인의 중계 주소로 바꿉니다.
  //  - 방문자 소스에 Supabase 주소가 안 남습니다
  //  - 세 브랜드 홈페이지가 같은 곳을 쓴다는 흔적이 안 남습니다
  //  - Cloudflare 가 캐시해 대신 내려주어 전송량이 줄어듭니다
  //  - 중계는 R2 를 먼저 보고, 없으면 Supabase 에서 가져오면서 R2 에 넣어둡니다
  // 중계는 functions/img/[[path]].js 에 있습니다.
  var SUPABASE_HOST = 'wdghlbswlvwlmkywiibr.supabase.co';
  var PUBLIC_PREFIX = '/storage/v1/object/public/';
  var PROXY_PREFIX = '/img/';

  function resolve(value) {
    var raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return '';

    try {
      var url = new URL(raw, global.location.origin);
      if (url.hostname !== SUPABASE_HOST) return raw;
      if (url.pathname.indexOf(PUBLIC_PREFIX) === 0) {
        return PROXY_PREFIX + url.pathname.slice(PUBLIC_PREFIX.length) + (url.search || '');
      }
      return raw;
    } catch (error) {
      return raw;
    }
  }

  global.DeardayPublicMedia = {
    resolve: resolve
  };
})(window);
