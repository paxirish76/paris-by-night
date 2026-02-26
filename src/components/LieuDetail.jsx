import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isMJ } from './AuthContext';
import './LieuDetail.css';

// ── Field metadata ─────────────────────────────────────────────────────────
const FIELD_META = {
  // Public fields
  presentation_generale:  { label: 'Présentation générale',    icon: '📜', section: 'public' },
  ambiance:               { label: 'Ambiance',                  icon: '🌑', section: 'public' },
  acces:                  { label: 'Accès',                     icon: '🚪', section: 'public' },
  usage:                  { label: 'Usage',                     icon: '⚙️', section: 'public' },
  usage_ordinaire:        { label: 'Usage ordinaire',           icon: '⚙️', section: 'public' },
  usage_diplomatique:     { label: 'Usage diplomatique',        icon: '🤝', section: 'public' },
  usage_discret:          { label: 'Usage discret',             icon: '🤫', section: 'public' },
  usage_crise:            { label: 'Usage en cas de crise',     icon: '⚠️', section: 'public' },
  protocoles:             { label: 'Protocoles',                icon: '📋', section: 'public' },
  president:              { label: 'Président',                 icon: '👑', section: 'public' },
  tenancier:              { label: 'Tenancier',                 icon: '🧛', section: 'public' },
  tenanciers:             { label: 'Tenanciers',                icon: '🧛', section: 'public' },
  tenanciere:             { label: 'Tenancière',                icon: '🧛', section: 'public' },
  direction:              { label: 'Direction',                 icon: '👑', section: 'public' },
  gardien:                { label: 'Gardien',                   icon: '🛡️', section: 'public' },
  activites_officielles:  { label: 'Activités officielles',     icon: '📌', section: 'public' },
  sections:               { label: 'Sections',                  icon: '🗂️', section: 'public' },
  utilite:                { label: 'Utilité',                   icon: '🔧', section: 'public' },
  securite:               { label: 'Sécurité',                  icon: '🔒', section: 'public' },
  rumeurs_et_secrets:     { label: 'Rumeurs & Secrets',         icon: '👂', section: 'public' },
  // MJ-only fields
  secrets_mj:             { label: 'Secrets MJ',                icon: '🔴', section: 'mj' },
  securite_occulte:       { label: 'Sécurité occulte',          icon: '🧿', section: 'mj' },
  // Sensitive but visible to players who access the location
  arriere_boutique:       { label: 'Arrière-boutique',          icon: '🚪', section: 'public' },
  activites_cachees:      { label: 'Activités cachées',         icon: '🕵️', section: 'public' },
  zones_secretes:         { label: 'Zones secrètes',            icon: '🗝️', section: 'public' },
};

const MJ_FIELDS = new Set(['secrets_mj', 'securite_occulte']);

const PROTECTION_LABELS = { 1: 'Faible', 2: 'Modérée', 3: 'Forte', 4: 'Maximale' };

// ── Helpers ────────────────────────────────────────────────────────────────
const ProtectionDots = ({ value }) => (
  <span className="ld-protection-dots">
    {[1,2,3,4].map(i => (
      <span key={i} className={`ld-dot ${i <= value ? 'active' : ''}`} />
    ))}
    <span className="ld-protection-label">{PROTECTION_LABELS[value] || value}</span>
  </span>
);

