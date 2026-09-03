(function (global) {
  'use strict';

  // 디어데이클래스 · 홈 히어로 영상을 관리자에서 가져옵니다.
  //
  // 예전에는 페이지에 <source src="이미지/히어로섹션_영상_보정.mp4"> 가 박혀 있었습니다.
  // 이제 관리자 [사이트 콘텐츠] → 배너에 올린 영상 주소를 읽어 붙입니다.
  // 관리자에 아직 아무것도 없으면 poster 이미지가 그대로 보입니다. 화면이 비지는 않습니다.

  var store = global.SiteContentStore;
  var video = document.querySelector('[data-site-hero-video]');
  if (!store || !video) return;

  function apply() {
    var banners = store.getBanners ? store.getBanners('home_hero') : [];
    var banner = banners && banners.length ? banners[0] : null;
    if (!banner) return;

    // 배너 이미지가 있으면 영상이 뜨기 전에 보여줄 그림으로 씁니다.
    if (banner.desktopImage) video.setAttribute('poster', banner.desktopImage);

    if (!banner.videoUrl) return;
    if (video.getAttribute('src') === banner.videoUrl) return;
    video.setAttribute('src', banner.videoUrl);
    video.load();
    // autoplay muted 라 대개 알아서 재생되지만, 늦게 붙는 경우를 위해 한 번 더 부릅니다.
    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(function () {});
  }

  store.ready().then(apply).catch(function (error) {
    // 자료를 못 불러와도 화면은 poster 로 남습니다. 조용히 넘어갑니다.
    if (global.console && console.warn) console.warn('[디어데이] 히어로 배너를 불러오지 못했습니다.', error);
  });
  if (store.subscribe) store.subscribe(apply);
})(window);
