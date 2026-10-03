import { useEffect } from 'react';
import '../src/styles/tokens.css';
import '../src/styles/reset.css';
import '../src/styles/global.css';
import './preview.css';

export const decorators = [
  (Story, context) => {
    const theme = context.globals.theme;

    useEffect(() => {
      document.documentElement.dataset.theme = theme;
    }, [theme]);

    return <div id="story-root" className="storyRoot"><Story /></div>;
  },
];

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'dark',
    toolbar: {
      icon: 'paintbrush',
      items: ['light', 'dark'],
    },
  },
};

export const parameters = {
  layout: 'fullscreen',
  controls: { expanded: true },
};
