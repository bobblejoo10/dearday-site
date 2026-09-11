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

  // 저장소에 올린 영상·그림은 중계(/img/)를 거칩니다.
  // 그 파일이 없거나 중계 파일이 없으면 원래 주소를 그대로 씁니다.
  function 미디어주소_(value) {
    var media = global.DeardayPublicMedia;
    return media && typeof media.resolve === 'function' ? media.resolve(value) : value;
  }

  // ── 관리자에서 저장한 색 ────────────────────────────
  // 예전에는 이 파일이 색을 아예 다루지 않아서, 관리자에서 무슨 색을 넣어도
  // 화면은 계속 CSS 기본색(마젠타)이었습니다.
  // 값이 비어 있으면 style 을 비워서 원래 CSS 모습으로 되돌립니다.

  /* 관리자가 정한 색은 #rrggbb 또는 #rrggbbaa 입니다.
     투명도를 담을 칸이 DB 에 없어서 뒤 두 자리에 얹어 옵니다.
     CSS 가 8자리 hex 를 그대로 알아들으므로 글자·단추 색은 그냥 넣습니다. */
  function 안전한색_(value) {
    var raw = String(value == null ? '' : value).trim();
    return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw) ? raw : '';
  }

  function 글자색_(el, value) {
    if (!el) return;
    el.style.color = 안전한색_(value);
  }

  function 단추색_(el, textColor, bgColor) {
    if (!el) return;
    var fg = 안전한색_(textColor);
    var bg = 안전한색_(bgColor);
    el.style.color = fg;
    el.style.backgroundColor = bg;
  }

  // 오버레이 — 사진·영상 위에 깔리는 막입니다.
  // 관리자에서 색을 정하면 그 색으로, 끄면 투명하게 만듭니다.
  function 오버레이_(el, hex, enabled) {
    if (!el) return;
    var color = 안전한색_(hex);
    if (color) {
      var r = parseInt(color.slice(1, 3), 16);
      var g = parseInt(color.slice(3, 5), 16);
      var b = parseInt(color.slice(5, 7), 16);
      // 8자리면 뒤 두 자리가 투명도입니다. 막의 두 단계에 곱합니다.
      var a = color.length === 9 ? parseInt(color.slice(7), 16) / 255 : 1;
      var at = function (base) { return 'rgba(' + r + ',' + g + ',' + b + ',' + (base * a).toFixed(3) + ')'; };
      // 세 단계 — 리더스와 관리자 미리보기가 쓰는 것과 같은 식입니다.
      // 예전에는 여기만 두 단계(0.10 → 0.55)라, 관리자에서 같은 색·투명도를 넣어도
      // 두 사이트가 다르게 보였습니다.
      el.style.background = 'linear-gradient(180deg, ' + at(0.34) + ' 0%, ' + at(0.14) + ' 40%, ' + at(0.66) + ' 100%)';
    } else {
      el.style.background = '';
    }
    el.style.opacity = enabled === false ? '0' : '';
  }

  function apply() {
    var banners = store.getBanners ? store.getBanners('home_hero') : [];
    var banner = banners && banners.length ? banners[0] : null;
    if (!banner) return;

    // 문구·단추 자리 — 관리자에서 고르지 않았으면 아무것도 바꾸지 않습니다.
    if (global.BannerLayout) global.BannerLayout.apply(document.querySelector('.hero'), banner);

    // 배너 이미지가 있으면 영상이 뜨기 전에 보여줄 그림으로 씁니다.
    // 중계(/img/)를 거칩니다. 소스에 Supabase 주소가 안 남고 R2 로 옮겨집니다.
    //
    // 좁은 화면에서는 모바일용 그림을 먼저 씁니다. 리더스와 같은 규칙입니다.
    // 예전에는 이 파일이 desktopImage 만 봐서, 관리자에 모바일 그림을 올려도
    // 디어데이에는 반영되지 않았습니다.
    var narrow = global.matchMedia ? global.matchMedia('(max-width:880px)').matches : false;
    var poster = narrow
      ? (banner.mobileImage || banner.desktopImage)
      : (banner.desktopImage || banner.mobileImage);
    if (poster) video.setAttribute('poster', 미디어주소_(poster));

    // 문구 — 서식본(HTML)이 있으면 그대로, 없으면 평문. 둘 다 없으면 페이지에 적힌 문구를 그대로 둡니다.
    // 좁은 화면에서는 모바일 문구를 먼저 씁니다. 모바일 칸이 비면 PC 문구 그대로입니다.
    // 고르는 규칙은 세 저장소가 함께 쓰는 banner-layout.js 에 있습니다.
    // 서식 없이 평문만 넣은 경우도 받습니다 — 예전에는 titleHtml 이 있을 때만 넣어서,
    // 서식 없는 모바일 문구를 채워도 PC 문구가 그대로 남았습니다.
    var rich = global.RichText;
    var titleEl = document.querySelector('.hero h1');
    var leadEl = document.querySelector('.hero .lead');
    var copy = global.BannerLayout && global.BannerLayout.heroText
      ? global.BannerLayout.heroText(banner, narrow) : banner;
    if (titleEl && (copy.titleHtml || copy.title)) {
      if (rich && copy.titleHtml) rich.set(titleEl, copy.titleHtml, copy.title);
      else titleEl.textContent = copy.title;
    }
    if (leadEl && (copy.subtitleHtml || copy.subtitle)) {
      if (rich && copy.subtitleHtml) rich.set(leadEl, copy.subtitleHtml, copy.subtitle);
      else leadEl.textContent = copy.subtitle;
    }

    // 직접 지정한 색이 있으면 그 색으로, 비어 있으면 원래 CSS 색 그대로.
    글자색_(titleEl, banner.titleColor);
    글자색_(leadEl, banner.subtitleColor);
    오버레이_(document.querySelector('.hero-overlay'), banner.overlayColor, banner.overlayEnabled);

    // 단추 — 세 저장소가 함께 쓰는 banner-cta.js 가 맞춥니다.
    // 디어데이 홈에는 단추가 원래 하나뿐이라, 2차를 켜면 만들어 넣습니다.
    var actions = document.querySelector('.hero-actions');
    if (global.BannerCta && actions) {
      global.BannerCta.apply(actions, banner, {
        applyColor: function (el, textColor, bgColor) {
          단추색_(el, textColor, bgColor);
        }
      });
    }

    if (!banner.videoUrl) return;
    var videoSrc = 미디어주소_(banner.videoUrl);
    if (video.getAttribute('src') === videoSrc) return;
    video.setAttribute('src', videoSrc);
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
