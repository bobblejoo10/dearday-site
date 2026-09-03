(function (global) {
  'use strict';

  // 배너 문구·단추의 자리를 화면에 입히는 곳.
  // 관리자 미리보기와 두 공개 사이트가 같은 규칙을 쓰도록 한 벌만 둡니다.
  //
  // 값이 비어 있으면 아무 클래스도 붙이지 않습니다.
  // 즉 관리자에서 고르지 않으면 페이지에 적힌 모습이 그대로 유지됩니다.

  var V = { top: 'hero-v-top', middle: 'hero-v-middle', bottom: 'hero-v-bottom' };
  var H = { left: 'hero-h-left', center: 'hero-h-center', right: 'hero-h-right' };
  var TA = { left: 'hero-ta-left', center: 'hero-ta-center', right: 'hero-ta-right' };
  var CTA = { left: 'hero-cta-left', center: 'hero-cta-center', right: 'hero-cta-right' };

  function all() {
    var list = [];
    [V, H, TA, CTA].forEach(function (map) {
      Object.keys(map).forEach(function (key) { list.push(map[key]); });
    });
    return list;
  }

  // 'top-left' → ['hero-v-top','hero-h-left']
  function classes(banner) {
    var out = [];
    var position = String((banner && banner.contentPosition) || '').trim();
    if (position) {
      var parts = position.split('-');
      if (V[parts[0]]) out.push(V[parts[0]]);
      if (H[parts[1]]) out.push(H[parts[1]]);
    }
    var textAlign = String((banner && banner.textAlign) || '').trim();
    if (TA[textAlign]) out.push(TA[textAlign]);
    var ctaAlign = String((banner && banner.ctaAlign) || '').trim();
    if (CTA[ctaAlign]) out.push(CTA[ctaAlign]);
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
