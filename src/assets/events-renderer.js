(function (global) {
  'use strict';

  // 디어데이클래스 · 행사 카드를 관리자 [행사 관리] 자료로 그립니다.
  //
  // 예전에는 카드 22장이 events.html 과 index.html 에 각각 박혀 있었습니다.
  // 이제 courses 표의 회차(sessions)를 읽어 같은 모양의 카드를 만듭니다.
  // 카드 마크업·글자 서식은 원래 페이지와 한 글자도 다르지 않게 맞췄습니다.
  //
  // 그리는 곳 두 군데. 같은 자료·같은 순서(날짜 오름차순)를 씁니다.
  //   #evGrid   /events/ 목록.  전체를 넣고 탭·검색·쪽나눔이 걸러 냅니다
  //   #rankRow  홈 [곧 마감되는 인기 프로그램].  전체를 넣고 홈 코드가 앞 10장만 보여줍니다

  var store = global.CourseStore;
  var grid = document.getElementById('evGrid');
  var rankRow = document.getElementById('rankRow');
  if (!store || (!grid && !rankRow)) return;

  var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  /* 분류 탭은 [사이트 콘텐츠 > 강연 카테고리] 의 활성 목록을 그대로 씁니다.
     예전에는 여기 표에 카테고리 이름을 손으로 적어 뒀습니다. 그래서 관리자에서
     카테고리를 더하거나 끄더라도 탭이 그대로였습니다.
     탭에 보이는 이름은 그 목록의 [표시명], 카드에 붙는 값은 [저장값] 입니다. */

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

  // 저장소에 올린 그림은 중계(/img/)를 거칩니다.
  // 사이트에 박힌 그림(/images/...)은 그대로 나갑니다.
  function 미디어주소_(value) {
    var media = window.DeardayPublicMedia;
    return media && typeof media.resolve === 'function' ? media.resolve(value) : value;
  }

  function cardImage(course, session) {
    return 미디어주소_(String(session.cardImg || session.banner || store.courseThumbnail(course) || '').trim());
  }

  function cardHtml(course, session) {
    var tab = String(course.category || '').trim();
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

  /* 탭 단추. 페이지에는 [전체] 하나만 적혀 있고 나머지는 여기서 붙입니다.
     행사가 하나도 없는 카테고리는 세우지 않습니다 — 늘 0건인 빈 탭이 되니까요.
     목록에 없는 값을 쓰는 행사가 있으면 그 값도 뒤에 붙입니다. 어느 탭에도
     안 걸려 [전체] 에서만 보이는 행사가 생기지 않게요. */
  var 카테고리목록_ = null;
  var 탭모양_ = '';

  async function 카테고리읽기_() {
    var api = window.AiLeadersSupabase;
    if (!api || typeof api.selectRows !== 'function') { 카테고리목록_ = []; return; }
    try {
      var rows = await api.selectRows('form_options', {
        select: 'label,value,sort_order,is_active,option_group',
        filters: { option_group: 'course_category', is_active: true },
        order: 'sort_order.asc'
      });
      카테고리목록_ = (Array.isArray(rows) ? rows : []).map(function (row) {
        var value = String((row && (row.value || row.label)) || '').trim();
        return { value: value, label: String((row && (row.label || row.value)) || '').trim() || value };
      }).filter(function (item) { return !!item.value; });
    } catch (error) {
      카테고리목록_ = [];   // 못 읽으면 행사가 쓰는 값만 세웁니다
    }
  }

  function 탭그리기_(cards) {
    var box = document.querySelector('.tabs');
    if (!box) return;
    var used = {};
    (cards || []).forEach(function (card) {
      var value = String((card.course && card.course.category) || '').trim();
      if (value) used[value] = true;
    });
    var listed = {};
    var tabs = [];
    (카테고리목록_ || []).forEach(function (item) {
      listed[item.value] = true;
      if (used[item.value]) tabs.push(item);
    });
    Object.keys(used).sort().forEach(function (value) {
      if (!listed[value]) tabs.push({ value: value, label: value });
    });
    var current = box.querySelector('.tab.active');
    var currentCat = current ? current.getAttribute('data-cat') : '전체';
    var html = '<button class="tab" type="button" data-cat="전체" role="tab">전체</button>'
      + tabs.map(function (item) {
        return '<button class="tab" type="button" data-cat="' + esc(item.value) + '" role="tab">' + esc(item.label) + '</button>';
      }).join('');
    // 자료를 다시 읽어도 탭 줄이 같으면 건드리지 않습니다.
    // 다시 쓰면 방문자가 고른 탭이 풀립니다.
    if (탭모양_ === html) return;
    탭모양_ = html;
    box.innerHTML = html;
    // 고른 탭이 사라졌으면 [전체] 로 돌립니다.
    var keep = box.querySelector('[data-cat="' + String(currentCat || '전체').replace(/"/g, '') + '"]') || box.firstElementChild;
    if (keep) { keep.classList.add('active'); keep.setAttribute('aria-selected', 'true'); }
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
    탭그리기_(cards);
    var html = cards.map(function (card) {
      return cardHtml(card.course, card.session);
    }).join('');

    if (grid) {
      if (cards.length) grid.innerHTML = html;
      // 카드를 새로 넣었으니 목록의 탭·검색·쪽나눔이 다시 세어야 합니다.
      if (typeof global.__evRefresh === 'function') global.__evRefresh();
    }
    if (rankRow) {
      if (cards.length) rankRow.innerHTML = html;
      // 홈은 앞 10장만 보여줍니다. 순번도 다시 매겨야 하고,
      // 0건이어도 불러야 "준비 중" 안내가 제때 뜹니다.
      if (typeof global.__rankRefresh === 'function') global.__rankRefresh();
    }
  }

  function failed(error) {
    // 자료를 못 불러오면 각 화면의 "준비 중" 안내가 그대로 남습니다.
    if (global.console && console.warn) console.warn('[디어데이] 행사 목록을 불러오지 못했습니다.', error);
    if (typeof global.__rankFailed === 'function') global.__rankFailed();
  }

  // 카테고리 목록을 먼저 읽고 나서 그립니다. 목록을 못 읽어도 행사 카드로 탭을 세웁니다.
  카테고리읽기_().then(function () { return store.ready(); }).then(render).catch(failed);
  if (store.subscribe) store.subscribe(render);
})(window);
