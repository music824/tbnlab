(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finishLoad = () => {
    document.body.classList.add('is-loaded');
    window.setTimeout(() => $('.preloader')?.classList.add('is-hidden'), reducedMotion ? 0 : 850);
  };
  if (document.readyState === 'complete') finishLoad();
  else window.addEventListener('load', finishLoad, { once: true });
  window.setTimeout(finishLoad, 2600);

  $('[data-year]').textContent = new Date().getFullYear();
  $('[data-to-top]').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

  const header = $('[data-header]');
  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 36);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const menuButton = $('.menu-toggle');
  const mobileMenu = $('.mobile-menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
  };
  menuButton.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('.mobile-menu a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .01, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min((index % 3) * 80, 160)}ms`;
    observer.observe(element);
  });

  if (!reducedMotion) {
    const parallaxItems = $$('.parallax');
    let ticking = false;
    const updateParallax = () => {
      const viewport = window.innerHeight;
      parallaxItems.forEach((item) => {
        const rect = item.parentElement.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < viewport) {
          const progress = (viewport - rect.top) / (viewport + rect.height) - .5;
          const speed = Number(item.dataset.speed || .06);
          item.style.translate = `0 ${progress * viewport * speed}px`;
        }
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    updateParallax();

    const hero = $('.hero');
    const people = $$('[data-hero-depth]');
    hero.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 721) return;
      const x = event.clientX / window.innerWidth - .5;
      const y = event.clientY / window.innerHeight - .5;
      people.forEach((person) => {
        const depth = Number(person.dataset.heroDepth);
        person.style.translate = `${x * depth}px ${y * depth * .35}px`;
      });
    });
    hero.addEventListener('pointerleave', () => people.forEach((person) => { person.style.translate = ''; }));
  }

  const cursor = $('.cursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let targetX = innerWidth / 2, targetY = innerHeight / 2, x = targetX, y = targetY;
    window.addEventListener('pointermove', (event) => { targetX = event.clientX; targetY = event.clientY; });
    const renderCursor = () => {
      x += (targetX - x) * .18;
      y += (targetY - y) * .18;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      requestAnimationFrame(renderCursor);
    };
    renderCursor();
    $$('a, button').forEach((item) => {
      item.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      item.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });
  }

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  const tracks = $$('.track');
  tracks.forEach((track) => {
    const audio = $('audio', track);
    const play = $('.track__play', track);
    const current = $('.player__time', track);
    const duration = $('.player__duration', track);
    const seek = $('.player__seek', track);
    const progress = $('i', seek);

    const stopOthers = () => tracks.forEach((other) => {
      if (other !== track) {
        $('audio', other).pause();
        other.classList.remove('is-playing');
      }
    });
    play.addEventListener('click', () => {
      if (audio.paused) {
        stopOthers();
        audio.play().then(() => track.classList.add('is-playing')).catch(() => {});
      } else {
        audio.pause();
        track.classList.remove('is-playing');
      }
    });
    audio.addEventListener('loadedmetadata', () => { duration.textContent = formatTime(audio.duration); });
    audio.addEventListener('timeupdate', () => {
      current.textContent = formatTime(audio.currentTime);
      progress.parentElement.style.setProperty('--progress', `${audio.duration ? audio.currentTime / audio.duration * 100 : 0}%`);
    });
    audio.addEventListener('ended', () => track.classList.remove('is-playing'));
    seek.addEventListener('click', (event) => {
      const rect = seek.getBoundingClientRect();
      if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * audio.duration;
    });
  });

  const slider = $('.live-slider');
  const sliderViewport = $('.live-slider__viewport');
  const sliderTrack = $('.live-slider__track');
  const slides = $$('.live-slide');
  const sliderDots = $$('.slider-dot');
  let slideIndex = 0;
  let sliderTimer;
  const goToSlide = (index) => {
    slideIndex = (index + slides.length) % slides.length;
    sliderTrack.style.transform = `translateX(${-slideIndex * 100}%)`;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === slideIndex));
    sliderDots.forEach((dot, i) => {
      const active = i === slideIndex;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };
  const resetSliderTimer = () => {
    window.clearInterval(sliderTimer);
    if (!reducedMotion) sliderTimer = window.setInterval(() => goToSlide(slideIndex + 1), 3800);
  };
  $('.slider-arrow--prev').addEventListener('click', (event) => { event.preventDefault(); goToSlide(slideIndex - 1); resetSliderTimer(); });
  $('.slider-arrow--next').addEventListener('click', (event) => { event.preventDefault(); goToSlide(slideIndex + 1); resetSliderTimer(); });
  sliderDots.forEach((dot, index) => dot.addEventListener('click', () => { goToSlide(index); resetSliderTimer(); }));
  let dragStart = null;
  sliderViewport.addEventListener('pointerdown', (event) => { dragStart = event.clientX; sliderViewport.setPointerCapture?.(event.pointerId); });
  sliderViewport.addEventListener('pointerup', (event) => {
    if (dragStart === null) return;
    const distance = event.clientX - dragStart;
    if (Math.abs(distance) > 45) goToSlide(slideIndex + (distance < 0 ? 1 : -1));
    dragStart = null;
    resetSliderTimer();
  });
  sliderViewport.addEventListener('pointercancel', () => { dragStart = null; });
  resetSliderTimer();

  const lightbox = $('.lightbox');
  const lightboxImage = $('img', lightbox);
  const closeLightbox = () => {
    lightbox.close();
    document.body.classList.remove('lightbox-open');
  };
  $$('.editorial-item[data-full]').forEach((item) => item.addEventListener('click', () => {
    lightboxImage.src = item.dataset.full;
    lightboxImage.alt = $('img', item).alt;
    document.body.classList.add('lightbox-open');
    lightbox.showModal();
  }));
  $('.lightbox__close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('close', () => document.body.classList.remove('lightbox-open'));

  const bookingDialog = $('.booking-dialog');
  const bookingForm = $('.booking-form');
  const bookingStatus = $('.booking-status');
  const bookingSubmit = $('.booking-submit');
  const bookingFields = $$('input, select, textarea', bookingForm);
  const bookingDate = $('input[type="date"]', bookingForm);
  const bookingDateTrigger = $('.date-picker__trigger', bookingForm);
  let bookingSending = false;
  let acceptedSignature = '';

  const closeBooking = () => {
    bookingDialog.close();
    document.body.classList.remove('booking-open');
  };
  const showBookingStatus = (state, message) => {
    bookingStatus.dataset.state = state;
    bookingStatus.textContent = message;
  };
  const refreshBookingButton = () => {
    bookingSubmit.disabled = bookingSending || Boolean(acceptedSignature);
    bookingSubmit.textContent = bookingSending ? '发送中…' : acceptedSignature ? '已提交' : '确定 ↗';
    bookingSubmit.setAttribute('aria-label', bookingSending ? '发送中…' : acceptedSignature ? '已提交' : '确定');
  };

  $('.booking-open').addEventListener('click', () => {
    document.body.classList.add('booking-open');
    bookingDialog.showModal();
  });
  $('.booking-close').addEventListener('click', closeBooking);
  bookingDateTrigger.addEventListener('click', () => {
    bookingDate.focus({ preventScroll: true });
    try {
      if (bookingDate.showPicker) bookingDate.showPicker();
      else bookingDate.click();
    } catch {}
  });
  bookingDialog.addEventListener('click', (event) => { if (event.target === bookingDialog) closeBooking(); });
  bookingDialog.addEventListener('close', () => document.body.classList.remove('booking-open'));
  bookingForm.addEventListener('input', () => {
    if (bookingSending) return;
    bookingForm.elements.city.setCustomValidity('');
    bookingForm.elements.contact.setCustomValidity('');
    acceptedSignature = '';
    showBookingStatus('', '');
    refreshBookingButton();
  });
  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (bookingSending || acceptedSignature || !bookingForm.reportValidity()) return;
    const data = new FormData(bookingForm);
    const city = String(data.get('city') || '').trim();
    const contact = String(data.get('contact') || '').trim();
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
    const payload = {
      '意向艺人': 'U&U / UNO × JUN',
      '演出城市': city,
      '意向日期': String(data.get('date')),
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
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    bookingSending = true;
    bookingFields.forEach((field) => { field.disabled = true; });
    bookingForm.setAttribute('aria-busy', 'true');
    refreshBookingButton();
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
      window.clearTimeout(timeout);
      bookingSending = false;
      bookingFields.forEach((field) => { field.disabled = false; });
      bookingForm.removeAttribute('aria-busy');
      refreshBookingButton();
      if (bookingDialog.open) bookingStatus.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
    }
  });
})();
