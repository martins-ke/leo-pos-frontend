import { useContext } from 'react';
import { ThemeContext } from './themeState';

export const useTheme = () => useContext(ThemeContext);
