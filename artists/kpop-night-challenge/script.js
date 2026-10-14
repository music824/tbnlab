const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.nav a');

window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 40), { passive: true });
menuButton.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
navLinks.forEach(link => link.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count);
    const start = performance.now();
    const duration = 1200;
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = `${Math.floor(target * (1 - Math.pow(1 - progress, 3)))}+`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.8 });
document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

const artistRails = [
  { rail: document.querySelector('#artistRail'), direction: 1 },
  { rail: document.querySelector('#artistRailReverse'), direction: -1 }
];

artistRails.forEach(({ rail }) => {
  [...rail.children].forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.dataset.clone = '';
    clone.querySelector('img')?.setAttribute('alt', '');
    rail.append(clone);
  });
});

const measureArtistLoops = () => {
  artistRails.forEach(item => {
    const firstClone = item.rail.querySelector('[data-clone]');
    item.loopWidth = firstClone.offsetLeft - item.rail.firstElementChild.offsetLeft;
  });
  const reverse = artistRails[1];
  if (reverse.rail.scrollLeft <= 1) reverse.rail.scrollLeft = reverse.loopWidth;
};
measureArtistLoops();
addEventListener('resize', measureArtistLoops, { passive: true });

let lastArtistFrame;
const artistSpeed = 0.028;
const reducedArtistMotion = matchMedia('(prefers-reduced-motion: reduce)');
let artistNudgeFrame;
let artistNudgeActive = false;
const animateArtists = timestamp => {
  const elapsed = lastArtistFrame ? Math.min(timestamp - lastArtistFrame, 50) : 0;
  lastArtistFrame = timestamp;
  if (!document.hidden && !reducedArtistMotion.matches && !artistNudgeActive) {
    artistRails.forEach(item => {
      item.rail.scrollLeft += artistSpeed * elapsed * item.direction;
      if (item.direction > 0 && item.rail.scrollLeft >= item.loopWidth) item.rail.scrollLeft -= item.loopWidth;
      if (item.direction < 0 && item.rail.scrollLeft <= 0) item.rail.scrollLeft += item.loopWidth;
    });
  }
  requestAnimationFrame(animateArtists);
};
requestAnimationFrame(animateArtists);

const nudgeArtists = direction => {
  if (artistNudgeFrame) cancelAnimationFrame(artistNudgeFrame);

  const tracks = artistRails.map(item => {
    const card = item.rail.querySelector('.artist-card');
    const styles = getComputedStyle(item.rail);
    const gap = parseFloat(styles.columnGap || styles.gap) || 18;
    const step = (card?.getBoundingClientRect().width || 230) + gap;
    return { item, distance: step * direction * item.direction };
  });

  const normalizePosition = item => {
    if (!item.loopWidth) return;
    while (item.rail.scrollLeft >= item.loopWidth) item.rail.scrollLeft -= item.loopWidth;
    while (item.rail.scrollLeft < 0) item.rail.scrollLeft += item.loopWidth;
  };

  if (reducedArtistMotion.matches) {
    tracks.forEach(({ item, distance }) => {
      item.rail.scrollLeft += distance;
      normalizePosition(item);
    });
    return;
  }

  const startedAt = performance.now();
  const duration = 520;
  let previousEased = 0;
  artistNudgeActive = true;

  const tick = now => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const easedDelta = eased - previousEased;

    tracks.forEach(({ item, distance }) => {
      item.rail.scrollLeft += distance * easedDelta;
      normalizePosition(item);
    });
    previousEased = eased;

    if (progress < 1) {
      artistNudgeFrame = requestAnimationFrame(tick);
    } else {
      artistNudgeFrame = undefined;
      artistNudgeActive = false;
      lastArtistFrame = now;
    }
  };

  artistNudgeFrame = requestAnimationFrame(tick);
};
document.querySelector('#artistPrev').addEventListener('click', () => nudgeArtists(-1));
document.querySelector('#artistNext').addEventListener('click', () => nudgeArtists(1));

const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox.querySelector('img');
document.querySelectorAll('.gallery-item').forEach(item => item.addEventListener('click', () => {
  lightboxImage.src = item.dataset.full;
  lightboxImage.alt = item.querySelector('img').alt;
  lightbox.showModal();
}));
lightbox.querySelector('button').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });

