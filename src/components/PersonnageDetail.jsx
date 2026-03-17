import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import PortraitModal from './PortraitModal';
import './PersonnageDetail.css';

// ── Visibilité par défaut ──────────────────────────────────────────────────
// true  = visible par défaut si la clé est absente de field_visibility
// false = masqué par défaut si la clé est absente de field_visibility
//
// nom, apparence            → toujours visibles (pas de toggle du tout)
// attributs, capacités,
// disciplines, secrets_mj  → MJ uniquement (showMJOnly, pas de toggle)
// roles                     → visible par défaut (true)
// tout le reste             → masqué par défaut (false)

const FIELD_DEFAULTS = {
  personnalite: false,
  histoire:     false,
  sire:         false,
  generation:   true,
  relations:    false,
  notes:        false,
  roles:        true,   // seul champ visible par défaut
};

// ── PersonnageDetail ───────────────────────────────────────────────────────
function PersonnageDetail({ personnageId, onClose, playerMode = false, viewerClan = null, joueur = null, selectedCampagne = null }) {
  const [personnage, setPersonnage]               = useState(null);
  const [clan, setClan]                           = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState(null);
  const [showPortraitModal, setShowPortraitModal] = useState(false);
  const [saving, setSaving]                       = useState(false);
  const [saveMsg, setSaveMsg]                     = useState('');
  const [fieldVisibility, setFieldVisibility]     = useState({});
  const [joueurs, setJoueurs]                     = useState([]);

  // Clan roster pour la navigation prev/next
  const [clanRoster, setClanRoster]                   = useState([]);
  const [currentPersonnageId, setCurrentPersonnageId] = useState(personnageId);

  const mjMode        = !playerMode;
  const isCampagneMode = playerMode && !!joueur;

  useEffect(() => {
    setCurrentPersonnageId(personnageId);
  }, [personnageId]);

  useEffect(() => {
    loadPersonnage();
  }, [currentPersonnageId]);

  // Load all joueurs for the MJ visibility panel
  useEffect(() => {
    if (!mjMode) return;
    supabase
      .from('joueurs')
      .select('id, nom, campagne_id, campagnes(nom)')
      .order('campagne_id')
      .then(({ data }) => setJoueurs(data || []));
  }, [mjMode]);

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
      setFieldVisibility(persoData.field_visibility ?? {});

      setClanRoster(prev => {
        const alreadyForThisClan = prev.length > 0 && prev.some(p => p.clan_id === persoData.clan_id);
        if (alreadyForThisClan) return prev;
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

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveVisibility = useCallback(async (nextVisibility) => {
    setSaving(true);
    const { error } = await supabase
      .from('personnages')
      .update({ field_visibility: nextVisibility })
      .eq('id', currentPersonnageId);
    if (!error) { setSaveMsg('✓ Sauvegardé'); setTimeout(() => setSaveMsg(''), 2000); }
    else        { setSaveMsg('✗ Erreur');     setTimeout(() => setSaveMsg(''), 3000); }
    setSaving(false);
  }, [currentPersonnageId]);

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  // joueurId: if provided, write into fv[joueurId] scope (MJ joueur panel)
  //           if null, write flat (existing MJ toggles)
  const toggleField = useCallback((fieldKey, joueurId = null) => {
    setFieldVisibility(prev => {
      // Per-joueur scoped toggle
      if (joueurId) {
        const joueurScope = prev[joueurId] ?? {};
        const current = fieldKey in joueurScope ? joueurScope[fieldKey] !== false : (FIELD_DEFAULTS[fieldKey] ?? false);
        const nextScope = { ...joueurScope, [fieldKey]: !current };
        const next = { ...prev, [joueurId]: nextScope };
        saveVisibility(next);
        return next;
      }
      // Flat MJ toggle (existing behaviour)
      const current = isFieldVisible(prev, fieldKey);
      const next = { ...prev, [fieldKey]: !current };
      saveVisibility(next);
      return next;
    });
  }, [saveVisibility]);

  // Toggle presence of a joueur in field_visibility (add with {} or remove entirely)
  const toggleJoueurPresence = useCallback((joueurId) => {
    setFieldVisibility(prev => {
      const next = { ...prev };
      if (joueurId in next) {
        delete next[joueurId];
      } else {
        next[joueurId] = {};
      }
      saveVisibility(next);
      return next;
    });
  }, [saveVisibility]);

  // Toggle d'un item individuel (roles / relations)
  const toggleItem = useCallback((fieldKey, index, joueurId = null) => {
    setFieldVisibility(prev => {
      if (joueurId) {
        const joueurScope = prev[joueurId] ?? {};
        const itemsKey = `${fieldKey}_items`;
        const items = joueurScope[itemsKey] || {};
        const currentlyVisible = String(index) in items ? items[String(index)] !== false : (FIELD_DEFAULTS[fieldKey] ?? false);
        const nextItems = { ...items, [String(index)]: !currentlyVisible };
        const nextScope = { ...joueurScope, [itemsKey]: nextItems };
        const next = { ...prev, [joueurId]: nextScope };
        saveVisibility(next);
        return next;
      }
      const itemsKey = `${fieldKey}_items`;
      const items = prev[itemsKey] || {};
      const currentlyVisible = isItemVisible(prev, fieldKey, index);
      const nextItems = { ...items, [String(index)]: !currentlyVisible };
      const next = { ...prev, [itemsKey]: nextItems };
      saveVisibility(next);
      return next;
    });
  }, [saveVisibility]);

  // ── Visibility helpers ─────────────────────────────────────────────────────
  // MJ toggles write to a flat fv: { histoire: true, relations: false }
  // Campagne joueurs read from fv[joueur.id]: { alice: { histoire: true } }
  // The MJ panel (added below) writes per-joueur scoped keys.

  const getScopedFv = (fv) => {
    if (isCampagneMode && joueur) return fv[joueur.id] ?? {};
    return fv;
  };

  const isFieldVisible = (fv, fieldKey) => {
    const scoped = getScopedFv(fv);
    if (fieldKey in scoped) return scoped[fieldKey] !== false;
    return FIELD_DEFAULTS[fieldKey] ?? false;
  };

  const isItemVisible = (fv, fieldKey, index) => {
    const scoped = getScopedFv(fv);
    const items = scoped[`${fieldKey}_items`] || {};
    if (String(index) in items) return items[String(index)] !== false;
    return FIELD_DEFAULTS[fieldKey] ?? false;
  };

  // ── Navigation clan ────────────────────────────────────────────────────────
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
        social:   { charisme: 0, manipulation: 0, apparence: 0 },
        mental:   { perception: 0, intelligence: 0, astuce: 0 }
      };
    }
    return typeof personnage.attributes === 'string'
      ? JSON.parse(personnage.attributes)
      : personnage.attributes;
  };

  // ── Loading / error ────────────────────────────────────────────────────────
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

  const attributes  = getAttributes();
  const roles       = personnage.roles || [];
  const disciplines = personnage.disciplines || [];
  const relations   = personnage.relations || [];
  const secrets     = personnage.secrets_mj || {};

  // ── Logique de visibilité globale ─────────────────────────────────────────
  // MJ              : voit tout + toggles
  // Joueur même clan: voit tout sauf secrets_mj + stats (showFullSheet)
  // Joueur autre    : nom, apparence + champs révélés uniquement
  const isOwnClan     = playerMode && viewerClan === personnage.clan_id;
  const showFullSheet = !playerMode || isOwnClan;
  const showMJOnly    = !playerMode;

  const fv = fieldVisibility;
  const playerCanSee     = (fieldKey) => !playerMode || isFieldVisible(fv, fieldKey);
  const playerCanSeeItem = (fieldKey, index) => !playerMode || isItemVisible(fv, fieldKey, index);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="personnage-detail">

      {/* ── Barre statut MJ ───────────────────────────────────────────────── */}
      {mjMode && (
        <div className="pd-mj-statusbar">
          <span className={`pd-save-msg ${saveMsg.startsWith('✓') ? 'ok' : saveMsg ? 'err' : ''}`}>
            {saving ? '…' : saveMsg}
          </span>
          <span className="pd-mj-hint">👁 / ◌ contrôle la visibilité joueur</span>
        </div>
      )}

      <button className="btn-close-top" onClick={onClose}>✕ Fermer</button>

      {/* ── Navigation clan (MJ uniquement) ───────────────────────────────── */}
      {!playerMode && total > 1 && (
        <div className="pd-clan-nav">
          <button
            className="pd-clan-nav-arrow"
            onClick={() => goTo(currentIndex - 1)}
            title="Personnage précédent"
            style={{ '--clan-color': clan?.couleur ?? '#888' }}
          >←</button>
          <span className="pd-clan-nav-info" style={{ color: clan?.couleur ?? '#888' }}>
            {clan?.nom} · {currentIndex + 1} / {total}
          </span>
          <button
            className="pd-clan-nav-arrow"
            onClick={() => goTo(currentIndex + 1)}
            title="Personnage suivant"
            style={{ '--clan-color': clan?.couleur ?? '#888' }}
          >→</button>
        </div>
      )}

      <div className="detail-grid">

        {/* ═══════════════════════════════════════════════════════════════════
            COLONNE DROITE : Image, ID, Rôles
        ═══════════════════════════════════════════════════════════════════ */}
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

          {/* Rôles — masquable globalement + item par item */}
          {(mjMode || playerCanSee('roles')) && (
            <div className={`detail-section ${!isFieldVisible(fv, 'roles') && mjMode ? 'section-hidden' : ''}`}>
              <h3 className="section-title">
                Rôles
                {mjMode && (
                  <VisibilityToggle
                    visible={isFieldVisible(fv, 'roles')}
                    onToggle={() => toggleField('roles')}
                    label="les rôles"
                  />
                )}
              </h3>
              <div className="roles-list">
                {roles.length > 0 ? (
                  roles.map((role, index) => {
                    const itemVisible = isItemVisible(fv, 'roles', index);
                    if (!mjMode && !itemVisible) return null;
                    return (
                      <div key={index} className={`role-badge-wrapper ${!itemVisible && mjMode ? 'item-hidden' : ''}`}>
                        <div className="role-badge">{role}</div>
                        {mjMode && (
                          <button
                            className={`item-visibility-btn ${itemVisible ? 'on' : 'off'}`}
                            onClick={() => toggleItem('roles', index)}
                            title={itemVisible ? 'Masquer ce rôle' : 'Révéler ce rôle'}
                          >
                            {itemVisible ? '👁' : '◌'}
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="empty-text">Aucun rôle</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            COLONNE CENTRE : Nom, Sire, Génération, Apparence, etc.
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="detail-center">

          {/* Nom — toujours visible */}
          <h1 className="detail-nom">{personnage.nom}</h1>

          {/* Sire et Génération — toggles SÉPARÉS */}
          {(mjMode || playerCanSee('sire') || playerCanSee('generation')) && (
            <div className="detail-meta">

              {(mjMode || playerCanSee('sire')) && (
                <div className={`meta-item ${!isFieldVisible(fv, 'sire') && mjMode ? 'meta-item-hidden' : ''}`}>
                  <span className="meta-label">
                    Sire
                    {mjMode && (
                      <VisibilityToggle
                        visible={isFieldVisible(fv, 'sire')}
                        onToggle={() => toggleField('sire')}
                        label="le sire"
                        className="meta-toggle"
                      />
                    )}
                  </span>
                  <span className="meta-value">{personnage.sire || 'Inconnu'}</span>
                </div>
              )}

              {(mjMode || playerCanSee('generation')) && (
                <div className={`meta-item ${!isFieldVisible(fv, 'generation') && mjMode ? 'meta-item-hidden' : ''}`}>
                  <span className="meta-label">
                    Génération
                    {mjMode && (
                      <VisibilityToggle
                        visible={isFieldVisible(fv, 'generation')}
                        onToggle={() => toggleField('generation')}
                        label="la génération"
                        className="meta-toggle"
                      />
                    )}
                  </span>
                  <span className="meta-value generation-badge">
                    {personnage.generation || '?'}ème
                  </span>
                </div>
              )}

            </div>
          )}

          {/* Apparence — toujours visible */}
          <div className="detail-section">
            <h3 className="section-title">Apparence</h3>
            <p className="section-text">{personnage.apparence || 'Non décrite'}</p>
          </div>

          {/* Personnalité — masquable */}
          {(mjMode || playerCanSee('personnalite')) && (
            <div className={`detail-section ${!isFieldVisible(fv, 'personnalite') && mjMode ? 'section-hidden' : ''}`}>
              <h3 className="section-title">
                Personnalité
                {mjMode && (
                  <VisibilityToggle
                    visible={isFieldVisible(fv, 'personnalite')}
                    onToggle={() => toggleField('personnalite')}
                    label="la personnalité"
                  />
                )}
              </h3>
              <p className="section-text">{personnage.personnalite || 'Non décrite'}</p>
            </div>
          )}

          {/* Histoire — masquable */}
          {(mjMode || playerCanSee('histoire')) && (
            <div className={`detail-section ${!isFieldVisible(fv, 'histoire') && mjMode ? 'section-hidden' : ''}`}>
              <h3 className="section-title">
                Histoire
                {mjMode && (
                  <VisibilityToggle
                    visible={isFieldVisible(fv, 'histoire')}
                    onToggle={() => toggleField('histoire')}
                    label="l'histoire"
                  />
                )}
              </h3>
              <p className="section-text">{personnage.histoire || 'Histoire inconnue'}</p>
            </div>
          )}

          {/* Relations — masquable globalement + item par item */}
          {showFullSheet && (mjMode || playerCanSee('relations')) && (
            <div className={`detail-section ${!isFieldVisible(fv, 'relations') && mjMode ? 'section-hidden' : ''}`}>
              <h3 className="section-title">
                Relations
                {mjMode && (
                  <VisibilityToggle
                    visible={isFieldVisible(fv, 'relations')}
                    onToggle={() => toggleField('relations')}
                    label="les relations"
                  />
                )}
              </h3>
              <div className="relations-list">
                {relations.length > 0 ? (
                  relations.map((relation, index) => {
                    const itemVisible = isItemVisible(fv, 'relations', index);
                    if (!mjMode && !itemVisible) return null;
                    return (
                      <div key={index} className={`relation-item-wrapper ${!itemVisible && mjMode ? 'item-hidden' : ''}`}>
                        <div className="relation-item">• {relation}</div>
                        {mjMode && (
                          <button
                            className={`item-visibility-btn ${itemVisible ? 'on' : 'off'}`}
                            onClick={() => toggleItem('relations', index)}
                            title={itemVisible ? 'Masquer cette relation' : 'Révéler cette relation'}
                          >
                            {itemVisible ? '👁' : '◌'}
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="empty-text">Aucune relation</p>
                )}
              </div>
            </div>
          )}

          {/* Secrets MJ — jamais de toggle, MJ uniquement */}
          {showMJOnly && Object.keys(secrets).length > 0 && (
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

        {/* ═══════════════════════════════════════════════════════════════════
            COLONNE GAUCHE : Clan, Attributs, Capacités, Disciplines
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="detail-left">
          <div className="detail-clan" style={{ borderColor: clan?.couleur }}>
            {clan?.icon_url ? (
              <img src={clan.icon_url} alt={clan.nom} className="clan-icon" />
            ) : (
              <span className="clan-icon-placeholder" style={{ color: clan?.couleur }}>⚜️</span>
            )}
            <span className="clan-nom" style={{ color: clan?.couleur }}>{clan?.nom}</span>
          </div>

          {/* Attributs — MJ uniquement, pas de toggle */}
          {showMJOnly && (
            <div className="detail-section">
              <h3 className="section-title">
                Attributs
                <span className="mj-only-badge">MJ</span>
              </h3>
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
          )}

          {/* Capacités — MJ uniquement, pas de toggle */}
          {showMJOnly && (
            <div className="detail-section">
              <h3 className="section-title">
                Capacités
                <span className="mj-only-badge">MJ</span>
              </h3>
              <div className="abilities-content">
                {personnage.abilities || 'Aucune capacité définie'}
              </div>
            </div>
          )}

          {/* Disciplines — MJ uniquement, pas de toggle */}
          {showMJOnly && (
            <div className="detail-section">
              <h3 className="section-title">
                Disciplines
                <span className="mj-only-badge">MJ</span>
              </h3>
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
          )}
        </div>
      </div>

      {/* ── Notes — masquable, pleine largeur ─────────────────────────────── */}
      {showFullSheet && (mjMode || playerCanSee('notes')) && (
        <div className={`detail-notes-bottom ${!isFieldVisible(fv, 'notes') && mjMode ? 'section-hidden' : ''}`}>
          <h3 className="section-title">
            📝 Notes
            {mjMode && (
              <VisibilityToggle
                visible={isFieldVisible(fv, 'notes')}
                onToggle={() => toggleField('notes')}
                label="les notes"
              />
            )}
          </h3>
          <div className="notes-content">
            {personnage.notes || 'Aucune note'}
          </div>
        </div>
      )}

      {/* ── Panneau visibilité joueurs (MJ only) ──────────────────────────── */}
      {mjMode && joueurs.length > 0 && (
        <JoueurVisibilityPanel
          joueurs={joueurs}
          fieldVisibility={fieldVisibility}
          onToggleField={toggleField}
          onTogglePresence={toggleJoueurPresence}
          selectedCampagne={selectedCampagne}
        />
      )}

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

// ── VisibilityToggle ───────────────────────────────────────────────────────
function VisibilityToggle({ visible, onToggle, label, className = '' }) {
  return (
    <button
      className={`pd-visibility-toggle ${visible ? 'on' : 'off'} ${className}`}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      title={visible ? `Masquer ${label} aux joueurs` : `Révéler ${label} aux joueurs`}
    >
      {visible ? '👁' : '◌'}
    </button>
  );
}

// ── JoueurVisibilityPanel ─────────────────────────────────────────────────
const TOGGLEABLE_FIELDS = [
  { key: 'personnalite', label: 'Personnalité' },
  { key: 'histoire',     label: 'Histoire' },
  { key: 'sire',         label: 'Sire' },
  { key: 'generation',   label: 'Génération' },
  { key: 'relations',    label: 'Relations' },
  { key: 'notes',        label: 'Notes' },
  { key: 'roles',        label: 'Rôles' },
];

function JoueurVisibilityPanel({ joueurs, fieldVisibility, onToggleField, onTogglePresence, selectedCampagne }) {
  const [open, setOpen] = useState(false);

  // Filter by selected campagne, then group
  const filteredJoueurs = selectedCampagne
    ? joueurs.filter(j => j.campagne_id === selectedCampagne)
    : joueurs;

  // Group joueurs by campagne
  const byCampagne = filteredJoueurs.reduce((acc, j) => {
    const key = j.campagne_id;
    if (!acc[key]) acc[key] = { nom: j.campagnes?.nom || key, joueurs: [] };
    acc[key].joueurs.push(j);
    return acc;
  }, {});

  const isJoueurVisible = (joueurId) => joueurId in fieldVisibility;

  const isJoueurFieldVisible = (joueurId, fieldKey) => {
    const fv = fieldVisibility[joueurId] ?? {};
    if (fieldKey in fv) return fv[fieldKey] !== false;
    return FIELD_DEFAULTS[fieldKey] ?? false;
  };

  return (
    <div className="pd-joueur-panel">
      <button
        className="pd-joueur-panel-toggle"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <span>👥 Visibilité joueurs</span>
        <span className="pd-joueur-panel-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="pd-joueur-panel-body">
          {Object.entries(byCampagne).map(([campagneId, { nom: campagneNom, joueurs: campagneJoueurs }]) => (
            <div key={campagneId} className="pd-joueur-campagne">
              <div className="pd-joueur-campagne-label">{campagneNom}</div>
              {campagneJoueurs.map(j => {
                const visible = isJoueurVisible(j.id);
                return (
                  <div key={j.id} className="pd-joueur-block">
                    <div className="pd-joueur-row">
                      <span className="pd-joueur-name">{j.nom}</span>
                      <div className="pd-joueur-visible-toggle" onClick={() => onTogglePresence(j.id)}>
                        <span>{visible ? 'Visible' : 'Caché'}</span>
                        <div className={`pd-toggle ${visible ? 'on' : ''}`} />
                      </div>
                    </div>

                    {visible && (
                      <div className="pd-joueur-fields">
                        {TOGGLEABLE_FIELDS.map(({ key, label }) => {
                          const fieldVisible = isJoueurFieldVisible(j.id, key);
                          return (
                            <button
                              key={key}
                              type="button"
                              className={`pd-joueur-field-pill ${fieldVisible ? 'active' : ''}`}
                              onClick={() => onToggleField(key, j.id)}
                            >
                              <span className="pd-joueur-field-dot" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PersonnageDetail;
