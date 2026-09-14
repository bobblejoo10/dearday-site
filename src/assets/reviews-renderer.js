(function (global) {
  'use strict';

  // 첫 화면 [참석후기] 카드(#reviews .oc-track)를 site_reviews 표에서 그립니다.
  // 예전에는 카드 일곱 장이 HTML 에 박혀 있었습니다.
  // 종류 태그는 관리자 [홈페이지 관리 > 후기 > 후기 종류] 에서 옵니다.

  var TAG_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.71 8.71a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/></svg>';
  var AVATAR_ICON = '<svg class="oc-avatar-ic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="#fff"/><path d="M4 20c0-4.42 3.58-7 8-7s8 2.58 8 7" fill="#fff"/></svg>';

  var store = global.SiteContentStore;
  var media = global.DeardayPublicMedia;
  var utils = global.AiLeadersSupabase || {};
  var esc = utils.escapeHtml || function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  function assetUrl(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    return media && typeof media.resolve === 'function' ? media.resolve(raw) : raw;
  }

  function card(item, photoOn) {
    var stars = '';
    for (var i = 0; i < item.rating; i++) stars += '★';
    var image = photoOn && item.imageUrl
      ? '<div class="oc-imgwrap"><img class="oc-img" src="' + esc(assetUrl(item.imageUrl))
        + '" alt="' + esc(item.title || item.authorName) + ' 후기" loading="lazy"></div>'
      : '';
    var tag = item.category
      ? '<div class="oc-tag">' + TAG_ICON + '<span>' + esc(item.category) + '</span></div>'
      : '';
    return '<div class="oc-card">' + image
      + '<div class="oc-body"><div class="oc-top">' + tag
      + (item.title ? '<h3 class="oc-title">' + esc(item.title) + '</h3>' : '')
      + '<p class="oc-desc">' + esc(item.body) + '</p></div>'
      + '<div class="oc-foot"><div class="oc-brand"><span class="oc-avatar">' + AVATAR_ICON + '</span>'
      + '<div><div class="oc-stars">' + stars + '</div>'
      + '<div class="oc-name">' + esc(item.authorName) + '</div></div></div></div></div></div>';
  }

  function renderMenuLabel() {
    var settings = store.getReviewSettings();
    var label = settings && settings.label;
    if (!label) return;   // 비어 있으면 페이지에 적힌 이름을 그대로 둡니다
    [].forEach.call(document.querySelectorAll('[data-nav-key="reviews"]'), function (link) {
      link.textContent = label;
    });
  }

  function paint() {
    var track = document.getElementById('ocTrack');
    if (!track) return;
    var settings = store.getReviewSettings();
    var photoOn = !!(settings && settings.photoEnabled);
    var items = store.getReviews('home');
    if (!items.length) return;   // 한 건도 없으면 적힌 카드를 그대로 둡니다
    track.innerHTML = items.map(function (item) { return card(item, photoOn); }).join('');
  }

  function start() {
    if (!store || typeof store.ready !== 'function') return;
    store.ready().then(function () {
      renderMenuLabel();
      paint();
    }).catch(function () {});
    if (typeof store.subscribe === 'function') store.subscribe(paint);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);