// Repeated poster artwork makes the wrap visually identical; keep fractional
// distance in JS so slow motion is not rounded away by scrollLeft at high FPS.
const posterRail = document.querySelector('.poster-strip');
const posterOriginals = [...posterRail.querySelectorAll('img')];
const posterMotion = matchMedia('(prefers-reduced-motion: reduce)');
let posterLoopWidth = 0;
let posterPosition = 0;
let posterWrittenPosition = 0;
let posterFrame = 0;
let posterLastTime = 0;
let posterVisible = false;
let posterHovered = false;
let posterFocused = false;
let posterDragging = false;
let posterResumeAt = 0;

const appendPosterCopy = () => {
  posterOriginals.forEach(original => {
    const clone = original.cloneNode(true);
    clone.dataset.posterClone = '';
    clone.setAttribute('aria-hidden', 'true');
    clone.alt = '';
    posterRail.append(clone);
  });
};
appendPosterCopy();

const writePosterPosition = () => {
  if (!posterLoopWidth) return;
  posterPosition = ((posterPosition % posterLoopWidth) + posterLoopWidth) % posterLoopWidth;
  posterRail.scrollLeft = posterPosition;
  posterWrittenPosition = posterRail.scrollLeft;
};
const measurePosterLoop = () => {
  const clone = posterRail.querySelector('[data-poster-clone]');
  const width = clone.offsetLeft - posterOriginals[0].offsetLeft;
  if (!width) return;
  if (posterLoopWidth) posterPosition = posterPosition / posterLoopWidth * width;
  posterLoopWidth = width;
  // Also cover a viewport wider than a whole original set, if the layout changes.
  while (posterRail.scrollWidth - posterRail.clientWidth < posterLoopWidth + 2) appendPosterCopy();
  writePosterPosition();
};
measurePosterLoop();
posterOriginals.forEach(image => image.addEventListener('load', measurePosterLoop));
new ResizeObserver(measurePosterLoop).observe(posterRail);

const animatePosters = now => {
  posterFrame = 0;
  if (!posterVisible || document.hidden || posterMotion.matches) return;
  const elapsed = posterLastTime ? Math.min(now - posterLastTime, 50) : 0;
  posterLastTime = now;
  if (Math.abs(posterRail.scrollLeft - posterWrittenPosition) > .5) posterPosition = posterRail.scrollLeft;
  if (!posterHovered && !posterFocused && !posterDragging && now >= posterResumeAt) posterPosition += elapsed * .028;
  writePosterPosition();
  posterFrame = requestAnimationFrame(animatePosters);
};
const syncPosterAnimation = () => {
  if (posterFrame) cancelAnimationFrame(posterFrame);
  posterFrame = 0;
  posterLastTime = 0;
  if (posterVisible && !document.hidden && !posterMotion.matches) posterFrame = requestAnimationFrame(animatePosters);
};
new IntersectionObserver(entries => {
  posterVisible = entries[0].isIntersecting;
  syncPosterAnimation();
}).observe(posterRail);
document.addEventListener('visibilitychange', syncPosterAnimation);
posterMotion.addEventListener('change', syncPosterAnimation);
posterRail.addEventListener('mouseenter', () => { posterHovered = true; });
posterRail.addEventListener('mouseleave', () => { posterHovered = false; });
posterRail.addEventListener('focusin', () => { posterFocused = true; });
posterRail.addEventListener('focusout', () => { posterFocused = false; });
posterRail.addEventListener('pointerdown', () => { posterDragging = true; });
const finishPosterDrag = () => {
  if (!posterDragging) return;
  posterDragging = false;
  posterResumeAt = performance.now() + 1200;
};
window.addEventListener('pointerup', finishPosterDrag);
window.addEventListener('pointercancel', finishPosterDrag);
posterRail.addEventListener('wheel', () => { posterResumeAt = performance.now() + 1200; }, { passive: true });

