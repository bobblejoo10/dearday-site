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
  var HERO_DEFAULT = {
    desktop: { title: 5,   subtitle: 2, cta: 1.04, dx: 0, dy: 0 },
    mobile:  { title: 7.5, subtitle: 3, cta: 3,    dx: 0, dy: 0 }
  };

  // 관리자 sites-store.js 가 이 값을 그대로 가져다 씁니다(숫자를 또 적지 않으려고).
  function heroDefaults() {
    return {
      desktop: { title: HERO_DEFAULT.desktop.title, subtitle: HERO_DEFAULT.desktop.subtitle,
                 cta: HERO_DEFAULT.desktop.cta, dx: HERO_DEFAULT.desktop.dx, dy: HERO_DEFAULT.desktop.dy },
      mobile:  { title: HERO_DEFAULT.mobile.title, subtitle: HERO_DEFAULT.mobile.subtitle,
                 cta: HERO_DEFAULT.mobile.cta, dx: HERO_DEFAULT.mobile.dx, dy: HERO_DEFAULT.mobile.dy }
    };
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

  // 변수를 늘 전부 답니다. 빈 칸이면 위 기본값을 답니다.
  // CSS 쪽에 var(--이름, 숫자) 로 기본값을 두지 않는 이유가 이것입니다 —
  // 그러면 사이트마다 숫자를 또 적게 되고, 관리자에서 한 번에 못 바꿉니다.
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
      if (!isFinite(n)) n = HERO_DEFAULT[row[2]][row[3]];
      hero.style.setProperty(row[1], String(n));
    });
  }

  // 배너를 아직 못 받았을 때도 기본값이 들어가 있어야 합니다.
  // 안 그러면 calc(var(--hero-title-vw) * 1cqw) 가 값을 못 찾아 글자 크기가 사라집니다.
  function seedDefaults() {
    var hero = document.querySelector('.hero');
    if (hero) applyVars(hero, null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', seedDefaults);
  else seedDefaults();

  function apply(hero, banner) {
    if (!hero) return;
    var wanted = classes(banner);
    all().forEach(function (name) {
      hero.classList.toggle(name, wanted.indexOf(name) >= 0);
    });
    applyVars(hero, banner);
  }

  global.BannerLayout = { classes: classes, apply: apply, allClasses: all, heroText: heroText, applyVars: applyVars, heroDefaults: heroDefaults };
})(window);
