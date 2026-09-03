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
  var ALLOWED_STYLES = ['color', 'font-size', 'font-weight', 'font-style', 'text-align', 'text-decoration'];
  var SAFE_VALUE = /^[#0-9a-zA-Z().,%\- ]*$/;

  function safeStyle(el) {
    var kept = [];
    ALLOWED_STYLES.forEach(function (name) {
      var value = '';
      try { value = el.style.getPropertyValue(name); } catch (error) { value = ''; }
      value = String(value || '').trim();
      if (!value) return;
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
      clean(child, copy, doc);
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
