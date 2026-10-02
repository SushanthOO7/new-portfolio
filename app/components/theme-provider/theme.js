import { pxToRem } from '~/utils/style';

// Full list of tokens
const baseTokens = {
  black: 'oklch(0% 0 0)',
  white: 'oklch(100% 0 0)',

  bezierFastoutSlowin: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  durationXS: '200ms',
  durationS: '300ms',
  durationM: '400ms',
  durationL: '600ms',
  durationXL: '800ms',
  systemFontStack:
    'system-ui, -apple-system, BlinkMacSystemFont, San Francisco, Roboto, Segoe UI, Ubuntu, Helvetica Neue, sans-serif',
  fontStack: `Gotham, var(--systemFontStack)`,
  monoFontStack:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  japaneseFontStack:
    'IPA Gothic, ヒラギノ角ゴ Pro W3, Hiragino Kaku Gothic Pro, Hiragino Sans, Osaka, メイリオ, Meiryo, Segoe UI, sans-serif',
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  fontSizeH0: pxToRem(140),
  fontSizeH1: pxToRem(100),
  fontSizeH2: pxToRem(58),
  fontSizeH3: pxToRem(38),
  fontSizeH4: pxToRem(28),
  fontSizeH5: pxToRem(24),
  fontSizeBodyXL: pxToRem(22),
  fontSizeBodyL: pxToRem(20),
  fontSizeBodyM: pxToRem(18),
  fontSizeBodyS: pxToRem(16),
  fontSizeBodyXS: pxToRem(14),
  lineHeightTitle: '1.1',
  lineHeightBody: '1.6',
  maxWidthS: '540px',
  maxWidthM: '720px',
  maxWidthL: '1096px',
  maxWidthXL: '1680px',
  spaceOuter: '64px',
  spaceXS: '4px',
  spaceS: '8px',
  spaceM: '16px',
  spaceL: '24px',
  spaceXL: '32px',
  space2XL: '48px',
  space3XL: '64px',
  space4XL: '96px',
  space5XL: '128px',
  zIndex0: 0,
  zIndex1: 4,
  zIndex2: 8,
  zIndex3: 16,
  zIndex4: 32,
  zIndex5: 64,
};

// Tokens that change based on viewport size
const tokensDesktop = {
  fontSizeH0: pxToRem(120),
  fontSizeH1: pxToRem(80),
};

const tokensLaptop = {
  maxWidthS: '480px',
  maxWidthM: '640px',
  maxWidthL: '1000px',
  maxWidthXL: '1100px',
  spaceOuter: '48px',
  fontSizeH0: pxToRem(100),
  fontSizeH1: pxToRem(70),
  fontSizeH2: pxToRem(50),
  fontSizeH3: pxToRem(36),
  fontSizeH4: pxToRem(26),
  fontSizeH5: pxToRem(22),
};

const tokensTablet = {
  fontSizeH0: pxToRem(80),
  fontSizeH1: pxToRem(60),
  fontSizeH2: pxToRem(48),
  fontSizeH3: pxToRem(32),
  fontSizeH4: pxToRem(24),
  fontSizeH5: pxToRem(20),
};

const tokensMobile = {
  spaceOuter: '24px',
  fontSizeH0: pxToRem(56),
  fontSizeH1: pxToRem(40),
  fontSizeH2: pxToRem(34),
  fontSizeH3: pxToRem(28),
  fontSizeH4: pxToRem(22),
  fontSizeH5: pxToRem(18),
  fontSizeBodyL: pxToRem(17),
  fontSizeBodyM: pxToRem(16),
  fontSizeBodyS: pxToRem(14),
};

const tokensMobileSmall = {
  spaceOuter: '16px',
  fontSizeH0: pxToRem(42),
  fontSizeH1: pxToRem(38),
  fontSizeH2: pxToRem(28),
  fontSizeH3: pxToRem(24),
  fontSizeH4: pxToRem(20),
};

// Tokens that change based on theme
const dark = {
  background: 'oklch(17.76% 0 0)',
  backgroundLight: 'var(--white)',
  primary: '',
  accent: 'oklch(0.6122 0.2313 22.61)',
  error: 'oklch(65.91% 0.249 13.76)',
  text: 'var(--white)',
  textTitle: 'var(--text)',
  textBody: 'color-mix(in lab, var(--text) 80%, transparent)',
  textLight: 'color-mix(in lab, var(--text) 60%, transparent)',
};

const light = {
  background: 'oklch(96.12% 0 0)',
  backgroundLight: 'var(--white)',
  primary: 'var(--black)',
  accent: 'oklch(0.7197 0.193 308.6)',
  error: 'oklch(63.17% 0.259 25.41)',
  text: 'var(--black)',
  textTitle: 'color-mix(in lab, var(--text) 90%, transparent)',
  textBody: 'color-mix(in lab, var(--text) 75%, transparent)',
  textLight: 'color-mix(in lab, var(--text) 55%, transparent)',
};

export const tokens = {
  base: baseTokens,
  desktop: tokensDesktop,
  laptop: tokensLaptop,
  tablet: tokensTablet,
  mobile: tokensMobile,
  mobileS: tokensMobileSmall,
};

// Gradient configurations for text
export const gradients = {
  // Main gradient - purple to pink to red to orange
  primary: {
    colors: ['#c080ff', '#ff60ff', '#ff40a0', '#ff2060', '#ff0040', '#ff8000'],
    stops: [0, 20, 40, 60, 80, 100],
    direction: '90deg',
  },

  // Shorter gradient - purple to pink to red
  secondary: {
    colors: ['#c080ff', '#ff60ff', '#ff40a0', '#ff2060', '#ff0040'],
    stops: [0, 25, 50, 75, 100],
    direction: '90deg',
  },

  // Blue to purple gradient
  cool: {
    colors: ['#3b82f6', '#8b5cf6', '#c084fc', '#e879f9'],
    stops: [0, 33, 66, 100],
    direction: '90deg',
  },

  // Green to blue gradient
  nature: {
    colors: ['#10b981', '#06b6d4', '#3b82f6', '#6366f1'],
    stops: [0, 33, 66, 100],
    direction: '90deg',
  },

  // Orange to red gradient
  warm: {
    colors: ['#f97316', '#ef4444', '#dc2626', '#b91c1c'],
    stops: [0, 33, 66, 100],
    direction: '90deg',
  },
};

// Helper function to generate gradient CSS
export function createGradientCSS(gradientName = 'primary') {
  const gradient = gradients[gradientName] || gradients.primary;

  const colorStops = gradient.colors
    .map((color, index) => `${color} ${gradient.stops[index]}%`)
    .join(', ');

  return `linear-gradient(${gradient.direction}, ${colorStops})`;
}

// Helper function to create gradient text styles
export function createGradientTextStyles(gradientName = 'primary') {
  const gradientCSS = createGradientCSS(gradientName);

  return {
    background: gradientCSS,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
  };
}

export const themes = { dark, light };
