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

  // 배경(영상·그림)과 고정 PNG 가 둘 다 준비될 때까지 기다리는 시간입니다.
  // 이 안에 안 오면 포기하고, 브랜드 그라데이션 + 진한 글씨 그대로 둡니다.
  var 대기제한_ = 7000;

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

  // ── 로딩 중에는 겉모습을 바꾸지 않습니다 ──────────────────
  //
  // 예전에는 관리자 설정이 도착하는 즉시 배경 밝기(글자색)와 어두운 막을 씌웠습니다.
  // 그런데 배경 영상은 그때 내려받기가 막 시작됩니다. 그래서 배경이 아직 없는
  // 브랜드 그라데이션 위에 어두운 막만 얹힌 구간이 몇 초씩 보였습니다(실측 2.4초~).
  // 고정 PNG 도 파일이 도착하는 대로 혼자 툭 나타났습니다.
  //
  // 이제는 배경과 고정 PNG 가 둘 다 준비될 때까지 아무것도 바꾸지 않고,
  // 준비되면 배경·고정 PNG·글자색·막을 한 번에 보여 줍니다.
  // 내려받기 자체는 미루지 않습니다. 주소는 바로 붙이고 보이기만 잡아 둡니다.

  function 영상인가_(el) {
    return String(el && el.tagName || '').toLowerCase() === 'video';
  }

  function 준비됐나_(el) {
    if (!el) return true;
    if (영상인가_(el)) return el.readyState >= 2;        // 첫 프레임까지 왔는가
    return !!(el.complete && el.naturalWidth > 0);
  }

  // 목록이 다 준비되면 준비되면(하나라도성공) 을 부릅니다.
  // 제한 시간이 지나도 안 오면 시간초과되면() 만 부릅니다 — 받은 만큼만 보여 주고,
  // 글자색·막은 그대로 둡니다. 나중에 늦게 도착하면 그때 준비되면 이 불립니다.
  function 모두준비되면_(목록, 준비되면, 시간초과되면) {
    var 대상 = (목록 || []).filter(Boolean);
    if (!대상.length) { 준비되면(true); return; }
    var 남은 = 0, 성공 = 0, 끝났다 = false;
    var 확인 = function () {
      if (끝났다 || 남은 > 0) return;
      끝났다 = true;
      준비되면(성공 > 0);
    };
    대상.forEach(function (el) {
      if (준비됐나_(el)) { 성공 += 1; return; }
      남은 += 1;
      var 종류 = 영상인가_(el) ? ['loadeddata', 'canplay', 'playing', 'error'] : ['load', 'error'];
      var 한번만 = function (e) {
        var 실패 = !!(e && e.type === 'error');
        if (!실패 && !준비됐나_(el)) return;              // 아직 첫 프레임 전이면 계속 기다립니다
        종류.forEach(function (type) { el.removeEventListener(type, 한번만); });
        if (!실패) 성공 += 1;
        남은 -= 1;
        확인();
      };
      종류.forEach(function (type) { el.addEventListener(type, 한번만); });
    });
    확인();
    if (!끝났다 && 시간초과되면) {
      global.setTimeout(function () { if (!끝났다) 시간초과되면(); }, 대기제한_);
    }
  }

  var 적용횟수_ = 0;   // 잡아두는 동안 관리자에서 배너가 바뀌면 옛 기다림은 버립니다

  function apply() {
    var 순번 = ++적용횟수_;
    var banners = store.getBanners ? store.getBanners('home_hero') : [];
    var banner = banners && banners.length ? banners[0] : null;
    if (!banner) return;

    var hero = document.querySelector('.hero');
    var band = video.closest ? video.closest('.hero-band') : video.parentNode;

    // 문구·단추 자리 — 관리자에서 고르지 않았으면 아무것도 바꾸지 않습니다.
    if (global.BannerLayout) global.BannerLayout.apply(hero, banner);

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

    // 고정 PNG — 배경 위, 막 아래. 배경 확대 움직임을 따라가지 않습니다.
    // 주소는 여기서 바로 붙입니다(내려받기 시작). 보이는 것만 아래 .hero-hold 가 잡습니다.
    var pin = null;
    var pinSrc = '';
    if (band) {
      pinSrc = banner.fixedImage ? 미디어주소_(banner.fixedImage) : '';
      pin = band.querySelector('.hero-pin');
      if (pinSrc && !pin) {
        pin = document.createElement('img');
        pin.className = 'hero-pin';
        pin.alt = '';
        pin.setAttribute('aria-hidden', 'true');
        band.insertBefore(pin, video.nextSibling);
      }
      if (pin) {
        if (pinSrc) {
          if (pin.getAttribute('src') !== pinSrc) pin.setAttribute('src', pinSrc);
          pin.hidden = false;
        } else {
          pin.hidden = true;
          pin.removeAttribute('src');
        }
      }
    }

    // 배경 영상 — 주소를 여기서 붙여 내려받기를 시작합니다.
    // 예전에는 이 블록이 apply() 맨 끝에 있었습니다. 기다릴 대상을 모으려면
    // 주소가 먼저 붙어 있어야 해서 위로 올렸습니다.
    var videoSrc = banner.videoUrl ? 미디어주소_(banner.videoUrl) : '';
    if (videoSrc && video.getAttribute('src') !== videoSrc) {
      video.setAttribute('src', videoSrc);
      video.load();
      // autoplay muted 라 대개 알아서 재생되지만, 늦게 붙는 경우를 위해 한 번 더 부릅니다.
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(function () {});
    }

    // 등록한 그림·영상의 가로세로 비를 히어로에 알려 줍니다.
    // 히어로보다 가로로 길면 잘라내는 대신 히어로 세로가 줄어듭니다(banner-layout.js).
    // 영상이 있으면 영상 비, 없으면 포스터 그림 비를 씁니다.
    var 포스터탐침 = null;
    var layout = global.BannerLayout;
    if (hero && layout && layout.watchHeroMedia) {
      if (banner.videoUrl) {
        layout.watchHeroMedia(hero, video);
      } else if (poster) {
        포스터탐침 = new Image();
        포스터탐침.onload = function () { layout.setSourceRatio(hero, 포스터탐침.naturalWidth / 포스터탐침.naturalHeight); };
        포스터탐침.src = 미디어주소_(poster);
      } else if (layout.setSourceRatio) {
        layout.setSourceRatio(hero, 0);               // 등록된 것이 없으면 기본 비로 되돌립니다
      }
    }

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

    // 단추 — 세 저장소가 함께 쓰는 banner-cta.js 가 맞춥니다.
    // 디어데이 홈에는 단추가 원래 하나뿐이라, 2차를 켜면 만들어 넣습니다.
    // 글자·링크는 지금 넣고, 색만 아래로 미룹니다. 어두운 배경용 색이 밝은 로딩
    // 화면에 먼저 깔리면 글자가 안 보이기 때문입니다.
    var 단추색목록 = [];
    var actions = document.querySelector('.hero-actions');
    if (global.BannerCta && actions) {
      global.BannerCta.apply(actions, banner, {
        applyColor: function (el, textColor, bgColor) {
          단추색목록.push([el, textColor, bgColor]);
        }
      });
    }

    // ── 배경·고정 PNG 가 다 준비되면 한 번에 ─────────────────
    if (band) band.classList.add('hero-hold');
    var 기다릴것 = [];
    if (banner.videoUrl) 기다릴것.push(video);
    else if (포스터탐침) 기다릴것.push(포스터탐침);
    if (pin && pinSrc) 기다릴것.push(pin);

    모두준비되면_(기다릴것, function (하나라도성공) {
      if (순번 !== 적용횟수_) return;
      if (band) band.classList.remove('hero-hold');
      // 배경도 고정 PNG 도 못 받았으면 지금 화면(그라데이션 + 진한 글씨) 그대로 둡니다.
      if (!하나라도성공) return;

      // 배경 밝기 — 관리자 [홈페이지 관리 > 히어로 배너 > 배경 밝기] 값입니다.
      // 리더스와 같은 동작입니다. 리더스는 기본이 흰 글자라 .tone-light 에 규칙이 있고,
      // 디어데이는 기본이 진한 글자라 .tone-dark 쪽에 규칙을 둡니다.
      // 관리자에서 고르는 것과 화면에서 보이는 결과는 두 브랜드가 같습니다.
      var isLight = banner.backgroundTone !== 'dark';
      if (hero) {
        hero.classList.toggle('tone-light', isLight);
        hero.classList.toggle('tone-dark', !isLight);
      }
      var navBar = document.getElementById('nav') || document.querySelector('header.nav');
      if (navBar) {
        navBar.classList.toggle('tone-light', isLight);
        navBar.classList.toggle('tone-dark', !isLight);
      }

      // 직접 지정한 색이 있으면 그 색으로, 비어 있으면 원래 CSS 색 그대로.
      글자색_(titleEl, banner.titleColor);
      글자색_(leadEl, banner.subtitleColor);
      오버레이_(document.querySelector('.hero-overlay'), banner.overlayColor, banner.overlayEnabled);
      단추색목록.forEach(function (row) { 단추색_(row[0], row[1], row[2]); });
    }, function () {
      if (순번 !== 적용횟수_) return;
      // 7초가 지났습니다. 받은 만큼은 보여 주되 글자색·막은 아직 바꾸지 않습니다.
      // 늦게라도 도착하면 위 함수가 그때 불려서 한 번에 맞춰집니다.
      if (band) band.classList.remove('hero-hold');
    });
  }

  // 배너 한 표만 오면 그립니다. 나머지 표(강사·FAQ·후기 등)는 안 기다립니다.
  // 없는 옛 저장소와 같이 쓸 수 있게, readyBanners 가 없으면 예전처럼 ready 를 씁니다.
  var 배너대기_ = typeof store.readyBanners === 'function' ? store.readyBanners() : store.ready();
  배너대기_.then(apply).catch(function (error) {
    // 자료를 못 불러와도 화면은 poster 로 남습니다. 조용히 넘어갑니다.
    if (global.console && console.warn) console.warn('[디어데이] 히어로 배너를 불러오지 못했습니다.', error);
  });
  if (store.subscribe) store.subscribe(apply);
})(window);
