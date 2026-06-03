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
      '--primary-50': '#FAF5FF',
      '--primary-100': '#F3E8FF',
      '--primary-200': '#E9D5FF',
      '--primary-300': '#D8B4FE',
      '--primary-400': '#C084FC',
      '--primary-500': '#A855F7',
      '--primary-600': '#9333EA',
      '--primary-700': '#7C3AED',
      '--primary-800': '#6D28D9',
      '--primary-900': '#4C1D95',
      '--bg-gradient': 'linear-gradient(160deg, #FEFEFF 0%, #FAF5FF 40%, #F5EEFF 100%)',
      '--bg-sidebar': 'linear-gradient(180deg, #FEFEFF 0%, #FAF5FF 100%)',
      '--bg-card': '#FFFFFF',
      '--bg-card-hover': '#FCFAFF',
      '--btn-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      '--btn-shadow': 'rgba(124, 58, 237, 0.25)',
      '--border-color': '#E9D5FF',
      '--text-accent': '#6D28D9',
      '--text-primary': '#1E1B4B',
      '--text-secondary': '#6B7280',
      '--shadow-color': 'rgba(76, 29, 149, 0.06)',
      '--badge-bg': '#F3E8FF',
      '--badge-text': '#6D28D9',
      '--accent-glow': 'rgba(139, 92, 246, 0.12)',
      '--accent-soft': 'rgba(139, 92, 246, 0.04)',
      '--sidebar-gradient': 'linear-gradient(180deg, #FEFEFF 0%, #FAF5FF 100%)',
      '--card-tint': 'rgba(139, 92, 246, 0.02)',
      '--focus-glow': 'rgba(139, 92, 246, 0.1)',
    }
  },
  dark: {
    name: 'Dark Focus',
    emoji: '🌙',
    colors: {
      '--primary-50': '#1E293B',
      '--primary-100': '#334155',
      '--primary-200': '#475569',
      '--primary-300': '#64748B',
      '--primary-400': '#94A3B8',
      '--primary-500': '#CBD5E1',
      '--primary-600': '#E2E8F0',
      '--primary-700': '#F1F5F9',
      '--primary-800': '#F8FAFC',
      '--primary-900': '#FFFFFF',
      '--bg-gradient': 'linear-gradient(160deg, #0F172A 0%, #1E293B 40%, #1E293B 100%)',
      '--bg-sidebar': 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      '--bg-card': '#1E293B',
      '--bg-card-hover': '#253347',
      '--btn-gradient': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      '--btn-shadow': 'rgba(37, 99, 235, 0.3)',
      '--border-color': '#334155',
      '--text-accent': '#60A5FA',
      '--text-primary': '#F1F5F9',
      '--text-secondary': '#94A3B8',
      '--shadow-color': 'rgba(0, 0, 0, 0.2)',
      '--badge-bg': 'rgba(59, 130, 246, 0.15)',
      '--badge-text': '#60A5FA',
      '--accent-glow': 'rgba(59, 130, 246, 0.15)',
      '--accent-soft': 'rgba(59, 130, 246, 0.06)',
      '--sidebar-gradient': 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      '--card-tint': 'rgba(59, 130, 246, 0.04)',
      '--focus-glow': 'rgba(59, 130, 246, 0.15)',
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