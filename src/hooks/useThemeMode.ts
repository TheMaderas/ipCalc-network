import { useEffect, useState } from 'react';
import { PaletteMode } from '@mui/material';

type ThemeMode = PaletteMode | 'system';

export const useThemeMode = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ThemeMode) || 'system';
  });

  const [actualMode, setActualMode] = useState<PaletteMode>('light');

  useEffect(() => {
    localStorage.setItem('themeMode', mode);

    if (mode === 'system') {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setActualMode(prefersDarkMode ? 'dark' : 'light');

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        setActualMode(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setActualMode(mode as PaletteMode);
    }
  }, [mode]);

  const toggleThemeMode = () => {
    if (mode === 'light') setMode('dark');
    else if (mode === 'dark') setMode('system');
    else setMode('light');
  };

  return {
    mode,
    actualMode,
    toggleThemeMode,
    setMode,
  };
};

export default useThemeMode;
