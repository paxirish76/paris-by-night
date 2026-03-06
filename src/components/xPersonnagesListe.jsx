import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './PersonnagesListe.css';

function PersonnagesListe({ onSelectPersonnage }) {
  const [personnages, setPersonnages] = useState([]);
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les clans
      const { data: clansData, error: clansError } = await supabase
        .from('clans')
        .select('*')
        .order('nom');

      if (clansError) throw clansError;

      // Charger les personnages
      const { data: persoData, error: persoError } = await supabase
        .from('personnages')
        .select('*')
        .order('nom');

      if (persoError) throw persoError;

      setClans(clansData || []);
      setPersonnages(persoData || []);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les personnages par clan
  const groupedByClans = () => {
    const grouped = {};
    
    clans.forEach(clan => {
      grouped[clan.id] = {
        clan: clan,
        personnages: personnages.filter(p => p.clan_id === clan.id)
      };
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="personnages-liste">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement des vampires...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="personnages-liste">
        <div className="error-container">
          <p className="error-text">❌ Erreur : {error}</p>
        </div>
      </div>
    );
  }

  const grouped = groupedByClans();

  return (
    <div className="personnages-liste">
      <div className="liste-header">
        <h1 className="liste-title">Les Vampires de Paris</h1>
        <p className="liste-subtitle">
          {personnages.length} Caïnites recensés dans le Domaine
        </p>
      </div>

      <div className="clans-container">
        {Object.entries(grouped).map(([clanId, { clan, personnages: clanPersos }]) => {
          if (clanPersos.length === 0) return null;

          return (
            <div key={clanId} className="clan-group">
              <div 
                className="clan-header" 
                style={{ 
                  borderColor: clan.couleur,
                  background: `linear-gradient(90deg, ${clan.couleur}15, transparent)`
                }}
              >
                <h2 
                  className="clan-name" 
                  style={{ color: clan.couleur }}
                >
                  {clan.nom}
                </h2>
                <span className="clan-count" style={{ color: clan.couleur }}>
                  {clanPersos.length}
                </span>
              </div>

              <div className="personnages-grid">
                {clanPersos.map(perso => (
                  <div
                    key={perso.id}
                    className="personnage-card"
                    style={{ borderLeftColor: clan.couleur }}
                    onClick={() => onSelectPersonnage && onSelectPersonnage(perso.id)}
                  >
                    <div className="card-header">
                      <h3 className="card-name">{perso.nom}</h3>
                      <span 
                        className="card-generation"
                        style={{ 
                          background: `linear-gradient(135deg, ${clan.couleur}, ${clan.couleur}99)` 
                        }}
                      >
                        Gen {perso.generation}
                      </span>
                    </div>

                    <div className="card-info">
                      <div className="info-item">
                        <span className="info-label">Sire:</span>
                        <span className="info-value">
                          {perso.sire || 'Inconnu'}
                        </span>
                      </div>

                      {perso.roles && perso.roles.length > 0 && (
                        <div className="card-roles">
                          {perso.roles.slice(0, 2).map((role, idx) => (
                            <span 
                              key={idx} 
                              className="role-tag"
                              style={{ borderColor: clan.couleur }}
                            >
                              {role}
                            </span>
                          ))}
                          {perso.roles.length > 2 && (
                            <span className="role-tag role-more">
                              +{perso.roles.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {perso.apparence && (
                      <div className="card-preview">
                        {perso.apparence.substring(0, 100)}
                        {perso.apparence.length > 100 && '...'}
                      </div>
                    )}

                    <div className="card-footer">
                      <span className="card-click-hint">
                        👁️ Cliquer pour voir la fiche complète
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PersonnagesListe;
