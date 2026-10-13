const artists = [
  { name: "KANG SUNG HOON 강성훈", latinName: "KANG SUNG HOON", koreanName: "강성훈", role: "K-POP ARTIST", image: "assets/posters/roster-20260916-kang-sung-hoon-site.webp", accent: "#c7a071", website: "" },
  { name: "SUJI 소아", latinName: "SUJI", koreanName: "소아", role: "DANCE / PERFORMANCE", image: "assets/posters/roster-20260916-suji-site.webp", accent: "#e42834", website: "" },
  { name: "BY", role: "PERFORMANCE DUO", image: "assets/posters/roster-20260916-by-site.webp", accent: "#9dff19", website: "BY/index.html" },
  { name: "KRISHA", role: "PERFORMANCE DJ", image: "assets/posters/roster-20260916-krisha-site.webp", accent: "#2f64ff", website: "" },
  { name: "PICKTA", role: "PERFORMANCE DUO", image: "assets/posters/roster-20260916-pickta-site.webp", accent: "#d8432e", website: "PickTa/index.html" },
  { name: "X:IN 엑신", latinName: "X:IN", koreanName: "엑신", role: "PERFORMANCE GROUP", image: "assets/posters/roster-20260916-xin-site.webp", accent: "#4a58c7", website: "" },
  { name: "U&U", role: "PERFORMANCE DUO", image: "assets/posters/uu-oriental-site.webp", accent: "#d0b16d", website: "u-and-u/index.html" },
  { name: "SSREAM 쌤", latinName: "SSREAM", koreanName: "쌤", role: "PERFORMANCE DJ", image: "assets/posters/roster-20260916-ssream-site.webp", accent: "#42bcd2", website: "" },
  { name: "MC 베니", role: "RAPPER / MC", image: "assets/posters/roster-20260916-mc-beni-site.webp", accent: "#e5a412", website: "" },
  { name: "DJ 프레스킷", latinName: "DJ", koreanName: "프레스킷", role: "PERFORMANCE DJ", image: "assets/posters/roster-20260916-dj-presket-site.webp", accent: "#eb2528", website: "" },
  { name: "TEENTOP", role: "K-POP GROUP", image: "assets/posters/roster-20260916-teentop-site.webp", accent: "#ef3a24", website: "" },
  { name: "CHEERLEADER QUEEN", role: "CHEERLEADING TEAM", image: "assets/posters/roster-20260916-cheerleader-queen-site.webp", accent: "#2f64ff", website: "" },
  { name: "GARRY DIAMOND", role: "PERFORMANCE DJ", image: "assets/posters/roster-20260916-garry-diamond-site.webp", accent: "#2f64ff", website: "" },
  { name: "ALPHA-X", role: "PERFORMANCE GROUP", image: "assets/posters/roster-20260916-alpha-x-site.webp", accent: "#8db6d9", website: "" },
  { name: "BRAND NEW GIRL 브랜뉴걸", latinName: "BRAND NEW GIRL", koreanName: "브랜뉴걸", role: "PERFORMANCE GROUP", image: "assets/posters/roster-20260916-brand-new-girl-site.webp", accent: "#f43fb4", website: "" },
  { name: "E&K", role: "PERFORMANCE DUO", image: "assets/posters/roster-20260916-eandk-site.webp", accent: "#9c4dff", website: "" },
  { name: "FLAY WITH ME", role: "PERFORMANCE GROUP", image: "assets/posters/roster-20260916-flay-with-me-site.webp", accent: "#38c7ff", website: "" },
  { name: "EPTS", role: "K-POP GROUP", image: "assets/posters/roster-20260916-epts-site.webp", accent: "#00a9ff", website: "" },
  { name: "DJ TAJO", role: "SPECIAL GUEST DJ", image: "assets/posters/roster-20260916-dj-tajo-site.webp", accent: "#c29b58", website: "TAJO/index.html" },
  { name: "FLEX", role: "PERFORMANCE DUO", image: "assets/posters/roster-20260916-flex-site.webp", accent: "#9fca78", website: "" },
  { name: "K-POP 踢馆", role: "K-POP NIGHT CHALLENGE", image: "assets/posters/kpop-night-challenge-site.webp", accent: "#39ef4a", website: "kpop-night-challenge/" },
];

