import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const themes = {
  light: {
    name: 'Light Academic',
    emoji: '🎓',
    colors: {
      '--primary-50': '#F8FAFC',
      '--primary-100': '#F1F5F9',
      '--primary-200': '#E2E8F0',
      '--primary-300': '#CBD5E1',
      '--primary-400': '#94A3B8',
      '--primary-500': '#64748B',
      '--primary-600': '#475569',
      '--primary-700': '#334155',
      '--primary-800': '#1E293B',
      '--primary-900': '#0F172A',
      '--bg-gradient': 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 40%, #F1F5F9 100%)',
      '--bg-sidebar': 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#FAFBFC',
      '--btn-gradient': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      '--btn-shadow': 'rgba(37, 99, 235, 0.25)',
      '--border-color': '#E2E8F0',
      '--text-accent': '#1D4ED8',
      '--text-primary': '#0F172A',
      '--text-secondary': '#475569',
      '--shadow-color': 'rgba(15, 23, 42, 0.06)',
      '--badge-bg': '#EFF6FF',
      '--badge-text': '#1D4ED8',
      '--accent-glow': 'rgba(59, 130, 246, 0.12)',
      '--accent-soft': 'rgba(59, 130, 246, 0.04)',
      '--sidebar-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
      '--card-tint': 'rgba(59, 130, 246, 0.02)',
      '--focus-glow': 'rgba(59, 130, 246, 0.1)',
    }
  },
  lavender: {
    name: 'Calm Lavender',
    emoji: '💜',
    colors: {
      '--primary-50': '#F3EDFF',
      '--primary-100': '#EBE0FF',
      '--primary-200': '#D4C0FA',
      '--primary-300': '#C0A8F3',
      '--primary-400': '#A882E8',
      '--primary-500': '#9066D8',
      '--primary-600': '#7C3AED',
      '--primary-700': '#6D28D9',
      '--primary-800': '#5B21B6',
      '--primary-900': '#4C1D95',
      '--bg-gradient': 'linear-gradient(160deg, #F5F0FF 0%, #EDE5FF 40%, #E8DEFF 100%)',
      '--bg-sidebar': 'linear-gradient(180deg, #F8F4FF 0%, #F0E8FF 100%)',
      '--bg-card': '#FAF7FF',
      '--bg-card-hover': '#F5EFFF',
      '--btn-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      '--btn-shadow': 'rgba(124, 58, 237, 0.25)',
      '--border-color': '#D4C5F0',
      '--text-accent': '#7C3AED',
      '--text-primary': '#1E1B4B',
      '--text-secondary': '#6B5B8A',
      '--shadow-color': 'rgba(76, 29, 149, 0.06)',
      '--badge-bg': '#F0E5FF',
      '--badge-text': '#7C3AED',
      '--accent-glow': 'rgba(139, 92, 246, 0.15)',
      '--accent-soft': 'rgba(139, 92, 246, 0.08)',
      '--sidebar-gradient': 'linear-gradient(180deg, #F8F4FF 0%, #F0E8FF 100%)',
      '--card-tint': 'rgba(139, 92, 246, 0.04)',
      '--focus-glow': 'rgba(139, 92, 246, 0.15)',
    }
  },
  dark: {
    name: 'Dark Focus',
    emoji: '🌙',
    colors: {
      '--primary-50': '#1C2638',
      '--primary-100': '#283548',
      '--primary-200': '#384860',
      '--primary-300': '#506078',
      '--primary-400': '#8494AC',
      '--primary-500': '#B0BFCF',
      '--primary-600': '#D0D9E4',
      '--primary-700': '#E4EAF0',
      '--primary-800': '#F0F3F7',
      '--primary-900': '#FFFFFF',
      '--bg-gradient': 'linear-gradient(160deg, #0A0F1A 0%, #111827 40%, #141E30 100%)',
      '--bg-sidebar': 'linear-gradient(180deg, #0D1320 0%, #151F30 100%)',
      '--bg-card': '#182234',
      '--bg-card-hover': '#1E2A40',
      '--btn-gradient': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      '--btn-shadow': 'rgba(37, 99, 235, 0.35)',
      '--border-color': '#2A3A52',
      '--text-accent': '#60A5FA',
      '--text-primary': '#F0F4F8',
      '--text-secondary': '#A0B4C8',
      '--shadow-color': 'rgba(0, 0, 0, 0.3)',
      '--badge-bg': 'rgba(59, 130, 246, 0.18)',
      '--badge-text': '#60A5FA',
      '--accent-glow': 'rgba(59, 130, 246, 0.2)',
      '--accent-soft': 'rgba(59, 130, 246, 0.08)',
      '--sidebar-gradient': 'linear-gradient(180deg, #0D1320 0%, #151F30 100%)',
      '--card-tint': 'rgba(59, 130, 246, 0.05)',
      '--focus-glow': 'rgba(59, 130, 246, 0.2)',
    }
  },
  cute: {
    name: 'Cute Study Mode',
    emoji: '🌸',
    colors: {
      '--primary-50': '#FFF0F5',
      '--primary-100': '#FFE4EF',
      '--primary-200': '#FECDD8',
      '--primary-300': '#FBA4BF',
      '--primary-400': '#F472A0',
      '--primary-500': '#EC4899',
      '--primary-600': '#DB2777',
      '--primary-700': '#BE185D',
      '--primary-800': '#9D174D',
      '--primary-900': '#831843',
      '--bg-gradient': 'linear-gradient(180deg, #FFF5F7 0%, #FFE8EE 40%, #FFDCE5 100%)',
      '--bg-sidebar': 'linear-gradient(180deg, #FFF8FA 0%, #FFE8EE 100%)',
      '--bg-card': '#FFF8FA',
      '--bg-card-hover': '#FFF0F5',
      '--btn-gradient': 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
      '--btn-shadow': 'rgba(236, 72, 153, 0.25)',
      '--border-color': '#FBD5E5',
      '--text-accent': '#DB2777',
      '--text-primary': '#4A1942',
      '--text-secondary': '#8B5E7A',
      '--shadow-color': 'rgba(236, 72, 153, 0.06)',
      '--badge-bg': '#FCE7F3',
      '--badge-text': '#DB2777',
      '--accent-glow': 'rgba(244, 114, 182, 0.15)',
      '--accent-soft': 'rgba(244, 114, 182, 0.06)',
      '--sidebar-gradient': 'linear-gradient(180deg, #FFF8FA 0%, #FFE8EE 100%)',
      '--card-tint': 'rgba(244, 114, 182, 0.04)',
      '--focus-glow': 'rgba(244, 114, 182, 0.15)',
    }
  }
};

// Map old theme keys to new ones for migration
const themeMigration = {
  pink: 'light',
  purple: 'lavender',
  mint: 'light',
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('assigntify_theme');
    if (saved && themeMigration[saved]) {
      return themeMigration[saved];
    }
    return themes[saved] ? saved : 'light';
  });

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    
    // Apply theme colors
    Object.entries(theme.colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Set data-theme attribute for CSS targeting
    root.setAttribute('data-theme', currentTheme);

    // Save to localStorage
    localStorage.setItem('assigntify_theme', currentTheme);
  }, [currentTheme]);

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      switchTheme, 
      themes,
      currentThemeData: themes[currentTheme]
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};