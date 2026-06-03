import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { currentTheme, switchTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = Object.entries(themes).map(([key, value]) => ({
    id: key,
    name: value.name,
  }));

  const currentThemeData = themes[currentTheme];

  const getSwatchColor = (themeKey) => {
    switch (themeKey) {
      case 'light': return '#3B82F6';
      case 'lavender': return '#8B5CF6';
      case 'dark': return '#1E293B';
      default: return '#64748B';
    }
  };

  return (
    <div className="theme-toggle">
      <button 
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle theme selector"
      >
        <span className="theme-swatch" style={{ background: getSwatchColor(currentTheme) }}></span>
        <span className="theme-name">{currentThemeData.name}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
          <svg width="10" height="10" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => {
                switchTheme(theme.id);
                setIsOpen(false);
              }}
            >
              <span className="theme-swatch" style={{ background: getSwatchColor(theme.id) }}></span>
              <span className="option-name">{theme.name}</span>
              {currentTheme === theme.id && (
                <span className="check-mark">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;