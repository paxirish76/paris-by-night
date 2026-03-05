import { useState, useEffect } from 'react';

/**
 * ThemeToggle — Paris by Night
 * Ajoute/retire data-theme="day" sur <html>.
 * Persiste le choix dans localStorage.
 * À placer dans le nav-footer de Navigation.jsx ou en floating.
 */
export default function ThemeToggle() {
  const [isDay, setIsDay] = useState(() => {
    return localStorage.getItem('pbn-theme') === 'day';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDay) {
      root.setAttribute('data-theme', 'day');
      localStorage.setItem('pbn-theme', 'day');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('pbn-theme', 'night');
    }
  }, [isDay]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setIsDay(prev => !prev)}
      title={isDay ? 'Passer en mode nuit' : 'Passer en mode jour'}
    >
      <span className="theme-toggle-icon">{isDay ? '🌙' : '☀️'}</span>
      {isDay ? 'Nuit' : 'Jour'}
    </button>
  );
}
