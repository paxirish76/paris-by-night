import React from 'react';
import { isMJ, isPlayer } from './AuthContext';
import './Navigation.css';

const CLAN_LABELS = {
  brujah:   'Brujah',
  gangrel:  'Gangrel',
  lasombra: 'Lasombra',
  malkavian:'Malkavian',
  nosferatu:'Nosferatu',
  toreador: 'Toreador',
  tremere:  'Tremere',
  ventrue:  'Ventrue',
};

const CLAN_COLORS = {
  brujah:   '#e05c2a',
  gangrel:  '#7ab648',
  lasombra: '#7c5cbf',
  malkavian:'#c47ed4',
  nosferatu:'#7d9e7d',
  toreador: '#d4537a',
  tremere:  '#c0392b',
  ventrue:  '#3a6fb5',
};

function Navigation({ onNavigate, currentPage, mode, onLogout }) {
  const allItems = [
    { id: 'home',         label: 'Accueil',      icon: '🏰', mjOnly: false },
    { id: 'organisation', label: 'Organisation', icon: '👑', mjOnly: false },
    { id: 'personnages',  label: 'Personnages',  icon: '🦇', mjOnly: false },
    { id: 'clans',        label: 'Clans',        icon: '⚜️', mjOnly: false },
    { id: 'influences',   label: 'Influences',   icon: '🕸️', mjOnly: false },
    { id: 'chronologie',  label: 'Chronologie',  icon: '📜', mjOnly: false },
    { id: 'lieux',        label: 'Lieux',        icon: '🏛️', mjOnly: false },
    { id: 'bourgs',       label: 'Bourgs',       icon: '🗺️', mjOnly: false },
    { id: 'carte',        label: 'Carte',        icon: '📍', mjOnly: false },
  ];

  const menuItems = allItems.filter(item => {
    if (item.mjOnly && isPlayer(mode)) return false;
    return true;
  });

  const clanColor = CLAN_COLORS[mode] || null;
  const clanLabel = CLAN_LABELS[mode] || null;

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-title">Paris by Night</h1>
        <p className="nav-subtitle">Domaine de François Villon</p>
      </div>

      <div className="nav-mode-badge">
        {isMJ(mode) ? (
          <span className="nav-badge nav-badge--mj">⚙ Maître de Jeu</span>
        ) : (
          <span
            className="nav-badge nav-badge--clan"
            style={{ borderColor: clanColor, color: clanColor }}
          >
            ⚜ {clanLabel}
          </span>
        )}
      </div>

      <ul className="nav-menu">
        {menuItems.map(item => (
          <li key={item.id}>
            <button
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="nav-footer">
        <p className="nav-version">Version 1.0 - Prototype</p>
        <button className="nav-logout" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
