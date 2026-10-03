import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root=new URL('../../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

describe('Storybook configuration',()=>{
  it('uses Storybook 10.6.1 consistently',async()=>{
    const pkg=JSON.parse(await read('package.json'));
    for(const name of ['storybook','@storybook/react-vite','@storybook/addon-a11y','@storybook/addon-docs','@storybook/addon-links','eslint-plugin-storybook']){
      expect(pkg.devDependencies[name]).toBe('^10.6.1');
    }
  });

  it('discovers only reusable stories under src',async()=>{
    const main=await read('.storybook/main.js');
    expect(main).toContain("../src/**/*.stories.@(js|jsx|ts|tsx)");
    expect(main).not.toContain('../app/');
    expect(main).toContain("viteConfigPath: '.storybook/vite.config.js'");
    expect(main).toContain('chunkSizeWarningLimit: 1200');
  });

  it('contains no legacy identity or Remix imports',async()=>{
    const files=[];
    for await(const path of glob(['.storybook/**/*.{js,jsx,html}','src/**/*.stories.{js,jsx,ts,tsx}'],{cwd:new URL(root)})) files.push(path);
    expect(files.length).toBeGreaterThan(4);
    for(const file of files){const content=await read(file);expect(content).not.toMatch(/hamish|@remix-run\//i)}
  });
});
