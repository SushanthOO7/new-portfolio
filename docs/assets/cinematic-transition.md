# Retired cinematic transition artwork

Historical asset record only. The natural-scrolling homepage no longer renders or requests these images. Original files are retained for reference.

Generated with the built-in GPT image generation tool on 2026-10-15, using the user's dark/light architectural references as art direction. These assets belong only to the hero-to-Experience interlude. The existing hero and company timeline artwork are preserved.

## Delivered assets

`public/images/transition/{landscape,foreground}-{dark,light}-{960,1920}.{avif,webp}`

Original generation canvas: 1672 × 941. Responsive exports preserve aspect ratio. Foregrounds retain generated alpha. AVIF quality 65 / effort 5; WebP quality 85 / alpha quality 100. The active theme pair is selected and decoded in `src/scripts/bridge-assets.ts`.

## Final prompt set

### Dark landscape

Create a production website background plate, cinematic photoreal architectural environment, widescreen 16:9 1920x1080 composition. Nearly black charcoal sky taking top 57 percent, subtle distant layered low mountain ridges across bottom 43 percent, faint burnt orange atmospheric horizon at y=72%. No foreground platform or walls: mountains can continue to bottom. View from a very low camera across a futuristic mountain plain. Premium restrained cinematic lighting, realistic dark stone ridges and smoky atmosphere, delicate orange light at horizon. Upper left and middle must be uncluttered negative space for native HTML title. No typography, letters, logos, floating lines or curves, glowing dots, or stars. This is the back landscape layer; foreground floor is composited separately.

### Light landscape (edit of dark landscape)

Relight this exact landscape plate to light theme. Preserve every mountain silhouette, location, perspective and framing. Warm off-white misty sky, pale warm gray mountain ridges fading into ivory atmospheric distance, subtle soft peach horizon. Sky should be luminous ivory/off-white, lower mountains pale stone. Premium architectural advertising photo, soft overcast illumination. No foreground floor or walls. No text, marks, floating orange paths, or dots. Same wide 16:9 composition.

### Dark foreground (transparent background)

Transparent foreground cutout for a premium cinematic website, wide landscape 16:9 composition, full canvas. A photoreal black polished concrete circular futuristic platform occupying only the bottom 30 percent, low eye level camera, curved concentric grooves with thin vivid orange luminous seams, localized orange reflections on dark glossy floor. Curving low concrete retaining walls rise toward left edge to 50% of canvas height and right edge to 65% height, taper to a distant flat horizon at 72% height center. Keep all floor and walls opaque, but everything above the floor and wall silhouette must be true alpha transparency, including the entire upper half and sky, no mountains. The visible inner circular platform ellipse extends off right edge, its front illuminated rim curves from x=30% y=79% to x=100% y=91%. Refined luxury industrial advertising photo, realistic subtle material texture and crisp perspective. No text, logos, floating paths, or dots. Preserve framing on a 16:9 canvas; transparent negative space above is essential.

### Light foreground (edit of dark foreground, transparent background)

Relight this exact transparent foreground architectural platform to light theme. Preserve exact same silhouette, floor ellipse, curved walls, framing, perspective and all alpha transparency above the floor/wall silhouette. Change dark concrete to pale warm gray polished concrete with ivory stone side walls, softly illuminated by overcast daylight. Preserve vivid fine orange illuminated seams and realistic soft orange reflections on the floor. Keep all upper sky and area outside the existing silhouette truly transparent. No background, mountains, text, floating lines, or dots. Do not crop or resize the composition.

## Compositing

HTML supplies the title, index and rules; SVG supplies the route; the existing shared traveler supplies the dot. Background and foreground transforms use one GSAP scrub clock. Native theme-colored surfaces remain available when artwork fails. The foreground, mountains and lettering must never be flattened into one image.
