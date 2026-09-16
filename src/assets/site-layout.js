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
  // 하단 [더보기] — 리더스 mt-drawer 와 같은 "메뉴" 입니다.
  // SNS 바로가기는 오른쪽 아래 [+] 단추(QUICK_RAIL_HTML)로 옮겼습니다.
  var MORE_SHEET_HTML = "<div class=\"mt-more-wrap\">\n  <div class=\"mt-more-overlay\" id=\"mtMoreOverlay\"></div>\n  <aside class=\"mt-more-sheet\" id=\"mtMoreSheet\" role=\"dialog\" aria-modal=\"true\" aria-label=\"메뉴\" hidden>\n    <div class=\"mt-more-head\"><span>메뉴</span><button class=\"mt-more-close\" id=\"mtMoreClose\" type=\"button\" aria-label=\"메뉴 닫기\"><svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6L6 18\"/></svg></button></div>\n    <nav class=\"mt-more-links\">\n      <a href=\"/#promise\" data-nav-key=\"about\">브랜드소개</a>\n      <a href=\"/events/\" data-nav-key=\"events\">행사신청</a>\n      <a href=\"/event-review/\" data-nav-key=\"review\">이벤트</a>\n      <a href=\"/#reviews\" data-nav-key=\"reviews\">참석후기</a>\n      <a href=\"/#faq\" data-nav-key=\"faq\">FAQ</a>\n    </nav>\n  </aside>\n</div>";
  var TOP_FAB_HTML = "<button class=\"top-fab\" id=\"topFab\" aria-label=\"맨 위로\">\n  <svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"var(--magenta)\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"5\"/><polyline points=\"6 11 12 5 18 11\"/></svg>\n</button>";
  // 오른쪽 아래 [+] — 리더스 quick-links 와 같은 자리·같은 역할입니다.
  // 누르면 SNS 바로가기가 위로 펼쳐집니다.
  var QUICK_RAIL_HTML = "<div class=\"qr\" id=\"quickRail\">\n  <nav class=\"qr-links\" id=\"quickRailLinks\" aria-label=\"SNS 바로가기\" hidden>\n    <a href=\"https://www.instagram.com/dearday.class/\" target=\"_blank\" rel=\"noopener\" aria-label=\"인스타그램\"><span class=\"qr-ic ig\"><svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.4\" cy=\"6.6\" r=\"1.1\" fill=\"#fff\" stroke=\"none\"/></svg></span></a>\n    <a href=\"https://blog.naver.com/deardayclass\" target=\"_blank\" rel=\"noopener\" aria-label=\"네이버 블로그\"><span class=\"qr-ic naver\">N</span></a>\n    <a href=\"https://pf.kakao.com/_SBxoqX\" target=\"_blank\" rel=\"noopener\" aria-label=\"카카오톡\"><span class=\"qr-ic kakao\"><svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" aria-hidden=\"true\"><path fill=\"#391B1B\" d=\"M12 4.2C6.9 4.2 2.8 7.4 2.8 11.3c0 2.5 1.7 4.7 4.2 6-0.2 0.7-1 3.3-1.1 3.6 0 0-0.1 0.3 0.1 0.4 0.2 0.1 0.4 0 0.4 0 0.3-0.1 3.6-2.4 4.2-2.8 0.5 0.1 1 0.1 1.4 0.1 5.1 0 9.2-3.2 9.2-7.3S17.1 4.2 12 4.2z\"/></svg></span></a>\n  </nav>\n  <button class=\"qr-toggle\" id=\"quickRailToggle\" type=\"button\" aria-label=\"빠른 메뉴 열기\" aria-expanded=\"false\">\n    <svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"none\" stroke=\"var(--magenta)\" stroke-width=\"2.4\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M12 5v14M5 12h14\"/></svg>\n  </button>\n</div>";

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
    // 홈에서 로고를 누르면 새로 불러오지 않고 맨 위로 올립니다.
    // 예전에는 href 를 '#nav' 로 바꿨는데, 네비바가 position:sticky 라
    // 늘 화면 맨 위에 있어서 스크롤 대상이 되지 못했습니다.
    // 그래서 주소만 #nav 로 바뀌고 화면은 그대로 있었습니다.
    // href 는 '/' 로 남겨 둡니다. 가운데 클릭·[새 탭에서 열기] 는 계속 됩니다.
    Array.prototype.forEach.call(root.querySelectorAll('a.brand[href="/"]'), function (link) {
      if (link.getAttribute('data-brand-top') === '1') return;
      link.setAttribute('data-brand-top', '1');
      link.addEventListener('click', function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        if (global.location.hash) {
          try {
            global.history.pushState(null, '', global.location.pathname + global.location.search);
          } catch (error) {
            global.location.hash = '';
          }
        }
        global.scrollTo({ top: 0, behavior: 'smooth' });
      });
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

  // [+] 빠른 메뉴와 오른쪽 아래 단추들의 자리를 정합니다.
  // 한 군데서만 정의해 네 페이지가 같은 값을 씁니다.
  //
  // 아래에서부터 : [상담] [TOP] [+] [SNS 펼침]
  // 상담 버튼이 꺼져 있으면(body.chat-off) 한 칸씩 내려가 빈 자리가 남지 않습니다.
  var QUICK_RAIL_CSS = [
    ':root{--qr-base:84px;--qr-gap:56px;}',

    /* ── 오른쪽 아래 단추들 ────────────────────────────────
       아래에서부터 [상담] [TOP] [+] 순서로 쌓입니다.
       상담이 꺼져 있거나(body.chat-off) TOP 이 아직 안 나왔으면(body.topfab-on 없음)
       그만큼 한 칸씩 내려가 빈 자리가 남지 않습니다. */
    '.qr{position:fixed;right:19px;z-index:152;display:none;flex-direction:column;align-items:center;gap:10px;}',
    '@media(max-width:640px){',
    '  .qr{display:flex;}',
    /* 아래 칸 수 = (상담 있으면 1) + (TOP 나와 있으면 1) */
    '  .qr{bottom:calc(var(--qr-base) + var(--qr-gap));}',                                  /* 상담만 */
    '  body.chat-off .qr{bottom:var(--qr-base);}',                                          /* 아무것도 없음 */
    '  body.topfab-on .qr{bottom:calc(var(--qr-base) + var(--qr-gap) * 2);}',               /* 상담 + TOP */
    '  body.chat-off.topfab-on .qr{bottom:calc(var(--qr-base) + var(--qr-gap));}',          /* TOP 만 */
    '  .top-fab{bottom:calc(var(--qr-base) + var(--qr-gap)) !important;}',
    '  body.chat-off .top-fab{bottom:var(--qr-base) !important;}',
    '  .rail{display:none !important;}',
    '}',
    '.qr-toggle{width:46px;height:46px;border-radius:50%;background:#fff;border:1.5px solid var(--magenta-soft);',
    '  display:grid;place-items:center;cursor:pointer;box-shadow:0 12px 26px -12px rgba(216,30,99,.3);',
    '  transition:transform .25s ease;-webkit-tap-highlight-color:transparent;}',
    '.qr-toggle[aria-expanded="true"]{transform:rotate(45deg);}',
    // 색은 CSS 로 줍니다. svg 의 stroke 속성에 var() 를 쓰면 안 먹는 브라우저가 있습니다.
    '.qr-toggle svg{stroke:var(--magenta);}',
    '.qr-links{display:flex;flex-direction:column;gap:10px;align-items:center;margin:0;padding:0;}',
    '.qr-links[hidden]{display:none;}',
    '.qr-links a{display:block;}',
    '.qr-ic{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;',
    '  box-shadow:0 12px 26px -12px rgba(60,40,46,.4);}',
    '.qr-ic.ig{background:linear-gradient(45deg,#feda75 5%,#fa7e1e 30%,#d62976 55%,#962fbf 78%,#4f5bd5 100%);}',
    '.qr-ic.naver{background:#03C75A;color:#fff;font-weight:900;font-size:1.25rem;line-height:1;font-family:Arial,Helvetica,sans-serif;}',
    '.qr-ic.kakao{background:#FAE100;}',

    /* ── [더보기] 메뉴 — 리더스 mt-drawer 와 같은 모양입니다.
       옆에서 밀려 나오는 세로 메뉴이고, 뒤는 어둡게 덮습니다. */
    '.mt-more-overlay{display:none;position:fixed;inset:0;z-index:210;background:rgba(40,20,28,.45);',
    '  opacity:0;pointer-events:none;transition:opacity .25s ease;}',
    'body.more-open .mt-more-overlay{display:block;opacity:1;pointer-events:auto;}',
    '.mt-more-sheet{display:flex;flex-direction:column;position:fixed;top:0;bottom:0;right:0;left:auto;',
    '  z-index:215;width:min(82vw,320px);background:#fff;border:0;border-radius:0;overflow-y:auto;',
    '  box-shadow:-12px 0 32px rgba(60,40,46,.18);transform:translateX(100%);',
    '  transition:transform .3s cubic-bezier(.22,1,.36,1);}',
    '.mt-more-sheet[hidden]{display:flex;}',
    '.mt-more-sheet.open{transform:translateX(0);}',
    '.mt-more-head{display:flex;align-items:center;justify-content:space-between;padding:20px 18px;',
    '  border-bottom:1px solid var(--line);font-size:1rem;font-weight:800;color:var(--ink);}',
    '.mt-more-close{display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:8px;',
    '  background:transparent;color:var(--ink-2);cursor:pointer;-webkit-tap-highlight-color:transparent;}',
    '.mt-more-close:hover{background:var(--pink-tint,#FFF2F7);color:var(--magenta);}',
    '.mt-more-links{display:flex;flex-direction:column;padding:8px 10px 24px;border:0;}',
    '.mt-more-sheet a{display:block;flex:none;text-align:left;padding:14px 12px;border:0;border-radius:10px;',
    '  font-size:.95rem;font-weight:700;color:var(--ink);text-decoration:none;}',
    '.mt-more-sheet a:hover{background:var(--pink-tint,#FFF2F7);color:var(--magenta-deep);}'
  ].join('\n');

  function ensureQuickRailStyles() {
    if (document.getElementById('quickRailStyle')) return;
    var style = document.createElement('style');
    style.id = 'quickRailStyle';
    style.textContent = QUICK_RAIL_CSS;
    document.head.appendChild(style);
  }

  function wireQuickRail() {
    var toggle = document.getElementById('quickRailToggle');
    var links = document.getElementById('quickRailLinks');
    if (!toggle || !links || toggle.__wired) return;
    toggle.__wired = true;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      toggle.setAttribute('aria-label', open ? '빠른 메뉴 열기' : '빠른 메뉴 닫기');
      links.hidden = open;
    });
    // 바깥을 누르면 닫습니다.
    document.addEventListener('click', function (event) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (event.target.closest && event.target.closest('#quickRail')) return;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '빠른 메뉴 열기');
      links.hidden = true;
    });
  }

  // [더보기] 메뉴의 닫기 단추. 여닫기 자체는 mobile-tabbar.js 가 맡습니다.
  function wireMoreSheet() {
    var close = document.getElementById('mtMoreClose');
    if (!close || close.__wired) return;
    close.__wired = true;
    close.addEventListener('click', function (event) {
      event.stopPropagation();
      var sheet = document.getElementById('mtMoreSheet');
      var btn = document.getElementById('mtMoreBtn');
      if (sheet) { sheet.classList.remove('open'); sheet.hidden = true; }
      if (btn) btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('more-open');
    });
  }

  function renderChrome() {
    if (!document.querySelector('.mobile-tabbar')) {
      localizeAnchors(mount('[data-site-tabbar]', TABBAR_HTML, true));
      markActive();
    }
    if (!document.getElementById('mtMoreSheet')) localizeAnchors(mount('[data-site-more-sheet]', MORE_SHEET_HTML, true));
    if (!document.getElementById('topFab')) mount('[data-site-top-fab]', TOP_FAB_HTML, true);
    ensureQuickRailStyles();
    if (!document.getElementById('quickRail')) mount('[data-site-quick-rail]', QUICK_RAIL_HTML, true);
    wireQuickRail();
    wireMoreSheet();
    if (!document.getElementById('siteAlert')) mount('[data-site-alert]', SITE_ALERT_HTML, true);
    dropLeftoverMounts();
  }

  // [이벤트] 메뉴는 관리자에서 켜 두었을 때만 둡니다.
  //   관리자 [홈페이지 관리 > 이벤트] 의 "이 브랜드에서 이벤트 페이지 사용"
  //   -> sites 표의 event_page_enabled 칸
  //
  // 이 파일은 Supabase 를 직접 읽지 않습니다. 설정을 읽는 화면(SiteContentStore 를
  // 불러온 화면)에서만 손댑니다. 못 읽는 화면에서는 메뉴를 그대로 둡니다 —
  // 모르면서 지워 버리는 쪽이 더 나쁩니다.
  function isEventPath() {
    var path = String(location.pathname || '').replace(/\/+$/, '') || '/';
    return path === '/event-review' || path === '/event-review/index.html';
  }

  function applyEventMenu() {
    var store = global.SiteContentStore;
    if (!store || typeof store.isEventPageEnabled !== 'function') return;
    var paint = function () {
      var on = store.isEventPageEnabled() === true;
      var links = document.querySelectorAll('[data-nav-key="review"], [data-tab-key="review"]');
      for (var i = 0; i < links.length; i++) {
        links[i].hidden = !on;
        links[i].style.display = on ? '' : 'none';
      }
      // 꺼져 있는데 주소로 바로 들어온 경우에는 첫 화면으로 보냅니다.
      if (!on && isEventPath()) location.replace('/');
    };
    if (typeof store.ready === 'function') store.ready().then(paint).catch(function () {});
    else paint();
    if (typeof store.subscribe === 'function') store.subscribe(paint);
  }

  // 우측 하단 상담 단추 — 관리자 [홈페이지 관리] → [상담 버튼] 에서 켜야 나옵니다.
  // 페이지에는 display:none 으로 박혀 있고, 켜져 있을 때만 풀어 줍니다.
  // 그래서 꺼져 있을 때 잠깐 떴다 사라지는 일이 없습니다.
  function applyChatButton() {
    var store = global.SiteContentStore;
    if (!store || typeof store.isChatButtonEnabled !== 'function') return;
    var paint = function () {
      var on = store.isChatButtonEnabled() === true;
      var nodes = document.querySelectorAll('#ctLauncher, .ct-launcher');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].style.display = on ? '' : 'none';
      }
      // 꺼져 있으면 그 자리를 다른 단추들이 쓰게 합니다(빈 자리가 남지 않게).
      document.body.classList.toggle('chat-off', !on);
      // 단추를 껐는데 대화창이 열려 있으면 같이 닫습니다.
      if (!on) {
        var box = document.getElementById('chatbot');
        if (box) box.hidden = true;
      }
    };
    if (typeof store.ready === 'function') store.ready().then(paint).catch(function () {});
    else paint();
    if (typeof store.subscribe === 'function') store.subscribe(paint);
  }

  // ── 해시로 들어왔을 때 자리 맞추기 ────────────────────────────────
  //
  // 주소에 #promise · #reviews · #faq 가 붙어 있으면 브라우저는 HTML 을 읽자마자
  // 그 자리로 뜁니다. 그런데 그보다 위에 있는 것들은 그 뒤에 채워집니다 —
  // 행사 목록(Supabase), 갤러리 그림, 히어로 영상, 그리고 후기·FAQ 도 그렇습니다.
  // 위가 자라면 목표가 아래로 밀리는데 브라우저는 다시 맞춰 주지 않습니다.
  //
  // 실측 — /#reviews 로 들어가면 849 ~ 1286px 어긋났습니다. 들어갈 때마다 달랐습니다.
  // 같은 페이지 안에서 누를 때는 이미 다 채워져 있어서 문제가 없었습니다.
  //
  // 그래서 높이가 더 안 바뀔 때까지 지켜보며 따라 붙습니다.
  // 자리는 같은 페이지에서 누를 때와 똑같이 잡습니다(칸 맨 위를 화면 맨 위로).
  // 그동안 사람이 직접 스크롤하면 그 뜻이 우선이라 바로 멈춥니다.
  var ANCHOR_STEP_MS = 120;     // 얼마나 자주 다시 재는지
  var ANCHOR_STEADY_MS = 480;   // 높이가 이만큼 그대로면 다 자란 것으로 봅니다
  var ANCHOR_GIVEUP_MS = 3000;  // 아무리 늦어도 여기서 그만둡니다

  function anchorTarget() {
    var hash = String(global.location.hash || '');
    if (!hash || hash === '#') return null;
    var id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch (error) { /* 그대로 씁니다 */ }
    return id ? document.getElementById(id) : null;
  }

  function settleAnchor() {
    var target = anchorTarget();
    if (!target) return;

    var startedAt = Date.now();
    var lastHeight = -1;
    var steadyFor = 0;
    var timer = null;
    var stopped = false;

    function stop() {
      if (stopped) return;
      stopped = true;
      if (timer) { clearTimeout(timer); timer = null; }
      ['wheel', 'touchstart', 'keydown'].forEach(function (type) {
        global.removeEventListener(type, stop);
      });
    }

    // 사람이 손대면 바로 물러납니다.
    ['wheel', 'touchstart', 'keydown'].forEach(function (type) {
      global.addEventListener(type, stop, { passive: true });
    });

    function step() {
      if (stopped) return;
      var height = document.documentElement.scrollHeight;
      if (height === lastHeight) steadyFor += ANCHOR_STEP_MS;
      else { steadyFor = 0; lastHeight = height; }

      var top = target.getBoundingClientRect().top + (global.pageYOffset || 0);
      // behavior:'auto' — html 의 scroll-behavior:smooth 를 여기서만 끕니다.
      // 안 그러면 따라붙을 때마다 화면이 미끄러져 어지럽습니다.
      global.scrollTo({ top: Math.max(0, Math.round(top)), behavior: 'auto' });

      if (steadyFor >= ANCHOR_STEADY_MS || Date.now() - startedAt > ANCHOR_GIVEUP_MS) return stop();
      timer = setTimeout(step, ANCHOR_STEP_MS);
    }

    step();
  }

  function renderAll() {
    renderNav();
    renderFooter();
    renderChrome();
    applyEventMenu();
    applyChatButton();
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

  // 해시 자리 맞추기는 화면이 한 번 그려진 뒤에 시작합니다.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', settleAnchor);
  } else {
    settleAnchor();
  }
})(window);
