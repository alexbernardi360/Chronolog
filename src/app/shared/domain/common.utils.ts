export function getTheme(): 'light' | 'dark' {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: 'light' | 'dark') {
  localStorage.setItem('theme', theme);
}
