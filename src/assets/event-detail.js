(function (global, document) {
  'use strict';

  /**
   * 디어데이클래스 · 통합 행사 상세
   *
   * 예전에는 행사마다 파일을 하나씩 만들고 제목·유의사항·이미지를 손으로 적었습니다.
   * 이제 이 파일 하나가 관리자 [행사 관리] 의 값으로 화면을 채웁니다.
   *
   *   주소 : /event/?c=<공개코드>          행사를 고릅니다
   *          /event/?c=<공개코드>&s=<회차>  회차까지 고릅니다 (없으면 첫 회차)
   *
   * 화면 규격은 리더스 상세(/course/)와 같습니다.
   *   - 공개코드로 찾기
   *   - 회차 선택 · 마감 판정
   *   - 유의사항 치환어 ({시작시간:한글} 등) — 회차를 바꾸면 문구도 바뀝니다
   * 디자인(CSS)은 디어데이 것을 그대로 씁니다.
   */

  var store = global.CourseStore;
  if (!store) return;

  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];

  function text(value) { return String(value == null ? '' : value).trim(); }

  function esc(value) {
    return text(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function el(id) { return document.getElementById(id); }

  function media(value) {
    var helper = global.DeardayPublicMedia;
    return helper && typeof helper.resolve === 'function' ? helper.resolve(value) : value;
  }

  function setText(id, value) {
    var node = el(id);
    if (node) node.textContent = value;
  }

  // ── 유의사항 치환어 (리더스 상세와 같은 규격) ─────────────────────
  var TOKEN = /\{(시작시간|종료시간|강연시간|날짜|지역|장소|강사)(?::([^}]*))?\}/g;

  function timeParts(value) {
    var found = text(value).match(/\d{1,2}:\d{2}/g) || [];
    return { start: found[0] || '', end: found[1] || '' };
  }

  function timeText(value, format) {
    var parts = text(value).split(':');
    if (parts.length !== 2) return text(value);
    var hour = Number(parts[0]);
    var minute = parts[1];
    if (format === '한글') return hour + '시 ' + minute + '분';
    if (format === '오전오후') {
      var label = hour < 12 ? '오전' : '오후';
      var hour12 = hour % 12 === 0 ? 12 : hour % 12;
      return label + ' ' + hour12 + '시' + (Number(minute) ? ' ' + minute + '분' : '');
    }
    return parts[0] + ':' + minute;
  }

  function dateText(value, format) {
    var found = text(value).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!found) return '';
    var year = Number(found[1]);
    var month = Number(found[2]);
    var day = Number(found[3]);
    if (format === '숫자') return found[1] + '-' + found[2] + '-' + found[3];
    if (format === '간단') return month + '/' + day;
    var weekday = WEEK[new Date(year, month - 1, day).getDay()];
    var tail = month + '월 ' + day + '일 (' + weekday + ')';
    return format === '짧게' ? tail : year + '년 ' + tail;
  }

  function tokenValue(view, name, format) {
    var times = timeParts(view.time);
    if (name === '시작시간') return timeText(times.start, format);
    if (name === '종료시간') return timeText(times.end, format);
    if (name === '강연시간') {
      if (!times.start) return '';
      if (!times.end) return timeText(times.start, format === '한글' ? '한글' : '');
      return format === '한글'
        ? timeText(times.start, '한글') + ' ~ ' + timeText(times.end, '한글')
        : timeText(times.start, '') + ' - ' + timeText(times.end, '');
    }
    if (name === '날짜') return dateText(view.date, format);
    if (name === '지역') return text(view.location);
    if (name === '장소') return text(view.address);
    if (name === '강사') return text(view.instructor);
    return '';
  }

  function fillTokens(value, view) {
    return text(value).replace(TOKEN, function (whole, name, format) {
      return tokenValue(view, name, format || '');
    });
  }

  function lines(value) {
    if (Array.isArray(value)) return value.map(text).filter(Boolean);
    return text(value).split('\n').map(function (item) { return item.trim(); }).filter(Boolean);
  }

  // ── 회차 ────────────────────────────────────────────────────────
  function visibleSessions(course) {
    return (course.sessions || []).filter(function (session) {
      return session && session.status !== 'hidden';
    });
  }

  function isEnded(dateValue) {
    var found = text(dateValue).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!found) return false;
    var day = new Date(Number(found[1]), Number(found[2]) - 1, Number(found[3]));
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return day < today;
  }

  function sessionClosed(session) {
    return session.status === 'closed' || isEnded(session.eventDate);
  }

  function venueText(session) {
    return [text(session.location), text(session.address)].filter(Boolean).join(' ');
  }

  function sessionLabel(session) {
    var when = dateText(session.eventDate, '짧게');
    return [text(session.location), when].filter(Boolean).join(' · ') || '회차';
  }

  // ── 화면 그리기 ─────────────────────────────────────────────────
  function detailImages(course) {
    var raw = course.detailImg;
    var list = Array.isArray(raw) ? raw : text(raw).split(/[\n,]/);
    return list.map(text).filter(Boolean);
  }

  function render(course, session) {
    var view = {
      title: text(course.title),
      date: text(session && session.eventDate) || text(course.eventDate),
      time: text(session && session.eventTime) || text(course.eventTime),
      location: text(session && session.location) || text(course.location),
      address: text(session && session.address) || text(course.address),
      instructor: text(session && session.instructor) || text(course.instructor)
    };
    view.venue = [view.location, view.address].filter(Boolean).join(' ');
    view.banner = media(text(course.thumbImg));

    document.title = (view.title ? view.title + ' · ' : '') + '디어데이클래스';
    setText('evTitle', view.title || '행사');

    var whenText = view.date ? dateText(view.date) : '-';
    setText('mDate', whenText);
    setText('mVenue', view.venue || '-');
    setText('dsTitle', view.title || '-');
    setText('dsDate', whenText);
    setText('dsVenue', view.venue || '-');

    var sub = [text(course.category), '전액 무료', '성인 관람 (미성년자 입장불가)'].filter(Boolean).join(' · ');
    setText('dsSub', sub);

    // D-day
    var ended = isEnded(view.date) || course.status === 'closed';
    var ddayEl = el('mDday');
    if (ddayEl) {
      var label = '-';
      var found = text(view.date).match(/(\d{4})-(\d{2})-(\d{2})/);
      if (found) {
        var day = new Date(Number(found[1]), Number(found[2]) - 1, Number(found[3]));
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var diff = Math.round((day - today) / 86400000);
        label = diff > 0 ? 'D-' + diff : (diff === 0 ? 'D-DAY' : '행사 종료');
      }
      ddayEl.textContent = label;
      ddayEl.classList.toggle('is-ended', ended);
    }

    // 포스터
    var banner = el('evBanner');
    if (banner) {
      if (view.banner) {
        banner.src = view.banner;
        banner.alt = (view.title || '행사') + ' 포스터';
        banner.hidden = false;
      } else {
        banner.hidden = true;
      }
    }

    // 본문 이미지
    var imgs = el('detailImgs');
    if (imgs) {
      var pictures = detailImages(course);
      imgs.innerHTML = pictures.map(function (src, index) {
        return '<img src="' + esc(media(src)) + '" alt="' + esc(view.title) + ' 안내'
          + (pictures.length > 1 ? ' ' + (index + 1) : '') + '" loading="lazy">';
      }).join('');
    }

    // 유의사항
    var card = el('reqCard');
    var list = el('reqList');
    if (card && list) {
      var notice = course.applicationNotice && typeof course.applicationNotice === 'object' ? course.applicationNotice : {};
      var items = lines(notice.items || notice.body).map(function (item) { return fillTokens(item, view); });
      var footer = fillTokens(notice.footer, view);
      setText('reqTitle', fillTokens(notice.title, view) || '신청 시 유의사항');
      list.innerHTML = items.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('');
      var foot = el('reqFoot');
      if (foot) {
        foot.textContent = footer;
        foot.hidden = !footer;
      }
      card.hidden = !items.length && !footer;
    }

    // 신청 단추
    document.querySelectorAll('.js-apply').forEach(function (button) {
      if (ended) {
        button.textContent = '마감';
        button.disabled = true;
        button.classList.add('is-closed');
      } else {
        button.disabled = false;
        button.classList.remove('is-closed');
        if (button.classList.contains('sc-btn')) button.textContent = '신청하기';
        else button.textContent = '신청하기';
      }
    });

    global.DEARDAY_COURSE = course;
    global.DEARDAY_EVENT = {
      course: course,
      session: session,
      sessionId: text(session && session.id),
      title: view.title,
      venue: view.venue,
      date: view.date,
      time: view.time,
      banner: view.banner,
      ended: ended
    };
    if (typeof global.__ddRenderEvent === 'function') global.__ddRenderEvent();
  }

  function renderPicker(course, sessions, selectedId, onPick) {
    var box = el('evSessions');
    if (!box) return;
    if (sessions.length < 2) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    box.innerHTML = '<p class="ev-sessions-title">회차 선택</p><div class="ev-sessions-list">'
      + sessions.map(function (session) {
        var closed = sessionClosed(session);
        return '<button type="button" class="ev-session'
          + (session.id === selectedId ? ' is-on' : '')
          + (closed ? ' is-closed' : '')
          + '" data-session="' + esc(session.id) + '"'
          + (closed ? ' disabled' : '') + '>'
          + '<span class="ev-session-when">' + esc(sessionLabel(session)) + '</span>'
          + '<span class="ev-session-where">' + esc(venueText(session) || '-') + '</span>'
          + (closed ? '<span class="ev-session-tag">마감</span>' : '')
          + '</button>';
      }).join('')
      + '</div>';
    box.querySelectorAll('[data-session]').forEach(function (button) {
      button.addEventListener('click', function () {
        onPick(button.getAttribute('data-session'));
      });
    });
  }

  // ── 시작 ────────────────────────────────────────────────────────
  function query(name) {
    return new URLSearchParams(global.location.search).get(name) || '';
  }

  function pickSession(sessions, wanted) {
    if (!sessions.length) return null;
    var asked = sessions.filter(function (s) { return s.id === wanted; })[0];
    if (asked) return asked;
    var open = sessions.filter(function (s) { return !sessionClosed(s); })[0];
    return open || sessions[0];
  }

  function showMissing() {
    setText('evTitle', '행사를 찾을 수 없습니다');
    setText('mDate', '-');
    setText('mVenue', '-');
    setText('mDday', '-');
    var imgs = el('detailImgs');
    if (imgs) {
      imgs.innerHTML = '<p class="ev-missing">주소가 잘못되었거나 종료된 행사입니다.<br>'
        + '<a href="/events/">전체 행사 보기</a> 에서 다시 골라주세요.</p>';
    }
    document.querySelectorAll('.js-apply').forEach(function (button) {
      button.disabled = true;
      button.textContent = '신청 불가';
      button.classList.add('is-closed');
    });
  }

  function boot() {
    var code = query('c') || query('code');
    var course = code && store.findCourseByPublicCode
      ? store.findCourseByPublicCode(code)
      : null;

    // 옛 주소(/event-ai/?id=...) 로 들어온 경우를 위해 행사 아이디로도 한 번 찾아봅니다.
    if (!course) {
      var legacy = query('id');
      course = (store.getCourses() || []).filter(function (item) {
        return item.id === code || item.id === legacy;
      })[0] || null;
    }

    if (!course) {
      showMissing();
      return;
    }

    var sessions = visibleSessions(course);
    var selected = pickSession(sessions, query('s'));

    function draw(session) {
      renderPicker(course, sessions, session && session.id, function (id) {
        var next = sessions.filter(function (s) { return s.id === id; })[0];
        if (!next) return;
        draw(next);
        var url = new URL(global.location.href);
        url.searchParams.set('s', id);
        global.history.replaceState({}, '', url);
      });
      render(course, session);
    }

    draw(selected);
  }

  store.ready().then(boot).catch(function (error) {
    if (global.console && console.warn) console.warn('[디어데이] 행사 자료를 불러오지 못했습니다.', error);
    showMissing();
  });
})(window, document);
