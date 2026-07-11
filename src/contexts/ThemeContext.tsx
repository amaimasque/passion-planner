import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  primary: string; // hex
  hover: string;   // hex
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'dusty-rose',  name: 'Dusty Rose',    primary: '#C97B84', hover: '#B66A74' },
  { id: 'sage-green',  name: 'Sage Green',     primary: '#6D9E7F', hover: '#5A8A6C' },
  { id: 'dusty-blue',  name: 'Dusty Blue',     primary: '#7B9CBF', hover: '#6889AA' },
  { id: 'champagne',   name: 'Champagne Gold', primary: '#C4903A', hover: '#A87830' },
  { id: 'lavender',    name: 'Lavender',       primary: '#9B89C4', hover: '#8A77B0' },
  { id: 'terracotta',  name: 'Terracotta',     primary: '#C8645B', hover: '#B5524A' },
  { id: 'slate',       name: 'Slate',          primary: '#6B7B8D', hover: '#586775' },
];

const STORAGE_KEY = 'pp-theme';

function hexToRgbChannels(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

export function darkenHex(hex: string, amount = 18): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function applyColors(primary: string, hover: string) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary-rgb', hexToRgbChannels(primary));
  root.style.setProperty('--brand-hover-rgb',   hexToRgbChannels(hover));
}

const DARK_KEY = 'pp-dark';

interface ThemeContextValue {
  themeId: string;
  setTheme: (id: string, primary: string, hover?: string) => void;
  isDark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'dusty-rose',
  setTheme: () => {},
  isDark: false,
  toggleDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState('dusty-rose');
  const [isDark, setIsDark]   = useState(() => localStorage.getItem(DARK_KEY) === 'true');

  // Apply dark class on mount + whenever isDark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const { id, primary, hover } = JSON.parse(saved);
      setThemeId(id);
      applyColors(primary, hover);
    } catch {}
  }, []);

  function setTheme(id: string, primary: string, hover?: string) {
    const finalHover = hover ?? darkenHex(primary);
    applyColors(primary, finalHover);
    setThemeId(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, primary, hover: finalHover }));
  }

  function toggleDark() {
    setIsDark(d => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(DARK_KEY, String(next));
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ themeId, setTheme, isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
