import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const browser = await chromium.launch({ headless: true });
try {
  for (const [source, destination, frame] of [['sushanth-splash', 'sushanth-poster', 0], ['projects-title', 'projects-poster', 17]]) {
    const page = await browser.newPage();
    await page.setContent('<div id="stage"></div>');
    await page.addScriptTag({ path: fileURLToPath(new URL('../node_modules/lottie-web/build/player/lottie_light.js', import.meta.url)) });
    const data = JSON.parse(readFileSync(new URL(`../public/animations/${source}.json`, import.meta.url)));
    const svg = await page.evaluate(async ({data, frame}) => {
      const container=document.querySelector('#stage');
      const animation=window.lottie.loadAnimation({container,renderer:'svg',loop:false,autoplay:false,animationData:data});
      await new Promise(resolve => animation.addEventListener('DOMLoaded',resolve));
      animation.goToAndStop(frame,true);
      for (const element of container.querySelectorAll('[fill], [stroke]')) {
        for (const attribute of ['fill','stroke']) if (element.getAttribute(attribute)==='rgb(255,255,255)') element.setAttribute(attribute,'currentColor');
      }
      const svg=container.querySelector('svg');
      svg.removeAttribute('style');
      svg.setAttribute('aria-hidden','true');
      // Posters are inlined: unique IDs avoid cross-title clip path collisions.
      return svg.outerHTML.replaceAll('__lottie_element_', `${data.nm.startsWith('Projects')?'projects':'sushanth'}_poster_`);
    }, {data,frame});
    writeFileSync(new URL(`../public/animations/${destination}.svg`, import.meta.url),svg);
    await page.close();
    console.log(`Generated ${destination}.svg`);
  }
} finally { await browser.close(); }
