import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './PersonnagesTable.css';

function PersonnagesTable({ onSelectPersonnage }) {
  const [personnages, setPersonnages] = useState([]);
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour filtres et tri
  const [filterClan, setFilterClan] = useState('tous');
  const [sortBy, setSortBy] = useState('clan-generation'); // clan-generation | alphabetique | generation

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
        .select('*');

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

  // Fonction de tri
  const getSortedPersonnages = (persos) => {
    const filtered = filterClan === 'tous' 
      ? persos 
      : persos.filter(p => p.clan_id === filterClan);

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'clan-generation':
          // D'abord par clan, puis par génération croissante
          if (a.clan_id !== b.clan_id) {
            return (a.clan_id || '').localeCompare(b.clan_id || '');
          }
          return (a.generation || 99) - (b.generation || 99);
        
        case 'alphabetique':
          return (a.nom || '').localeCompare(b.nom || '');
        
        case 'generation':
          return (a.generation || 99) - (b.generation || 99);
        
        default:
          return 0;
      }
    });

    return sorted;
  };

  // Obtenir le clan d'un personnage
  const getClan = (clanId) => {
    return clans.find(c => c.id === clanId);
  };

  // Obtenir le premier rôle (ou 'Aucun')
  const getPrimaryRole = (roles) => {
    if (!roles || roles.length === 0) return 'Aucun';
    return roles[0];
  };

  if (loading) {
    return (
      <div className="personnages-table">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement des vampires...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="personnages-table">
        <div className="error-container">
          <p className="error-text">❌ Erreur : {error}</p>
        </div>
      </div>
    );
  }

  const sortedPersonnages = getSortedPersonnages(personnages);

  return (
    <div className="personnages-table">
      {/* Header avec titre et stats */}
      <div className="table-header">
        <div className="header-title">
          <h1 className="table-title">Les Vampires de Paris</h1>
          <p className="table-subtitle">
            {sortedPersonnages.length} / {personnages.length} Caïnites
          </p>
        </div>
      </div>

      {/* Contrôles : Filtres et Tri */}
      <div className="table-controls">
        {/* Filtre par clan */}
        <div className="control-group">
          <label className="control-label">Filtrer par Clan</label>
          <select 
            className="control-select"
            value={filterClan}
            onChange={(e) => setFilterClan(e.target.value)}
          >
            <option value="tous">Tous les clans ({personnages.length})</option>
            {clans.map(clan => {
              const count = personnages.filter(p => p.clan_id === clan.id).length;
              return (
                <option key={clan.id} value={clan.id}>
                  {clan.nom} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Tri */}
        <div className="control-group">
          <label className="control-label">Trier par</label>
          <select 
            className="control-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="clan-generation">Clan puis Génération</option>
            <option value="alphabetique">Alphabétique (A-Z)</option>
            <option value="generation">Génération (croissante)</option>
          </select>
        </div>

        {/* Bouton Reset */}
        {(filterClan !== 'tous' || sortBy !== 'clan-generation') && (
          <button 
            className="btn-reset"
            onClick={() => {
              setFilterClan('tous');
              setSortBy('clan-generation');
            }}
          >
            ↺ Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau */}
      <div className="table-container">
        <table className="vampires-table">
          <thead>
            <tr>
              <th className="col-nom">Nom</th>
              <th className="col-generation">Gén.</th>
              <th className="col-clan">Clan</th>
              <th className="col-role">Rôle Principal</th>
            </tr>
          </thead>
          <tbody>
            {sortedPersonnages.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-row">
                  Aucun personnage trouvé
                </td>
              </tr>
            ) : (
              sortedPersonnages.map((perso) => {
                const clan = getClan(perso.clan_id);
                const role = getPrimaryRole(perso.roles);
                
                return (
                  <tr 
                    key={perso.id}
                    className="table-row"
                    onClick={() => onSelectPersonnage && onSelectPersonnage(perso.id)}
                  >
                    <td className="col-nom">
                      <span className="nom-text">{perso.nom || 'Sans nom'}</span>
                    </td>
                    <td className="col-generation">
                      <span 
                        className="generation-badge"
                        style={{ 
                          background: `linear-gradient(135deg, ${clan?.couleur || '#666'}, ${clan?.couleur || '#666'}99)` 
                        }}
                      >
                        {perso.generation || '?'}
                      </span>
                    </td>
                    <td className="col-clan">
                      <span 
                        className="clan-badge"
                        style={{ 
                          color: clan?.couleur || '#c0c0c0',
                          borderColor: clan?.couleur || '#c0c0c0'
                        }}
                      >
                        {clan?.nom || 'Inconnu'}
                      </span>
                    </td>
                    <td className="col-role">
                      <span className="role-text">{role}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer avec légende */}
      <div className="table-footer">
        <p className="footer-hint">👁️ Cliquer sur une ligne pour voir la fiche complète</p>
      </div>
    </div>
  );
}

export default PersonnagesTable;
