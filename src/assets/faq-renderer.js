(function (global) {
  'use strict';

  // 첫 화면 FAQ(#faq .faq-list)를 site_faqs 표에서 그립니다.
  // 예전에는 다섯 개가 HTML 에 박혀 있었습니다.
  //
  // 분류(관리자 [홈페이지 관리 > FAQ > FAQ 분류])가 있으면 묶어서 보여 주고,
  // 하나도 없으면 지금처럼 한 줄로 쭉 놓습니다. 디어데이는 지금 분류가 없습니다.

  var store = global.SiteContentStore;
  var utils = global.AiLeadersSupabase || {};
  var esc = utils.escapeHtml || function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // 답변은 관리자 편집기가 만든 서식본을 씁니다.
  // RichText.sanitize 가 허용한 태그만 남기므로 그대로 넣어도 안전합니다.
  function answerHtml(item) {
    var html = item && item.answerHtml;
    if (html && global.RichText && typeof global.RichText.sanitize === 'function') {
      var safe = global.RichText.sanitize(html);
      if (safe) return safe;
    }
    return esc(item ? item.answer : '').replace(/\n/g, '<br>');
  }

  function itemHtml(item) {
    return '<div class="faq-item">'
      + '<button class="faq-q" type="button" aria-expanded="false">'
      + '<span class="qtxt">' + esc(item.question) + '</span><span class="ar">&#9662;</span></button>'
      + '<div class="faq-a"><div class="faq-a-inner">' + answerHtml(item) + '</div></div>'
      + '</div>';
  }

  // 이 화면의 여닫기는 index.html 의 스크립트가 걸어 둡니다.
  // 카드를 다시 그리면 그 연결이 끊기므로 여기서 다시 걸어 줍니다.
  function wireToggle(list) {
    [].forEach.call(list.querySelectorAll('.faq-q'), function (button) {
      button.addEventListener('click', function () {
        var box = button.closest('.faq-item');
        var answer = box.querySelector('.faq-a');
        var open = box.classList.toggle('open');
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        answer.style.maxHeight = open ? (answer.scrollHeight + 'px') : '';
      });
    });
  }

  function paint() {
    var list = document.querySelector('#faq .faq-list');
    if (!list) return;
    var items = store.getFaqs();
    if (!items.length) return;   // 한 건도 없으면 적힌 내용을 그대로 둡니다

    var groups = store.getFaqCategories ? store.getFaqCategories() : [];
    var html;
    if (groups.length) {
      html = groups.map(function (cat) {
        var picked = items.filter(function (item) { return item.category === cat.value; });
        if (!picked.length) return '';
        return '<p class="faq-group-title">' + esc(cat.label) + '</p>' + picked.map(itemHtml).join('');
      }).join('');
      // 분류가 비어 있는 글이 남아 있으면 뒤에 붙입니다.
      var rest = items.filter(function (item) {
        return !groups.some(function (cat) { return cat.value === item.category; });
      });
      html += rest.map(itemHtml).join('');
    } else {
      html = items.map(itemHtml).join('');
    }
    list.innerHTML = html;
    wireToggle(list);
  }

  function start() {
    if (!store || typeof store.ready !== 'function') return;
    store.ready().then(paint).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);
