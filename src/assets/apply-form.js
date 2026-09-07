(function (global) {
  'use strict';

  // 디어데이클래스 · 행사 신청을 관리자 [신청자 관리] 로 보냅니다.
  //
  // 예전에는 신청 단추를 눌러도 화면에만 "접수되었습니다" 가 뜨고
  // 자료가 아무 데도 저장되지 않았습니다. 이제 lecture_applications 표에 넣습니다.
  //
  // 공개 사이트 권한은 넣기(INSERT)만 있습니다. 읽기는 관리자에서만 됩니다.

  var store = global.ApplicationStore;

  function venueLabel(session) {
    return [session && session.location, session && session.address].filter(function (part) {
      return String(part || '').trim();
    }).join(' ').trim();
  }

  // 지금 페이지에서 고른 회차 (상세 페이지 전용).
  // 전역 DATA / COURSE_ID / DEFAULT_ID 는 상세 페이지가 미리 만들어 둡니다.
  function currentSession() {
    var data = global.DATA;
    if (!data) return null;
    var params = new URLSearchParams(global.location.search);
    var asked = params.get('id');
    var slug = (asked && data[asked]) ? asked : String(global.DEFAULT_ID || '');
    var item = data[slug];
    if (!item) return null;
    return {
      slug: slug,
      venue: item.venue || '',
      eventDate: item.date || '',
      eventTime: item.time || ''
    };
  }

  function courseTitle() {
    var course = global.DEARDAY_COURSE;
    if (course && course.title) return course.title;
    return String(global.TITLE || '').trim();
  }

  // 신청 한 건을 보냅니다. 실패하면 reject 하므로,
  // 부르는 쪽에서 "접수되었습니다" 를 띄우기 전에 반드시 기다려야 합니다.
  function submit(extra) {
    var payload = Object.assign({
      courseId: String(global.COURSE_ID || '').trim(),
      courseTitle: courseTitle(),
      courseType: 'free',
      source: 'dearday'
    }, extra || {});

    if (!payload.eventDate) {
      var session = currentSession();
      if (session) {
        payload.eventDate = session.eventDate;
        payload.eventTime = session.eventTime;
        if (session.venue) payload.courseTitle = payload.courseTitle + ' (' + session.venue + ')';
      }
    }

    if (!store || typeof store.addApplication !== 'function') {
      return Promise.reject(new Error('신청을 접수할 수 없습니다. 잠시 후 다시 시도해주세요.'));
    }
    return store.addApplication(payload);
  }

  // 실패 안내 — 페이지마다 있는 알림창을 씁니다.
  function warn(message) {
    var text = message || '신청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요.';
    if (typeof global.siteAlert === 'function') global.siteAlert(text);
    else global.alert(text);
  }

  global.DeardayApply = {
    submit: submit,
    warn: warn,
    currentSession: currentSession,
    venueLabel: venueLabel
  };
})(window);
