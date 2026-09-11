(function (global) {
  'use strict';

  // 히어로의 1차·2차 단추를 관리자에서 정한 값에 맞춥니다.
  // 세 저장소가 같은 파일을 씁니다. 관리자에서 고른 것이 어느 브랜드에서나
  // 같게 나오도록 한 벌만 둡니다.
  //
  // 왜 한 벌로 모았나
  //   예전에는 사이트마다 방식이 달랐습니다. 디어데이는 2차 단추가 없으면
  //   1차를 본떠 만들어 넣었고, 리더스는 페이지에 이미 있는 두 번째 링크를
  //   고쳐 썼습니다. 그래서 단추가 하나뿐인 페이지에서는 관리자에서 2차를
  //   켜도 화면에 나오지 않았습니다. 새 브랜드를 붙일 때 걸릴 자리였습니다.
  //   이제 어느 쪽이든 없으면 만들어 넣습니다.
  //
  // 쓰는 법
  //   BannerCta.apply(단추를담은칸, banner, {
  //     resolveUrl: function (값, 기본값) { ... },   // 주소 다듬기. 없으면 값 그대로
  //     applyColor: function (단추, 글자색, 배경색) { ... }, // 없으면 style 로 넣습니다
  //     fallbackPrimaryUrl / fallbackSecondaryUrl        // 주소가 비었을 때 쓸 값
  //   });

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function defaultColor(el, textColor, bgColor) {
    if (!el) return;
    var ok = function (v) {
      var raw = text(v);
      return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw) ? raw : '';
    };
    el.style.color = ok(textColor);
    el.style.backgroundColor = ok(bgColor);
  }

  // 칸 안에서 1차·2차 단추를 찾습니다. 2차는 표시(data-cta-secondary)가 붙은
  // 것을 먼저 보고, 없으면 두 번째 링크를 씁니다.
  function findLinks(container) {
    var all = [].slice.call(container.querySelectorAll('a'));
    var marked = container.querySelector('[data-cta-secondary]');
    var primary = null;
    for (var i = 0; i < all.length; i += 1) {
      if (all[i] !== marked) { primary = all[i]; break; }
    }
    var secondary = marked;
    if (!secondary) {
      for (var j = 0; j < all.length; j += 1) {
        if (all[j] !== primary) { secondary = all[j]; break; }
      }
    }
    return { primary: primary, secondary: secondary };
  }

  // 2차 단추가 없으면 1차를 본떠 만들어 넣습니다.
  function makeSecondary(container, primary, options) {
    var el = document.createElement('a');
    el.className = options.secondaryClass || (primary ? primary.className : 'btn');
    el.setAttribute('data-cta-secondary', '');
    container.appendChild(el);
    return el;
  }

  function apply(container, banner, options) {
    if (!container || !banner) return;
    var opts = options || {};
    var resolveUrl = typeof opts.resolveUrl === 'function'
      ? opts.resolveUrl
      : function (value, fallback) { return text(value) || fallback || '#'; };
    var color = typeof opts.applyColor === 'function' ? opts.applyColor : defaultColor;

    var found = findLinks(container);
    var primary = found.primary;
    var secondary = found.secondary;

    if (primary) {
      if (text(banner.primaryLabel)) primary.textContent = banner.primaryLabel;
      primary.setAttribute('href', resolveUrl(banner.primaryUrl, opts.fallbackPrimaryUrl || primary.getAttribute('href') || '#'));
      primary.style.display = banner.primaryEnabled === false ? 'none' : '';
      color(primary, banner.primaryTextColor, banner.primaryBgColor);
    }

    var wantSecondary = banner.secondaryEnabled !== false && !!text(banner.secondaryLabel);
    if (wantSecondary && !secondary) secondary = makeSecondary(container, primary, opts);

    if (secondary) {
      if (!wantSecondary) {
        secondary.style.display = 'none';
      } else {
        secondary.textContent = banner.secondaryLabel;
        secondary.setAttribute('href', resolveUrl(banner.secondaryUrl, opts.fallbackSecondaryUrl || secondary.getAttribute('href') || '#'));
        secondary.style.display = '';
        color(secondary, banner.secondaryTextColor, banner.secondaryBgColor);
      }
    }
  }

  global.BannerCta = { apply: apply, findLinks: findLinks };
})(window);
