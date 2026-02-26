import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import './LieuDetail.css';

// ── Field metadata ─────────────────────────────────────────────────────────
const FIELD_META = {
  presentation_generale:  { label: 'Présentation générale',  icon: '📜' },
  ambiance:               { label: 'Ambiance',                icon: '🌑' },
  acces:                  { label: 'Accès',                   icon: '🚪' },
  usage:                  { label: 'Usage',                   icon: '⚙️' },
  usage_ordinaire:        { label: 'Usage ordinaire',         icon: '⚙️' },
  usage_diplomatique:     { label: 'Usage diplomatique',      icon: '🤝' },
  usage_discret:          { label: 'Usage discret',           icon: '🤫' },
  usage_crise:            { label: 'Usage en cas de crise',   icon: '⚠️' },
  protocoles:             { label: 'Protocoles',              icon: '📋' },
  president:              { label: 'Président',               icon: '👑' },
  tenancier:              { label: 'Tenancier',               icon: '🧛' },
  tenanciers:             { label: 'Tenanciers',              icon: '🧛' },
  tenanciere:             { label: 'Tenancière',              icon: '🧛' },
  direction:              { label: 'Direction',               icon: '👑' },
  gardien:                { label: 'Gardien',                 icon: '🛡️' },
  activites_officielles:  { label: 'Activités officielles',   icon: '📌' },
  sections:               { label: 'Sections',                icon: '🗂️' },
  utilite:                { label: 'Utilité',                 icon: '🔧' },
  securite:               { label: 'Sécurité',               icon: '🔒' },
  rumeurs_et_secrets:     { label: 'Rumeurs & Secrets',       icon: '👂' },
  arriere_boutique:       { label: 'Arrière-boutique',        icon: '🗝️' },
  activites_cachees:      { label: 'Activités cachées',       icon: '🕵️' },
  zones_secretes:         { label: 'Zones secrètes',          icon: '🗺️' },
  // MJ only
  secrets_mj:             { label: 'Secrets MJ',              icon: '⚠️' },
  securite_occulte:       { label: 'Sécurité occulte',        icon: '🧿' },
};

const MJ_FIELDS = new Set(['secrets_mj', 'securite_occulte']);

// Champs cachés par défaut aux joueurs (sauf si explicitement révélés par le MJ)
const HIDDEN_BY_DEFAULT = new Set([
  'usage_discret',
  'usage_crise',
  'arriere_boutique',
  'activites_cachees',
  'zones_secretes',
]);
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

const getImageUrl = (lieuId, index) => {
  const { data } = supabase.storage.from('lieux').getPublicUrl(`${lieuId}${index}.jpg`);
  return data?.publicUrl || null;
};

// ── Recursive value renderer ───────────────────────────────────────────────
const renderValue = (value, depth = 0) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    return <span className="ld-val-string">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
      return (
        <ul className="ld-val-list">
          {value.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    }
    return (
      <div className="ld-val-array">
        {value.map((item, i) => (
          <div key={i} className="ld-val-array-item">{renderValue(item, depth + 1)}</div>
        ))}
      </div>
    );
  }
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

// ── FieldBlock ─────────────────────────────────────────────────────────────
const FieldBlock = ({ fieldKey, value, mjMode, visible, onToggleVisible }) => {
  const meta = FIELD_META[fieldKey] || { label: fieldKey.replace(/_/g, ' '), icon: '•' };
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
      <div className="ld-field-content">{renderValue(value)}</div>
    </div>
  );
};

