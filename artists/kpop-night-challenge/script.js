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

document.querySelector('#inquiryForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const text = `KPOP踢馆巡演合作需求\n巡演城市：${data.get('city')}\n舞台面积：${data.get('stage')}\n抖音官媒数据：${data.get('douyin')}`;
  const status = form.querySelector('.form-status');
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = '合作需求已复制，可直接发送给合作团队。';
  } catch {
    status.textContent = '复制未成功，请手动记录以上信息。';
  }
});
