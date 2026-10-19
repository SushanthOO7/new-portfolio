---
version: alpha
name: "Sushanth U V Portfolio"
description: "An industrial, cinematic engineering portfolio built around technical precision and controlled motion."
colors:
  background: "#0A0A0A"
  foreground: "#F2F2EE"
  accent: "#FF4D00"
  signal: "#22D7FF"
  surface: "#1A1A1A"
  muted: "#686866"
typography:
  display:
    fontFamily: "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif"
  sans:
    fontFamily: "Gotham, system-ui, sans-serif"
  navigation-experience:
    fontFamily: "DM Sans, system-ui, sans-serif"
  contact:
    fontFamily: "Contact Kamber, DM Sans, system-ui, sans-serif"
rounded:
  DEFAULT: "0.5rem"
  control: "999px"
spacing:
  outer: "clamp(1.5rem, 4vw, 4rem)"
  content-max: "75rem"
components:
  hero: { }
  button: { }
---

# Sushanth U V Portfolio Design System

## Overview

The creative north star is an industrial robotics control surface presented with cinematic advertising composition. The site is a public brand portfolio for engineering peers, recruiters, and potential collaborators. Its memorable signature is the overlap of monumental typography, a static robotic-arm poster, and signal-route graphics. Supporting pages remain quieter and content-led. Avoid generic SaaS cards, rainbow gradients, excessive glass effects, and playful motion.

Runtime CSS variables in `src/styles/tokens.css` are canonical. This document mirrors their durable roles; shared tokens must be updated there and here together.

## Colors

Black is environmental rather than merely a page background. Off-white carries primary copy, orange identifies energy, focus, and engineered routes, while cyan is reserved for the robotic joint's single powered signal. The secondary surface is reserved for content separation. The homepage hero follows the selected theme. Light mode uses a warm white (#f3f1ed) environment, near-black headline including NEXT, charcoal navigation and labels, subtle gray guides, and unchanged orange routes and dots. The existing floor artwork is recolored with invert plus a 180-degree hue rotation to retain orange on a pale floor; robot shadows become softer. Theme changes affect colors and compositing only, preserving all elements, geometry, copy, and motion.

## Typography

The first-visit splash spells SUSHANTH using actual Thorben Bold specimen outlines and the original Wondermake effect artwork. `public/animations/thorben-reference.json` remains the unmodified 1200×600, 25fps reference (frames 50–200). `src/assets/brand/thorben-name-glyphs.json` supplies the lettering; the generator preserves every original effect layer and adds solid #FF4D00 bands following one side of each lightning contour and the rounded lower base, matching the annotated reference. Each 24-unit stroke is clipped to the original silhouette, leaving its visible thickness inside the shape and its interior neutral. The generated Sushanth asset starts at frame 75, trimming one second of opening hold in both loader and footer; its remaining five seconds play at the original speed. Projects retains its original timing. The transparent artwork inherits the active theme foreground, including paths that first appear after playback starts; orange is always #FF4D00. Do not invert the whole artwork.

