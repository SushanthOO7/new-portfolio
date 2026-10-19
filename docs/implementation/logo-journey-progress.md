# Natural scrolling and traveling logo implementation

Approved specification: user-supplied Natural Scrolling and a Traveling Brand Logo plan.

- Baseline: existing linked astro worktree on release; existing modifications preserved. Vitest: 24/24 pass.
- Work: clean Experience and company logo loading; shared brand SVG; measured reversible logo journey; natural scroll configuration; browser regression tests and documentation.
- Ruling: implement in existing worktree without commits to preserve the user's mixed tracked/untracked work. Retain unused raster artwork.
- Ruling: the existing tech center logo remains static and upright after docking; surrounding orbits continue. No separate traveler orbit is introduced.

- Layout/controller implemented; garden and scenic bridge code retired, raster files retained. Shared SVG path used in Astro and React.
- Geometry tests: four new cases fail before the module exists, then pass. Initial typecheck: 0 errors/warnings/hints.
- Browser libraries available under /tmp/robot-browser-libs; use LD_LIBRARY_PATH without installing system packages.
- Browser regression caught scale-origin offset at orbit handoff; corrected center translation. Desktop/mobile endpoint and reverse tests pass on dev server.
- Found pre-existing dev-server stale Astro CSS; verify production on isolated port 7798 rather than judging stale styles.
- Independent read-only review: desktop row ordering only explicitly covered three entries; adding regression for four entries before fixing.

- Final review fix: chronological grid rows derive from each JSON index. Four-entry browser regression failed first, then passed on desktop and mobile.
- Final verification: npm run typecheck: 0 errors/warnings/hints; npm test: 28/28; full npm run test:e2e on fresh production port 7800: 58/58.
- Visual QA: desktop 1440×1000 and mobile 393×851, dark/light; all page identities correct, no JS/console errors, no horizontal overflow, no pin spacers. Images and rapid-scroll CDP trace: /tmp/logo-journey-qa/.
- Performance trace captured (29 Layout events, about 5.03ms total layout time in this run); no FPS claim. Chromium only; other browser engines not verified.
- Existing Astro preview restarted on 127.0.0.1:7778 to invalidate stale scoped CSS. Work remains uncommitted; no deployment.
