(function (global) {
  'use strict';

  // 배너 문구·단추의 자리를 화면에 입히는 곳.
  // 관리자 미리보기와 두 공개 사이트가 같은 규칙을 쓰도록 한 벌만 둡니다.
  //
  // 값이 비어 있으면 아무 클래스도 붙이지 않습니다.
  // 즉 관리자에서 고르지 않으면 페이지에 적힌 모습이 그대로 유지됩니다.
  //
  // PC 와 모바일을 따로 정할 수 있습니다.
  //   PC   : contentPosition · textAlign · ctaAlign        → hero-v-* · hero-h-* · hero-ta-* · hero-cta-*
  //   모바일 : mobileContentPosition · mobileTextAlign · mobileCtaAlign
  //                                                        → hero-m-v-* · hero-m-h-* · hero-m-ta-* · hero-m-cta-*
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
    var textAlign = text(banner && banner.textAlign);
    if (TA[textAlign]) out.push(TA[textAlign]);
    var ctaAlign = text(banner && banner.ctaAlign);
    if (CTA[ctaAlign]) out.push(CTA[ctaAlign]);

    // 모바일 — 비어 있으면 PC 값을 그대로 씁니다.
    var mPosition = text(banner && banner.mobileContentPosition) || position;
    if (mPosition) out = out.concat(positionClasses(mPosition, MV, MH));
    var mTextAlign = text(banner && banner.mobileTextAlign) || textAlign;
    if (MTA[mTextAlign]) out.push(MTA[mTextAlign]);
    var mCtaAlign = text(banner && banner.mobileCtaAlign) || ctaAlign;
    if (MCTA[mCtaAlign]) out.push(MCTA[mCtaAlign]);

    return out;
  }

  function apply(hero, banner) {
    if (!hero) return;
    var wanted = classes(banner);
    all().forEach(function (name) {
      hero.classList.toggle(name, wanted.indexOf(name) >= 0);
    });
  }

  global.BannerLayout = { classes: classes, apply: apply, allClasses: all };
})(window);
