(function () {
  'use strict';

  var body = document.body;
  var header = document.querySelector('[data-header]');
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');

  window.addEventListener('load', function () {
    window.setTimeout(function () {
      body.classList.remove('is-loading');
      body.classList.add('is-ready');
    }, 650);
  });

  window.setTimeout(function () {
    body.classList.remove('is-loading');
    body.classList.add('is-ready');
  }, 2400);

  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 30);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.classList.remove('is-open');
    body.style.overflow = '';
  }

  menuButton.addEventListener('click', function () {
    var open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    mobileMenu.setAttribute('aria-hidden', String(open));
    mobileMenu.classList.toggle('is-open', !open);
    body.style.overflow = open ? '' : 'hidden';
  });

  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.reveal').forEach(function (el, index) {
    el.style.transitionDelay = Math.min(index % 4, 3) * 70 + 'ms';
    revealObserver.observe(el);
  });

  var player = document.querySelector('[data-player]');
  var audio = document.querySelector('[data-audio]');
  var playButton = document.querySelector('[data-play]');
  var progress = document.querySelector('[data-progress]');
  var current = document.querySelector('[data-current]');
  var waveform = document.querySelector('[data-waveform]');

  for (var i = 0; i < 42; i += 1) {
    var bar = document.createElement('span');
    var height = 18 + Math.abs(Math.sin(i * 1.73) * 31) + (i % 5) * 2;
    bar.style.setProperty('--h', Math.min(height, 50) + 'px');
    bar.style.setProperty('--d', '-' + (i * 27) + 'ms');
    waveform.appendChild(bar);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '00:00';
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  playButton.addEventListener('click', function () {
    if (audio.paused) {
      audio.muted = false;
      audio.play().catch(function () {});
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', function () {
    player.classList.add('is-playing');
    playButton.setAttribute('aria-label', '暂停《你的后座》');
  });
  audio.addEventListener('pause', function () {
    player.classList.remove('is-playing');
    playButton.setAttribute('aria-label', '播放《你的后座》');
  });
  audio.addEventListener('ended', function () {
    player.classList.remove('is-playing');
    playButton.setAttribute('aria-label', '播放《你的后座》');
  });
  audio.addEventListener('timeupdate', function () {
    if (!audio.duration) return;
    progress.value = Math.round((audio.currentTime / audio.duration) * 1000);
    current.textContent = formatTime(audio.currentTime);
  });
  progress.addEventListener('input', function () {
    if (audio.duration) audio.currentTime = (Number(progress.value) / 1000) * audio.duration;
  });

  function openDialog(dialog) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  var imageDialog = document.querySelector('[data-image-dialog]');
  var dialogImage = document.querySelector('[data-dialog-image]');

  function closeImage() {
    if (typeof imageDialog.close === 'function') imageDialog.close();
    else imageDialog.removeAttribute('open');
  }

  document.querySelectorAll('[data-image]').forEach(function (button) {
    button.addEventListener('click', function () {
      dialogImage.src = button.getAttribute('data-image');
      openDialog(imageDialog);
    });
  });
  document.querySelector('[data-close-image]').addEventListener('click', closeImage);
  imageDialog.addEventListener('click', function (event) {
    if (event.target === imageDialog) closeImage();
  });

  var bookingDialog = document.querySelector('[data-booking-dialog]');
  var bookingOpen = document.querySelector('[data-booking-open]');
  var bookingClose = document.querySelector('[data-booking-close]');
  var bookingForm = document.querySelector('[data-booking-form]');
  var bookingStatus = document.querySelector('[data-booking-status]');
  var bookingSubmit = document.querySelector('[data-booking-submit]');
  var bookingFields = bookingForm.querySelectorAll('input, select, textarea');
  var bookingDate = bookingForm.elements.date;
  var sending = false;
  var acceptedSignature = '';

  function closeBooking() {
    if (typeof bookingDialog.close === 'function') bookingDialog.close();
    else bookingDialog.removeAttribute('open');
  }

  function showBookingStatus(state, message) {
    bookingStatus.dataset.state = state;
    bookingStatus.textContent = message;
  }

  function refreshBookingButton() {
    bookingSubmit.disabled = sending || Boolean(acceptedSignature);
    bookingSubmit.innerHTML = sending ? '发送中…' : acceptedSignature ? '已提交' : '确定 <span aria-hidden="true">↗</span>';
  }

  bookingOpen.addEventListener('click', function () {
    openDialog(bookingDialog);
    body.classList.add('has-dialog');
  });
  bookingClose.addEventListener('click', closeBooking);
  bookingDialog.addEventListener('close', function () {
    body.classList.remove('has-dialog');
    bookingOpen.focus({ preventScroll: true });
  });
  bookingDialog.addEventListener('click', function (event) {
    if (event.target === bookingDialog) closeBooking();
  });
  bookingDate.addEventListener('click', function () {
    if (typeof bookingDate.showPicker === 'function') {
      try { bookingDate.showPicker(); } catch (error) { /* Native date input remains usable. */ }
    }
  });

  bookingForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (sending || acceptedSignature || !bookingForm.reportValidity()) return;
    var data = new FormData(bookingForm);
    var city = String(data.get('city') || '').trim();
    var contact = String(data.get('contact') || '').trim();
    if (!city) {
      bookingForm.elements.city.setCustomValidity('请填写演出城市');
      bookingForm.elements.city.reportValidity();
      return;
    }
    if (!contact) {
      bookingForm.elements.contact.setCustomValidity('请填写联系电话或微信号');
      bookingForm.elements.contact.reportValidity();
      return;
    }
    if (String(data.get('_honey') || '').trim()) {
      showBookingStatus('error', '无法提交，请刷新页面后重新填写。');
      return;
    }
    var payload = {
      '意向艺人': 'PickTa｜智妍 × 过儿',
      '演出城市': city,
      '意向日期': String(data.get('date')),
      '活动类型': String(data.get('type')),
      '联系电话 / 微信': contact,
      '补充需求': String(data.get('notes') || '').trim() || '待沟通',
      '_subject': String(data.get('_subject')),
      '_template': 'table',
      '_honey': '',
      '_url': location.origin + location.pathname
    };
    var signature = JSON.stringify(payload);
    var controller = new AbortController();
    var timeout = window.setTimeout(function () { controller.abort(); }, 20000);
    sending = true;
    bookingFields.forEach(function (field) { field.disabled = true; });
    bookingForm.setAttribute('aria-busy', 'true');
    refreshBookingButton();
    showBookingStatus('sending', '正在提交邀约，请稍候，不要重复发送。');
    fetch('https://formsubmit.co/ajax/kpopcn@agent.qq.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).then(function (response) {
      return response.json().then(function (result) { return { response: response, result: result }; });
    }).then(function (outcome) {
      var message = String(outcome.result.message || '');
      if (/activat|confirmation|confirm.*email|verify.*email/i.test(message)) {
        showBookingStatus('activation', '收件邮箱尚待激活，请联系 TBN 确认邮箱激活后再提交。你的填写内容已保留。');
      } else if (outcome.response.ok && (outcome.result.success === true || outcome.result.success === 'true')) {
        acceptedSignature = signature;
        showBookingStatus('success', '邀约已提交，邮件服务已受理。请保持电话或微信畅通，等待 TBN 经纪团队联系。');
      } else {
        showBookingStatus('error', '邮件服务暂未受理，请稍后再试。你的填写内容已保留。');
      }
    }).catch(function (error) {
      showBookingStatus('error', error.name === 'AbortError'
        ? '请求超时，暂时无法确认是否提交成功。内容已保留，请勿连续重复发送。'
        : '网络异常，暂时无法确认提交结果。内容已保留，请检查网络后重试。');
    }).finally(function () {
      window.clearTimeout(timeout);
      sending = false;
      bookingFields.forEach(function (field) { field.disabled = false; });
      bookingForm.removeAttribute('aria-busy');
      refreshBookingButton();
    });
  });

  bookingForm.addEventListener('input', function () {
    if (sending) return;
    bookingForm.elements.city.setCustomValidity('');
    bookingForm.elements.contact.setCustomValidity('');
    acceptedSignature = '';
    showBookingStatus('', '');
    refreshBookingButton();
  });

  document.querySelector('[data-year]').textContent = new Date().getFullYear();

  if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var heroImage = document.querySelector('.hero__media img');
    window.addEventListener('scroll', function () {
      if (window.scrollY < window.innerHeight) {
        heroImage.style.transform = 'translateY(' + (window.scrollY * 0.08) + 'px) scale(1.01)';
      }
    }, { passive: true });
  }
}());
