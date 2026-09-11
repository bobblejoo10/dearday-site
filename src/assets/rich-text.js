(function (global) {
  'use strict';

  // 관리자 서식 편집기가 만든 HTML 을 화면에 넣기 전에 걸러냅니다.
  //
  // 관리자만 쓸 수 있는 값이지만, 그 글이 그대로 방문자 화면의 HTML 이 됩니다.
  // 그래서 허용한 태그와 스타일만 남기고 나머지는 글자만 남깁니다.
  // (<script> 나 onclick 같은 것은 통째로 사라집니다)

  var ALLOWED_TAGS = {
    B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, STRIKE: 1, DEL: 1,
    BR: 1, SPAN: 1, DIV: 1, P: 1, UL: 1, OL: 1, LI: 1
  };
  var DROP_WHOLE = { SCRIPT: 1, STYLE: 1, TEMPLATE: 1, NOSCRIPT: 1, IFRAME: 1, OBJECT: 1, EMBED: 1 };
  var ALLOWED_STYLES = ['color', 'font-size', 'font-weight', 'font-style', 'text-align', 'text-decoration'];
  var SAFE_VALUE = /^[#0-9a-zA-Z().,%\- ]*$/;

  // 글자 크기는 배수(em)나 백분율(%)만 받습니다.
  // small·24px 같은 고정값은 자리마다 결과가 어긋납니다. 편집기 칸은 14px 이라
  // 24px 이 커 보이지만, 히어로 제목은 1440 기준 약 92px 이라 같은 24px 이
  // 도리어 4분의 1로 작아집니다. 배수는 어느 자리에서나 같은 비율입니다.
  var SIZE_VALUE = /^\d*\.?\d+(em|%)$/;

  // 굵게를 굵기 숫자로 붙여 두면 자리마다 결과가 어긋납니다.
  // 편집기가 넣는 값은 bold(=700) 하나인데, 히어로 제목은 이미 700~800 이라
  // 굵게를 걸어도 그대로거나(리더스 700) 오히려 가늘어졌습니다(디어데이·미리보기 800).
  // 그래서 굵기 지정은 <b> 태그로 옮기고, 실제 굵기는 그 자리의 CSS 가 정합니다.
  function isBoldWeight(value) {
    var text = String(value == null ? '' : value).trim().toLowerCase();
    if (!text) return false;
    if (text === 'bold' || text === 'bolder') return true;
    var number = parseInt(text, 10);
    return !isNaN(number) && number >= 600;
  }

  function weightOf(el) {
    try { return el.style.getPropertyValue('font-weight'); } catch (error) { return ''; }
  }

  function safeStyle(el) {
    var kept = [];
    ALLOWED_STYLES.forEach(function (name) {
      var value = '';
      try { value = el.style.getPropertyValue(name); } catch (error) { value = ''; }
      value = String(value || '').trim();
      if (!value) return;
      // 굵게는 <b> 로 옮기므로 인라인 굵기 값은 버립니다.
      // (normal 이나 400 같은 "굵게 아님" 값은 되돌리기 표현이라 그대로 둡니다)
      if (name === 'font-weight' && isBoldWeight(value)) return;
      // 고정 크기(px·small·x-large)는 버립니다. 그 자리의 기본 크기가 대신 쓰입니다.
      if (name === 'font-size' && !SIZE_VALUE.test(value.toLowerCase())) return;
      // url(...) · expression(...) 같은 것이 끼어들 여지를 막습니다.
      if (!SAFE_VALUE.test(value)) return;
      kept.push(name + ':' + value);
    });
    return kept.join(';');
  }

  function clean(node, out, doc) {
    Array.prototype.forEach.call(node.childNodes, function (child) {
      if (child.nodeType === 3) {                       // 글자
        out.appendChild(doc.createTextNode(child.nodeValue));
        return;
      }
      if (child.nodeType !== 1) return;                 // 주석 등은 버립니다
      var tag = child.tagName;
      // 이 태그들은 안쪽 글자까지 통째로 버립니다.
      // 아래 "허용 안 한 태그" 규칙에 맡기면 <script> 안의 글이 화면에 그대로 나옵니다.
      if (DROP_WHOLE[tag]) return;
      if (tag === 'FONT') {                             // 옛 편집기가 만드는 태그
        var span = doc.createElement('span');
        var color = child.getAttribute('color');
        if (color && SAFE_VALUE.test(color)) span.setAttribute('style', 'color:' + color);
        clean(child, span, doc);
        out.appendChild(span);
        return;
      }
      if (!ALLOWED_TAGS[tag]) {                         // 허용 안 한 태그는 글자만 살립니다
        clean(child, out, doc);
        return;
      }
      var copy = doc.createElement(tag.toLowerCase());
      var style = safeStyle(child);
      if (style) copy.setAttribute('style', style);
      var host = copy;
      // 인라인으로 굵게 지정된 것은 <b> 로 감싸 옮깁니다. B·STRONG 자체는 그냥 둡니다.
      if (tag !== 'B' && tag !== 'STRONG' && isBoldWeight(weightOf(child))) {
        var bold = doc.createElement('b');
        copy.appendChild(bold);
        host = bold;
      }
      clean(child, host, doc);
      out.appendChild(copy);
    });
  }

  function sanitize(html) {
    var raw = String(html == null ? '' : html);
    if (!raw) return '';
    var doc = new DOMParser().parseFromString('<body>' + raw + '</body>', 'text/html');
    var box = doc.createElement('div');
    clean(doc.body, box, doc);
    return box.innerHTML;
  }

  function toPlain(html) {
    var doc = new DOMParser().parseFromString('<body>' + String(html || '') + '</body>', 'text/html');
    return String(doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // 서식본이 있으면 서식대로, 없으면 평문을 넣습니다.
  function set(el, html, plain) {
    if (!el) return;
    var safe = sanitize(html);
    if (safe) { el.innerHTML = safe; return; }
    if (plain != null) el.textContent = String(plain);
  }

  global.RichText = { sanitize: sanitize, toPlain: toPlain, set: set };
})(window);
