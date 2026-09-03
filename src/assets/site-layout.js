(function (global) {
  'use strict';

  // 디어데이클래스 · 공용 뼈대
  //
  // 페이지 9장에 똑같이 들어 있던 여섯 덩이를 여기 한 벌만 두고 꽂아 넣습니다.
  //   머리(메뉴) · 꼬리 · 모바일 하단 메뉴 · [더보기] 시트 · [맨 위로] · 알림창
  // 페이지에는 <div data-site-nav></div> 처럼 자리만 남깁니다.
  //
  // 지금 어느 메뉴가 켜져 있는지는 주소를 보고 스스로 붙입니다(markActive).
  // 홈에서는 /#promise 같은 링크를 #promise 로 바꿔, 새로 열지 않고 그 자리에서 내려갑니다.

  var NAV_HTML = "<header class=\"nav\" id=\"nav\"><div class=\"wrap nav-inner\"><a class=\"brand\" href=\"/\" aria-label=\"dearday class 홈\"><img src=\"/images/common-03.png\" alt=\"dearday class\"></a><nav class=\"nav-menu\" id=\"navMenu\"><a href=\"/#promise\" data-nav-key=\"about\">브랜드소개</a><a href=\"/events/\" data-nav-key=\"events\">행사신청</a><a href=\"/event-review/\" data-nav-key=\"review\">이벤트</a><a href=\"/#reviews\" data-nav-key=\"reviews\">참석후기</a><a href=\"/#faq\" data-nav-key=\"faq\">FAQ</a></nav></div></header>";
  var FOOTER_HTML = "<footer id=\"contact\">\n  <div class=\"wrap foot-top\">\n    <div class=\"foot-brand\"><img src=\"/images/common-26.png\" alt=\"디어데이클래스\"></div>\n    <nav class=\"foot-links\" aria-label=\"정책 링크\">\n      <a href=\"#\" class=\"js-policy-link\">개인정보처리방침</a>\n      <a href=\"#\" class=\"js-terms-link\">이용약관</a>\n    </nav>\n  </div>\n  <div class=\"wrap\">\n    <div class=\"foot-rule\"></div>\n    <div class=\"foot-bottom\">\n      <div class=\"biz\">\n        상호: 디어데이<span class=\"sep\">|</span>대표자: 김영주<span class=\"sep\">|</span>사업자번호: 352-88-01460<br>\n        대표전화: 010-5078-5221<span class=\"sep\">|</span>통신판매업: 2022-서울 영등포-2072<br>\n        서울특별시 영등포구 문래로 89 문래비즈타워 7층\n      </div>\n      <span class=\"copy\">&copy; 2026 디어데이클래스 (dearday class)</span>\n    </div>\n  </div>\n</footer>";
  var TABBAR_HTML = "<nav class=\"mobile-tabbar\" aria-label=\"모바일 하단 메뉴\">\n  <a href=\"/\" class=\"mt-item\" data-tab-key=\"home\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 10.5 12 3l9 7.5\"/><path d=\"M5 9.5V21h14V9.5\"/></svg><span>홈</span></a>\n  <a href=\"/event-review/\" class=\"mt-item\" data-tab-key=\"review\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M3 9.5h18\"/><path d=\"M8 3v4M16 3v4\"/></svg><span>이벤트</span></a>\n  <a href=\"/events/\" class=\"mt-item mt-main\" data-tab-key=\"events\"><span class=\"mt-main-ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z\"/><path d=\"M10 8v8\" stroke-dasharray=\"2 2\"/></svg></span><span>신청하기</span></a>\n  <a href=\"/#reviews\" class=\"mt-item\" data-tab-key=\"reviews\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z\"/></svg><span>후기</span></a>\n  <button type=\"button\" class=\"mt-item\" id=\"mtMoreBtn\" aria-haspopup=\"true\" aria-expanded=\"false\"><svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><circle cx=\"5\" cy=\"12\" r=\"1.8\"/><circle cx=\"12\" cy=\"12\" r=\"1.8\"/><circle cx=\"19\" cy=\"12\" r=\"1.8\"/></svg><span>더보기</span></button>\n</nav>";
  var MORE_SHEET_HTML = "<div class=\"mt-more-sheet\" id=\"mtMoreSheet\" hidden>\n  <div class=\"mt-more-links\">\n    <a href=\"/#promise\">브랜드소개</a>\n    <a href=\"/#faq\">FAQ</a>\n  </div>\n  <div class=\"mt-more-quick\">\n    <a href=\"https://www.instagram.com/dearday.class/\" target=\"_blank\" rel=\"noopener\" aria-label=\"인스타그램\"><span class=\"mq-ic ig\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.4\" cy=\"6.6\" r=\"1.1\" fill=\"#fff\" stroke=\"none\"/></svg></span><span>인스타그램</span></a>\n    <a href=\"https://blog.naver.com/deardayclass\" target=\"_blank\" rel=\"noopener\" aria-label=\"네이버 블로그\"><span class=\"mq-ic naver\">N</span><span>네이버 블로그</span></a>\n    <a href=\"https://pf.kakao.com/_SBxoqX\" target=\"_blank\" rel=\"noopener\" aria-label=\"카카오톡\"><span class=\"mq-ic kakao\"><svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" aria-hidden=\"true\"><path fill=\"#391B1B\" d=\"M12 4.2C6.9 4.2 2.8 7.4 2.8 11.3c0 2.5 1.7 4.7 4.2 6-0.2 0.7-1 3.3-1.1 3.6 0 0-0.1 0.3 0.1 0.4 0.2 0.1 0.4 0 0.4 0 0.3-0.1 3.6-2.4 4.2-2.8 0.5 0.1 1 0.1 1.4 0.1 5.1 0 9.2-3.2 9.2-7.3S17.1 4.2 12 4.2z\"/></svg></span><span>카카오톡</span></a>\n  </div>\n</div>";
  var TOP_FAB_HTML = "<button class=\"top-fab\" id=\"topFab\" aria-label=\"맨 위로\">\n  <svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"var(--magenta)\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"5\"/><polyline points=\"6 11 12 5 18 11\"/></svg>\n</button>";
  var SITE_ALERT_HTML = "<div class=\"modal\" id=\"siteAlert\" hidden>\n  <div class=\"modal-backdrop\" data-close></div>\n  <div class=\"modal-card alert-card\" role=\"alertdialog\" aria-modal=\"true\">\n    <div class=\"done-ic alert-ic\">!</div>\n    <p class=\"alert-msg\" id=\"siteAlertMsg\"></p>\n    <button type=\"button\" class=\"modal-submit\" id=\"siteAlertClose\">확인</button>\n  </div>\n</div>";

  // 주소 → 켜야 할 메뉴
  function currentKeys() {
    var path = String(global.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/index.html') return { nav: '', tab: 'home' };
    if (path === '/events' || path === '/events/index.html') return { nav: 'events', tab: 'events' };
    if (path === '/event-review' || path === '/event-review/index.html') return { nav: 'review', tab: 'review' };
    // 개별 행사 상세 — 메뉴는 [행사신청] 을 켜고, 하단 메뉴는 아무것도 켜지 않습니다(지금과 같음).
    if (path.indexOf('/event-') === 0) return { nav: 'events', tab: '' };
    return { nav: '', tab: '' };
  }

  function isHome() {
    var path = String(global.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    return path === '/' || path === '/index.html';
  }

  function build(html) {
    var box = document.createElement('div');
    box.innerHTML = html;
    return box.firstElementChild;
  }

  // 자리가 있으면 그 자리에, 없으면 body 끝에 붙입니다.
  // 머리와 꼬리는 흐름 안에 있어 자리가 꼭 필요하고,
  // 하단 메뉴·시트·[맨 위로]·알림창은 화면에 고정되는 것이라 자리가 어디든 같습니다.
  function mount(selector, html, appendIfMissing) {
    var node = build(html);
    if (!node) return null;
    var target = document.querySelector(selector);
    if (target) {
      target.parentNode.replaceChild(node, target);
      return node;
    }
    if (!appendIfMissing || !document.body) return null;
    document.body.appendChild(node);
    return node;
  }

  // 이미 붙인 뒤에 뒤늦게 나타난 빈 자리를 치웁니다.
  function dropLeftoverMounts() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-site-tabbar],[data-site-more-sheet],[data-site-top-fab],[data-site-alert]'),
      function (node) { if (!node.firstElementChild) node.parentNode.removeChild(node); });
  }

  // 홈에서는 같은 페이지 안 이동이라 /# 를 # 로 바꿔 줍니다.
  function localizeAnchors(root) {
    if (!root || !isHome()) return;
    Array.prototype.forEach.call(root.querySelectorAll('a[href^="/#"]'), function (link) {
      link.setAttribute('href', link.getAttribute('href').slice(1));
    });
    Array.prototype.forEach.call(root.querySelectorAll('a.brand[href="/"]'), function (link) {
      link.setAttribute('href', '#nav');
    });
  }

  function markActive() {
    var keys = currentKeys();
    var nav = document.getElementById('nav');
    if (nav) {
      Array.prototype.forEach.call(nav.querySelectorAll('[data-nav-key]'), function (link) {
        link.classList.toggle('active', !!keys.nav && link.getAttribute('data-nav-key') === keys.nav);
      });
    }
    var tabbar = document.querySelector('.mobile-tabbar');
    if (tabbar) {
      Array.prototype.forEach.call(tabbar.querySelectorAll('[data-tab-key]'), function (link) {
        link.classList.toggle('active', !!keys.tab && link.getAttribute('data-tab-key') === keys.tab);
      });
    }
  }

  function renderNav() {
    if (document.getElementById('nav')) { markActive(); return; }
    var node = mount('[data-site-nav]', NAV_HTML);
    localizeAnchors(node);
    markActive();
  }

  function renderFooter() {
    if (document.getElementById('contact')) return;
    localizeAnchors(mount('[data-site-footer]', FOOTER_HTML));
  }

  function renderChrome() {
    if (!document.querySelector('.mobile-tabbar')) {
      localizeAnchors(mount('[data-site-tabbar]', TABBAR_HTML, true));
      markActive();
    }
    if (!document.getElementById('mtMoreSheet')) localizeAnchors(mount('[data-site-more-sheet]', MORE_SHEET_HTML, true));
    if (!document.getElementById('topFab')) mount('[data-site-top-fab]', TOP_FAB_HTML, true);
    if (!document.getElementById('siteAlert')) mount('[data-site-alert]', SITE_ALERT_HTML, true);
    dropLeftoverMounts();
  }

  function renderAll() {
    renderNav();
    renderFooter();
    renderChrome();
  }

  global.DeardayLayout = {
    renderAll: renderAll,
    renderNav: renderNav,
    renderFooter: renderFooter,
    renderChrome: renderChrome,
    markActive: markActive
  };

  renderAll();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  }
})(window);
