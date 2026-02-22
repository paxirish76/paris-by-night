import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PortraitModal from './PortraitModal';
import './PersonnageDetail.css';

function PersonnageDetail({ personnageId, onClose }) {
  const [personnage, setPersonnage] = useState(null);
  const [clan, setClan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPortraitModal, setShowPortraitModal] = useState(false);

  // Clan roster for prev/next navigation
  const [clanRoster, setClanRoster] = useState([]);
  const [currentPersonnageId, setCurrentPersonnageId] = useState(personnageId);

  useEffect(() => {
    setCurrentPersonnageId(personnageId);
  }, [personnageId]);

  useEffect(() => {
    loadPersonnage();
  }, [currentPersonnageId]);

  const loadPersonnage = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: persoData, error: persoError } = await supabase
        .from('personnages')
        .select('*')
        .eq('id', currentPersonnageId)
        .single();

      if (persoError) throw persoError;

      const { data: clanData, error: clanError } = await supabase
        .from('clans')
        .select('*')
        .eq('id', persoData.clan_id)
        .single();

      if (clanError) throw clanError;

      setPersonnage(persoData);
      setClan(clanData);

      // Fetch clan roster only if clan changed or roster is empty
      setClanRoster(prev => {
        const alreadyForThisClan = prev.length > 0 && prev.some(p => p.clan_id === persoData.clan_id);
        if (alreadyForThisClan) return prev;
        // Trigger async roster load
        supabase
          .from('personnages')
          .select('id, nom, generation, clan_id')
          .eq('clan_id', persoData.clan_id)
          .eq('ghost', false)
          .order('generation', { ascending: true })
          .then(({ data }) => {
            if (!data) return;
            const sorted = [...data].sort((a, b) => {
              if (a.generation !== b.generation) return a.generation - b.generation;
              return a.nom.localeCompare(b.nom, 'fr');
            });
            setClanRoster(sorted);
          });
        return prev;
      });

    } catch (err) {
      console.error('Erreur chargement personnage:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = clanRoster.findIndex(p => p.id === currentPersonnageId);
  const total = clanRoster.length;

  const goTo = (index) => {
    const next = clanRoster[(index + total) % total];
    if (next) setCurrentPersonnageId(next.id);
  };

  const getImageUrl = () => {
    if (personnage?.image_url) {
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/personnages/${personnage.image_url}`;
    }
    return null;
  };

  const getAttributes = () => {
    if (!personnage?.attributes) {
      return {
        physique: { force: 0, dexterite: 0, vigueur: 0 },
        social: { charisme: 0, manipulation: 0, apparence: 0 },
        mental: { perception: 0, intelligence: 0, astuce: 0 }
      };
    }
    return typeof personnage.attributes === 'string'
      ? JSON.parse(personnage.attributes)
      : personnage.attributes;
  };

  if (loading) {
    return (
      <div className="personnage-detail">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement du personnage...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="personnage-detail">
        <div className="error-message">
          <p>❌ Erreur : {error}</p>
          <button onClick={onClose} className="btn-close">Retour</button>
        </div>
      </div>
    );
  }

  if (!personnage) {
    return (
      <div className="personnage-detail">
        <div className="error-message">
          <p>Personnage introuvable</p>
          <button onClick={onClose} className="btn-close">Retour</button>
        </div>
      </div>
    );
  }

  const attributes = getAttributes();
  const roles = personnage.roles || [];
  const disciplines = personnage.disciplines || [];
  const relations = personnage.relations || [];
  const secrets = personnage.secrets_mj || {};

  return (
    <div className="personnage-detail">
      <button className="btn-close-top" onClick={onClose}>
        ✕ Fermer
      </button>

      {/* Clan navigation arrows */}
      {total > 1 && (
        <div className="pd-clan-nav">
          <button
            className="pd-clan-nav-arrow"
            onClick={() => goTo(currentIndex - 1)}
            title="Personnage précédent"
            style={{ '--clan-color': clan?.couleur ?? '#888' }}
          >
            ←
          </button>
          <span className="pd-clan-nav-info" style={{ color: clan?.couleur ?? '#888' }}>
            {clan?.nom} · {currentIndex + 1} / {total}
          </span>
          <button
            className="pd-clan-nav-arrow"
            onClick={() => goTo(currentIndex + 1)}
            title="Personnage suivant"
            style={{ '--clan-color': clan?.couleur ?? '#888' }}
          >
            →
          </button>
        </div>
      )}

      <div className="detail-grid">
        {/* COLONNE DROITE : Image, ID, Rôles */}
        <div className="detail-right">
          <div
            className="detail-portrait"
            onClick={() => setShowPortraitModal(true)}
            style={{ cursor: 'pointer' }}
            title="Cliquer pour agrandir le portrait"
          >
            {getImageUrl() ? (
              <img src={getImageUrl()} alt={personnage.nom} />
            ) : (
              <div className="portrait-placeholder">
                <span className="placeholder-icon">🧛</span>
                <span className="placeholder-text">Portrait</span>
              </div>
            )}
            <div className="portrait-overlay">
              <span className="overlay-icon">🔍</span>
            </div>
          </div>

          <div className="detail-field detail-id">
            <span className="field-label">ID</span>
            <span className="field-value">{personnage.id}</span>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Rôles</h3>
            <div className="roles-list">
              {roles.length > 0 ? (
                roles.map((role, index) => (
                  <div key={index} className="role-badge">{role}</div>
                ))
              ) : (
                <p className="empty-text">Aucun rôle</p>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE CENTRE : Nom, Sire/Génération, Apparence, etc. */}
        <div className="detail-center">
          <h1 className="detail-nom">{personnage.nom}</h1>

          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">Sire</span>
              <span className="meta-value">{personnage.sire || 'Inconnu'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Génération</span>
              <span className="meta-value generation-badge">
                {personnage.generation || '?'}ème
              </span>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Apparence</h3>
            <p className="section-text">{personnage.apparence || 'Non décrite'}</p>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Personnalité</h3>
            <p className="section-text">{personnage.personnalite || 'Non décrite'}</p>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Histoire</h3>
            <p className="section-text">{personnage.histoire || 'Histoire inconnue'}</p>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Relations</h3>
            <div className="relations-list">
              {relations.length > 0 ? (
                relations.map((relation, index) => (
                  <div key={index} className="relation-item">• {relation}</div>
                ))
              ) : (
                <p className="empty-text">Aucune relation</p>
              )}
            </div>
          </div>

          {Object.keys(secrets).length > 0 && (
            <div className="detail-section secrets-section">
              <h3 className="section-title secrets-title">🔒 Secrets du MJ</h3>
              <div className="secrets-content">
                {Object.entries(secrets).map(([key, value]) => (
                  <div key={key} className="secret-item">
                    <div className="secret-key">{key.replace(/_/g, ' ')}</div>
                    <div className="secret-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLONNE GAUCHE : Clan, Attributs, Capacités, Disciplines */}
        <div className="detail-left">
          <div className="detail-clan" style={{ borderColor: clan?.couleur }}>
            {clan?.icon_url ? (
              <img src={clan.icon_url} alt={clan.nom} className="clan-icon" />
            ) : (
              <span className="clan-icon-placeholder" style={{ color: clan?.couleur }}>⚜️</span>
            )}
            <span className="clan-nom" style={{ color: clan?.couleur }}>{clan?.nom}</span>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Attributs</h3>
            <div className="attributes-grid">
              <div className="attribute-category">
                <div className="category-label">Physique</div>
                <div className="attribute-row">
                  <span className="attr-name">FOR:</span>
                  <span className="attr-value">{attributes.physique?.force || 0}</span>
                  <span className="attr-separator">/</span>
                  <span className="attr-name">DEX:</span>
                  <span className="attr-value">{attributes.physique?.dexterite || 0}</span>
                  <span className="attr-separator">/</span>
                  <span className="attr-name">VIG:</span>
                  <span className="attr-value">{attributes.physique?.vigueur || 0}</span>
                </div>
              </div>
              <div className="attribute-category">
                <div className="category-label">Social</div>
                <div className="attribute-row">
                  <span className="attr-name">CHA:</span>
                  <span className="attr-value">{attributes.social?.charisme || 0}</span>
                  <span className="attr-separator">/</span>
                  <span className="attr-name">MAN:</span>
                  <span className="attr-value">{attributes.social?.manipulation || 0}</span>
                  <span className="attr-separator">/</span>
                  <span className="attr-name">APP:</span>
                  <span className="attr-value">{attributes.social?.apparence || 0}</span>
                </div>
              </div>
              <div className="attribute-category">
                <div className="category-label">Mental</div>
                <div className="attribute-row">
                  <span className="attr-name">PER:</span>
                  <span className="attr-value">{attributes.mental?.perception || 0}</span>
                  <span className="attr-separator">/</span>
                  <span className="attr-name">INT:</span>
                  <span className="attr-value">{attributes.mental?.intelligence || 0}</span>
                  <span className="attr-separator">/</span>
                  <span className="attr-name">AST:</span>
                  <span className="attr-value">{attributes.mental?.astuce || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Capacités</h3>
            <div className="abilities-content">
              {personnage.abilities || 'Aucune capacité définie'}
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Disciplines</h3>
            <div className="disciplines-list">
              {disciplines.length > 0 ? (
                disciplines.map((disc, index) => (
                  <div key={index} className="discipline-badge">{disc}</div>
                ))
              ) : (
                <p className="empty-text">Aucune discipline</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-notes-bottom">
        <h3 className="section-title">📝 Notes</h3>
        <div className="notes-content">
          {personnage.notes || 'Aucune note'}
        </div>
      </div>

      {showPortraitModal && (
        <PortraitModal
          imageUrl={getImageUrl()}
          personnageName={personnage.nom}
          onClose={() => setShowPortraitModal(false)}
        />
      )}
    </div>
  );
}

export default PersonnageDetail;
