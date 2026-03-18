import React, { useState, useEffect } from 'react';
import { isMJ, isGuest } from './AuthContext';
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
  const [campagnes, setCampagnes]               = useState([]);
  const [selectedCampagne, setSelectedCampagne] = useState(null);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('pbn-nav-collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed(v => {
      localStorage.setItem('pbn-nav-collapsed', String(!v));
      return !v;
    });
  };

  // Load campagnes for MJ selector
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
    { id: 'home',         label: 'Accueil',      icon: '🏰' },
    { id: 'organisation', label: 'Organisation', icon: '👑' },
    { id: 'personnages',  label: 'Personnages',  icon: '🦇' },
    { id: 'clans',        label: 'Clans',        icon: '⚜️' },
    { id: 'influences',   label: 'Influences',   icon: '🕸️' },
    { id: 'chronologie',  label: 'Chronologie',  icon: '📜' },
    { id: 'lieux',        label: 'Lieux',        icon: '🏛️' },
    { id: 'bourgs',       label: 'Bourgs',       icon: '🗺️' },
    { id: 'carte',        label: 'Carte',        icon: '📍' },
  ];

  // Clan badge data — for campagne joueurs, read from joueur.clan_id
  const effectiveClan = mode === 'campagne' ? joueur?.clan_id : null;
  const clanColor     = CLAN_COLORS[effectiveClan] || null;
  const clanLabel     = CLAN_LABELS[effectiveClan] || null;

  return (
    <nav className={`navigation ${collapsed ? 'navigation--collapsed' : ''}`}>

      {/* ── Toggle collapse button ── */}
      <button
        className="nav-collapse-btn"
        onClick={toggleCollapsed}
        title={collapsed ? 'Étendre' : 'Réduire'}
      >
        {collapsed ? '›' : '‹'}
      </button>

      <div className="nav-header">
        <h1 className="nav-title">Paris by Night</h1>
        <p className="nav-subtitle">Domaine de François Villon</p>
      </div>

      <div className="nav-mode-badge">
        {isMJ(mode) ? (
          <span className="nav-badge nav-badge--mj">⚙ Maître de Jeu</span>
        ) : isGuest(mode) ? (
          <span className="nav-badge nav-badge--clan" style={{ borderColor: '#888', color: '#888' }}>
            👁 Invité
          </span>
        ) : mode === 'campagne' && joueur ? (
          <span
            className="nav-badge nav-badge--campagne"
            style={clanColor ? { borderColor: clanColor } : undefined}
          >
            <span className="nav-badge-joueur" style={clanColor ? { color: clanColor } : undefined}>
              ⚜ {joueur.nom}
            </span>
            {clanLabel && (
              <span className="nav-badge-clan-label" style={{ color: clanColor }}>
                {clanLabel}
              </span>
            )}
            <span className="nav-badge-campagne">{joueur.campagne_nom}</span>
          </span>
        ) : null}
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
        {allItems.map(item => (
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
