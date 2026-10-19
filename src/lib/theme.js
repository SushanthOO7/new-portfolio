export const THEME_STORAGE_KEY = 'portfolio-theme';

export function getThemeBootstrapScript() {
  return `(()=>{let theme=typeof matchMedia==="function"&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";try{const stored=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY
  )});if(stored==="light"||stored==="dark")theme=stored}catch{}document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme})();`;
}