const inquiryDialog = document.querySelector('#inquiryDialog');
const inquiryForm = document.querySelector('#inquiryForm');
const inquiryStatus = document.querySelector('#inquiryStatus');
const inquirySubmit = inquiryForm.querySelector('[type="submit"]');
const inquiryFields = [...inquiryForm.querySelectorAll('input, textarea')];
let inquirySending = false;
let inquiryAccepted = false;
let inquiryOpener;

const setInquiryStatus = (state, message) => {
  inquiryStatus.dataset.state = state;
  inquiryStatus.textContent = message;
};
const refreshInquiryButton = () => {
  inquirySubmit.disabled = inquirySending || inquiryAccepted;
  inquirySubmit.textContent = inquirySending ? '提交中…' : inquiryAccepted ? '已提交' : '确定提交 ↗';
};
document.querySelector('[data-inquiry-open]').addEventListener('click', event => {
  inquiryOpener = event.currentTarget;
  document.body.classList.add('inquiry-open');
  inquiryDialog.showModal();
});
inquiryDialog.querySelector('[data-inquiry-close]').addEventListener('click', () => inquiryDialog.close());
inquiryDialog.addEventListener('click', event => {
  if (event.target !== inquiryDialog) return;
  const rect = inquiryDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) inquiryDialog.close();
});
inquiryDialog.addEventListener('close', () => {
  document.body.classList.remove('inquiry-open');
  inquiryOpener?.focus({ preventScroll: true });
});
inquiryForm.addEventListener('input', () => {
  if (inquirySending) return;
  inquiryFields.forEach(field => field.setCustomValidity(''));
  inquiryAccepted = false;
  setInquiryStatus('', '');
  refreshInquiryButton();
});
inquiryForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (inquirySending || inquiryAccepted || !inquiryForm.reportValidity()) return;
  const data = new FormData(inquiryForm);
  for (const [name, label] of [['city', '巡演城市'], ['stage', '舞台面积'], ['contactName', '联系人'], ['contact', '电话或微信']]) {
    if (!String(data.get(name) || '').trim()) {
      inquiryForm.elements[name].setCustomValidity(`请填写${label}`);
      inquiryForm.elements[name].reportValidity();
      return;
    }
  }
  if (String(data.get('_honey') || '').trim()) {
    setInquiryStatus('error', '无法提交，请刷新页面后重新填写。');
    return;
  }
  const payload = {
    '合作项目': 'K-POP 踢馆巡演',
    '巡演城市': String(data.get('city')).trim(),
    '舞台面积（㎡）': String(data.get('stage')).trim(),
    '场地 / 门店': String(data.get('venue') || '').trim() || '待沟通',
    '联系人': String(data.get('contactName')).trim(),
    '联系电话 / 微信': String(data.get('contact')).trim(),
    '补充需求': String(data.get('notes') || '').trim() || '待沟通',
    _subject: 'TBN · K-POP 踢馆巡演合作预约',
    _template: 'table',
    _honey: '',
    _url: location.origin + location.pathname
  };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  inquirySending = true;
  inquiryFields.forEach(field => { field.disabled = true; });
  inquiryForm.setAttribute('aria-busy', 'true');
  refreshInquiryButton();
  setInquiryStatus('sending', '正在提交预约，请稍候，不要重复发送。');
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
      setInquiryStatus('activation', '收件邮箱尚待激活，请联系 TBN 确认邮箱激活后再提交。填写内容已保留。');
    } else if (response.ok && (result.success === true || result.success === 'true')) {
      inquiryAccepted = true;
      setInquiryStatus('success', '预约已提交，邮件服务已受理。请保持电话或微信畅通，等待 TBN 团队联系。');
    } else {
      setInquiryStatus('error', '邮件服务暂未受理，请稍后再试。填写内容已保留。');
    }
  } catch (error) {
    setInquiryStatus('error', error.name === 'AbortError'
      ? '请求超时，暂时无法确认是否提交成功。内容已保留，请勿连续重复发送。'
      : '网络异常，暂时无法确认提交结果。内容已保留，请检查网络后重试。');
  } finally {
    window.clearTimeout(timeout);
    inquirySending = false;
    inquiryFields.forEach(field => { field.disabled = false; });
    inquiryForm.removeAttribute('aria-busy');
    refreshInquiryButton();
    if (inquiryDialog.open) inquiryStatus.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }
});
