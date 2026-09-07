(function (global) {
  'use strict';

  // 디어데이클래스 · 행사 상세 페이지의 회차 자료를 관리자 [행사 관리] 에서 가져옵니다.
  //
  // 예전에는 페이지마다 var DATA={"jeonju":{venue:…,date:…}} 가 손으로 적혀 있었습니다.
  // 이제 courses 표의 sessions 를 읽어 같은 모양으로 채웁니다.
  //
  // 페이지 쪽에서 준비해 두는 것 (전역 변수)
  //   COURSE_ID          읽어올 행사 아이디 (예: 'free-dd-ai')
  //   DATA               빈 객체. 이 파일이 slug 별로 채웁니다.
  //   __ddRenderEvent()  DATA 가 채워진 뒤 화면을 그리는 함수
  //
  // 자료를 못 불러오면 __ddRenderEvent 를 부르지 않습니다.
  // 그러면 페이지에 적힌 기본 화면이 그대로 남습니다 (빈 화면이 되지 않습니다).

  var store = global.CourseStore;
  if (!store) return;

  function venueText(session) {
    return [session.location, session.address].filter(function (part) {
      return String(part || '').trim();
    }).join(' ').trim();
  }

  function fill(courseId, target) {
    var course = store.getCourses().filter(function (item) {
      return item.id === courseId;
    })[0];
    if (!course) return null;
    (course.sessions || []).forEach(function (session) {
      if (session.status === 'hidden') return;
      var slug = String(session.slug || session.id || '').trim();
      if (!slug) return;
      target[slug] = {
        venue: venueText(session),
        date: String(session.eventDate || '').trim(),
        time: String(session.eventTime || '').trim(),
        banner: String(session.banner || session.cardImg || '').trim()
      };
    });
    return course;
  }

  function apply() {
    var courseId = String(global.COURSE_ID || '').trim();
    if (!courseId || !global.DATA) return;
    var course = fill(courseId, global.DATA);
    if (!course) {
      if (global.console && console.warn) console.warn('[디어데이] 행사를 찾지 못했습니다.', courseId);
      return;
    }
    global.DEARDAY_COURSE = course;
    if (typeof global.__ddRenderEvent === 'function') global.__ddRenderEvent();
  }

  store.ready().then(apply).catch(function (error) {
    if (global.console && console.warn) console.warn('[디어데이] 행사 자료를 불러오지 못했습니다.', error);
  });
  if (store.subscribe) store.subscribe(function () {
    if (store.hasLoaded && store.hasLoaded()) apply();
  });
})(window);
