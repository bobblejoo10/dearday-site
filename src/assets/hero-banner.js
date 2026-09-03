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

    // 문구·단추 자리 — 관리자에서 고르지 않았으면 아무것도 바꾸지 않습니다.
    if (global.BannerLayout) global.BannerLayout.apply(document.querySelector('.hero'), banner);

    // 배너 이미지가 있으면 영상이 뜨기 전에 보여줄 그림으로 씁니다.
    if (banner.desktopImage) video.setAttribute('poster', banner.desktopImage);

    // 문구 — 서식본(HTML)이 있으면 그대로, 없으면 평문. 없으면 페이지에 적힌 문구를 그대로 둡니다.
    var rich = global.RichText;
    var titleEl = document.querySelector('.hero h1');
    var leadEl = document.querySelector('.hero .lead');
    if (rich && titleEl && banner.titleHtml) rich.set(titleEl, banner.titleHtml, banner.title);
    if (rich && leadEl && banner.subtitleHtml) rich.set(leadEl, banner.subtitleHtml, banner.subtitle);

    // 단추 — 디어데이 홈에는 원래 1개만 있습니다.
    // 2차는 관리자에서 켜고 이름을 넣었을 때만 같은 모양으로 하나 더 만듭니다.
    var actions = document.querySelector('.hero-actions');
    if (actions) {
      var first = actions.querySelector('a:not([data-cta-secondary])');
      if (first) {
        if (banner.primaryLabel) first.textContent = banner.primaryLabel;
        if (banner.primaryUrl) first.setAttribute('href', banner.primaryUrl);
        first.style.display = banner.primaryEnabled === false ? 'none' : '';
      }
      var second = actions.querySelector('[data-cta-secondary]');
      var wantSecond = banner.secondaryEnabled !== false && !!banner.secondaryLabel;
      if (wantSecond) {
        if (!second) {
          second = document.createElement('a');
          second.className = first ? first.className : 'btn';
          second.setAttribute('data-cta-secondary', '');
          actions.appendChild(second);
        }
        second.textContent = banner.secondaryLabel;
        second.setAttribute('href', banner.secondaryUrl || '#');
        second.style.display = '';
      } else if (second) {
        second.style.display = 'none';
      }
    }

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
