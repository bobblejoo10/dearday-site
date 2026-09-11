(function (global) {
  'use strict';

  // 히어로 칸의 가로세로 비율을 등록한 이미지·영상에 맞춥니다.
  //
  // 왜
  //   예전에는 히어로 높이가 화면 높이에 매여 있었습니다(예: height:90vh).
  //   그래서 보는 사람 창 크기마다 히어로 모양이 달라졌고, 등록한 이미지는
  //   object-fit:cover 로 그 모양에 맞춰 잘렸습니다. 만드는 쪽에서는 어디가
  //   잘릴지 알 수 없었고, 관리자 미리보기와도 어긋났습니다.
  //
  //   이제 히어로가 이미지 비율을 따릅니다. 누가 보든 같은 모양이고 잘리지 않습니다.
  //
  // 비율을 어디서 얻나
  //   1. 관리자가 저장해 둔 값 (site_banners 의 desktop_ratio · mobile_ratio)
  //   2. 없으면 그림·영상이 실제로 실린 뒤 그 크기에서 잽니다
  //   3. 둘 다 없으면 CSS 에 적힌 그 사이트의 기본값을 그대로 둡니다
  //
  //   1번이 있으면 그림을 기다리지 않아 화면이 덜컥이지 않습니다.
  //
  // 너무 길거나 납작해지는 것은 각 사이트 CSS 의 min-height · max-height 가 막습니다.
  // 그때는 예전처럼 잘립니다.

  var MIN = 0.2;   // 이보다 납작하거나 길면 잘못 들어온 값으로 봅니다
  var MAX = 6;

  function sane(value) {
    var n = Number(value);
    return isFinite(n) && n >= MIN && n <= MAX ? n : 0;
  }

  function set(hero, ratio) {
    if (!hero) return false;
    var r = sane(ratio);
    if (!r) return false;
    hero.style.setProperty('--hero-ratio', String(r));
    return true;
  }

  // 그림·영상이 실린 뒤 실제 크기에서 비율을 잽니다.
  function measure(media, done) {
    if (!media) return;
    var read = function () {
      var w = media.naturalWidth || media.videoWidth || 0;
      var h = media.naturalHeight || media.videoHeight || 0;
      if (w > 0 && h > 0) done(w / h);
    };
    read();
    media.addEventListener('load', read, { once: true });
    media.addEventListener('loadedmetadata', read, { once: true });
  }

  // banner 에 저장된 값을 먼저 쓰고, 없으면 미디어에서 잽니다.
  // isMobile 은 그 화면이 모바일 폭인지입니다. 모바일용 그림을 따로 올렸을 때 씁니다.
  function apply(hero, banner, media, isMobile) {
    if (!hero) return;
    var stored = banner && (isMobile ? banner.mobileRatio : banner.desktopRatio);
    if (set(hero, stored)) return;
    measure(media, function (r) { set(hero, r); });
  }

  global.HeroRatio = { apply: apply, set: set, measure: measure };
})(window);