// ── Recursive value renderer ───────────────────────────────────────────────
const renderValue = (value, depth = 0) => {
  if (value === null || value === undefined) return null;

  // Plain string / number
  if (typeof value === 'string' || typeof value === 'number') {
    return <span className="ld-val-string">{value}</span>;
  }

  // Array
  if (Array.isArray(value)) {
    // Array of plain strings → bullet list
    if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
      return (
        <ul className="ld-val-list">
          {value.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    }
    // Array of objects → recurse each
    return (
      <div className="ld-val-array">
        {value.map((item, i) => (
          <div key={i} className="ld-val-array-item">
            {renderValue(item, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  // Object → render sub-keys as sub-sections
  if (typeof value === 'object') {
    return (
      <div className={`ld-val-object ${depth > 0 ? 'ld-val-object--nested' : ''}`}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="ld-val-subfield">
            <div className="ld-val-subkey">{k.replace(/_/g, ' ')}</div>
            <div className="ld-val-subvalue">{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }

  return String(value);
};

const FieldBlock = ({ fieldKey, value, mjMode, visible, onToggleVisible }) => {
  const meta = FIELD_META[fieldKey] || { label: fieldKey.replace(/_/g, ' '), icon: '•', section: 'public' };
  const isMjField = MJ_FIELDS.has(fieldKey);

  return (
    <div className={`ld-field ${isMjField ? 'ld-field--mj' : ''} ${!visible && mjMode ? 'ld-field--hidden' : ''}`}>
      <div className="ld-field-header">
        <span className="ld-field-icon">{meta.icon}</span>
        <span className="ld-field-label">{meta.label}</span>
        {mjMode && !isMjField && (
          <button
            className={`ld-visibility-toggle ${visible ? 'on' : 'off'}`}
            onClick={() => onToggleVisible(fieldKey)}
            title={visible ? 'Masquer aux joueurs' : 'Révéler aux joueurs'}
          >
            {visible ? '👁' : '◌'}
          </button>
        )}
        {isMjField && <span className="ld-mj-badge">MJ</span>}
      </div>
      <div className="ld-field-content">
        {renderValue(value)}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const LieuDetail = ({ lieuId, onClose, onNavigateToCarte, mode = 'mj', viewerClan = null }) => {
  const mjMode = isMJ(mode);

  const [lieu, setLieu]             = useState(null);
  const [clans, setClans]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');

  // Local editable state
  const [connu, setConnu]           = useState(false);
  const [overrides, setOverrides]   = useState([]);
  // fieldVisibility: { fieldKey: bool } — persisted in a JSON column or supabase field
  const [fieldVisibility, setFieldVisibility] = useState({});

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: lieuxData }, { data: clansData }] = await Promise.all([
          supabase
            .from('lieux')
            .select('*, bourg:bourgs!lieux_bourg_id_fkey(nom), clan:clans!lieux_clan_id_fkey(nom, couleur)')
            .eq('id', lieuId)
            .single(),
          supabase.from('clans').select('id, nom, couleur').order('nom'),
        ]);

        if (lieuxData) {
          setLieu(lieuxData);
          setConnu(lieuxData.connu ?? false);
          setOverrides(lieuxData.clan_overrides ?? []);
          // field_visibility stored in lieu row (if column exists) or default all public visible
          setFieldVisibility(lieuxData.field_visibility ?? {});
        }
        setClans(clansData || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [lieuId]);

  // ── Save changes ──────────────────────────────────────────────────────────
  const saveChanges = useCallback(async (updates) => {
    setSaving(true);
    const { error } = await supabase
      .from('lieux')
      .update(updates)
      .eq('id', lieuId);
    if (!error) {
      setSaveMsg('✓ Sauvegardé');
      setTimeout(() => setSaveMsg(''), 2000);
    } else {
      setSaveMsg('✗ Erreur');
      setTimeout(() => setSaveMsg(''), 3000);
    }
    setSaving(false);
  }, [lieuId]);

  const handleToggleConnu = async () => {
    const newVal = !connu;
    setConnu(newVal);
    setLieu(l => ({ ...l, connu: newVal }));
    await saveChanges({ connu: newVal });
  };

  const handleToggleOverride = async (clanId) => {
    const newOverrides = overrides.includes(clanId)
      ? overrides.filter(c => c !== clanId)
      : [...overrides, clanId];
    setOverrides(newOverrides);
    await saveChanges({ clan_overrides: newOverrides });
  };

  const handleToggleFieldVisibility = async (fieldKey) => {
    const current = fieldVisibility[fieldKey] !== false; // default visible
    const newVis = { ...fieldVisibility, [fieldKey]: !current };
    setFieldVisibility(newVis);
    await saveChanges({ field_visibility: newVis });
  };

  // ── Parse description ─────────────────────────────────────────────────────
  const description = (() => {
    if (!lieu?.description) return {};
    if (typeof lieu.description === 'object') return lieu.description;
    try { return JSON.parse(lieu.description); } catch { return {}; }
  })();

  const publicFields = Object.entries(description).filter(([k]) => !MJ_FIELDS.has(k));
  const mjFields     = Object.entries(description).filter(([k]) =>  MJ_FIELDS.has(k));

  const isFieldVisible = (key) => fieldVisibility[key] !== false;

  const clanColor = lieu?.clan?.couleur || '#8b0000';

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="ld-loading">
      <div className="ld-spinner" />
      <p>Chargement...</p>
    </div>
  );

  if (!lieu) return (
    <div className="ld-error">Lieu introuvable.</div>
  );

  const isElysium = (lieu.statut || '').toLowerCase().includes('elysium');

  return (
    <div className="ld-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ld-panel" style={{ '--clan-color': clanColor }}>

        {/* ── Top bar ─────────────────────────────────────────── */}
        <div className="ld-topbar">
          <button className="ld-close" onClick={onClose}>✕</button>
          {onNavigateToCarte && (
            <button className="ld-carte-btn" onClick={() => onNavigateToCarte(lieuId)} title="Voir sur la carte">
              🗺 Carte
            </button>
          )}
          {mjMode && (
            <div className="ld-save-area">
              {saving && <span className="ld-saving">Sauvegarde…</span>}
              {saveMsg && <span className={`ld-save-msg ${saveMsg.startsWith('✓') ? 'ok' : 'err'}`}>{saveMsg}</span>}
            </div>
          )}
        </div>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="ld-header" style={{ borderBottomColor: clanColor }}>
          <div className="ld-header-marker">
            <span
              className={`ld-shape ${isElysium ? 'diamond' : 'circle'}`}
              style={{ background: clanColor, boxShadow: `0 0 16px ${clanColor}` }}
            />
          </div>
          <div className="ld-header-main">
            <h1 className="ld-nom" style={{ color: clanColor }}>{lieu.nom}</h1>
            {lieu.adresse && <p className="ld-adresse">{lieu.adresse}</p>}
            <div className="ld-badges">
              {lieu.statut && (
                <span className="ld-badge ld-badge--statut" style={{ borderColor: clanColor, color: clanColor }}>
                  {lieu.statut}
                </span>
              )}
              {lieu.clan?.nom && (
                <span className="ld-badge ld-badge--clan" style={{ background: `${clanColor}22`, borderColor: `${clanColor}66`, color: clanColor }}>
                  {lieu.clan.nom}
                </span>
              )}
              {lieu.bourg?.nom && (
                <span className="ld-badge ld-badge--bourg">
                  {lieu.bourg.nom}
                </span>
              )}
              {lieu.protection && (
                <span className="ld-badge ld-badge--protection">
                  🛡 <ProtectionDots value={lieu.protection} />
                </span>
              )}
            </div>
          </div>

          {/* MJ controls */}
          {mjMode && (
            <div className="ld-header-controls">
              <button
                className={`ld-connu-btn ${connu ? 'on' : 'off'}`}
                onClick={handleToggleConnu}
                title={connu ? 'Visible par les joueurs — cliquer pour masquer' : 'Masqué aux joueurs — cliquer pour révéler'}
              >
                <span className="ld-connu-icon">{connu ? '👁' : '◌'}</span>
                <span className="ld-connu-label">{connu ? 'Visible' : 'Masqué'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Clan overrides (MJ only) ─────────────────────────── */}
        {mjMode && (
          <div className="ld-overrides-section">
            <div className="ld-section-title">
              <span className="ld-section-icon">🔑</span>
              Accès par clan (même si masqué)
            </div>
            <div className="ld-clan-toggles">
              {clans.map(clan => (
                <button
                  key={clan.id}
                  className={`ld-clan-toggle ${overrides.includes(clan.id) ? 'active' : ''}`}
                  style={overrides.includes(clan.id) ? {
                    background: `${clan.couleur}22`,
                    borderColor: clan.couleur,
                    color: clan.couleur,
                  } : {}}
                  onClick={() => handleToggleOverride(clan.id)}
                >
                  {clan.nom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Description fields ───────────────────────────────── */}
        <div className="ld-body">

          {/* Public fields section */}
          {publicFields.length > 0 && (
            <section className="ld-section">
              <div className="ld-section-title">
                <span className="ld-section-icon">📖</span>
                Description
                {mjMode && (
                  <span className="ld-section-hint">Les champs 👁/◌ contrôlent la visibilité joueur</span>
                )}
              </div>
              <div className="ld-fields-grid">
                {publicFields.map(([key, value]) => (
                  <FieldBlock
                    key={key}
                    fieldKey={key}
                    value={value}
                    mjMode={mjMode}
                    visible={isFieldVisible(key)}
                    onToggleVisible={handleToggleFieldVisibility}
                  />
                ))}
              </div>
            </section>
          )}

          {/* MJ-only section */}
          {mjMode && mjFields.length > 0 && (
            <section className="ld-section ld-section--mj">
              <div className="ld-section-title ld-section-title--mj">
                <span className="ld-section-icon">🔴</span>
                Informations MJ
                <span className="ld-section-hint ld-section-hint--mj">Jamais visibles par les joueurs</span>
              </div>
              <div className="ld-fields-grid">
                {mjFields.map(([key, value]) => (
                  <FieldBlock
                    key={key}
                    fieldKey={key}
                    value={value}
                    mjMode={mjMode}
                    visible={true}
                    onToggleVisible={() => {}}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};

export default LieuDetail;
