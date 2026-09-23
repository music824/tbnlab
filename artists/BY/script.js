(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const html = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let paused = reduced.matches;
  function applyMotion() {
    html.classList.toggle('motion-paused', paused);
    if (paused) resetPointer();
  }
  reduced.addEventListener('change', () => { paused = reduced.matches; applyMotion(); });

  // All content is readable without JavaScript; only enable reveals after observation is ready.
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .06 });
    $$('.reveal').forEach(element => revealObserver.observe(element));
    html.classList.add('motion-ready');
    const ticker = $('.ticker');
    new IntersectionObserver(([entry]) => ticker.classList.toggle('is-offscreen', !entry.isIntersecting)).observe(ticker);
  }

  const menuButton = $('.menu-toggle');
  const navigation = $('.nav__links');
  const mobile = window.matchMedia('(max-width: 760px)');
  function closeMenu() {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    closeMenu();
    // Move keyboard focus to the destination without adding a second scroll.
    const destination = $(link.getAttribute('href'));
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
    }
  }));
  mobile.addEventListener('change', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav')) closeMenu();
  });

  const sections = $$('main [id]').filter(element => element.matches('header, section'));
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    const height = document.documentElement.scrollHeight - innerHeight;
    $('.scroll-progress i').style.transform = 'scaleX(' + (height > 0 ? scrollY / height : 0) + ')';
    let active = 'top';
    sections.forEach(section => { if (section.getBoundingClientRect().top < innerHeight * .4) active = section.id; });
    $$('.nav__links a').forEach(link => {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }, { passive: true });
  window.addEventListener('resize', () => { updateScroll(); updateGallery(); });
  window.addEventListener('load', updateScroll, { once: true });

  // Pointer effects schedule work only while a pointer event is active.
  const cursor = $('.cursor');
  let pointerFrame = 0;
  let pointer = { x: 0, y: 0, target: null };
  let lastTilt = null;
  function resetPointer() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    cursor.classList.remove('is-visible');
    if (lastTilt) lastTilt.style.transform = '';
    lastTilt = null;
  }
  function renderPointer() {
    pointerFrame = 0;
    if (paused || !finePointer.matches || document.hidden) return;
    cursor.style.transform = 'translate3d(' + pointer.x + 'px,' + pointer.y + 'px,0)';
    cursor.classList.add('is-visible');
    cursor.classList.toggle('is-active', Boolean(pointer.target.closest('a,button,summary')));
    const tilt = pointer.target.closest('[data-tilt]');
    if (lastTilt && lastTilt !== tilt) lastTilt.style.transform = '';
    if (tilt) {
      const box = tilt.parentElement.getBoundingClientRect();
      const x = Math.max(-.5, Math.min(.5, (pointer.x - box.left) / box.width - .5));
      const y = Math.max(-.5, Math.min(.5, (pointer.y - box.top) / box.height - .5));
      tilt.style.transform = 'perspective(1100px) rotateX(' + (-y * 3) + 'deg) rotateY(' + (x * 3) + 'deg)';
      tilt.style.setProperty('--light-x', (x + .5) * 100 + '%');
      tilt.style.setProperty('--light-y', (y + .5) * 100 + '%');
    }
    lastTilt = tilt;
  }
  document.addEventListener('pointermove', event => {
    if (paused || !finePointer.matches || event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY, target: event.target };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', resetPointer);
  window.addEventListener('blur', resetPointer);
  window.addEventListener('scroll', resetPointer, { passive: true });
  document.addEventListener('visibilitychange', () => {
    html.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) resetPointer();
  });

  const gallery = $('.gallery');
  const galleryItems = $$('[data-gallery]');
  const galleryBack = $('.gallery-back');
  const galleryForward = $('.gallery-forward');
  function updateGallery() {
    const max = gallery.scrollWidth - gallery.clientWidth;
    const progress = max > 0 ? Math.max(0, Math.min(1, gallery.scrollLeft / max)) : 1;
    $('.gallery-progress i').style.transform = 'scaleX(' + (.15 + progress * .85) + ')';
    galleryBack.disabled = gallery.scrollLeft < 2;
    galleryForward.disabled = gallery.scrollLeft >= max - 2;
  }
  gallery.addEventListener('scroll', updateGallery, { passive: true });
  function slideGallery(direction) {
    const current = gallery.scrollLeft;
    const positions = galleryItems.map(item => item.offsetLeft - galleryItems[0].offsetLeft);
    const destination = direction > 0
      ? positions.find(position => position > current + 8)
      : positions.reverse().find(position => position < current - 8);
    if (destination !== undefined) gallery.scrollTo({ left: destination, behavior: paused ? 'instant' : 'smooth' });
  }
  galleryBack.addEventListener('click', () => slideGallery(-1));
  galleryForward.addEventListener('click', () => slideGallery(1));

  // Slow continuous gallery motion; pause for reading, touch, focus, dialogs and offscreen state.
  let galleryFrame = 0;
  let galleryVisible = false;
  let galleryHovered = false;
  let galleryDirection = 1;
  let galleryPosition = gallery.scrollLeft;
  let galleryTime = 0;
  let galleryResumeTimer = 0;
  let galleryInteraction = false;
  function canAnimateGallery() {
    return galleryVisible && !paused && !document.hidden && !galleryHovered && !galleryInteraction
      && !$('#showtime').contains(document.activeElement) && !$('dialog[open]');
  }
  function syncGalleryMotion() {
    cancelAnimationFrame(galleryFrame);
    galleryFrame = 0;
    galleryTime = 0;
    galleryPosition = gallery.scrollLeft;
    if (canAnimateGallery()) {
      gallery.classList.add('is-autoscrolling');
      galleryFrame = requestAnimationFrame(animateGallery);
    }
  }
  function animateGallery(time) {
    galleryFrame = 0;
    if (!canAnimateGallery()) return;
    const elapsed = galleryTime ? Math.min(time - galleryTime, 40) : 0;
    galleryTime = time;
    const max = gallery.scrollWidth - gallery.clientWidth;
    if (max <= 0) return;
    const edgeDistance = galleryDirection > 0 ? max - galleryPosition : galleryPosition;
    const speed = 34 * Math.max(.25, Math.min(1, edgeDistance / 100));
    galleryPosition = Math.max(0, Math.min(max, galleryPosition + galleryDirection * elapsed * speed / 1000));
    gallery.scrollTo({ left: galleryPosition, behavior: 'instant' });
    if (galleryPosition >= max - .2) galleryDirection = -1;
    if (galleryPosition <= .2) galleryDirection = 1;
    galleryFrame = requestAnimationFrame(animateGallery);
  }
  function pauseForGalleryInteraction() {
    galleryInteraction = true;
    clearTimeout(galleryResumeTimer);
    syncGalleryMotion();
    galleryResumeTimer = setTimeout(() => { galleryInteraction = false; syncGalleryMotion(); }, 3000);
  }
  gallery.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { galleryHovered = true; syncGalleryMotion(); }
  });
  gallery.addEventListener('pointerleave', () => { galleryHovered = false; syncGalleryMotion(); });
  gallery.addEventListener('pointerdown', pauseForGalleryInteraction, { passive: true });
  gallery.addEventListener('wheel', pauseForGalleryInteraction, { passive: true });
  $('#showtime').addEventListener('focusin', syncGalleryMotion);
  $('#showtime').addEventListener('focusout', () => setTimeout(syncGalleryMotion, 0));
  document.addEventListener('visibilitychange', syncGalleryMotion);
  reduced.addEventListener('change', syncGalleryMotion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      galleryVisible = entry.isIntersecting;
      syncGalleryMotion();
    }, { threshold: .25 }).observe(gallery);
  }

  const lightbox = $('.lightbox');
  let imageIndex = 0;
  let lightboxTrigger = null;
  function displayImage(index) {
    imageIndex = (index + galleryItems.length) % galleryItems.length;
    const source = $('img', galleryItems[imageIndex]);
    const target = $('figure img', lightbox);
    target.src = source.currentSrc || source.src;
    target.alt = source.alt;
    $('figcaption', lightbox).textContent = source.alt;
  }
  function openDialog(dialog) {
    resetPointer();
    dialog.showModal();
    document.body.classList.add('is-locked');
    syncGalleryMotion();
  }
  galleryItems.forEach((item, index) => item.addEventListener('click', () => {
    lightboxTrigger = item;
    displayImage(index);
    openDialog(lightbox);
  }));
  $('.lightbox__close').addEventListener('click', () => lightbox.close());
  $('.lightbox__prev').addEventListener('click', () => displayImage(imageIndex - 1));
  $('.lightbox__next').addEventListener('click', () => displayImage(imageIndex + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      displayImage(imageIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('is-locked');
    if (lightboxTrigger) lightboxTrigger.focus({ preventScroll: true });
  });

  const bookingDialog = $('.booking-dialog');
  const bookingForm = $('.booking-form');
  const bookingStatus = $('.booking-status');
  const bookingDateField = $('.booking-date-field', bookingForm);
  const bookingDateInput = $('input[name="date"]', bookingDateField);
  const bookingDateTrigger = $('.booking-date-trigger', bookingDateField);
  const bookingDateDisplay = $('[data-date-display]', bookingDateTrigger);
  const bookingCalendar = $('.booking-calendar', bookingDateField);
  const bookingCalendarTitle = $('[data-calendar-title]', bookingCalendar);
  const bookingCalendarDays = $('.booking-calendar__days', bookingCalendar);
  const today = new Date();
  let calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const padDate = value => String(value).padStart(2, '0');
  const dateValue = date => `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}`;
  function renderBookingCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const dayCount = new Date(year, month + 1, 0).getDate();
    bookingCalendarTitle.textContent = `${year}.${padDate(month + 1)}`;
    bookingCalendarDays.replaceChildren();
    for (let cell = 0; cell < 42; cell += 1) {
      const day = cell - firstWeekday + 1;
      const button = document.createElement('button');
      button.type = 'button';
      if (day < 1 || day > dayCount) {
        button.disabled = true;
        button.setAttribute('aria-hidden', 'true');
      } else {
        const current = new Date(year, month, day);
        const value = dateValue(current);
        button.textContent = String(day);
        button.dataset.date = value;
        button.setAttribute('role', 'gridcell');
        button.setAttribute('aria-label', `${year}年${month + 1}月${day}日`);
        button.setAttribute('aria-selected', String(bookingDateInput.value === value));
        if (value === dateValue(today)) button.classList.add('is-today');
      }
      bookingCalendarDays.append(button);
    }
  }
  function openBookingCalendar() {
    if (bookingDateInput.value) {
      const [year, month] = bookingDateInput.value.split('-').map(Number);
      calendarMonth = new Date(year, month - 1, 1);
    }
    renderBookingCalendar();
    bookingCalendar.hidden = false;
    bookingDateTrigger.setAttribute('aria-expanded', 'true');
  }
  function closeBookingCalendar() {
    bookingCalendar.hidden = true;
    bookingDateTrigger.setAttribute('aria-expanded', 'false');
  }
  bookingDateTrigger.addEventListener('click', () => bookingCalendar.hidden ? openBookingCalendar() : closeBookingCalendar());
  bookingDateField.addEventListener('click', event => {
    if (event.target.closest('.booking-calendar') || event.target.closest('.booking-date-trigger')) return;
    bookingDateTrigger.click();
  });
  $('[data-calendar-prev]', bookingCalendar).addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderBookingCalendar();
  });
  $('[data-calendar-next]', bookingCalendar).addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderBookingCalendar();
  });
  bookingCalendarDays.addEventListener('click', event => {
    const day = event.target.closest('button[data-date]');
    if (!day) return;
    bookingDateInput.value = day.dataset.date;
    const [year, month, date] = day.dataset.date.split('-');
    bookingDateDisplay.textContent = `${year} / ${month} / ${date}`;
    bookingForm.dispatchEvent(new Event('input', { bubbles: true }));
    closeBookingCalendar();
    bookingDateTrigger.focus({ preventScroll: true });
  });
  bookingDateField.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || bookingCalendar.hidden) return;
    event.stopPropagation();
    closeBookingCalendar();
    bookingDateTrigger.focus({ preventScroll: true });
  });
  document.addEventListener('click', event => {
    if (!bookingCalendar.hidden && !bookingDateField.contains(event.target)) closeBookingCalendar();
  });
  $('.booking-open').addEventListener('click', () => openDialog(bookingDialog));
  $('.booking-close').addEventListener('click', () => bookingDialog.close());
  bookingDialog.addEventListener('close', () => {
    closeBookingCalendar();
    document.body.classList.remove('is-locked');
  });
  [bookingDialog, lightbox].forEach(dialog => dialog.addEventListener('close', syncGalleryMotion));
  [bookingDialog, lightbox].forEach(dialog => dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  }));
  const sendButton = $('button[type="submit"]', bookingForm);
  const sendFields = $$('input,select,textarea', bookingForm);
  let sending = false;
  let acceptedSignature = '';
  function showBookingStatus(state, message) {
    bookingStatus.dataset.state = state;
    bookingStatus.textContent = message;
  }
  function refreshSendButton() {
    sendButton.disabled = sending || Boolean(acceptedSignature);
    if (sending) sendButton.textContent = '发送中…';
    else if (acceptedSignature) sendButton.textContent = '已提交';
    else sendButton.innerHTML = '确定 <span aria-hidden="true">↗</span>';
    sendButton.setAttribute('aria-label', sending ? '发送中…' : acceptedSignature ? '已提交' : '确定');
  }
  bookingForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || acceptedSignature || !bookingForm.reportValidity()) return;
    const data = new FormData(bookingForm);
    const city = String(data.get('city') || '').trim();
    if (!city) { bookingForm.elements.city.setCustomValidity('请填写演出城市'); bookingForm.elements.city.reportValidity(); return; }
    const bookingDate = String(data.get('date') || '').trim();
    if (!bookingDate) {
      showBookingStatus('error', '请选择意向日期。');
      openBookingCalendar();
      bookingDateTrigger.focus({ preventScroll: true });
      return;
    }
    const contact = String(data.get('contact') || '').trim();
    if (!contact) { bookingForm.elements.contact.setCustomValidity('请填写联系电话或微信号'); bookingForm.elements.contact.reportValidity(); return; }
    if (String(data.get('_honey') || '').trim()) {
      showBookingStatus('error', '无法提交，请刷新页面后重新填写。');
      return;
    }
    const payload = {
      '意向艺人': 'YADARM × BraVo',
      '演出城市': city,
      '意向日期': bookingDate,
      '活动类型': String(data.get('type')),
      '联系电话 / 微信': contact,
      '补充需求': String(data.get('notes') || '').trim() || '待沟通',
      _subject: String(data.get('_subject')),
      _template: 'table',
      _honey: '',
      _url: location.origin + location.pathname
    };
    const signature = JSON.stringify(payload);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    sending = true;
    sendFields.forEach(field => { field.disabled = true; });
    bookingForm.setAttribute('aria-busy', 'true');
    refreshSendButton();
    showBookingStatus('sending', '正在提交邀约，请稍候，不要重复发送。');
    try {
      const response = await fetch('https://formsubmit.co/ajax/kpopcn@agent.qq.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await response.json();
      const message = String(result.message || '');
      if (/activat|confirmation|confirm.*email|verify.*email/i.test(message)) {
        showBookingStatus('activation', '收件邮箱尚待激活，请联系 TBN 确认邮箱激活后再提交。你的填写内容已保留。');
      } else if (response.ok && (result.success === true || result.success === 'true')) {
        acceptedSignature = signature;
        showBookingStatus('success', '邀约已提交，邮件服务已受理。请保持电话或微信畅通，等待 TBN 经纪团队联系。');
      } else {
        showBookingStatus('error', '邮件服务暂未受理，请稍后再试。你的填写内容已保留。');
      }
    } catch (error) {
      showBookingStatus('error', error.name === 'AbortError'
        ? '请求超时，暂时无法确认是否提交成功。内容已保留，请勿连续重复发送。'
        : '网络异常，暂时无法确认提交结果。内容已保留，请检查网络后重试。');
    } finally {
      clearTimeout(timeout);
      sending = false;
      sendFields.forEach(field => { field.disabled = false; });
      bookingForm.removeAttribute('aria-busy');
      refreshSendButton();
      if (bookingDialog.open) bookingStatus.scrollIntoView({ behavior: paused ? 'instant' : 'smooth', block: 'nearest' });
    }
  });
  bookingForm.addEventListener('input', () => {
    if (sending) return;
    bookingForm.elements.city.setCustomValidity('');
    bookingForm.elements.contact.setCustomValidity('');
    acceptedSignature = '';
    showBookingStatus('', '');
    refreshSendButton();
  });

  applyMotion();
  updateScroll();
  updateGallery();
  html.classList.add('is-ready');
})();