The splash loops above the old portfolio’s elliptical Loading percentage pill. Restore its pointer-following blurred edge beam and layered interior highlight using saturated orange (#FF7900, #FF4D00, #D93600) in place of purple. Clip the beam to the pill and fade it during the expanding exit. The pill and screen use the page background: pure black in dark mode and soft off-white in light mode. First visits follow the browser color scheme; saved choices take precedence. Six equally weighted milestones track DOM, window load, fonts, initial hero images, initial hero components, and critical styles. Already-settled and failed assets count as settled; deferred lower-page content is not a readiness requirement. Percentage updates ease forward and reserve 100% for completion. After reaching 100%, hold 400ms, reveal Welcome over 800ms, and expand the pill out over 900ms without waiting for an animation cycle. During exit, an 800ms elliptical clip reveals the home from the measured pill bounds, using the original cubic-bezier(.33,.11,1,.72) easing; the splash and pill backgrounds become transparent so expansion is visible in both themes. Cancel the temporary clip on every cleanup path. Recovery forces completion at eight seconds and releases the overlay independently by 11.5 seconds. Preserve the first-visit session gate, Skip, Escape, focus/scroll restoration, and reduced-motion bypass. The old marquee and game decorations are omitted.

`npm run generate:titles` regenerates both animation JSON files and inline SVG posters using the installed Playwright Chromium. Letter outlines are checked-in source data, so generation needs no network or font downloads. Posters inherit currentColor from their host, retain orange, and use separate clip-path ID prefixes for splash, footer, and Projects.

Navbar links and the entire Experience section use locally hosted DM Sans, following the NexDash reference. Desktop navigation uses 13px bold type with .04em tracking; mobile menu links use the same family at display size. Experience headings use bold weight and -.035em tracking, with regular body text and medium role labels. Other sections retain their established typography.

Condensed, oversized display type is reserved for the homepage thesis. The lower headline words use an organic scratched-metal and cracked-paint raster texture, clipped to the text and gradient-masked into the bottom third over white-to-charcoal and orange-to-dark-red gradients. The opening screen follows the supplied full-screen reference: a compact top navigation, monumental two-row headline, centered robot with its full base above the floor, and supporting copy at the lower corners. The headline uses bundled Anton at weight 400 with tight tracking and two closely stacked rows. The top row spans 48% of the display width, matching the reference’s “I BUILD” ending near the center; the lower row spans 98%. A ResizeObserver fits horizontal widths and refreshes after font loading. No erosion filters alter the letterforms. Desktop sizing uses min(20vw, 38svh); mobile uses 25cqw and a 70% top row. Text has no extra paint padding, keeping the lower row’s charcoal/orange-brown shading and grunge aligned with the actual letter bottoms; distress begins below the upper 42%. Mobile recomposes the robot below the headline. Gotham carries navigation, prose, and technical labels. Utility copy uses uppercase, compact sizes, and deliberate tracking; body prose remains sentence case and readable.

## Layout

The hero uses a full-viewport layered composition. Content routes use the shared outer gutter and 75rem maximum width. Mobile layouts are recomposed rather than scaled down, removing nonessential annotations before core content.

## Elevation & Depth

Depth comes from overlap, tonal gradients, restrained glow, and foreground/background route separation. IDEAS, BUILD, and SOLVE each use one stationary dot on the dashed signal route, at shared SVG coordinates (1414,212), (1702,362), and (1800,724). Routes and labels have no independent parallax or marker pulsing; responsive scaling preserves their alignment. The dashed signal uses broad, horizontally tangent cubic curves through IDEAS and BUILD, plus a separate shallow wave through SOLVE; there are no hooked detours or steep connecting drops. Redundant background curves and duplicate SVG nodes are removed. The main, lower-sweep, and dashed signal routes all weave between matching front and back curves using the shared route-weave mask, disappearing behind selected headline letters and reappearing in counters and gaps; the lower animated highlight uses that same mask; a separate dashed signal route stays legible beneath the robot. The hero floor is glossy black with narrow angular orange illuminated panel seams and localized reflections around the robot base, fading into deep black at the edges. Preserve a dark contact shadow beneath the robot and avoid broad amber flood lighting. Avoid card shadows and broad blur fields. WebGL, typography, and SVG layers must keep stable reserved geometry while assets load.

## Shapes

Content surfaces use restrained corners. Circular shapes are reserved for controls, signal nodes, and technical indicators.

## Components

The hero robot uses the original art-directed AVIF/WebP poster in both themes. Preserve its authored lighting, pose, and framing. No live GLB, WebGL canvas, or cursor-driven wrist motion is used.

Interactive elements use native links or buttons with visible orange focus. Motion is coordinated and heavy: entrance movement uses transforms and opacity, ambient movement stays subtle, and reduced-motion mode displays the finished composition without loops or parallax.

## Do's and Don'ts

- **Do:** make the robot and headline overlap the dominant visual event.
- **Do:** use orange sparingly to communicate energy and interaction.
- **Don't:** flatten the hero into raster artwork or hide meaningful copy in SVG.
- **Don't:** add decorative motion that competes with the robotic-arm silhouette.

## Experience timeline

Experience uses the same plain theme-aware `var(--background)` as Tech Stack. There are no garden plates, foreground scenery, particles, vignette, floor glow, or backdrop blur. Section padding is `clamp(3rem, 6vw, 5rem)`, with a 2.5rem heading-to-timeline gap. Company cards use solid secondary surfaces and restrained borders. Preserve JSON content, company logo theme switching and error fallbacks, and keyboard-accessible native disclosures.

Experience is the single exception to the site's restrained-glow rule: two short beams of uniform orange leave the upper inner corner together, one horizontally and the other vertically, and follow separate rounded routes to the lower outer corner. Paired beams loop every 4.8–5.2 seconds with linear motion and no repeat delay, restarting immediately on arrival. A separate 3.6-second reversing lava loop gently varies the attached tips from 5 to 11px, preserving the red-orange outer skin and inset golden-yellow interior. There is no detached drop, pinch-off, falling motion, or beam-triggered lava event. Six tiny embers flicker independently close to the corner with 1–2px drift. Cards have independent phases, without scroll triggers or scrubbing. Hidden tabs pause all loops; reduced motion shows a static attached corner without moving beams or embers. The central timeline retains its existing scroll-driven brand journey.

Desktop cards alternate around a central rail in chronological vertical order for any entry count. Below 48rem the cards use a single column with a left rail. Every role stays readable without JavaScript.

## Natural scrolling and brand-logo journey

The homepage keeps the existing Hero → Experience → Projects → Tech Stack → Contact → Footer content order. With motion enabled, a sticky viewport separates the logo's input clock from the page camera. Horizontal logo sweeps consume input while the page holds; downward travel advances the page. There is no scenic interlude or duplicated content. Reduced motion and no JavaScript retain ordinary document flow.

The hero's paired 1px architectural guides continue at 2.8% from both viewport edges through Experience, Projects, and Tech Stack. Projects and Tech Stack share the global `--max-width` content boundary; section artwork stays inside that boundary so headings, interactive content, and supporting modules align across the homepage.

The top-left navbar monogram is the journey's starting position; there is no separate lower-hero or Projects heading mark. The functional navbar home link and its wordmark stay intact. One fixed, pointer-transparent SVG traveler follows the user-drawn reference: a broad upper-hero sweep, right-edge descent, lower leftward/upward curl, loop to the right of the Experience heading, measured vertical company rail, upper Projects loop and left-side sweeps around the folder and contribution panel, approach to the Tech Stack center, where the journey ends. The traveler stays docked in that circle while Contact and the footer scroll normally; the footer keeps its own static mark.

The reference knots remain in `src/lib/logo-journey-route.ts`, using measured section bounds and shared angle-bisector tangents. The Projects heading and contribution panel have separate measured boundaries; narrow screens reserve a small left gutter for the full traveler. Cached Bézier arc-length tables preserve the drawn curves and upward curls. The logo uses its measured navbar width and interpolates to the orbit and footer sizes, rendering at native SVG dimensions.

Cinematic timing lives in `src/lib/logo-cinematic.ts`. It uses the reference site's ratio of 1.16 input pixels per pixel of travel, rather than compressing the path into the original document height. An input-driven camera holds during horizontal travel, follows descent at 55% viewport height, and stays still while the logo curls upward. The page never reverses while the user scrolls down. Gentle full-turn rotation is distance-based, easing upright at the final Tech Stack dock. After docking, input advances the page at a one-to-one rate while the logo stays at the orbit’s document position. The 220ms response constant settles in roughly one second, matching the reference's one-second scrub feel. Stopping input lets the current small movement settle; reversing retraces the same trajectory.

The existing Lenis/GSAP ticker drives both logo and camera; no additional animation clock or wheel interception is introduced. The physical scrollbar controls the extended journey. A sticky viewport clips the transformed content, while the fixed traveler is mounted outside that transform. Geometry is measured only on refresh, including fonts, section resizing, disclosures and hydration. Internal anchors, deep links and keyboard focus map logical content positions into the extended input clock. Reduced-motion cleanup restores native flow and the current camera position. Static navbar, rail, orbit and footer marks remain available without JavaScript. Development `/?logoPath=1` shows the actual blue path moving with content; production omits the preview.

## Projects

Projects uses the Kamber reference animation, personalized to read Projects with the exact public Heavy specimen outlines. `public/animations/kamber-reference.json` is the untouched original from https://fonts.wondermake.xyz/uploads/kamber-4982.json (1200×600, 30fps, frames 60–252). The generator transfers its outline displacement to the new glyphs and reassigns its eight ball-contact beats to the eight letters, preserving timing, easing, and ball squash/stretch. Ball contact coordinates follow the new letters’ deformed surfaces. The bouncing ball is #FF4D00 in both themes; neutral lettering inherits the theme foreground. No additional effects or signal curves accompany the heading. Preserve the accessible Projects heading and reserved responsive animation stage; the traveling logo curves above and left of the stage. One React glass folder replaces the editorial rows and GitHub footer. The supplied GlassFolder component lives in `src/components/ui/glass-folder-cards.tsx`; the portfolio adapter uses existing JSON content and local artwork with no new dependencies.

Dark mode uses smoked charcoal glass and light text; light mode uses milky glass, dark text, and soft gray shadows. CSS follows the root data-theme immediately without resetting open state. The folder starts closed, assembles once on entry, tilts on hover, and hinges open to reveal three readable image cards. Desktop spreads them horizontally; below 1000px opened cards form a vertical list. Existing project URLs open in new tabs. Add and management controls are hidden. The folder is centered within the space below the heading; an Other projects link below it opens the GitHub repository list. Escape closes and restores focus; closed cards are inert; reduced motion removes animation. A noscript list preserves project access.

Content remains in `src/data/projects.json` with the existing schema. Preserve the cinematic scroll mapping and surrounding logo trajectory; short desktop screens may grow beyond one viewport to avoid clipping.

## Tech Stack

Section // 04 follows Projects with a reference-matched split composition: monumental bundled Anton TECH above orange STACK on the left, category pills below, and a large orbital logo system on the right. Fine neutral/orange paths and traveling nodes continue the engineering-line language. Use the existing navbar's orange brand mark at the center. No background image or explanatory cards. Dark/light variants preserve geometry and use local theme-specific SVG logos when needed. Runtime colors derive from `src/styles/tokens.css`; section-local surface, edge, and shadow tokens live in `src/styles/tech-stack.css`.

Technology content lives exclusively in `src/data/tech-stack.json`: unique `id`, `title`, `categories`, local `logo`, optional `logoLight`. Build-time validation rejects malformed entries or missing artwork. Ring allocation, positioning, filters, labels, and entrances derive from this data. The initial twelve technologies are editable examples. See `docs/tech-stack.md`.

The outer orange dashed guide and duplicate top-right section label are omitted to keep the top divider clear. One subtle dashed neutral guide remains among the inner rings. Orange highlights use explicit SVG arc geometry rather than normalized circle dash lengths, which shift under non-scaling strokes. Each node shares its rotating group's coordinates with the leading arc endpoint, keeping it attached at every screen size and during playback.

One visible-hydrated React island owns Motion entrances, spring filtering, and subtle counter-rotating orbits; GSAP/Lenis retains existing scroll ownership. Logos stay upright. Hover/focus pauses movement, scales a tile to 1.15, adds orange glow, dims neighbors, and reveals a viewport-clamped tooltip. Touch toggles details; Escape/outside interaction dismisses them. A pause control, viewport/page-visibility suspension, reduced-motion handling, and static server-rendered markup preserve accessibility and performance. Small screens stack the title and orbit, with wrapping 44px-high filter controls.

Reference-specific Tech Stack paints are intentional section-local tonal ramps: TECH uses #fff → #f2f2ee → #81817b; dark STACK uses #ff5b20 → #ff4d00 → #e83e00 → #6b270f; light STACK uses #ff5b20 → #ee4109 → #b72c08. These reproduce the approved artwork rather than introduce new semantic accents. Tile edges use a 7% white inset sheen; tooltip depth uses 12% black shadow and an 11px radius to match the reference's compact floating label. Small light-theme accent text derives from an 80/20 mix of the accent and foreground for AA contrast. Scoped checker exceptions preserve the approved gradient text and the local 'Tech Anton' alias for the bundled Anton typeface.

### Hero rendering budget

The robot uses a static AVIF/WebP picture with no WebGL renderer or model downloads. Keep the one-time entrance, but leave SVG route dash offsets and the textured headline static afterward. A separate 2D canvas draws one short traveling highlight per route at up to 60 fps, using cached curve points and drawing only the visible segment at 75% of CSS-pixel resolution. It pauses during scrolling (180ms idle threshold), offscreen, in hidden tabs, and for reduced motion; it shares the existing GSAP clock. Avoid pointer parallax on the full-screen background and masked text. The headline grunge uses a compressed WebP texture.

The hero-to-Experience handoff shares `--background` in both themes. Static masks dissolve the atmosphere and the lower floor reflections before the section boundary. Experience begins with compact responsive top padding; keep both sections in natural flow without a spacer or scroll-driven fade.


## Contact

The final homepage section follows Tech Stack and retains the `#contact` anchor. Its centered Contact heading uses locally served Kamber Heavy, named Contact Kamber in CSS, matching the supplied rounded specimen; neutral “Cont” pairs with upright orange “act”. Regenerate the font from the same public Heavy specimen used by Projects with `node scripts/generate-contact-font.mjs`. Light mode uses the shared dark text and warm background tokens. Contained data rain sits behind native HTML content and is hidden from assistive technology. The underlined monospace email opens a native mailto link; `sushanth@example.com` is an intentional temporary placeholder to replace before publishing. Desktop reserves one viewport and mobile uses a compact 80svh layout with smaller typography. Keyboard focus stays visible and the logo journey continues around the left of Contact toward the footer.


## Footer

Loader and footer both wait two seconds of visible time before the first thunder strike, then repeat a three-second segment starting at the first strike frame. Preserve the original playback speed by trimming the trailing hold. Pause the initial countdown and ongoing playback when hidden or offscreen, resuming on return. The loader still closes when progress reaches 100%, without waiting for a strike or cycle to finish. Projects keeps its existing timing.

The homepage ends with a semantic footer after Contact and outside main. An oversized SUSHANTH wordmark reuses the entrance splash’s transparent SVG Lottie sequence. Below it, a restrained Wise-reference row places the same orange monogram and canonical Sushanth wordmark as the navbar on the left, with separate outline-style GitHub, LinkedIn, Email, and Phone icons aligned to the right. Copyright sits underneath: © [current year] Sushanth U V. All rights reserved. The footer brand links back to main content. No legal-link columns are included. On narrow screens, preserve 44px link targets and right alignment, wrapping the social row only when necessary. The original filled social icons stay on the hero's left, positioned absolutely inside that section so they scroll away with it; they remain hidden at the existing mobile breakpoint. Both icon variants share destinations in SocialLinks.astro.

The compact footer artwork has no boxed grid or perimeter border. A single horizontal divider beneath it fades at both ends before the logo and social row. The contact clock separates the Phoenix location from orange, spaced time numerals. Background, divider, and neutral artwork follow theme tokens; orange contact accents retain #FF4D00. Both footer and Projects preload near the viewport, loop continuously while visible, and pause offscreen, in hidden tabs, or when reduced motion is selected. Playback resumes when those conditions clear. Shared playback lives in the AnimatedTitle component and title-animations script; no completion handler permanently stops either title. Reduced motion, no JavaScript, and load failures retain the static SVG poster. Links use orange focus outlines and native anchors compatible with Lenis.


## Theme reveal

The navbar uses a 68×36px sun/moon pill with an accessible Dark mode switch. A 780ms viewport-centered circular reveal expands light outward and closes dark inward across the whole document. Keep the existing root theme tokens and portfolio-theme persistence. Reduced motion and unsupported browsers switch immediately; busy locking and a watchdog recover from failed snapshots.