const heroRoot = document.querySelector(".hero-carousel");
const heroFilmstrip = document.querySelector("#hero-filmstrip");
const heroActive = document.querySelector(".hero-carousel__active");
const heroActiveIndex = document.querySelector("#hero-active-index");
const heroActiveName = document.querySelector("#hero-active-name");
const heroActiveRole = document.querySelector("#hero-active-role");
const heroProgressCurrent = document.querySelector("#hero-progress-current");
const heroProgressBar = document.querySelector("#hero-progress-bar");
const heroBackdrops = [...document.querySelectorAll(".hero-carousel__backdrop")];
const profileNotice = document.querySelector("#profile-notice");
const profileNoticeImage = document.querySelector("#profile-notice-image");
const profileNoticeIndex = document.querySelector("#profile-notice-index");
const profileNoticeArtist = document.querySelector("#profile-notice-artist");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const bootScreen = document.querySelector(".boot-screen");
const autoplayDelay = 4000;
const wheelThreshold = 60;
const wheelCooldown = 420;

let heroIndex = 0;
let heroBackdropIndex = 0;
let heroDragStart = 0;
let heroDragDelta = 0;
let heroDragging = false;
let suppressHeroClick = false;
let heroAutoplayTimer;
let wheelResetTimer;
let profileCloseTimer;
let wheelAccumulator = 0;
let wheelLockedUntil = 0;

function twoDigits(number) {
  return String(number).padStart(2, "0");
}

function renderHeroArtistName(artist) {
  if (!artist.koreanName) {
    heroActiveName.textContent = artist.name;
    return;
  }

  const latinName = document.createElement("span");
  latinName.className = "artist-name__latin";
  latinName.textContent = artist.latinName;

  const koreanName = document.createElement("span");
  koreanName.className = "artist-name__korean";
  koreanName.lang = "ko";
  koreanName.textContent = artist.koreanName;

  heroActiveName.replaceChildren(latinName, koreanName);
}

function updateHeroGeometry(offset = 0) {
  const firstSlide = heroFilmstrip.querySelector(".hero-slide");
  if (!firstSlide) return;
  const cardWidth = firstSlide.getBoundingClientRect().width;
  const gap = Number.parseFloat(getComputedStyle(heroFilmstrip).gap) || 0;
  const target = heroRoot.clientWidth / 2 - cardWidth / 2 - heroIndex * (cardWidth + gap) + offset;
  heroFilmstrip.style.setProperty("--hero-track-x", `${target}px`);
}

function swapHeroBackdrop(image) {
  const nextIndex = (heroBackdropIndex + 1) % heroBackdrops.length;
  const next = heroBackdrops[nextIndex];
  const previous = heroBackdrops[heroBackdropIndex];
  const reveal = () => {
    next.classList.add("is-visible");
    previous.classList.remove("is-visible");
    heroBackdropIndex = nextIndex;
  };

  next.src = image;
  if (next.complete) reveal();
  else next.addEventListener("load", reveal, { once: true });
}

function scheduleHeroAutoplay(delay = autoplayDelay) {
  window.clearTimeout(heroAutoplayTimer);
  if (reduceMotion || heroDragging || profileNotice.hasAttribute("open") || document.hidden) return;
  heroAutoplayTimer = window.setTimeout(() => setHero(heroIndex + 1), delay);
}

function setHero(nextIndex, options = {}) {
  const { wrap = true, swapBackground = true } = options;
  const lastIndex = artists.length - 1;
  const next = wrap
    ? (nextIndex + artists.length) % artists.length
    : Math.min(lastIndex, Math.max(0, nextIndex));
  const changed = next !== heroIndex;
  heroIndex = next;
  const artist = artists[heroIndex];

  heroRoot.style.setProperty("--hero-accent", artist.accent);
  heroProgressBar.style.setProperty("--hero-progress-x", `${heroIndex * 100}%`);
  heroProgressCurrent.textContent = twoDigits(heroIndex + 1);
  heroActiveIndex.textContent = `${twoDigits(heroIndex + 1)} / ${twoDigits(artists.length)}`;
  renderHeroArtistName(artist);
  heroActiveName.classList.toggle("is-long", artist.name.length > 11);
  heroActiveRole.textContent = artist.role;
  heroActive.setAttribute("aria-label", `打开 ${artist.name} 个人主页`);

  heroActive.classList.remove("is-switching");
  void heroActive.offsetWidth;
  heroActive.classList.add("is-switching");

  heroFilmstrip.querySelectorAll(".hero-slide").forEach((slide, index) => {
    const selected = index === heroIndex;
    slide.classList.toggle("is-active", selected);
    slide.setAttribute("aria-current", selected ? "true" : "false");
    if (Math.abs(index - heroIndex) <= 1) slide.querySelector("img").loading = "eager";
    slide.setAttribute("aria-label", selected ? `打开 ${artists[index].name} 个人主页` : `选择 ${artists[index].name}`);
  });

  if (changed && swapBackground) swapHeroBackdrop(artist.image);
  updateHeroGeometry();
  scheduleHeroAutoplay();
}

