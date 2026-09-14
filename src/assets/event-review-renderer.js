(function (global) {
  'use strict';

  // /event-review/ 의 이벤트 카드를 site_events 표에서 그립니다.
  //
  // 예전에는 카드 여덟 장이 HTML 에 그대로 박혀 있었습니다. 그때는
  //   - 종료 여부를 제목의 'N월' 을 정규식으로 뽑아 계산했고
  //   - 라이트박스 아래 단추를 이미지의 alt 글자로 골랐습니다
  // 둘 다 글자를 조금만 고쳐도 어긋났습니다.
  // 이제 셋 다 관리자 [홈페이지 관리 > 이벤트] 의 칸에서 옵니다.

  var ENDED_BADGE = '/images/event-review-02.png';

  var store = global.SiteContentStore;
  var media = global.DeardayPublicMedia;
  var utils = global.AiLeadersSupabase || {};
  var esc = utils.escapeHtml || function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // Supabase 저장소 주소는 우리 도메인 중계 주소로 바꿉니다(public-media-overrides.js).
  function assetUrl(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    return media && typeof media.resolve === 'function' ? media.resolve(raw) : raw;
  }

  function renderHead(page) {
    var head = document.querySelector('.page-head .wrap');
    if (!head || !page) return;
    var hasAny = page.eyebrow || page.titleLead || page.titleAccent || page.description;
    if (!hasAny) return;   // 관리자에 값이 없으면 페이지에 적힌 문구를 그대로 둡니다
    var html = '';
    if (page.eyebrow) html += '<span class="eyebrow">' + esc(page.eyebrow) + '</span>';
    html += '<h1>' + esc(page.titleLead || '')
          + (page.titleAccent ? '<span class="mg">' + esc(page.titleAccent) + '</span>' : '')
          + '</h1>';
    if (page.description) html += '<p>' + esc(page.description) + '</p>';
    head.innerHTML = html;
  }

  function cardHtml(item, ended) {
    var src = assetUrl(item.imageUrl);
    var extra = assetUrl(item.extraImageUrl);
    var title = item.title || '';
    return '<div class="rv-item' + (ended ? ' is-ended' : '') + '" data-cat="' + (ended ? '종료' : '진행중') + '">'
      + '<div class="rv-imgwrap">'
      + '<img src="' + esc(src) + '" alt="' + esc(title) + '"'
      + (extra ? ' data-extra="' + esc(extra) + '"' : '')
      + ' data-cta="' + esc(item.ctaKind || 'none') + '" loading="lazy">'
      + '<img class="rv-ended-badge" src="' + ENDED_BADGE + '" alt="이벤트 종료" loading="lazy">'
      + '</div>'
      + '<h3>' + esc(title) + '</h3>'
      + '</div>';
  }

  function renderCards(items) {
    var list = document.querySelector('.revent-list');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<p class="rv-empty">준비 중인 이벤트가 없습니다.</p>';
      return;
    }
    list.innerHTML = items.map(function (item) {
      return cardHtml(item, store.isEventEnded(item));
    }).join('');
  }

  // 위쪽 [전체 / 진행중 이벤트 / 종료된 이벤트] 단추
  function wireTabs() {
    var tabs = [].slice.call(document.querySelectorAll('.tabs .tab'));
    if (!tabs.length) return;
    var filter = function (cat) {
      [].forEach.call(document.querySelectorAll('.revent-list .rv-item'), function (card) {
        card.style.display = (cat === '전체' || card.dataset.cat === cat) ? '' : 'none';
      });
    };
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (other) { other.classList.remove('active'); other.removeAttribute('aria-selected'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        filter(tab.dataset.cat);
      });
    });
    var active = document.querySelector('.tabs .tab.active');
    filter(active ? active.dataset.cat : '전체');
  }

  // 카드를 누르면 큰 이미지가 열립니다. 아래 단추는 카드의 data-cta 가 정합니다.
  function wireLightbox(page) {
    var lb = document.getElementById('lightbox');
    var lbImgs = document.getElementById('lbImgs');
    if (!lb || !lbImgs) return;

    var kakao = document.getElementById('lbKakao');
    var insta = lb.querySelector('.lb-insta');
    if (kakao && page && page.kakaoUrl) kakao.setAttribute('href', page.kakaoUrl);
    if (insta && page && page.instagramUrl) insta.setAttribute('href', page.instagramUrl);

    function open(img) {
      var extra = img.dataset.extra;
      var srcs = extra ? [img.currentSrc || img.src, extra] : [img.currentSrc || img.src];
      var cta = img.dataset.cta || 'none';
      lb.classList.toggle('show-kakao', cta === 'kakao');
      lb.classList.toggle('show-sns', cta === 'sns');
      lb.classList.toggle('has-multi', srcs.length > 1);
      lbImgs.innerHTML = '';
      srcs.forEach(function (src) {
        var el = document.createElement('img');
        el.src = src;
        el.alt = img.alt || '';
        lbImgs.appendChild(el);
      });
      lb.hidden = false;
      document.body.classList.add('lb-open');
    }
    function close() {
      lb.hidden = true;
      document.body.classList.remove('lb-open');
      lb.classList.remove('show-kakao');
      lb.classList.remove('show-sns');
      lb.classList.remove('has-multi');
      lbImgs.innerHTML = '';
    }

    // 카드는 나중에 그려지므로 목록 전체에 한 번만 걸어 둡니다.
    var list = document.querySelector('.revent-list');
    if (list) {
      list.addEventListener('click', function (event) {
        var img = event.target;
        if (!img || img.tagName !== 'IMG') return;
        if (img.classList.contains('rv-ended-badge')) return;
        open(img);
      });
    }
    [].forEach.call(lb.querySelectorAll('[data-lbclose]'), function (el) {
      el.addEventListener('click', close);
    });
    var x = document.getElementById('lbClose');
    if (x) x.addEventListener('click', close);
    addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !lb.hidden) close();
    });
  }

  function paint() {
    if (!store) return;
    var page = store.getEventPage();
    renderHead(page);
    renderCards(store.getEvents());
    return page;
  }

  function start() {
    if (!store || typeof store.ready !== 'function') return;
    var page = null;
    store.ready().then(function () {
      page = paint();
      wireTabs();
      wireLightbox(page);
    }).catch(function () {
      // 못 불러오면 페이지에 적힌 그대로 두고, 단추만 살려 둡니다.
      wireTabs();
      wireLightbox(null);
    });
    if (typeof store.subscribe === 'function') {
      store.subscribe(function () { paint(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);
