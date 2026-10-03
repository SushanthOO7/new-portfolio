import { mergeConfig } from 'vite';

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-a11y', '@storybook/addon-docs'],

  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: '.storybook/vite.config.js',
      },
    },
  },

  async viteFinal(config) {
    return mergeConfig(config, {
      assetsInclude: ['**/*.glb'],
      build: {
        assetsInlineLimit: 1024,
        chunkSizeWarningLimit: 1200,
      },
    });
  },

  features: {
    backgrounds: false,
  },
};

export default config;
