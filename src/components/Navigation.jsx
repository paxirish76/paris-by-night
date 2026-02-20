import React from 'react';
import './Navigation.css';

function Navigation({ onNavigate, currentPage }) {
  const menuItems = [
    { id: 'home', label: 'Accueil', icon: '🏰' },
    { id: 'personnages', label: 'Personnages', icon: '🦇' },
    { id: 'clans', label: 'Clans', icon: '⚜️' },
    { id: 'lieux', label: 'Lieux', icon: '🏛️' },
    { id: 'bourgs', label: 'Bourgs', icon: '🗺️' },
    { id: 'carte', label: 'Carte', icon: '📍' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-title">Paris by Night</h1>
        <p className="nav-subtitle">Domaine de François Villon</p>
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
      </div>
    </nav>
  );
}

export default Navigation;
