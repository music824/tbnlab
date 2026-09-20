# TBN Soft Blue Motion Intro — Design QA

## Source visual truth

- Final static-first-frame reference: `/var/folders/rs/0ym613w564s642gj034pn43w0000gn/T/codex-clipboard-157f0b69-f4f5-41f9-b0c7-786bfdeb30d2.png`
  - 1322 × 1678 px.
  - Required behavior: the complete TBN/glass composition must be present immediately with no foreground entrance animation.
- Annotated composition and motion direction: `/Users/hjay/Documents/2026/艺人/1 完成/8b5e5cd7-eb97-4ea1-8725-c0e1853cda0a.png`
  - 1976 × 1120 px.
  - Required changes: stronger TBN shadow, `K-POP ARTISTS`, a held full-screen intro, upper content moving upward, glass/lower content moving downward, and the screen closing from both edges.
- Background reference and production asset: `/Users/hjay/Documents/2026/艺人/1 完成/de14340f8494fb0d079b72b3e6eed29d.jpg`
  - 736 × 1308 px.
  - Used directly for the soft cobalt/electric-blue light field.

## Implementation evidence

- Immediate static first frame: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-static-first-frame.jpg`
  - 934 × 959 px browser capture; taken approximately 80 ms after navigation.
  - TBN, glass, `K-POP ARTISTS`, metadata, full rail and status are all already in their settled positions.
- Immediate mobile static frame: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-static-first-frame-mobile-stage.jpg`
  - 934 × 959 px capture containing a same-origin 390 × 844 CSS-pixel iframe; taken approximately 100 ms after navigation.
- Static-first-frame comparison: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-static-first-frame-comparison.jpg`
  - 1400 × 700 px; the final visual reference and browser-rendered first frame are normalized into equal cells.
- Static-to-exit state: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-static-first-frame-exit.jpg`
  - 934 × 959 px browser capture; confirms motion begins only during automatic handoff.
- Entry motion start: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-entry-motion-start.jpg`
  - 934 × 959 px browser capture; CSS viewport 934 × 959, density 1.
  - State: approximately 360 ms after navigation; TBN is descending through blur before the glass and title finish arriving.
- Entry motion settled: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-entry-motion-settled.jpg`
  - 934 × 959 px browser capture.
  - State: approximately 1540 ms after navigation; the full composition is settled and held.
- Desktop intro: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-soft-blue-intro-desktop.jpg`
  - 934 × 959 px browser capture; CSS viewport 934 × 959, density 1.
  - State: approximately 950 ms after entry, card and wordmark settled.
- Synchronized exit motion: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-exit-motion-synced.jpg`
  - 934 × 959 px browser capture.
  - State: approximately 3880 ms after entry; upper content moves up, glass/lower content moves down, and the top/bottom clip opens to the roster in the same animation state.
- Motion sequence contact sheet: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-motion-sequence.jpg`
  - 1560 × 534 px; entry start, settled state and synchronized exit are displayed in time order.
- Mobile intro: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-soft-blue-intro-mobile-390x844.jpg`
  - 934 × 959 px capture containing a same-origin 390 × 844 CSS-pixel iframe, density 1.
- Full comparison: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-soft-blue-full-comparison.jpg`
  - 1800 × 600 px; annotated source, blue-light source and implementation normalized into equal 600 × 600 cells.
- Focused comparison: `/Users/hjay/Documents/2026/7月 /网站设计/TBN艺人动态列表网页/qa-soft-blue-focused-comparison.jpg`
  - 1400 × 700 px; the source screen crop and implementation normalized into equal 700 × 700 cells.

## Full-view comparison evidence

- The supplied soft blue light field replaces the earlier dotted textile texture and fills the viewport continuously.
- TBN remains the dominant focal point with a darker extruded shadow and glass-edge reflection.
- `K-POP ARTISTS` replaces the generic `ARTISTS` label and stays on one line at desktop and 390 px mobile widths.
- The intro remains fully visible after its initial arrival, then automatically exits after a deliberate hold.
- The final behavior intentionally has no foreground arrival sequence: the complete composition is visible on the first rendered frame, matching the user's final clarification.

## Focused region comparison evidence

- The TBN/card overlap, card width, corner radius, edge highlight, title scale, small metadata and loading rail align with the annotated composition.
- The implementation intentionally uses the new soft-light source rather than preserving the obsolete dotted background shown inside the annotation.
- The mid-exit capture confirms the annotated motion split and page closure share one `is-exiting` trigger: kicker/TBN travel upward, glass/lower status travel downward, and the top/bottom edges reveal the roster at the same time.

## Required fidelity surfaces

- Fonts and typography: condensed TBN display lettering remains brand-consistent; editorial serif is retained for `K-POP ARTISTS`. The longer title was resized responsively to avoid wrapping.
- Spacing and layout rhythm: centered wordmark/card overlap is unchanged from the approved structure; desktop and mobile gutters remain balanced.
- Colors and visual tokens: deep navy glass, cobalt background, electric-blue light and cool-white type match the second source. The stronger shadow improves TBN separation.
- Image quality and asset fidelity: the supplied background JPG is preloaded and rendered as two full-cover image layers with opposing slow movement; no generated or placeholder background is used.
- Copy and content: `K-POP ARTISTS`, `OFFICIAL ROSTER`, `ENTERING / 19`, location marks and TBN division copy are correct.

## Findings

- No actionable P0, P1 or P2 differences remain for the requested revision.
- P3: the abstract background movement is deliberately slow so the text remains legible; increasing its speed further would reduce the premium feel.

## Comparison history

1. Initial revised exit used an 8 px blur and opacity fade, which obscured the requested split movement (P2).
2. The exit was corrected to retain full opacity and use only 2 px motion blur. The final mid-exit capture clearly shows upper and lower content traveling in opposite directions before the page closes.
3. Entry motion was too subtle and the element movement began 150 ms before the page-closing animation (P2). Entry layers now have distinct staggered motion, and all exit behavior is driven by one class on the same animation frame.
4. The first synchronized closure also faded the full overlay, causing the roster to ghost through (P2). The opacity fade was removed; the roster is now revealed only by the clean top/bottom clip.
5. The user clarified that there should be no foreground entrance animation at all (P2 against final intent). Scene, TBN, glass, title, metadata, loading rail and status-dot arrival animations were removed. Captures at 80 ms desktop and 100 ms mobile show the complete static composition immediately; synchronized exit behavior remains unchanged.

## Verification

- Desktop static first frame, synchronized exit, final artist-list handoff and 390 × 844 mobile static first frame were rendered in the Codex in-app browser.
- `script.js` passed `node --check`.
- The new background returned HTTP 200 with `image/jpeg`.
- Fine-pointer parallax and continuous dual-layer background motion remain active; reduced-motion users receive a shortened transition.
- Static hold time was reduced from 3600 ms to 1800 ms; the 1100 ms synchronized exit duration is unchanged.
- Opening composition now stays in its final position and resolves from 18 px blur to sharp focus in 720 ms; no foreground element uses a positional entrance.

final result: passed
