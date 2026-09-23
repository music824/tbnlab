const root = document.documentElement;
const body = document.body;
const header = document.querySelector('[data-header]');
const progress = document.querySelector('.progress i');
const heroVisual = document.querySelector('[data-parallax]');
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const bookingDialog = document.querySelector('[data-booking-dialog]');
const bookingForm = document.querySelector('[data-booking-form]');
const bookingStatus = document.querySelector('[data-booking-status]');
const bookingSubmit = document.querySelector('[data-booking-submit]');
const bookingFields = bookingForm?.querySelectorAll('input, select, textarea') || [];
let lastBookingOpener = null;
let bookingSending = false;
let acceptedBookingSignature = '';

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    root.classList.add('loader-playing');
    window.setTimeout(() => root.classList.add('loaded'), 2000);
  });
});

let scrollTicking = false;
function updateScrollState() {
  const y = window.scrollY;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  header?.classList.toggle('is-scrolled', y > 28);
  if (progress) progress.style.width = `${Math.min(100, (y / max) * 100)}%`;
  if (heroVisual && y < window.innerHeight * 1.2) {
    heroVisual.style.setProperty('--parallax-y', `${Math.min(54, y * .075)}px`);
  }
  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateScrollState);
    scrollTicking = true;
  }
}, { passive: true });
updateScrollState();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .14, rootMargin: '0px 0px -7% 0px' });
document.querySelectorAll('[data-reveal]').forEach((node) => revealObserver.observe(node));

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  mobileMenu?.classList.remove('is-open');
  body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  mobileMenu?.setAttribute('aria-hidden', String(!opening));
  mobileMenu?.classList.toggle('is-open', opening);
  body.classList.toggle('menu-open', opening);
});
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

function openBooking(opener) {
  if (!bookingDialog) return;
  lastBookingOpener = opener;
  closeMenu();
  if (typeof bookingDialog.showModal === 'function') bookingDialog.showModal();
  else bookingDialog.setAttribute('open', '');
  body.classList.add('has-dialog');
}

function closeBooking() {
  if (!bookingDialog) return;
  if (typeof bookingDialog.close === 'function') bookingDialog.close();
  else {
    bookingDialog.removeAttribute('open');
    body.classList.remove('has-dialog');
    lastBookingOpener?.focus({ preventScroll: true });
  }
}

document.querySelectorAll('[data-booking-open]').forEach((opener) => {
  opener.addEventListener('click', () => openBooking(opener));
});
document.querySelector('[data-booking-close]')?.addEventListener('click', closeBooking);
bookingDialog?.addEventListener('close', () => {
  body.classList.remove('has-dialog');
  lastBookingOpener?.focus({ preventScroll: true });
});
bookingDialog?.addEventListener('click', (event) => {
  if (event.target === bookingDialog) closeBooking();
});

const bookingDate = bookingForm?.elements.date;
if (bookingDate) {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  bookingDate.min = localToday;
  bookingDate.addEventListener('click', () => {
    if (typeof bookingDate.showPicker === 'function') {
      try { bookingDate.showPicker(); } catch (error) { /* Native date input remains available. */ }
    }
  });
}

function showBookingStatus(state, message) {
  if (!bookingStatus) return;
  bookingStatus.dataset.state = state;
  bookingStatus.textContent = message;
}

function refreshBookingButton() {
  if (!bookingSubmit) return;
  bookingSubmit.disabled = bookingSending || Boolean(acceptedBookingSignature);
  bookingSubmit.innerHTML = bookingSending ? '发送中…' : acceptedBookingSignature ? '已提交' : '确定 <span aria-hidden="true">↗</span>';
}

bookingForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (bookingSending || acceptedBookingSignature || !bookingForm.reportValidity()) return;
  const data = new FormData(bookingForm);
  const city = String(data.get('city') || '').trim();
  const contact = String(data.get('contact') || '').trim();
  if (!city || !contact || String(data.get('_honey') || '').trim()) return;

  const payload = {
    '意向艺人': 'DJ TAJO',
    '演出城市': city,
    '意向日期': String(data.get('date')),
    '活动类型': String(data.get('type')),
    '联系方式 / 微信': contact,
    '补充需求': String(data.get('notes') || '').trim() || '待沟通',
    '_subject': String(data.get('_subject')),
    '_template': 'table',
    '_honey': '',
    '_url': location.href.split('#')[0]
  };
  const signature = JSON.stringify(payload);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  bookingSending = true;
  bookingFields.forEach((field) => { field.disabled = true; });
  bookingForm.setAttribute('aria-busy', 'true');
  refreshBookingButton();
  showBookingStatus('sending', '正在提交邀约，请稍候，不要重复发送。');

  try {
    const response = await fetch('https://formsubmit.co/ajax/kpopcn@agent.qq.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const result = await response.json();
    const message = String(result.message || '');
    if (/activat|confirmation|confirm.*email|verify.*email/i.test(message)) {
      showBookingStatus('activation', '收件邮箱尚待激活，请联系 TBN 确认邮箱激活后再提交。你的填写内容已保留。');
    } else if (response.ok && (result.success === true || result.success === 'true')) {
      acceptedBookingSignature = signature;
      showBookingStatus('success', '邀约已提交，邮件服务已受理。请保持联系方式畅通，等待 TBN 经纪团队联系。');
    } else {
      showBookingStatus('error', '邮件服务暂未受理，请稍后再试。你的填写内容已保留。');
    }
  } catch (error) {
    showBookingStatus('error', error.name === 'AbortError'
      ? '请求超时，暂时无法确认是否提交成功。内容已保留，请勿连续重复发送。'
      : '网络异常，暂时无法确认提交结果。内容已保留，请检查网络后重试。');
  } finally {
    window.clearTimeout(timeout);
    bookingSending = false;
    bookingFields.forEach((field) => { field.disabled = false; });
    bookingForm.removeAttribute('aria-busy');
    refreshBookingButton();
  }
});

bookingForm?.addEventListener('input', () => {
  if (bookingSending) return;
  acceptedBookingSignature = '';
  showBookingStatus('', '');
  refreshBookingButton();
});

const clock = document.querySelector('[data-clock]');
function updateClock() {
  if (!clock) return;
  clock.textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date());
}
updateClock();
window.setInterval(updateClock, 1000);

const finePointer = window.matchMedia('(pointer: fine)');
if (finePointer.matches) {
  const cursor = document.querySelector('.cursor');
  let pointerX = -100;
  let pointerY = -100;
  let cursorX = -100;
  let cursorY = -100;
  let cursorFrame;

  const renderCursor = () => {
    cursorX += (pointerX - cursorX) * .18;
    cursorY += (pointerY - cursorY) * .18;
    if (cursor) cursor.style.left = `${cursorX}px`, cursor.style.top = `${cursorY}px`;
    cursorFrame = requestAnimationFrame(renderCursor);
  };
  cursorFrame = requestAnimationFrame(renderCursor);
  window.addEventListener('mousemove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursor?.classList.add('is-visible');
  }, { passive: true });
  document.addEventListener('mouseleave', () => cursor?.classList.remove('is-visible'));
  document.querySelectorAll('.media-hover').forEach((node) => {
    node.addEventListener('mouseenter', () => cursor?.classList.add('is-media'));
    node.addEventListener('mouseleave', () => cursor?.classList.remove('is-media'));
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && cursorFrame) cancelAnimationFrame(cursorFrame);
    else if (!document.hidden) cursorFrame = requestAnimationFrame(renderCursor);
  });

  document.querySelectorAll('.magnetic').forEach((button) => {
    button.addEventListener('mousemove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .12;
      const y = (event.clientY - rect.top - rect.height / 2) * .12;
      button.style.transform = `translate3d(${x}px,${y}px,0)`;
    });
    button.addEventListener('mouseleave', () => { button.style.transform = ''; });
  });
}

const rail = document.querySelector('[data-archive]');
if (rail) {
  let direction = 1;
  let paused = false;
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let lastTime = performance.now();

  function glide(now) {
    const delta = Math.min(40, now - lastTime);
    lastTime = now;
    if (!paused && !dragging && !document.hidden && rail.scrollWidth > rail.clientWidth) {
      rail.scrollLeft += direction * delta * .022;
      const max = rail.scrollWidth - rail.clientWidth;
      if (rail.scrollLeft >= max - 1) direction = -1;
      if (rail.scrollLeft <= 1) direction = 1;
    }
    requestAnimationFrame(glide);
  }
  requestAnimationFrame(glide);

  rail.addEventListener('mouseenter', () => { paused = true; });
  rail.addEventListener('mouseleave', () => { paused = false; dragging = false; rail.classList.remove('is-dragging'); });
  rail.addEventListener('pointerdown', (event) => {
    dragging = true;
    paused = true;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add('is-dragging');
    rail.setPointerCapture(event.pointerId);
  });
  rail.addEventListener('pointermove', (event) => {
    if (dragging) rail.scrollLeft = startScroll - (event.clientX - startX) * 1.25;
  });
  rail.addEventListener('pointerup', (event) => {
    dragging = false;
    paused = false;
    rail.classList.remove('is-dragging');
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  });
}

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('video[autoplay]').forEach((video) => video.pause());
}
