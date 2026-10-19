# Experience content and artwork

Edit `src/data/experience.json` to maintain the company history. Astro renders entries at build time in array order. Configuration validates required fields, unique slug IDs, `YYYY-MM` dates, chronological date ranges, nonempty tag arrays, positive logo dimensions, and existing local logo files. An empty array omits the section.

The initial three roles and descriptions come from the supplied mockups. **These are draft employment details, not independently verified.** The references supplied years only, so January is used as a placeholder month in the machine-readable dates. Confirm the months, current role, and wording before publication. Display labels intentionally show years only.

Logo `src` is required. Optional `lightSrc` and `darkSrc` select original theme-specific brand assets. Paths begin `/images/` and refer to files under `public/`. `alt`, `width`, and `height` describe the asset. Visible company names provide accessible naming; decorative logo images have empty HTML alt text to avoid duplication. Failed logos reveal company-name text.

## Asset sources

- ASU: original PNG from https://www.asu.edu/profiles/contrib/webspark/modules/asu_brand/dist/assets/img/arizona-state-university-logo.png. Full official wordmark retained without alteration.
- Aramark: `Aramark_H_RedandBlack_R.png` from the approved logo bundle linked at https://www.aramark.com/newsroom/media-kit. Resized to a 480px PNG with the original artwork intact and unnecessary print metadata removed. A neutral light backing preserves contrast in both themes.
- Generated environment and robot exports: `public/images/experience/`. Built-in image-generation tool used; no API-key fallback. Responsive AVIF and WebP exports use Sharp, preserving the robot's alpha channel. Source PNGs remain in the generation tool's original output directory.

## Previous robot scene prompts (archived)

Environment, dark: Generate only a DARK environment background plate based on the user's dark experience webpage reference. Wide 16:9. Empty futuristic industrial black studio, angular machined glossy black platform in lower left, top surface about 75% down, thin orange luminous seams on bevelled edges, subtle floor reflections, tall distant black architectural columns and restrained orange circuits. Leave central left space empty for a separate robot; right 40% quiet near-black for HTML text. Match the reference's sleek industrial atmosphere. No robot, objects on platform, text, logos, dates, tags, timeline, dots, beams, circles, UI or borders.

Environment, light (edit the selected dark plate): Preserve exact camera, architectural geometry, platform location, seam positions, framing and perspective. Change black platform and room to clean pale warm white and light gray materials, diffuse bright daylight, soft shadows, subtle orange seams and reflections. Right 40% quiet pale gray for dark HTML text. Platform stays in the same place for compositing. No robot, objects on platform, text, logos, timeline, dots, beams, circles or UI.

Robot (reference `public/images/home/robotic-arm-poster.webp`): Transparent product cutout of the exact hero robot. Preserve rounded orange panels, black motor housing, black flared base with cyan display, cyan joint ring and silver mechanical gripper. Repose into a compact near-square side-view silhouette: base around x38% y87%, elbow x26% y53%, cyan upper joint x58% y36%, silver fingers x82% y29%. Arm reaches diagonally up-right. Small proportional gripper; almost orthographic camera, no close-up foreshortening. Keep the full robot and transparent margin on all sides. Neutral studio key light usable on dark and white backgrounds, subtle orange rim light. No environment, platform, floor, text, beam, dots or UI. Actual transparent alpha.

## Validation

Run `npm test`, `npm run typecheck`, and `npm run test:e2e`. The browser suite covers document progress endpoints, reversible dot movement, theme-specific loading and decoding, logo fallback, responsive positioning and reduced-motion keyboard scrolling. Transition tests also cover the pinned/flow checkpoints, title-style preservation, rapid-input dot continuity, rail alignment, height-only resize, breakpoint cleanup, live reduced-motion changes, keyboard anchor navigation, and failed artwork. Tests use the existing Chromium projects; real Safari/iOS and Firefox require separate device verification.

## Cinematic entry

`SignalBridge.astro` supplies the decorative SVG, preview host and exact copy “Ideas. Into practice.” `src/scripts/signal-bridge.ts` coordinates the sequence using the existing Lenis/GSAP clock, with `scrub: 0.35`. Desktop adds two viewport heights of pin spacing to the hero; smaller screens use the last half-viewport of its natural exit. The JSON format is unchanged.

The actual traveler is temporarily promoted into the shared fixed layer; a second dot is never created. The preview clones only the scene, retaining style-scope attributes while removing application selectors and IDs. Original image sources are mirrored after decoded theme swaps. Failed assets leave a theme-colored background, never a scroll lock or loading gate. On teardown, restore the original dot parent, inline styles and normal scene layout and remove the preview and pin spacer.

The hero title's original PNG grunge texture is preserved at the user's request. The floor uses a compressed WebP export. An isolated Chromium software-renderer sample of the current transition recorded 73 frame intervals over 2.2 seconds: median 16.7ms, p95 66.7ms, with nine intervals above 33.5ms. A separate steady timeline sample recorded median 16.7ms and p95 16.8ms. The opening transition still has occasional slow frames in this environment; representative physical-device profiling remains necessary. During the transition, ambient hero animations pause, expensive decorative filters are bypassed, and the outgoing SVG layer translates without scaling. Covered hero artwork stops painting. These measurements do not guarantee 60fps on other hardware.


## Architectural garden redesign

The current scene replaces the robot/sidebar composition with matched architectural garden layers (`garden-background` and `garden-foreground`) in dark and light themes. Background and alpha foreground were generated separately; light variants preserve each layer’s camera and geometry. Original generation files remain under the image tool’s output directory; responsive 960/1680 AVIF/WebP exports are shipped locally. The transparent foreground preserves actual alpha. Garden background prompt: charcoal architectural columns, amber canopy edge, volcanic rocks and olive trees at the sides, reflective floor and empty center, no UI or text. Foreground prompt: isolated corner basalt, olive branches, and edge glass with an empty transparent center. Light variants relight these plates with pale stone and daylight.

The entrance bridge retains its original mountain/platform pair; only its incoming Experience preview loads the garden. Native HTML disclosure cards start open; arrows toggle descriptions and tags, leaving company, role, and date visible. Existing JSON entries are unchanged. Desktop uses an alternating central timeline and mobile uses one column beside a left rail. Reduced motion disables scene depth, particles, and card entrances. No JavaScript leaves all content and a static background visible.