// ── LieuImage ─────────────────────────────────────────────────────────────
const LieuImage = ({ lieuId, index, nom }) => {
  const [status, setStatus] = useState('loading');
  const url = getImageUrl(lieuId, index);
  return (
    <div className={`ld-img-slot ld-img-slot--${status}`}>
      {status === 'loading' && <div className="ld-img-shimmer" />}
      {status === 'error' && (
        <div className="ld-img-placeholder"><span>🏛</span></div>
      )}
      <img
        src={url}
        alt={`${nom} — vue ${index}`}
        onLoad={() => setStatus('ok')}
        onError={() => setStatus('error')}
        className="ld-img"
        style={{ opacity: status === 'ok' ? 1 : 0 }}
      />
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const LieuDetail = ({ lieuId, onClose, onNavigateToCarte, playerMode = false, viewerClan = null }) => {
  const mjMode = !playerMode;

  const [lieu, setLieu]                       = useState(null);
  const [clans, setClans]                     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [saveMsg, setSaveMsg]                 = useState('');
  const [connu, setConnu]                     = useState(false);
  const [overrides, setOverrides]             = useState([]);
  const [fieldVisibility, setFieldVisibility] = useState({});

  // ── Load ──────────────────────────────────────────────────────────────────
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
          setFieldVisibility(lieuxData.field_visibility ?? {});
        }
        setClans(clansData || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [lieuId]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveChanges = useCallback(async (updates) => {
    setSaving(true);
    const { error } = await supabase.from('lieux').update(updates).eq('id', lieuId);
    if (!error) { setSaveMsg('✓ Sauvegardé'); setTimeout(() => setSaveMsg(''), 2000); }
    else        { setSaveMsg('✗ Erreur');     setTimeout(() => setSaveMsg(''), 3000); }
    setSaving(false);
  }, [lieuId]);

  const handleToggleConnu = async () => {
    const v = !connu; setConnu(v);
    await saveChanges({ connu: v });
  };

  const handleToggleOverride = async (clanId) => {
    const next = overrides.includes(clanId)
      ? overrides.filter(c => c !== clanId)
      : [...overrides, clanId];
    setOverrides(next);
    await saveChanges({ clan_overrides: next });
  };

  const handleToggleFieldVisibility = async (fieldKey) => {
    const current = fieldVisibility[fieldKey] !== false;
    const next = { ...fieldVisibility, [fieldKey]: !current };
    setFieldVisibility(next);
    await saveChanges({ field_visibility: next });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const description = (() => {
    if (!lieu?.description) return {};
    if (typeof lieu.description === 'object') return lieu.description;
    try { return JSON.parse(lieu.description); } catch { return {}; }
  })();

  const publicFields   = Object.entries(description).filter(([k]) => !MJ_FIELDS.has(k));
  const mjFields       = Object.entries(description).filter(([k]) =>  MJ_FIELDS.has(k));
  const isFieldVisible = (key) => {
    if (key in fieldVisibility) return fieldVisibility[key];
    return !HIDDEN_BY_DEFAULT.has(key); // défaut : caché si dans la liste
  };
  const clanColor      = lieu?.clan?.couleur || '#8b0000';
  const isElysium      = (lieu?.statut || '').toLowerCase().includes('elysium');

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="ld-page ld-page--loading">
      <div className="ld-spinner" />
      <p>Chargement...</p>
    </div>
  );
  if (!lieu) return (
    <div className="ld-page ld-page--loading"><p>Lieu introuvable.</p></div>
  );

  return (
    <div className="ld-page" style={{ '--clan-color': clanColor }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <div className="ld-navbar">
        <button className="ld-back" onClick={onClose}>
          ← Retour
        </button>
        <span className="ld-navbar-nom">{lieu.nom}</span>
        <div className="ld-navbar-actions">
          {onNavigateToCarte && (
            <button className="ld-carte-btn" onClick={() => onNavigateToCarte(lieuId)}>
              🗺 Carte
            </button>
          )}
          {mjMode && (
            <button
              className={`ld-connu-btn ${connu ? 'on' : 'off'}`}
              onClick={handleToggleConnu}
            >
              {connu ? '👁 Visible' : '◌ Masqué'}
            </button>
          )}
          {mjMode && (
            <span className={`ld-save-msg ${saveMsg.startsWith('✓') ? 'ok' : saveMsg ? 'err' : ''}`}>
              {saving ? '…' : saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* ── Hero images 50/50 ──────────────────────────────────────────────── */}
      <div className="ld-hero">
        <LieuImage lieuId={lieuId} index={1} nom={lieu.nom} />
        <LieuImage lieuId={lieuId} index={2} nom={lieu.nom} />
        <div className="ld-hero-overlay">
          <div className="ld-hero-title">
            <span
              className={`ld-shape ${isElysium ? 'diamond' : 'circle'}`}
              style={{ background: clanColor, boxShadow: `0 0 20px ${clanColor}` }}
            />
            <div>
              <h1 className="ld-nom">{lieu.nom}</h1>
              {lieu.adresse && <p className="ld-adresse-hero">{lieu.adresse}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Meta badges ────────────────────────────────────────────────────── */}
      <div className="ld-meta">
        {lieu.statut && (
          <span className="ld-badge ld-badge--statut" style={{ borderColor: clanColor, color: clanColor }}>
            {isElysium ? '♦' : '●'} {lieu.statut}
          </span>
        )}
        {lieu.clan?.nom && (
          <span className="ld-badge ld-badge--clan" style={{ background: `${clanColor}22`, borderColor: `${clanColor}66`, color: clanColor }}>
            {lieu.clan.nom}
          </span>
        )}
        {lieu.bourg?.nom && (
          <span className="ld-badge ld-badge--bourg">{lieu.bourg.nom}</span>
        )}
        {lieu.protection && (
          <span className="ld-badge ld-badge--protection">
            🛡 <ProtectionDots value={lieu.protection} />
          </span>
        )}
      </div>

      {/* ── Clan overrides (MJ only) ────────────────────────────────────────── */}
      {mjMode && (
        <div className="ld-overrides-section">
          <div className="ld-section-title">
            <span>🔑</span> Accès par clan (même si masqué)
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

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="ld-content">

        {/* Public fields */}
        {publicFields.length > 0 && (
          <section className="ld-section">
            <div className="ld-section-title">
              <span>📖</span> Description
              {mjMode && <span className="ld-section-hint">👁 / ◌ contrôle la visibilité joueur</span>}
            </div>
            <div className="ld-fields-grid">
              {publicFields
                .filter(([key]) => mjMode || isFieldVisible(key))
                .map(([key, value]) => (
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

        {mjMode && mjFields.length > 0 && (
          <section className="ld-section ld-section--mj">
            <div className="ld-section-title ld-section-title--mj">
              <span>⚠️</span> Informations MJ
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
  );
};

export default LieuDetail;
