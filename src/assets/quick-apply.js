(function (global) {
  'use strict';

  // 디어데이클래스 · 홈 히어로의 [빠른 예약 신청] 을 관리자와 연결합니다.
  //
  // 예전에는 일정 6개가 손으로 적혀 있고, 신청 단추를 눌러도 아무 일이 없었습니다
  // (form 에 onsubmit="return false;" 가 붙어 있었습니다).
  // 이제 신청받는 회차를 관리자 [행사 관리] 에서 읽어 채우고,
  // 신청은 [신청자 관리] 로 보냅니다.

  var courseStore = global.CourseStore;
  var form = document.getElementById('apply');
  var select = document.getElementById('qaSession');
  if (!form || !select) return;

  var nameEl = document.getElementById('qaName');
  var phoneEl = document.getElementById('qaPhone');
  var agreeEl = document.getElementById('qaAgree');
  var options = [];

  function say(message) {
    if (typeof global.siteAlert === 'function') global.siteAlert(message);
    else global.alert(message);
  }

  function venueText(session) {
    return [session.location, session.address].filter(function (part) {
      return String(part || '').trim();
    }).join(' ').trim();
  }

  // 07.02 성남 · 이상준 힐링토크쇼  — 원래 적혀 있던 모양 그대로입니다.
  function optionLabel(course, session) {
    var raw = String(session.eventDate || '').trim();
    var match = raw.match(/^\d{4}-(\d{2})-(\d{2})$/);
    var when = match ? match[1] + '.' + match[2] : raw;
    var where = String(session.location || '').trim() || venueText(session);
    return [when, where].filter(Boolean).join(' ') + ' · ' + course.title;
  }

  function fillOptions() {
    options = [];
    (courseStore.getCourses() || []).forEach(function (course) {
      (course.sessions || []).forEach(function (session) {
        // 신청받는 중인 회차만 고를 수 있게 합니다 (지난 행사는 넣지 않습니다).
        if (!courseStore.isOpenForApply(session)) return;
        options.push({ course: course, session: session });
      });
    });
    options.sort(function (a, b) {
      return String(a.session.eventDate || '').localeCompare(String(b.session.eventDate || ''));
    });

    select.innerHTML = '';
    var first = document.createElement('option');
    first.value = '';
    first.textContent = options.length ? '신청 일정 선택' : '신청 가능한 일정이 없어요';
    select.appendChild(first);
    options.forEach(function (item, index) {
      var option = document.createElement('option');
      option.value = String(index);
      option.textContent = optionLabel(item.course, item.session);
      select.appendChild(option);
    });
    select.disabled = !options.length;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var name = String(nameEl && nameEl.value || '').trim();
    var phone = String(phoneEl && phoneEl.value || '').trim();
    var picked = options[Number(select.value)];

    if (!name) { say('이름을 입력해주세요.'); nameEl && nameEl.focus(); return; }
    if (!phone) { say('연락처를 입력해주세요.'); phoneEl && phoneEl.focus(); return; }
    if (!/^\d{2,3}-\d{3,4}-\d{4}$/.test(phone)) {
      say('연락처는 숫자만 정확하게 입력해주세요. (예: 010-1234-5678)');
      phoneEl && phoneEl.focus();
      return;
    }
    if (!picked) { say('신청하실 일정을 선택해주세요.'); select.focus(); return; }
    if (agreeEl && !agreeEl.checked) { say('개인정보 수집 및 이용에 동의해주세요.'); return; }

    var button = form.querySelector('.submit');
    if (button) { button.disabled = true; button.dataset.label = button.textContent; button.textContent = '접수 중…'; }

    var venue = venueText(picked.session);
    global.ApplicationStore.addApplication({
      courseId: picked.course.id,
      courseTitle: picked.course.title + (venue ? ' (' + venue + ')' : ''),
      courseType: 'free',
      eventDate: picked.session.eventDate || '',
      eventTime: picked.session.eventTime || '',
      name: name,
      phone: phone,
      source: 'dearday-home'
    }).then(function () {
      say('신청이 접수되었습니다! 당첨 문자를 통해 참석 안내를 드릴 예정이니 문자를 꼭 확인해주세요.');
      form.reset();
      fillOptions();
    }).catch(function (error) {
      say((error && error.message) || '신청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }).then(function () {
      if (button) { button.disabled = false; button.textContent = button.dataset.label || '신청하기'; }
    });
  });

  if (!courseStore || !global.ApplicationStore) {
    select.disabled = true;
    return;
  }
  courseStore.ready().then(fillOptions).catch(function (error) {
    select.disabled = true;
    if (global.console && console.warn) console.warn('[디어데이] 신청 일정을 불러오지 못했습니다.', error);
  });
  if (courseStore.subscribe) courseStore.subscribe(function () {
    if (courseStore.hasLoaded && courseStore.hasLoaded()) fillOptions();
  });
})(window);
