import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const initial = () => document.documentElement.classList.contains('dark');

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(initial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#f8fafc');
  }, [dark]);

  const toggle = () =>
    setDark((d) => {
      try {
        localStorage.setItem('theme', d ? 'light' : 'dark');
      } catch {}
      return !d;
    });

  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