function openProfile(index) {
  const artist = artists[index];
  if (artist.website) {
    window.location.href = artist.website;
    return;
  }

  profileNotice.style.setProperty("--notice-accent", artist.accent);
  profileNoticeImage.src = artist.image;
  profileNoticeIndex.textContent = twoDigits(index + 1);
  profileNoticeArtist.textContent = artist.name;
  window.clearTimeout(heroAutoplayTimer);
  window.clearTimeout(profileCloseTimer);
  profileNotice.classList.remove("is-closing");

  if (typeof profileNotice.showModal === "function") profileNotice.showModal();
  else {
    profileNotice.setAttribute("open", "");
    profileNotice.setAttribute("aria-modal", "true");
  }
  document.body.classList.add("is-modal-open");
}

function finishProfileNoticeClose() {
  if (typeof profileNotice.close === "function") profileNotice.close();
  else {
    profileNotice.removeAttribute("open");
    profileNotice.removeAttribute("aria-modal");
    profileNotice.dispatchEvent(new Event("close"));
  }
  profileNotice.classList.remove("is-closing");
}

function closeProfileNotice() {
  if (!profileNotice.hasAttribute("open") || profileNotice.classList.contains("is-closing")) return;
  if (reduceMotion) {
    finishProfileNoticeClose();
    return;
  }

  profileNotice.classList.add("is-closing");
  window.clearTimeout(profileCloseTimer);
  profileCloseTimer = window.setTimeout(finishProfileNoticeClose, 680);
}

function renderHero() {
  heroRoot.style.setProperty("--artist-count", artists.length);
  // The artist directory is rendered in HTML so links remain discoverable without JavaScript.

  heroFilmstrip.querySelectorAll(".hero-slide").forEach((slide) => {
    const index = Number(slide.dataset.index);
    slide.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (suppressHeroClick) return;
      if (index === heroIndex) {
        openProfile(index);
        return;
      }
      setHero(index, { wrap: false });
    });
    slide.addEventListener("mouseenter", () => {
      const cursor = document.querySelector(".cursor");
      if (!cursor) return;
      cursor.querySelector("span").textContent = index === heroIndex ? "ENTER" : "SELECT";
      cursor.classList.add("is-view");
    });
    slide.addEventListener("mouseleave", () => document.querySelector(".cursor")?.classList.remove("is-view"));
  });

  heroFilmstrip.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    heroDragging = true;
    heroDragStart = event.clientX;
    heroDragDelta = 0;
    suppressHeroClick = false;
    window.clearTimeout(heroAutoplayTimer);
    heroFilmstrip.classList.add("is-dragging");
  });

  window.addEventListener("pointermove", (event) => {
    if (!heroDragging) return;
    heroDragDelta = event.clientX - heroDragStart;
    suppressHeroClick = Math.abs(heroDragDelta) > 6;
    updateHeroGeometry(heroDragDelta);
  });

  const finishDrag = () => {
    if (!heroDragging) return;
    heroDragging = false;
    heroFilmstrip.classList.remove("is-dragging");
    const cardWidth = heroFilmstrip.querySelector(".hero-slide")?.getBoundingClientRect().width || 160;
    const threshold = Math.min(70, cardWidth * 0.28);

    if (Math.abs(heroDragDelta) >= threshold) {
      setHero(heroIndex + (heroDragDelta < 0 ? 1 : -1), { wrap: false });
    } else {
      updateHeroGeometry();
      scheduleHeroAutoplay();
    }
    window.setTimeout(() => (suppressHeroClick = false), 0);
  };

  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);

  heroRoot.addEventListener(
    "wheel",
    (event) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      window.clearTimeout(heroAutoplayTimer);

      const now = event.timeStamp;
      if (now < wheelLockedUntil) return;

      wheelAccumulator += delta;
      const liveOffset = Math.max(-46, Math.min(46, wheelAccumulator * -0.34));
      updateHeroGeometry(liveOffset);
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAccumulator = 0;
        updateHeroGeometry();
        scheduleHeroAutoplay();
      }, 140);

      if (Math.abs(wheelAccumulator) < wheelThreshold) return;
      const direction = Math.sign(wheelAccumulator);
      wheelAccumulator = 0;
      wheelLockedUntil = now + wheelCooldown;
      setHero(heroIndex + direction);
    },
    { passive: false },
  );

  heroRoot.addEventListener("keydown", (event) => {
    const destinations = {
      ArrowLeft: heroIndex - 1,
      ArrowRight: heroIndex + 1,
      Home: 0,
      End: artists.length - 1,
    };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    window.clearTimeout(heroAutoplayTimer);
    setHero(destinations[event.key], { wrap: false });
  });

  document.querySelector("#hero-prev").addEventListener("click", () => {
    window.clearTimeout(heroAutoplayTimer);
    setHero(heroIndex - 1);
  });
  document.querySelector("#hero-next").addEventListener("click", () => {
    window.clearTimeout(heroAutoplayTimer);
    setHero(heroIndex + 1);
  });
  heroActive.addEventListener("click", () => openProfile(heroIndex));
  window.addEventListener("resize", () => requestAnimationFrame(() => updateHeroGeometry()));

  requestAnimationFrame(() => setHero(0, { swapBackground: false }));
}

