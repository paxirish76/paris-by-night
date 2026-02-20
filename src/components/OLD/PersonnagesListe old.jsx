import React from 'react';
import personnagesData from '../data/personnages.json';
import './PersonnagesListe.css';

function PersonnagesListe({ onSelectPersonnage }) {
  const { personnages } = personnagesData;

  // Grouper par clan
  const personnagesParClan = personnages.reduce((acc, perso) => {
    const clan = perso.meta?.clan || 'Autre';
    if (!acc[clan]) acc[clan] = [];
    acc[clan].push(perso);
    return acc;
  }, {});

  const clanColors = {
    'Toreador': '#d4af37',
    'Ventrue': '#4169e1',
    'Brujah': '#8b0000',
    'Tremere': '#4b0082',
    'Malkavian': '#9370db',
    'Nosferatu': '#2f4f4f',
    'Gangrel': '#228b22',
    'Lasombra': '#1a1a1a',
  };

  return (
    <div className="personnages-liste">
      <div className="liste-header">
        <h1 className="liste-title">Personnages</h1>
        <p className="liste-subtitle">{personnages.length} vampires recensés</p>
      </div>

      <div className="clans-grid">
        {Object.entries(personnagesParClan).map(([clan, members]) => (
          <div key={clan} className="clan-group">
            <h2 
              className="clan-title"
              style={{ borderLeftColor: clanColors[clan] || '#c0c0c0' }}
            >
              <span className="clan-icon">⚜️</span>
              {clan}
              <span className="clan-count">({members.length})</span>
            </h2>
            
            <div className="personnages-grid">
              {members.map(perso => (
                <button
                  key={perso.id}
                  className="personnage-card"
                  onClick={() => onSelectPersonnage(perso.id)}
                  style={{ borderColor: clanColors[clan] || '#c0c0c0' }}
                >
                  <div className="card-portrait">
                    <div className="portrait-placeholder">
                      {perso.nom?.charAt(0) || perso.id?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="card-name">
                      {perso.nom || perso.id}
                    </h3>
                    
                    {perso.meta?.roles && perso.meta.roles.length > 0 && (
                      <p className="card-role">{perso.meta.roles[0]}</p>
                    )}
                    
                    <div className="card-meta">
                      <span className="card-generation">
                        Gén. {perso.meta?.generation || '?'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PersonnagesListe;
