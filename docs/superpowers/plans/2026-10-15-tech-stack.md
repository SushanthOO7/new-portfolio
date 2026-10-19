# Tech Stack Implementation Plan

Approved in chat: reference-matched // 04 section after Projects, dark/light themes, JSON-managed entries, Motion orbit/filter/tooltip interactions, no explanatory panels. Implement inline in the existing isolated Astro worktree; preserve all pre-existing edits.

- [x] Data: add tech-stack.json, local assets, pure validation/filter/layout helpers; validate assets in Astro config. Unit tests cover invalid author data, empty lists, multi-category filtering, finite geometry, and reference ring allocation.
- [x] UI: one SSR React island, native SVG paths, local logos and existing brand path; use Motion phases and independent spring position/hover transforms. Theme-aware CSS, static fallback, reduced motion, keyboard/touch details, viewport-clamped tooltip, pause/offscreen/page visibility.
- [x] Verify: typecheck, build, full unit suite, focused Playwright checks and existing homepage regression checks. Inspect dark/light desktop and narrow screenshots. Review changes and correct material findings.
- [x] Document JSON editing, asset provenance, and DESIGN.md rules.

Implementation ruling: the original attachment is available visually in chat but has no local file path. The 12ui converter cannot consume that attachment directly, so use the approved reference directly and verify with actual browser screenshots. Reuse the existing exact brand path instead of reconstructing it.

Verification: Astro typecheck clean (40 files); build passes; 24 unit tests pass; 12 Tech Stack Playwright checks pass across desktop/mobile; all 10 Projects checks pass. Strict UI audit reports zero findings. Screenshots saved under `.artifacts/tech-stack/`.

Review: independent read-only reviewer identified shortest-arc remainder behavior, Escape focus pause, and tooltip hover retention. All corrected and covered by unit/browser checks. Touch first-tap event ordering also corrected. Light-theme small orange text uses a darker derived accent for contrast; headings and routes retain the canonical accent. Existing worktree changes remain uncommitted.

Final contrast pass: build and all four theme/filter browser checks pass again after the CSS-only adjustment. Design detector advisories for reference-specific ramp colors, tooltip shadow, and 11px tooltip radius were reviewed and documented in DESIGN.md. Narrow persisted exceptions cover gradient lettering in tech-stack.css and the Tech Anton font alias. No functional findings remain.