profileNotice.addEventListener("click", closeProfileNotice);
profileNotice.addEventListener("close", () => {
  window.clearTimeout(profileCloseTimer);
  profileNotice.classList.remove("is-closing");
  document.body.classList.remove("is-modal-open");
  scheduleHeroAutoplay(1800);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && profileNotice.hasAttribute("open")) closeProfileNotice();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) window.clearTimeout(heroAutoplayTimer);
  else scheduleHeroAutoplay(1400);
});

if (finePointer && !reduceMotion) {
  const cursor = document.querySelector(".cursor");
  const glow = document.querySelector(".pointer-glow");
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let cursorX = pointerX;
  let cursorY = pointerY;
  let cursorFrame = 0;

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    glow.style.transform = `translate(${pointerX}px, ${pointerY}px) translate(-50%, -50%)`;
    if (!cursorFrame && !document.hidden) cursorFrame = requestAnimationFrame(animateCursor);
  });

  function animateCursor() {
    cursorFrame = 0;
    if (document.hidden) return;
    cursorX += (pointerX - cursorX) * 0.2;
    cursorY += (pointerY - cursorY) * 0.2;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    if (Math.abs(pointerX - cursorX) + Math.abs(pointerY - cursorY) > .15) cursorFrame = requestAnimationFrame(animateCursor);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(cursorFrame); cursorFrame = 0; } });

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;
      element.style.transform = `translate(${x * 0.13}px, ${y * 0.13}px)`;
    });
    element.addEventListener("pointerleave", () => (element.style.transform = "translate(0, 0)"));
  });
}

renderHero();

if (bootScreen && finePointer && !reduceMotion) {
  bootScreen.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 12;
    const y = (event.clientY / window.innerHeight - 0.5) * 10;
    bootScreen.style.setProperty("--boot-x", `${x}px`);
    bootScreen.style.setProperty("--boot-y", `${y}px`);
  });
}

let bootFinished = false;
function finishBoot() {
  if (bootFinished) return;
  bootFinished = true;
  document.body.classList.add("is-loaded");
  if (bootScreen) window.setTimeout(() => bootScreen.classList.add("is-exiting"), reduceMotion ? 0 : 850);
}
const firstBackdrop = heroBackdrops[0];
if (firstBackdrop?.complete) finishBoot();
else {
  firstBackdrop?.addEventListener("load", finishBoot, {once:true});
  firstBackdrop?.addEventListener("error", finishBoot, {once:true});
}
window.setTimeout(finishBoot, 2400);
