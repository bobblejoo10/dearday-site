(function (global) {
  'use strict';

  // 배너 문구·단추의 자리를 화면에 입히는 곳.
  // 관리자 미리보기와 두 공개 사이트가 같은 규칙을 쓰도록 한 벌만 둡니다.
  //
  // 값이 비어 있으면 아무 클래스도 붙이지 않습니다.
  // 즉 관리자에서 고르지 않으면 페이지에 적힌 모습이 그대로 유지됩니다.
  //
  // PC 와 모바일을 따로 정할 수 있습니다.
  //   PC   : contentPosition · ctaAlign        → hero-v-* · hero-h-* · hero-cta-*
  //   모바일 : mobileContentPosition · mobileCtaAlign
  //                                              → hero-m-v-* · hero-m-h-* · hero-m-cta-*
  //
  // 글줄 정렬(hero-ta-*)은 더 이상 붙이지 않습니다. 관리자 문구 편집기의 정렬 단추와
  // 겹쳐서, 두 곳에서 같은 것을 정하고 있었습니다. 이제 정렬은 편집기 한 곳에서만
  // 정합니다. 표의 text_align 칸과 각 사이트의 hero-ta-* CSS 는 되돌리기 쉽도록
  // 지우지 않고 남겨 두었습니다(지금은 아무도 안 씁니다).
  // 모바일 값이 비어 있으면 PC 값을 그대로 따릅니다. 모바일만 다르게 하고 싶을 때만
  // 채우면 됩니다. 모바일용 클래스는 각 사이트의 모바일 구간 CSS 에서만 듣습니다.

  var V = { top: 'hero-v-top', middle: 'hero-v-middle', bottom: 'hero-v-bottom' };
  var H = { left: 'hero-h-left', center: 'hero-h-center', right: 'hero-h-right' };
  var TA = { left: 'hero-ta-left', center: 'hero-ta-center', right: 'hero-ta-right' };
  var CTA = { left: 'hero-cta-left', center: 'hero-cta-center', right: 'hero-cta-right' };

  var MV = { top: 'hero-m-v-top', middle: 'hero-m-v-middle', bottom: 'hero-m-v-bottom' };
  var MH = { left: 'hero-m-h-left', center: 'hero-m-h-center', right: 'hero-m-h-right' };
  var MTA = { left: 'hero-m-ta-left', center: 'hero-m-ta-center', right: 'hero-m-ta-right' };
  var MCTA = { left: 'hero-m-cta-left', center: 'hero-m-cta-center', right: 'hero-m-cta-right' };

  function all() {
    var list = [];
    [V, H, TA, CTA, MV, MH, MTA, MCTA].forEach(function (map) {
      Object.keys(map).forEach(function (key) { list.push(map[key]); });
    });
    return list;
  }

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  // 'top-left' → ['hero-v-top','hero-h-left'] (모바일이면 hero-m-v-top …)
  function positionClasses(position, vmap, hmap) {
    var out = [];
    var parts = text(position).split('-');
    if (vmap[parts[0]]) out.push(vmap[parts[0]]);
    if (hmap[parts[1]]) out.push(hmap[parts[1]]);
    return out;
  }

  function classes(banner) {
    var out = [];
    var position = text(banner && banner.contentPosition);
    if (position) out = out.concat(positionClasses(position, V, H));
    var ctaAlign = text(banner && banner.ctaAlign);
    if (CTA[ctaAlign]) out.push(CTA[ctaAlign]);

    // 모바일 — 비어 있으면 PC 값을 그대로 씁니다.
    var mPosition = text(banner && banner.mobileContentPosition) || position;
    if (mPosition) out = out.concat(positionClasses(mPosition, MV, MH));
    var mCtaAlign = text(banner && banner.mobileCtaAlign) || ctaAlign;
    if (MCTA[mCtaAlign]) out.push(MCTA[mCtaAlign]);

    return out;
  }

  // 좁은 화면에서 쓸 문구를 고릅니다. 세 저장소가 같은 규칙을 쓰도록 여기에 둡니다.
  // 모바일 칸이 비어 있으면 PC 문구를 그대로 씁니다.
  // 제목과 설명은 따로 봅니다 — 제목만 모바일용으로 넣고 설명은 그대로 두는 경우가 있습니다.
  function heroText(banner, narrow) {
    var b = banner || {};
    var out = {
      title: text(b.title), titleHtml: text(b.titleHtml),
      subtitle: text(b.subtitle), subtitleHtml: text(b.subtitleHtml)
    };
    if (!narrow) return out;
    if (text(b.mobileTitle) || text(b.mobileTitleHtml)) {
      out.title = text(b.mobileTitle);
      out.titleHtml = text(b.mobileTitleHtml);
    }
    if (text(b.mobileSubtitle) || text(b.mobileSubtitleHtml)) {
      out.subtitle = text(b.mobileSubtitle);
      out.subtitleHtml = text(b.mobileSubtitleHtml);
    }
    return out;
  }

  // ── 히어로 문구·단추 기본 비율 ─────────────────────────
  // 세 저장소가 함께 쓰는 이 파일 한 곳에만 적습니다.
  // 각 사이트 CSS 에는 숫자를 두지 않습니다. 두면 값이 세 벌이 되어 서로 어긋납니다.
  // 관리자에서 배너마다 다른 값을 정하면 그 값이 이 기본값을 덮습니다.
  //   값의 뜻 : 히어로 칸 폭의 백분율. 세부 위치는 폭(x)·높이(y) 의 백분율.
  //   title·subtitle·cta : 글자 크기. 히어로 칸 폭의 백분율.
  //   dx·dy              : 세부 위치. 폭·높이의 백분율.
  //   titleLh·subLh      : 줄 간격(배수).
  //   subGap             : 제목과 설명 사이. 설명 글자 크기의 배수(em).
  //   ctaGap             : 설명과 단추 사이. 히어로 칸 폭의 백분율.
  //
  // subGap·subLh 를 여기로 옮긴 까닭 — 세 곳이 서로 달랐습니다(실측).
  //   제목→설명 간격   미리보기 0px · 리더스 41.4px · 디어데이 40.9px
  //   설명 줄 간격     미리보기 1.5 · 리더스 1.7 · 디어데이 1.6
  // 전민 지시로 둘의 가운데로 맞춥니다 — 간격 0.7em, 줄 간격 1.6.
  var HERO_DEFAULT = {
    desktop: { title: 5,   subtitle: 2, cta: 1.04, dx: 0, dy: 0,
               titleLh: 1.06, subLh: 1.6, subGap: 0.7, ctaGap: 2.2 },
    mobile:  { title: 7.5, subtitle: 3, cta: 3,    dx: 0, dy: 0,
               titleLh: 1.06, subLh: 1.6, subGap: 0.6, ctaGap: 1.6 },
    // 화면과 무관하게 한 벌만 쓰는 값들
    page: {
      // 히어로 칸이 차지할 화면 높이(%). 100 이면 첫 화면이 히어로로 꽉 찹니다.
      // 상단 메뉴는 히어로 위에 겹치므로 이 안에 포함됩니다.
      heroVh: 85,
      // 배경을 천천히 확대하는 효과의 최대 배율(%). 100 이면 확대 없음.
      // 전에는 리더스 index.html 에만 112 가 박혀 있었습니다.
      bgZoom: 100,
      bgZoomSecs: 22
    }
  };

  // 배너마다 바꾸는 값이 아니라 늘 같은 값으로 넣는 것들입니다.
  var STYLE_VARS = [
    ['--hero-title-lh',   'desktop', 'titleLh'], ['--hero-m-title-lh',   'mobile', 'titleLh'],
    ['--hero-sub-lh',     'desktop', 'subLh'],   ['--hero-m-sub-lh',     'mobile', 'subLh'],
    ['--hero-sub-gap',    'desktop', 'subGap'],  ['--hero-m-sub-gap',    'mobile', 'subGap'],
    ['--hero-cta-gap',    'desktop', 'ctaGap'],  ['--hero-m-cta-gap',    'mobile', 'ctaGap']
  ];

  // 관리자 sites-store.js 가 이 값을 그대로 가져다 씁니다(숫자를 또 적지 않으려고).
  function heroDefaults() {
    var copy = function (side) {
      var out = {};
      Object.keys(side).forEach(function (key) { out[key] = side[key]; });
      return out;
    };
    return { desktop: copy(HERO_DEFAULT.desktop), mobile: copy(HERO_DEFAULT.mobile),
             page: copy(HERO_DEFAULT.page) };
  }

  // 배너 칸 이름 → CSS 변수 → 그 자리의 기본값 → (모바일이면) 비었을 때 볼 PC 칸
  //
  // 세부 위치는 모바일 칸이 비면 PC 값을 그대로 씁니다. 자리·정렬과 같은 규칙입니다.
  // 글자 비율은 그렇게 하지 않습니다. PC 와 모바일의 기본 비율이 원래 다르기 때문입니다
  // (제목 5 vs 7.5, 단추 1.04 vs 3). PC 만 고쳤는데 모바일이 따라가면 모바일이 망가집니다.
  var CSS_VARS = [
    ['contentOffsetX',       '--hero-dx',         'desktop', 'dx',       null],
    ['contentOffsetY',       '--hero-dy',         'desktop', 'dy',       null],
    ['titleVw',              '--hero-title-vw',   'desktop', 'title',    null],
    ['subtitleVw',           '--hero-sub-vw',     'desktop', 'subtitle', null],
    ['ctaVw',                '--hero-cta-vw',     'desktop', 'cta',      null],
    ['mobileContentOffsetX', '--hero-m-dx',       'mobile',  'dx',       'contentOffsetX'],
    ['mobileContentOffsetY', '--hero-m-dy',       'mobile',  'dy',       'contentOffsetY'],
    ['mobileTitleVw',        '--hero-m-title-vw', 'mobile',  'title',    null],
    ['mobileSubtitleVw',     '--hero-m-sub-vw',   'mobile',  'subtitle', null],
    ['mobileCtaVw',          '--hero-m-cta-vw',   'mobile',  'cta',      null]
  ];

  // 배너에서 정한 값만 .hero 에 인라인으로 붙입니다.
  // 빈 칸은 인라인 값을 지웁니다 — 그러면 :root 에 깔아 둔 기본값이 살아납니다.
  // 여기에 기본값을 다시 써 넣으면, 기본값을 바꿔도 인라인이 이겨서 안 바뀝니다.
  //
  // 좁은 화면인지 아닌지는 JS 가 재지 않습니다. 변수만 넘기고 고르는 것은
  // 각 사이트의 미디어 쿼리가 합니다. 그래야 창을 줄이거나 화면을 돌려도
  // 다시 재 줄 필요가 없습니다.
  function applyVars(hero, banner) {
    if (!hero || !hero.style) return;
    var b = banner || {};
    CSS_VARS.forEach(function (row) {
      var value = b[row[0]];
      var n = (value === null || value === undefined || value === '') ? NaN : Number(value);
      if (!isFinite(n) && row[4]) {                       // 모바일이 비면 PC 칸을 봅니다
        var pc = b[row[4]];
        n = (pc === null || pc === undefined || pc === '') ? NaN : Number(pc);
      }
      if (!isFinite(n)) hero.style.removeProperty(row[1]);
      else hero.style.setProperty(row[1], String(n));
    });
    // 배경 확대 — 관리자에서 정한 최대 배율(%)입니다. 100 이면 확대 없음.
    var zoom = b.bgZoom;
    var z = (zoom === null || zoom === undefined || zoom === '') ? NaN : Number(zoom);
    if (!isFinite(z) || z <= 0) hero.style.removeProperty('--hero-bg-zoom');
    else hero.style.setProperty('--hero-bg-zoom', String(Math.round(z) / 100));
  }

  // ── 기본값을 CSS 에 먼저 깔아 둡니다 ─────────────────────
  // 이 파일이 <head> 에서 실행되면서 :root 규칙을 바로 만들어 둡니다.
  // 그래야 히어로가 처음 그려질 때부터 값이 있습니다. DOMContentLoaded 를 기다리면
  // 한 번 그린 뒤에 값이 들어와서 화면이 덜컥 움직입니다.
  // 배너별 값은 .hero 에 인라인으로 붙어서 이 :root 값을 덮습니다.
  function defaultCss() {
    var lines = [];
    STYLE_VARS.forEach(function (row) {
      lines.push(row[0] + ':' + HERO_DEFAULT[row[1]][row[2]]);
    });
    CSS_VARS.forEach(function (row) {
      lines.push(row[1] + ':' + HERO_DEFAULT[row[2]][row[3]]);
    });
    lines.push('--hero-vh:' + HERO_DEFAULT.page.heroVh);
    lines.push('--hero-bg-zoom:' + (HERO_DEFAULT.page.bgZoom / 100));
    lines.push('--hero-bg-zoom-secs:' + HERO_DEFAULT.page.bgZoomSecs);
    return ':root{' + lines.join(';') + '}';
  }

  function injectDefaults() {
    if (!document.head) return;                     // <head> 보다 먼저면 아래 DOM 대기로 갑니다
    if (document.getElementById('hero-default-vars')) return;
    var style = document.createElement('style');
    style.id = 'hero-default-vars';
    style.textContent = defaultCss();
    document.head.appendChild(style);
  }

  // 원본 그림·영상의 가로세로 비를 히어로에 알려 줍니다.
  //
  // 원본이 히어로보다 가로로 길면(예: 25:10) 가운데를 잘라내지 않고,
  // 히어로 칸의 세로를 원본 비에 맞춰 줄입니다. 그러면 잘리는 곳도,
  // 위아래 빈 띠도 생기지 않고 바로 아래 내용이 붙습니다.
  // 원본이 더 세로로 길면 지금처럼 히어로 비(16:9 · 모바일 3:2)를 지키고 잘립니다.
  // 고르는 일은 CSS 가 합니다 — max(기본비, 원본비). 큰 쪽이 가로로 더 긴 쪽입니다.
  function setSourceRatio(hero, ratio) {
    if (!hero || !hero.style) return;
    var n = Number(ratio);
    if (!isFinite(n) || n <= 0) hero.style.removeProperty('--hero-src-ar');
    else hero.style.setProperty('--hero-src-ar', String(Math.round(n * 10000) / 10000));
  }

  // 그림이면 naturalWidth, 영상이면 videoWidth 를 봅니다. 아직 안 읽혔으면 기다립니다.
  function watchHeroMedia(hero, el) {
    if (!hero || !el) return;
    var read = function () {
      var w = Number(el.naturalWidth || el.videoWidth || 0);
      var h = Number(el.naturalHeight || el.videoHeight || 0);
      if (w > 0 && h > 0) { setSourceRatio(hero, w / h); return true; }
      return false;
    };
    if (read()) return;
    ['load', 'loadedmetadata'].forEach(function (type) {
      el.addEventListener(type, function once() {
        el.removeEventListener(type, once);
        read();
      });
    });
  }

  // 기본값 :root 규칙을 지금 바로 깝니다.
  // 이 파일이 <head> 에서 실행되므로 히어로가 처음 그려지기 전에 값이 준비됩니다.
  // <head> 가 아직 없는 아주 이른 경우에만 DOM 준비를 기다립니다.
  if (document.head) injectDefaults();
  else document.addEventListener('DOMContentLoaded', injectDefaults);

  function apply(hero, banner) {
    if (!hero) return;
    var wanted = classes(banner);
    all().forEach(function (name) {
      hero.classList.toggle(name, wanted.indexOf(name) >= 0);
    });
    applyVars(hero, banner);
  }

  global.BannerLayout = { classes: classes, apply: apply, allClasses: all, heroText: heroText, applyVars: applyVars, heroDefaults: heroDefaults,
    watchHeroMedia: watchHeroMedia, setSourceRatio: setSourceRatio };
})(window);
