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

The creative north star is an industrial robotics control surface presented with cinematic advertising composition. The site is a public brand portfolio for engineering peers, recruiters, and potential collaborators. Its memorable signature is the overlap of monumental typography, a physical 3D machine, and signal-route graphics. Supporting pages remain quieter and content-led. Avoid generic SaaS cards, rainbow gradients, excessive glass effects, and playful motion.

Runtime CSS variables in `src/styles/tokens.css` are canonical. This document mirrors their durable roles; shared tokens must be updated there and here together.

## Colors

Black is environmental rather than merely a page background. Off-white carries primary copy, orange identifies energy, focus, and engineered routes, while cyan is reserved for the robotic joint's single powered signal. The secondary surface is reserved for content separation. The homepage hero follows the selected theme. Light mode uses a warm white (#f3f1ed) environment, near-black headline including NEXT, charcoal navigation and labels, subtle gray guides, and unchanged orange routes and dots. The existing floor artwork is recolored with invert plus a 180-degree hue rotation to retain orange on a pale floor; robot shadows become softer. Theme changes affect colors and compositing only, preserving all elements, geometry, copy, and motion.

## Typography

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
