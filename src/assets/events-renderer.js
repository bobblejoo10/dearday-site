(function (global) {
  'use strict';

  // 디어데이클래스 · /events/ 목록을 관리자 [행사 관리] 자료로 그립니다.
  //
  // 예전에는 카드 22장이 events.html 안에 그대로 박혀 있었습니다.
  // 이제 courses 표의 회차(sessions)를 읽어 같은 모양의 카드를 만듭니다.
  // 카드 마크업·글자 서식은 원래 페이지와 한 글자도 다르지 않게 맞췄습니다.

  var store = global.CourseStore;
  var grid = document.getElementById('evGrid');
  if (!store || !grid) return;

  var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  // 사이트 탭 ← 관리자 카테고리.
  // 토크/코미디는 공연에 포함시켜 탭을 3개(공연·강연·원데이클래스)로 씁니다.
  var TAB_BY_CATEGORY = {
    '공연': '공연',
    '토크/코미디': '공연',
    '강연': '강연',
    '원데이': '원데이클래스',
    '원데이클래스': '원데이클래스'
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function venueText(session) {
    return [session.location, session.address].filter(function (part) {
      return String(part || '').trim();
    }).join(' ').trim();
  }

  // 날짜 표기 — 원본 22장이 세 가지 형식으로 뒤섞여 있었습니다.
  //   2026.07.01 (수) / 2026.07.02 · 오후 7시 20분 / 2026.07.16 (목) · 오후 7시 20분
  // 하나로 통일합니다 : 시간이 있으면 시간을, 없으면 요일을 붙입니다.
  // (요일과 시간을 같이 넣으면 모바일 390px 에서 두 줄로 넘어가 카드 높이가 들쭉날쭉해집니다.)
  function dateText(session) {
    var raw = String(session.eventDate || '').trim();
    var match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return raw;
    var dotted = match[1] + '.' + match[2] + '.' + match[3];
    var time = String(session.eventTime || '').trim();
    if (time) return dotted + ' · ' + time;
    var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return dotted + ' (' + WEEKDAYS[date.getDay()] + ')';
  }

  function cardImage(course, session) {
    return String(session.cardImg || session.banner || store.courseThumbnail(course) || '').trim();
  }

  function cardHtml(course, session) {
    var tab = TAB_BY_CATEGORY[String(course.category || '').trim()] || String(course.category || '').trim();
    var href = store.courseDetailUrl(course, session);
    var venue = venueText(session);
    var img = cardImage(course, session);
    var label = [course.title, session.location].filter(Boolean).join(' ') + ' 상세보기';
    var alt = venue ? course.title + ' - ' + venue : course.title;
    return '<a class="ex" data-cat="' + esc(tab) + '" href="' + esc(href) + '" aria-label="' + esc(label) + '">'
      + '<div class="ex-imgwrap"><img class="ex-img" src="' + esc(img) + '" alt="' + esc(alt) + '" loading="lazy"><span class="ex-rank">1</span></div>'
      + '<div class="ex-body">'
      + '<h3>' + esc(course.title) + '</h3>'
      + '<p class="venue">' + esc(venue) + '</p>'
      + '<p class="daterange">' + esc(dateText(session)) + '</p>'
      + '<span class="ex-tag">전액 무료</span>'
      + '</div></a>';
  }

  function collectCards(courses) {
    var cards = [];
    (courses || []).forEach(function (course) {
      (course.sessions || []).forEach(function (session) {
        // 관리자에서 숨긴 회차만 뺍니다. 마감된 회차도 목록에는 그대로 보입니다
        // (원래 페이지도 지난 행사를 모두 보여주고 있었습니다).
        if (session.status === 'hidden') return;
        cards.push({ course: course, session: session });
      });
    });
    cards.sort(function (a, b) {
      var dateDiff = String(a.session.eventDate || '').localeCompare(String(b.session.eventDate || ''));
      if (dateDiff) return dateDiff;
      return String(a.course.title || '').localeCompare(String(b.course.title || ''), 'ko');
    });
    return cards;
  }

  function render() {
    var cards = collectCards(store.getCourses());
    if (!cards.length) return;
    grid.innerHTML = cards.map(function (card) {
      return cardHtml(card.course, card.session);
    }).join('');
    if (typeof global.__evRefresh === 'function') global.__evRefresh();
  }

  store.ready().then(render).catch(function (error) {
    // 자료를 못 불러오면 화면에 "아직 준비 중인 행사예요" 안내가 남습니다.
    if (global.console && console.warn) console.warn('[디어데이] 행사 목록을 불러오지 못했습니다.', error);
  });
  if (store.subscribe) store.subscribe(render);
})(window);
