(function (global) {
  'use strict';

  var BANNER_POSITIONS = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  var BANNER_ALIGNS = ['left', 'center', 'right'];

  var api = global.AiLeadersSupabase;
  var utils = global.AiLeadersUtils || api || {};
  var clone = utils.clone;
  var text = utils.text;
  var toNumber = utils.toNumber;
  var toBoolean = utils.toBoolean;
  var normalizeAssetUrl = utils.normalizeAssetUrl || function (value) { return text(value); };
  // 'site-assets' 버킷은 실제로 Supabase Storage에 생성된 적이 없어서
  // 업로드 시 항상 "Bucket not found"로 실패했음. 배너/강사 SQL 마이그레이션에서
  // 실제로 만들고 RLS 정책까지 세팅해 둔 'instructor-portfolio' 버킷을 재사용한다.
  var CONTENT_ASSETS_BUCKET = 'instructor-portfolio';
  // 강연 카테고리(course_category)는 여기 목록에 넣지 않습니다.
  // 폼 드롭다운이 아니라 홈페이지 탭을 결정하는 값이라, [강연 카테고리] 탭에서 따로 다룹니다.
  // 강사는 form_options 를 쓰지 않고 instructors 표(강사진)를 그대로 씁니다.
  var OPTION_GROUPS = {
    corporate_region: '출강 문의 지역',
    corporate_preferred_instructor: '출강 문의 선호 강사',
    corporate_level: '출강 문의 수강생 수준',
    instructor_region: '강사 지원 활동 가능 지역',
    instructor_career: '강사 지원 강의 경력',
    instructor_mode: '강사 지원 강의 형태',
    instructor_field: '강사 지원 전문 분야'
  };
  var FAQ_CATEGORIES = {
    apply: '수강 · 신청',
    lecture: '강연 · 방식',
    pay: '결제 · 환불',
    biz: '기업 · 기관 교육'
  };

  var cache = {
    banners: [],
    instructors: [],
    options: [],
    faqs: [],
    events: [],
    eventPage: null,
    eventPageEnabled: false,
    chatButtonEnabled: false,
    reviews: [],
    reviewSettings: null
  };
  var loaded = false;
  var lastError = null;
  var readyPromise = null;
  var listeners = [];

  function notify() {
    utils.notifyListeners(listeners);
  }

  function setError(error) {
    lastError = utils.normalizeError(error, api && api.defaultErrorMessage);
  }

  function parseArray(value) {
    return utils.parseList(value, { json: true, separator: 'line' });
  }

  // 숫자 칸 — 비어 있으면 '' 로, 숫자면 숫자로 둡니다.
  // 0 은 "안 밈" 이라는 뜻이 있어서 빈 값과 섞이면 안 됩니다.
  function numOrBlank(value) {
    if (value === null || value === undefined || value === '') return '';
    var n = Number(value);
    return isFinite(n) ? n : '';
  }
  function nullIfBlank(value) {
    var n = numOrBlank(value);
    return n === '' ? null : n;
  }

  function normalizeBanner(banner) {
    var item = Object.assign({}, banner || {});
    item.id = text(item.id);
    item.placement = text(item.placement) || 'home_hero';
    item.title = text(item.title);
    item.subtitle = text(item.subtitle);
    // 서식본(HTML). 비어 있으면 위의 평문을 씁니다.
    item.titleHtml = text(item.titleHtml);
    item.subtitleHtml = text(item.subtitleHtml);
    // 세부 위치와 글자 비율 — 비워 두면 코드의 기본값을 씁니다.
    // 0 은 뜻이 있는 값(안 밈)이라 빈 값과 구분해야 합니다. 그래서 '' 또는 숫자로 둡니다.
    item.contentOffsetX = numOrBlank(item.contentOffsetX);
    item.contentOffsetY = numOrBlank(item.contentOffsetY);
    item.mobileContentOffsetX = numOrBlank(item.mobileContentOffsetX);
    item.mobileContentOffsetY = numOrBlank(item.mobileContentOffsetY);
    item.bgZoom = numOrBlank(item.bgZoom);
    item.titleVw = numOrBlank(item.titleVw);
    item.subtitleVw = numOrBlank(item.subtitleVw);
    item.ctaVw = numOrBlank(item.ctaVw);
    item.mobileTitleVw = numOrBlank(item.mobileTitleVw);
    item.mobileSubtitleVw = numOrBlank(item.mobileSubtitleVw);
    item.mobileCtaVw = numOrBlank(item.mobileCtaVw);
    // 모바일 문구 — 비워 두면 PC 문구를 그대로 씁니다(모바일 자리 칸과 같은 규칙).
    item.mobileTitle = text(item.mobileTitle);
    item.mobileTitleHtml = text(item.mobileTitleHtml);
    item.mobileSubtitle = text(item.mobileSubtitle);
    item.mobileSubtitleHtml = text(item.mobileSubtitleHtml);
    // 문구·단추 자리. 빈 값이면 페이지에 적힌 그대로 두고 아무것도 바꾸지 않습니다.
    item.contentPosition = BANNER_POSITIONS.indexOf(text(item.contentPosition)) >= 0 ? text(item.contentPosition) : '';
    item.textAlign = BANNER_ALIGNS.indexOf(text(item.textAlign)) >= 0 ? text(item.textAlign) : '';
    item.ctaAlign = BANNER_ALIGNS.indexOf(text(item.ctaAlign)) >= 0 ? text(item.ctaAlign) : '';
    // 모바일 자리 — 비어 있으면 PC 값을 그대로 씁니다(banner-layout.js 가 처리).
    item.mobileContentPosition = BANNER_POSITIONS.indexOf(text(item.mobileContentPosition)) >= 0 ? text(item.mobileContentPosition) : '';
    item.mobileTextAlign = BANNER_ALIGNS.indexOf(text(item.mobileTextAlign)) >= 0 ? text(item.mobileTextAlign) : '';
    item.mobileCtaAlign = BANNER_ALIGNS.indexOf(text(item.mobileCtaAlign)) >= 0 ? text(item.mobileCtaAlign) : '';
    // 단추를 보일지. 끄면 공개 페이지에서 그 단추가 사라집니다.
    item.primaryEnabled = toBoolean(item.primaryEnabled, true);
    item.secondaryEnabled = toBoolean(item.secondaryEnabled, true);
    item.desktopImage = normalizeAssetUrl(item.desktopImage, 'images');
    item.mobileImage = normalizeAssetUrl(item.mobileImage, 'images');
    item.videoUrl = text(item.videoUrl);
    item.overlayColor = text(item.overlayColor) || '#021642';
    // 배경 밝기. light 면 대제목·소제목·단추·메뉴바가 진한 색으로 바뀝니다.
    item.backgroundTone = text(item.backgroundTone) === 'light' ? 'light' : 'dark';
    // 그라데이션 막을 씌울지. 끄면 사진이 그대로 보입니다.
    item.overlayEnabled = toBoolean(item.overlayEnabled, true);
    // 직접 지정한 색. 비어 있으면 배경 밝기(backgroundTone) 기본값을 씁니다.
    item.titleColor = text(item.titleColor);
    item.subtitleColor = text(item.subtitleColor);
    item.primaryTextColor = text(item.primaryTextColor);
    item.primaryBgColor = text(item.primaryBgColor);
    item.secondaryTextColor = text(item.secondaryTextColor);
    item.secondaryBgColor = text(item.secondaryBgColor);
    item.primaryLabel = text(item.primaryLabel);
    item.primaryUrl = text(item.primaryUrl);
    item.secondaryLabel = text(item.secondaryLabel);
    item.secondaryUrl = text(item.secondaryUrl);
    item.sortOrder = toNumber(item.sortOrder, 0);
    item.isActive = toBoolean(item.isActive, true);
    return item;
  }

  function normalizeInstructor(instructor) {
    var item = Object.assign({}, instructor || {});
    item.id = text(item.id);
    item.slug = text(item.slug) || item.id;
    item.name = text(item.name);
    item.role = text(item.role);
    item.label = text(item.label);
    item.photo = normalizeAssetUrl(item.photo, 'images');
    item.landingSummary = text(item.landingSummary);
    item.aboutSummary = text(item.aboutSummary);
    item.careerItems = parseArray(item.careerItems);
    item.landingDetails = parseArray(item.landingDetails);
    item.sortOrder = toNumber(item.sortOrder, 0);
    item.isActive = toBoolean(item.isActive, true);
    // 홈페이지 강사진 소개에 내보낼지. 끄면 강연 강사 드롭다운에는 그대로 남습니다.
    item.showOnSite = toBoolean(item.showOnSite, true);
    return item;
  }

  function normalizeOption(option) {
    var item = Object.assign({}, option || {});
    item.id = text(item.id);
    item.optionGroup = text(item.optionGroup);
    item.label = text(item.label);
    item.value = text(item.value) || item.label;
    item.sortOrder = toNumber(item.sortOrder, 0);
    item.isActive = toBoolean(item.isActive, true);
    return item;
  }

  // FAQ 분류 묶음. 예전에는 apply·lecture·pay·biz 네 가지가 코드에 박혀 있었는데,
  // 리더스 기준이라 디어데이에는 맞지 않았습니다. 이제 브랜드마다 따로 정합니다.
  var FAQ_CATEGORY_GROUP = 'faq_category';

  function normalizeFaq(faq) {
    var item = Object.assign({}, faq || {});
    item.id = text(item.id);
    // 분류가 없는 브랜드(디어데이)는 빈 값으로 둡니다.
    item.category = text(item.category);
    item.question = text(item.question);
    item.answer = text(item.answer);
    item.answerHtml = text(item.answerHtml);
    item.sortOrder = toNumber(item.sortOrder, 0);
    item.isActive = toBoolean(item.isActive, true);
    return item;
  }

  function bannerFromRow(row) {
    return normalizeBanner({
      id: row.id,
      placement: row.placement,
      title: row.title,
      subtitle: row.subtitle,
      titleHtml: row.title_html,
      subtitleHtml: row.subtitle_html,
      contentOffsetX: row.content_offset_x,
      contentOffsetY: row.content_offset_y,
      mobileContentOffsetX: row.mobile_content_offset_x,
      mobileContentOffsetY: row.mobile_content_offset_y,
      bgZoom: row.bg_zoom,
      titleVw: row.title_vw,
      subtitleVw: row.subtitle_vw,
      ctaVw: row.cta_vw,
      mobileTitleVw: row.mobile_title_vw,
      mobileSubtitleVw: row.mobile_subtitle_vw,
      mobileCtaVw: row.mobile_cta_vw,
      mobileTitle: row.mobile_title,
      mobileTitleHtml: row.mobile_title_html,
      mobileSubtitle: row.mobile_subtitle,
      mobileSubtitleHtml: row.mobile_subtitle_html,
      contentPosition: row.content_position,
      mobileContentPosition: row.mobile_content_position,
      mobileTextAlign: row.mobile_text_align,
      mobileCtaAlign: row.mobile_cta_align,
      textAlign: row.text_align,
      ctaAlign: row.cta_align,
      primaryEnabled: row.primary_enabled,
      secondaryEnabled: row.secondary_enabled,
      desktopImage: row.desktop_image,
      mobileImage: row.mobile_image,
      videoUrl: row.video_url,
      overlayColor: row.overlay_color,
      backgroundTone: row.background_tone,
      overlayEnabled: row.overlay_enabled,
      titleColor: row.title_color,
      subtitleColor: row.subtitle_color,
      primaryTextColor: row.primary_text_color,
      primaryBgColor: row.primary_bg_color,
      secondaryTextColor: row.secondary_text_color,
      secondaryBgColor: row.secondary_bg_color,
      primaryLabel: row.primary_label,
      primaryUrl: row.primary_url,
      secondaryLabel: row.secondary_label,
      secondaryUrl: row.secondary_url,
      sortOrder: row.sort_order,
      isActive: row.is_active
    });
  }

  function bannerToRow(banner) {
    var item = normalizeBanner(banner);
    return {
      id: item.id,
      placement: item.placement,
      title: item.title || null,
      subtitle: item.subtitle || null,
      title_html: item.titleHtml || null,
      subtitle_html: item.subtitleHtml || null,
      content_offset_x: nullIfBlank(item.contentOffsetX),
      content_offset_y: nullIfBlank(item.contentOffsetY),
      mobile_content_offset_x: nullIfBlank(item.mobileContentOffsetX),
      mobile_content_offset_y: nullIfBlank(item.mobileContentOffsetY),
      bg_zoom: nullIfBlank(item.bgZoom),
      title_vw: nullIfBlank(item.titleVw),
      subtitle_vw: nullIfBlank(item.subtitleVw),
      cta_vw: nullIfBlank(item.ctaVw),
      mobile_title_vw: nullIfBlank(item.mobileTitleVw),
      mobile_subtitle_vw: nullIfBlank(item.mobileSubtitleVw),
      mobile_cta_vw: nullIfBlank(item.mobileCtaVw),
      mobile_title: item.mobileTitle || null,
      mobile_title_html: item.mobileTitleHtml || null,
      mobile_subtitle: item.mobileSubtitle || null,
      mobile_subtitle_html: item.mobileSubtitleHtml || null,
      content_position: item.contentPosition || '',
      mobile_content_position: item.mobileContentPosition || '',
      mobile_text_align: item.mobileTextAlign || '',
      mobile_cta_align: item.mobileCtaAlign || '',
      text_align: item.textAlign || '',
      cta_align: item.ctaAlign || '',
      primary_enabled: item.primaryEnabled !== false,
      secondary_enabled: item.secondaryEnabled !== false,
      desktop_image: item.desktopImage || null,
      mobile_image: item.mobileImage || null,
      video_url: item.videoUrl || null,
      overlay_color: item.overlayColor || '#021642',
      background_tone: item.backgroundTone === 'light' ? 'light' : 'dark',
      overlay_enabled: item.overlayEnabled !== false,
      title_color: item.titleColor || null,
      subtitle_color: item.subtitleColor || null,
      primary_text_color: item.primaryTextColor || null,
      primary_bg_color: item.primaryBgColor || null,
      secondary_text_color: item.secondaryTextColor || null,
      secondary_bg_color: item.secondaryBgColor || null,
      primary_label: item.primaryLabel || null,
      primary_url: item.primaryUrl || null,
      secondary_label: item.secondaryLabel || null,
      secondary_url: item.secondaryUrl || null,
      sort_order: item.sortOrder,
      is_active: item.isActive
    };
  }

  function instructorFromRow(row) {
    return normalizeInstructor({
      id: row.id,
      slug: row.slug,
      name: row.name,
      role: row.role,
      label: row.label,
      photo: row.photo,
      landingSummary: row.landing_summary,
      aboutSummary: row.about_summary,
      careerItems: row.career_items,
      landingDetails: row.landing_details,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      // 옛 자료에는 이 칸이 없습니다. 없으면 내보내는 것으로 봅니다.
      showOnSite: row.show_on_site == null ? true : row.show_on_site
    });
  }

  function instructorToRow(instructor) {
    var item = normalizeInstructor(instructor);
    return {
      id: item.id,
      slug: item.slug || item.id,
      name: item.name,
      role: item.role || null,
      label: item.label || null,
      photo: item.photo || null,
      landing_summary: item.landingSummary || null,
      about_summary: item.aboutSummary || null,
      career_items: item.careerItems,
      landing_details: item.landingDetails,
      sort_order: item.sortOrder,
      is_active: item.isActive,
      show_on_site: item.showOnSite
    };
  }

  function optionFromRow(row) {
    return normalizeOption({
      id: row.id,
      optionGroup: row.option_group,
      label: row.label,
      value: row.value,
      sortOrder: row.sort_order,
      isActive: row.is_active
    });
  }

  function optionToRow(option) {
    var item = normalizeOption(option);
    return {
      id: item.id,
      option_group: item.optionGroup,
      label: item.label,
      value: item.value,
      sort_order: item.sortOrder,
      is_active: item.isActive
    };
  }

  function faqFromRow(row) {
    return normalizeFaq({
      id: row.id,
      category: row.category,
      question: row.question,
      answer: row.answer,
      answerHtml: row.answer_html,
      sortOrder: row.sort_order,
      isActive: row.is_active
    });
  }

  function faqToRow(faq) {
    var item = normalizeFaq(faq);
    return {
      id: item.id,
      category: item.category,
      question: item.question,
      answer: item.answer,
      answer_html: item.answerHtml || null,
      sort_order: item.sortOrder,
      is_active: item.isActive
    };
  }

  function getFaqCategories(includeInactive) {
    return getOptions(FAQ_CATEGORY_GROUP, includeInactive);
  }

  // ── 이벤트 카드 ────────────────────────────────────────────────────
  //
  // 브랜드별 [이벤트] 페이지(디어데이 /event-review/)에 놓이는 카드입니다.
  // 표는 site_events, 켜기/끄기와 상단 문구는 sites 표의 두 칸에 있습니다.
  //
  // 종료 여부는 저장하지 않습니다. 오늘 날짜와 종료일을 그때그때 견줍니다.
  // 예전에는 제목에서 'N월' 을 뽑아 계산했는데, 제목을 바꾸면 어긋났습니다.
  var EVENT_CTA_KINDS = { none: '없음', kakao: '카카오톡 채널 추가', sns: '인스타그램 바로가기' };

  function normalizeEvent(source) {
    var item = Object.assign({}, source || {});
    item.id = text(item.id);
    item.title = text(item.title);
    item.imageUrl = normalizeAssetUrl(item.imageUrl);
    item.extraImageUrl = normalizeAssetUrl(item.extraImageUrl);
    item.ctaKind = EVENT_CTA_KINDS[text(item.ctaKind)] ? text(item.ctaKind) : 'none';
    item.endAt = text(item.endAt).slice(0, 10);
    item.sortOrder = toNumber(item.sortOrder, 0);
    item.isActive = toBoolean(item.isActive, true);
    return item;
  }

  function eventFromRow(row) {
    return normalizeEvent({
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      extraImageUrl: row.extra_image_url,
      ctaKind: row.cta_kind,
      endAt: row.end_at,
      sortOrder: row.sort_order,
      isActive: row.is_active
    });
  }

  function eventToRow(source) {
    var item = normalizeEvent(source);
    return {
      id: item.id,
      title: item.title,
      image_url: item.imageUrl,
      extra_image_url: item.extraImageUrl || null,
      cta_kind: item.ctaKind,
      end_at: item.endAt || null,
      sort_order: item.sortOrder,
      is_active: item.isActive
    };
  }

  // 오늘이 종료일을 지났으면 종료입니다. 종료일이 비어 있으면 계속 진행중입니다.
  function isEventEnded(item, today) {
    var end = text(item && item.endAt).slice(0, 10);
    if (!end) return false;
    var now = today || new Date();
    var pad = function (n) { return ('0' + n).slice(-2); };
    var todayText = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    return todayText > end;
  }

  function normalizeEventPage(source) {
    var page = Object.assign({}, source || {});
    return {
      eyebrow: text(page.eyebrow),
      // 제목 앞부분만 좌우 공백을 지우지 않습니다. '월별 ' 처럼 끝의 한 칸이 뜻을 갖습니다.
      titleLead: String(page.titleLead == null ? '' : page.titleLead),
      titleAccent: text(page.titleAccent),
      description: text(page.description),
      kakaoUrl: text(page.kakaoUrl),
      instagramUrl: text(page.instagramUrl)
    };
  }

  function currentSiteId() {
    return (api && typeof api.currentSiteId === 'function' && api.currentSiteId()) || '';
  }

  // ── 후기 ──────────────────────────────────────────────────────────
  //
  // 표는 site_reviews, 메뉴 이름과 사진 사용 여부는 sites 표에 있습니다.
  // 후기 종류는 form_options 의 review_category 묶음을 씁니다(브랜드마다 다릅니다).
  //
  // placement — 이 후기를 어느 화면에 둘지
  //   home 첫 화면 · page 후기 페이지 · both 둘 다
  //   리더스는 두 화면의 후기가 서로 다른 글이라 나누어 둡니다.
  //   디어데이는 첫 화면 하나뿐이라 늘 home 입니다.
  var REVIEW_PLACEMENTS = { home: '첫 화면', page: '후기 페이지', both: '둘 다' };
  var REVIEW_CATEGORY_GROUP = 'review_category';

  function normalizeReview(source) {
    var item = Object.assign({}, source || {});
    item.id = text(item.id);
    item.category = text(item.category);
    item.title = text(item.title);
    item.authorName = text(item.authorName);
    item.authorIntro = text(item.authorIntro);
    item.authorContext = text(item.authorContext);
    item.rating = Math.max(1, Math.min(5, toNumber(item.rating, 5)));
    item.bodyLead = text(item.bodyLead);
    item.body = text(item.body);
    item.imageUrl = normalizeAssetUrl(item.imageUrl);
    item.placement = REVIEW_PLACEMENTS[text(item.placement)] ? text(item.placement) : 'home';
    item.sortOrder = toNumber(item.sortOrder, 0);
    item.isActive = toBoolean(item.isActive, true);
    return item;
  }

  function reviewFromRow(row) {
    return normalizeReview({
      id: row.id,
      category: row.category,
      title: row.title,
      authorName: row.author_name,
      authorIntro: row.author_intro,
      authorContext: row.author_context,
      rating: row.rating,
      bodyLead: row.body_lead,
      body: row.body,
      imageUrl: row.image_url,
      placement: row.placement,
      sortOrder: row.sort_order,
      isActive: row.is_active
    });
  }

  function reviewToRow(source) {
    var item = normalizeReview(source);
    return {
      id: item.id,
      category: item.category,
      title: item.title,
      author_name: item.authorName,
      author_intro: item.authorIntro,
      author_context: item.authorContext,
      rating: item.rating,
      body_lead: item.bodyLead,
      body: item.body,
      image_url: item.imageUrl || null,
      placement: item.placement,
      sort_order: item.sortOrder,
      is_active: item.isActive
    };
  }

  function normalizeReviewSettings(source) {
    var next = Object.assign({}, source || {});
    return {
      label: text(next.label),
      photoEnabled: toBoolean(next.photoEnabled, false)
    };
  }

  function sortByOrder(a, b) {
    var order = toNumber(a.sortOrder, 0) - toNumber(b.sortOrder, 0);
    if (order !== 0) return order;
    return String(a.label || a.name || a.title || '').localeCompare(String(b.label || b.name || b.title || ''), 'ko');
  }

  function setCache(next) {
    cache.banners = (next.banners || []).map(normalizeBanner).sort(sortByOrder);
    cache.instructors = (next.instructors || []).map(normalizeInstructor).sort(sortByOrder);
    cache.options = (next.options || []).map(normalizeOption).sort(sortByOrder);
    cache.faqs = (next.faqs || []).map(normalizeFaq).sort(sortByOrder);
    cache.events = (next.events || []).map(normalizeEvent).sort(sortByOrder);
    cache.eventPage = normalizeEventPage(next.eventPage);
    cache.eventPageEnabled = toBoolean(next.eventPageEnabled, false);
    cache.chatButtonEnabled = toBoolean(next.chatButtonEnabled, false);
    cache.reviews = (next.reviews || []).map(normalizeReview).sort(sortByOrder);
    cache.reviewSettings = normalizeReviewSettings(next.reviewSettings);
    loaded = true;
    lastError = null;
    notify();
    return getState();
  }

  async function loadContent() {
    if (!api || !api.hasConfig()) {
      throw new Error(api ? api.defaultErrorMessage : '데이터를 불러올 수 없습니다.');
    }
    // 네 가지를 동시에(병렬) 불러온다. FAQ 테이블(site_faqs)이 아직 없거나 조회에
    // 실패해도 배너/강사/옵션 로딩은 막히지 않도록 FAQ 조회만 실패 시 빈 목록으로 처리한다.
    // (순차로 기다리면 히어로 배너 렌더가 늦어져 기본 이미지가 잠깐 깜빡이므로 반드시 병렬로 둔다.)
    var rows = await Promise.all([
      api.selectRows('site_banners', { select: '*' }),
      api.selectRows('instructors', { select: '*' }),
      api.selectRows('form_options', { select: '*' }),
      api.selectRows('site_faqs', { select: '*' }).catch(function () { return []; }),
      api.selectRows('site_events', { select: '*' }).catch(function () { return []; }),
      // sites 는 브랜드로 걸러 읽는 표가 아니라 세 줄뿐입니다. 지금 브랜드 줄만 골라 씁니다.
      api.selectRows('sites', { select: 'id,event_page_enabled,event_page,reviews_label,reviews_photo_enabled,chat_button_enabled' }).catch(function () { return []; }),
      api.selectRows('site_reviews', { select: '*' }).catch(function () { return []; })
    ]);
    var siteId = currentSiteId();
    var siteRow = (rows[5] || []).filter(function (row) { return row && row.id === siteId; })[0] || {};
    return setCache({
      banners: rows[0].map(bannerFromRow),
      instructors: rows[1].map(instructorFromRow),
      options: rows[2].map(optionFromRow),
      faqs: (rows[3] || []).map(faqFromRow),
      events: (rows[4] || []).map(eventFromRow),
      eventPage: siteRow.event_page,
      eventPageEnabled: siteRow.event_page_enabled,
      chatButtonEnabled: siteRow.chat_button_enabled,
      reviews: (rows[6] || []).map(reviewFromRow),
      reviewSettings: { label: siteRow.reviews_label, photoEnabled: siteRow.reviews_photo_enabled }
    });
  }

  function ready(force) {
    if (force) readyPromise = null;
    if (!readyPromise) {
      readyPromise = loadContent().catch(function (error) {
        loaded = false;
        setError(error);
        notify();
        throw lastError;
      });
    }
    return readyPromise;
  }

  function refresh() {
    readyPromise = null;
    return ready(true);
  }

  function getState() {
    return clone(cache);
  }

  function getBanners(placement) {
    return cache.banners.filter(function (item) {
      return item.isActive && (!placement || item.placement === placement);
    }).map(clone);
  }

  function getInstructors(includeInactive) {
    return cache.instructors.filter(function (item) {
      return includeInactive || item.isActive;
    }).map(clone);
  }

  function getOptions(group, includeInactive) {
    return cache.options.filter(function (item) {
      return item.optionGroup === group && (includeInactive || item.isActive);
    }).map(clone);
  }

  function getFaqs(category, includeInactive) {
    return cache.faqs.filter(function (item) {
      return (!category || item.category === category) && (includeInactive || item.isActive);
    }).map(clone);
  }

  async function saveBanner(banner) {
    var item = normalizeBanner(banner);
    if (!item.id) item.id = api.createId('banner');
    await api.upsertRows('site_banners', [bannerToRow(item)], 'id');
    return refresh();
  }

  async function deleteBanner(id) {
    if (!id) return getState();
    await api.deleteRows('site_banners', { id: id });
    return refresh();
  }

  async function saveInstructor(instructor) {
    var item = normalizeInstructor(instructor);
    if (!item.id) item.id = api.createId('instructor');
    if (!item.slug) item.slug = item.id;
    await api.upsertRows('instructors', [instructorToRow(item)], 'id');
    return refresh();
  }

  async function deleteInstructor(id) {
    if (!id) return getState();
    await api.deleteRows('instructors', { id: id });
    return refresh();
  }

  async function saveOption(option) {
    var item = normalizeOption(option);
    if (!item.id) item.id = api.createId('option');
    await api.upsertRows('form_options', [optionToRow(item)], 'id');
    return refresh();
  }

  function orderedRows(items, ids, toRow) {
    var seen = {};
    return (ids || []).map(function (id, index) {
      var key = text(id);
      if (!key || seen[key]) return null;
      seen[key] = true;
      var current = items.find(function (item) { return item.id === key; });
      if (!current) return null;
      var next = Object.assign({}, current, { sortOrder: index + 1 });
      return toRow(next);
    }).filter(Boolean);
  }

  async function saveBannerOrder(ids) {
    var rows = orderedRows(cache.banners, ids, bannerToRow);
    if (!rows.length) return getState();
    await api.upsertRows('site_banners', rows, 'id');
    return refresh();
  }

  async function saveInstructorOrder(ids) {
    var rows = orderedRows(cache.instructors, ids, instructorToRow);
    if (!rows.length) return getState();
    await api.upsertRows('instructors', rows, 'id');
    return refresh();
  }

  async function saveOptionOrder(ids) {
    var rows = orderedRows(cache.options, ids, optionToRow);
    if (!rows.length) return getState();
    await api.upsertRows('form_options', rows, 'id');
    return refresh();
  }

  async function deleteOption(id) {
    if (!id) return getState();
    await api.deleteRows('form_options', { id: id });
    return refresh();
  }

  async function saveFaq(faq) {
    var item = normalizeFaq(faq);
    if (!item.id) item.id = api.createId('faq');
    await api.upsertRows('site_faqs', [faqToRow(item)], 'id');
    return refresh();
  }

  async function deleteFaq(id) {
    if (!id) return getState();
    await api.deleteRows('site_faqs', { id: id });
    return refresh();
  }

  async function saveFaqOrder(ids) {
    var rows = orderedRows(cache.faqs, ids, faqToRow);
    if (!rows.length) return getState();
    await api.upsertRows('site_faqs', rows, 'id');
    return refresh();
  }

  function getEvents(includeInactive) {
    return cache.events.filter(function (item) {
      return includeInactive || item.isActive;
    }).map(clone);
  }

  function getEventPage() {
    return clone(cache.eventPage);
  }

  function isEventPageEnabled() {
    return cache.eventPageEnabled === true;
  }

  // 우측 하단 상담 버튼 — 켜기/끄기만 sites 표에 둡니다.
  function isChatButtonEnabled() {
    return cache.chatButtonEnabled === true;
  }

  async function saveChatButton(enabled) {
    var siteId = currentSiteId();
    if (!siteId) throw new Error('브랜드를 먼저 고르세요.');
    await api.updateRows('sites', { id: siteId }, { chat_button_enabled: toBoolean(enabled, false) });
    return refresh();
  }

  async function saveEvent(source) {
    var item = normalizeEvent(source);
    if (!item.id) item.id = api.createId('event');
    await api.upsertRows('site_events', [eventToRow(item)], 'id');
    return refresh();
  }

  async function deleteEvent(id) {
    if (!id) return getState();
    await api.deleteRows('site_events', { id: id });
    return refresh();
  }

  async function saveEventOrder(ids) {
    var rows = orderedRows(cache.events, ids, eventToRow);
    if (!rows.length) return getState();
    await api.upsertRows('site_events', rows, 'id');
    return refresh();
  }

  // 켜기/끄기와 상단 문구·링크는 카드가 아니라 sites 표에 있습니다.
  // patch.enabled 와 patch.page 를 따로 보낼 수 있습니다.
  async function saveEventPage(patch) {
    var siteId = currentSiteId();
    if (!siteId) throw new Error('브랜드를 먼저 고르세요.');
    var next = {};
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'enabled')) {
      next.event_page_enabled = toBoolean(patch.enabled, false);
    }
    if (patch && patch.page) {
      next.event_page = normalizeEventPage(Object.assign({}, cache.eventPage, patch.page));
    }
    if (!Object.keys(next).length) return getState();
    await api.updateRows('sites', { id: siteId }, next);
    return refresh();
  }

  // placement 가 'both' 인 후기는 두 화면에 모두 나옵니다.
  function getReviews(placement, includeInactive) {
    return cache.reviews.filter(function (item) {
      if (!includeInactive && !item.isActive) return false;
      if (!placement) return true;
      return item.placement === placement || item.placement === 'both';
    }).map(clone);
  }

  function getReviewSettings() {
    return clone(cache.reviewSettings);
  }

  function getReviewCategories(includeInactive) {
    return getOptions(REVIEW_CATEGORY_GROUP, includeInactive);
  }

  async function saveReview(source) {
    var item = normalizeReview(source);
    if (!item.id) item.id = api.createId('review');
    await api.upsertRows('site_reviews', [reviewToRow(item)], 'id');
    return refresh();
  }

  async function deleteReview(id) {
    if (!id) return getState();
    await api.deleteRows('site_reviews', { id: id });
    return refresh();
  }

  async function saveReviewOrder(ids) {
    var rows = orderedRows(cache.reviews, ids, reviewToRow);
    if (!rows.length) return getState();
    await api.upsertRows('site_reviews', rows, 'id');
    return refresh();
  }

  // 메뉴 이름과 사진 사용 여부는 후기 한 건이 아니라 sites 표에 있습니다.
  async function saveReviewSettings(patch) {
    var siteId = currentSiteId();
    if (!siteId) throw new Error('브랜드를 먼저 고르세요.');
    var next = {};
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'label')) {
      next.reviews_label = text(patch.label);
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'photoEnabled')) {
      next.reviews_photo_enabled = toBoolean(patch.photoEnabled, false);
    }
    if (!Object.keys(next).length) return getState();
    await api.updateRows('sites', { id: siteId }, next);
    return refresh();
  }

  async function uploadAsset(file, prefix, options) {
    if (!api || !file) throw new Error('업로드할 파일이 없습니다.');
    var path = api.createStoragePath(prefix || 'site-assets', file.name);
    return api.uploadFile(path, file, CONTENT_ASSETS_BUCKET, Object.assign({ cacheControl: 31536000 }, options || {}));
  }

  function subscribe(listener) {
    return utils.subscribeListener(listeners, listener);
  }

  global.SiteContentStore = {
    optionGroups: clone(OPTION_GROUPS),
    faqCategories: clone(FAQ_CATEGORIES),
    faqCategoryGroup: FAQ_CATEGORY_GROUP,
    getFaqCategories: getFaqCategories,
    contentAssetsBucket: CONTENT_ASSETS_BUCKET,
    ready: ready,
    refresh: refresh,
    subscribe: subscribe,
    hasLoaded: function () { return loaded; },
    hasError: function () { return !!lastError; },
    getErrorMessage: function () { return lastError ? lastError.message : ''; },
    getState: getState,
    getBanners: getBanners,
    getInstructors: getInstructors,
    getOptions: getOptions,
    saveBanner: saveBanner,
    saveBannerOrder: saveBannerOrder,
    deleteBanner: deleteBanner,
    saveInstructor: saveInstructor,
    saveInstructorOrder: saveInstructorOrder,
    deleteInstructor: deleteInstructor,
    saveOption: saveOption,
    saveOptionOrder: saveOptionOrder,
    deleteOption: deleteOption,
    getFaqs: getFaqs,
    saveFaq: saveFaq,
    saveFaqOrder: saveFaqOrder,
    deleteFaq: deleteFaq,
    eventCtaKinds: clone(EVENT_CTA_KINDS),
    getEvents: getEvents,
    isEventEnded: isEventEnded,
    getEventPage: getEventPage,
    isEventPageEnabled: isEventPageEnabled,
    saveEvent: saveEvent,
    saveEventOrder: saveEventOrder,
    deleteEvent: deleteEvent,
    saveEventPage: saveEventPage,
    isChatButtonEnabled: isChatButtonEnabled,
    saveChatButton: saveChatButton,
    reviewPlacements: clone(REVIEW_PLACEMENTS),
    reviewCategoryGroup: REVIEW_CATEGORY_GROUP,
    getReviews: getReviews,
    getReviewSettings: getReviewSettings,
    getReviewCategories: getReviewCategories,
    saveReview: saveReview,
    saveReviewOrder: saveReviewOrder,
    deleteReview: deleteReview,
    saveReviewSettings: saveReviewSettings,
    uploadAsset: uploadAsset
  };

  ready().catch(function () {});
})(window);
