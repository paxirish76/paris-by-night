import React, { useState, useEffect } from 'react';
import { isMJ, isPlayer, isGuest } from './AuthContext';
import { supabase } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';
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

function Navigation({ onNavigate, currentPage, mode, joueur = null, onLogout, onCampagneChange }) {
  const [campagnes, setCampagnes]           = useState([]);
  const [selectedCampagne, setSelectedCampagne] = useState(null); // null = toutes
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('pbn-nav-collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed(v => {
      localStorage.setItem('pbn-nav-collapsed', String(!v));
      return !v;
    });
  };

  // Load campagnes for MJ
  useEffect(() => {
    if (!isMJ(mode)) return;
    supabase
      .from('campagnes')
      .select('id, nom')
      .order('nom')
      .then(({ data }) => setCampagnes(data || []));
  }, [mode]);

  const handleCampagneChange = (id) => {
    setSelectedCampagne(id);
    onCampagneChange?.(id);
  };
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
    if (item.mjOnly && !isMJ(mode)) return false;
    return true;
  });

  const clanColor = CLAN_COLORS[mode] || null;
  const clanLabel = CLAN_LABELS[mode] || null;

  return (
    <nav className={`navigation ${collapsed ? 'navigation--collapsed' : ''}`}>

      {/* ── Toggle collapse button ───────────────────────────────────────── */}
      <button className="nav-collapse-btn" onClick={toggleCollapsed} title={collapsed ? 'Étendre' : 'Réduire'}>
        {collapsed ? '›' : '‹'}
      </button>

      <div className="nav-header">
        <h1 className="nav-title">Paris by Night</h1>
        <p className="nav-subtitle">Domaine de François Villon</p>
      </div>

      <div className="nav-mode-badge">
        {isMJ(mode) ? (
          <span className="nav-badge nav-badge--mj">⚙ Maître de Jeu</span>
        ) : mode === 'campagne' && joueur ? (
          <span className="nav-badge nav-badge--campagne">
            <span className="nav-badge-joueur">⚜ {joueur.nom}</span>
            <span className="nav-badge-campagne">{joueur.campagne_nom}</span>
          </span>
        ) : isGuest(mode) ? (
          <span className="nav-badge nav-badge--clan" style={{ borderColor: '#888', color: '#888' }}>
            👁 Invité
          </span>
        ) : (
          <span
            className="nav-badge nav-badge--clan"
            style={{ borderColor: clanColor, color: clanColor }}
          >
            ⚜ {clanLabel}
          </span>
        )}
      </div>

      {/* Sélecteur de campagne — MJ uniquement */}
      {isMJ(mode) && campagnes.length > 0 && (
        <div className="nav-campagne-selector">
          <p className="nav-campagne-label">Campagne</p>
          <div className="nav-campagne-btns">
            <button
              className={`nav-campagne-btn ${selectedCampagne === null ? 'active' : ''}`}
              onClick={() => handleCampagneChange(null)}
              type="button"
            >
              Toutes
            </button>
            {campagnes.map(c => (
              <button
                key={c.id}
                className={`nav-campagne-btn ${selectedCampagne === c.id ? 'active' : ''}`}
                onClick={() => handleCampagneChange(c.id)}
                type="button"
              >
                {c.nom}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="nav-menu">
        {menuItems.map(item => (
          <li key={item.id}>
            <button
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="nav-footer">
        <ThemeToggle />
        <p className="nav-version">Version 1.0 - Prototype</p>
        <button className="nav-logout" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
