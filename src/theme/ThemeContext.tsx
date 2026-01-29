// src/theme/ThemeContext.tsx
// NOTE: ThemeProvider will always use DefaultTheme if useDefaultTheme is true in the config or if the API fails, as handled by the store.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DefaultTheme } from '../assets/theme/defaultTheme';
import { LightTheme } from '../assets/theme/lightTheme';
import useThemeStore, { ThemeMode } from '../store/themeStore';

type ButtonColors = {
  default_background: string;
  default_text: string;
  pressed_background: string;
  pressed_text: string;
  disabled_background: string;
  disabled_text: string;
};

type Shadow = {
  color: string;
  opacity: number;
  offset_width: number;
  offset_height: number;
  radius: number;
};

export type Colors = {
  main: string;
  secondary: string;
  background: string;
  tabBackground: string;
  card: string;
  error: string;
  border: string;
  overlay: string;
  white: string;
  black: string;
  text: string;
  subText: string;
  placeholder: string;
  dividerText: string;
  dividerLine: string;
  button: ButtonColors;
  shadow: Shadow;
  borderHighlight: string;
};

type Typography = {
  fontFamily: string;
  lineHeightMultiplier: number;
  h1: number;
  h2: number;
  subtitle: number;
  body: number;
  caption: number;
  small: number;
};

type BorderRadius = {
  sm: number;
  md: number;
  max: number;
};

export type Theme = {
  colors: Colors;
  typography: Typography;
  borderRadius: BorderRadius;
};

type ThemeContextType = {
  theme: Theme;
  themeMode: ThemeMode;
  isLoading: boolean;
  error: Error | null;
  getColor: (colorKey: keyof Colors | 'primary' | 'primaryLight' | 'success') => string;
  getButtonColor: (
    state: 'default' | 'pressed' | 'disabled',
    element: 'background' | 'text'
  ) => string;
  getTypography: (type: keyof Omit<Typography, 'fontFamily' | 'lineHeightMultiplier'>) => number;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false); // No loading needed
  // const [error, setError] = useState<Error | null>(null);
  // const { theme, themeMode, toggleTheme } = useThemeStore(); // Ignored

  // FORCE LIGHT THEME
  const theme = LightTheme;
  const themeMode = 'light';
  const toggleTheme = () => console.log('Theme toggling is disabled.');

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const getColor = (colorKey: keyof Colors | 'primary' | 'primaryLight' | 'success'): string => {
    const map: Record<string, keyof Colors> = {
      primary: 'main',
      primaryLight: 'overlay',
      success: 'secondary',
    };
    const resolvedKey = (map[colorKey as string] || colorKey) as keyof Colors;
    return theme.colors[resolvedKey] as string;
  };

  const getTypography = (
    type: keyof Omit<Typography, 'fontFamily' | 'lineHeightMultiplier'>
  ): number => {
    return theme.typography[type];
  };

  const getButtonColor = (
    state: 'default' | 'pressed' | 'disabled',
    element: 'background' | 'text'
  ): string => {
    const key = `${state}_${element}` as keyof ButtonColors;
    const value = theme.colors.button[key];
    return value as string;
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isLoading,
        error: null,
        getColor,
        getTypography,
        getButtonColor,
        toggleTheme,
        isDarkMode: false,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ThemeProvider, useTheme };
