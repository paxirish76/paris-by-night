import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './BourgsTable.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const IMPORTANCE_ORDER = ['critique', 'stratégique', 'strategique', 'majeure', 'forte', 'moyenne', 'mineure', 'naturelle'];
const NO_POLYGON_IDS   = new Set(['dessous-rive-droite', 'dessous-rive-gauche', 'yvelines-essonne']);

function normStr(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ─── Badge helpers ────────────────────────────────────────────────────────────
const TYPE_META = {
  'intra-muros': { cls: 'bt-badge-intra',    label: 'Intra-Muros' },
  'grand-paris': { cls: 'bt-badge-grand',    label: 'Grand Paris'  },
  'souterrain':  { cls: 'bt-badge-souter',   label: 'Souterrain'   },
  'prestige':    { cls: 'bt-badge-prestige', label: 'Prestige'     },
};

function TypeBadge({ type }) {
  const { cls, label } = TYPE_META[type] || { cls: 'bt-badge-intra', label: type };
  return <span className={`bt-badge ${cls}`}>{label}</span>;
}

function ImpBadge({ importance }) {
  const key = normStr(importance).replace(/[^a-z]/g, '');
  return (
    <span className={`bt-imp bt-imp-${key}`}>
      <span className="bt-imp-pip" />
      {importance.charAt(0).toUpperCase() + importance.slice(1)}
    </span>
  );
}

function Richesse({ value }) {
  return (
    <span className="bd-richesse">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`bd-star${i <= value ? ' filled' : ''}`}>★</span>
      ))}
    </span>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────
const BourgDetail = ({ bourg, lieux, clans, onBack, onNavigateToCarte, onNavigateToPersonnage }) => {
  const clan  = clans.find(c => c.id === bourg.clan_dominant_id);
  const color = clan?.couleur || '#d4af37';

  let desc = {};
  try {
    desc = typeof bourg.description === 'string'
      ? JSON.parse(bourg.description)
      : (bourg.description || {});
  } catch (e) { desc = {}; }

  const bourgLieux = lieux.filter(l => l.bourg_id === bourg.id);
  const hasPolygon = !NO_POLYGON_IDS.has(bourg.id);

  const handleMapNav = () => {
    if (hasPolygon) onNavigateToCarte(bourg.id);
  };

  return (
    <div className="bd-page">
      {/* Back */}
      <button className="bd-back" onClick={onBack}>
        <span className="bd-back-arrow">←</span>
        Retour aux Bourgs
      </button>

      {/* ── Hero ── */}
      <div className="bd-hero">
        <div className="bd-hero-left">
          <div className="bd-eyebrow">
            Bourg&nbsp;·&nbsp;
            {(TYPE_META[bourg.type]?.label || bourg.type)}
          </div>

          <div className="bd-nom-row">
            <span
              className={`bd-nom-link${hasPolygon ? ' clickable' : ' no-polygon'}`}
              onClick={handleMapNav}
              title={hasPolygon ? 'Voir sur la carte' : 'Pas de polygone sur la carte'}
            >
              {bourg.nom}
            </span>
            <span
              className={`bd-map-badge${hasPolygon ? '' : ' disabled'}`}
              onClick={handleMapNav}
              title={hasPolygon ? 'Voir sur la carte' : 'Pas de polygone'}
            >
              ↗ Carte
            </span>
          </div>

          <div className="bd-meta-row">
            <div className="bd-meta-item">
              <span className="bd-meta-label">Clan</span>
              <span className="bd-meta-val" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="bd-clan-dot" style={{ background: color, color, boxShadow: `0 0 5px ${color}` }} />
                {clan?.nom || bourg.clan_dominant_id}
              </span>
            </div>
            <span className="bd-sep">·</span>
            <div className="bd-meta-item">
              <span className="bd-meta-label">Type</span>
              <TypeBadge type={bourg.type} />
            </div>
            <span className="bd-sep">·</span>
            <div className="bd-meta-item">
              <span className="bd-meta-label">Importance</span>
              <ImpBadge importance={bourg.importance} />
            </div>
            {desc.richesse && (
              <>
                <span className="bd-sep">·</span>
                <div className="bd-meta-item">
                  <span className="bd-meta-label">Richesse</span>
                  <Richesse value={desc.richesse} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bd-hero-right">
          <div className="bd-bm-label">Bourgmestre</div>
          <div
            className="bd-bm-name"
            onClick={() => onNavigateToPersonnage(bourg.bourgmestre_id)}
            title="Voir la fiche personnage"
          >
            {bourg.bourgmestre}
          </div>
          <div className="bd-bm-hint">↗ Fiche personnage</div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="bd-sections">

        {/* Description */}
        {(desc.ambiance || (desc.activites && desc.activites.length > 0)) && (
          <div className="bd-section">
            <div className="bd-section-head">
              <span className="bd-section-icon">🌑</span>
              <span className="bd-section-title">Description</span>
            </div>
            <div className="bd-section-body">
              <div className="bd-desc-grid">
                {desc.ambiance && (
                  <div className="bd-desc-field">
                    <label>Ambiance</label>
                    <div className="bd-desc-value">{desc.ambiance}</div>
                  </div>
                )}
                {desc.activites && desc.activites.length > 0 && (
                  <div className="bd-desc-field">
                    <label>Activités</label>
                    <div className="bd-activites">
                      {desc.activites.map((a, i) => (
                        <span key={i} className="bd-activite-tag">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Narrative */}
        {bourg.narr_description && (
          <div className="bd-section">
            <div className="bd-section-head">
              <span className="bd-section-icon">⚜️</span>
              <span className="bd-section-title">Récit</span>
            </div>
            <div className="bd-section-body">
              <p className="bd-narr">{bourg.narr_description}</p>
            </div>
          </div>
        )}

        {/* Lieux */}
        <div className="bd-section">
          <div className="bd-section-head">
            <span className="bd-section-icon">🏛️</span>
            <span className="bd-section-title">
              Lieux du bourg
              {bourgLieux.length > 0 && <span className="bd-section-count">{bourgLieux.length}</span>}
            </span>
          </div>
          <div className="bd-section-body">
            {bourgLieux.length === 0 ? (
              <p className="bd-lieux-empty">Aucun lieu référencé dans ce bourg.</p>
            ) : (
              <div className="bd-lieux-list">
                {bourgLieux.map(lieu => {
                  const lieuClan  = clans.find(c => c.id === lieu.clan_id);
                  const lieuColor = lieuClan?.couleur || '#d4af37';
                  const isElys    = (lieu.statut || '').toLowerCase().includes('elysium');
                  return (
                    <div
                      key={lieu.id}
                      className="bd-lieu-row"
                      onClick={() => onNavigateToCarte(null, lieu.id)}
                    >
                      <span
                        className={`bd-lieu-shape ${isElys ? 'diamond' : 'circle'}`}
                        style={{ background: lieuColor, boxShadow: `0 0 5px ${lieuColor}55` }}
                      />
                      <span className="bd-lieu-nom">{lieu.nom}</span>
                      {lieu.statut && <span className="bd-lieu-statut">{lieu.statut}</span>}
                      <span className="bd-lieu-arrow">→</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const BourgsTable = ({ onNavigateToCarte, onNavigateToPersonnage, initialBourgId = null, onInitialBourgConsumed = () => {} }) => {
  const [bourgs,  setBourgs]  = useState([]);
  const [lieux,   setLieux]   = useState([]);
  const [clans,   setClans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Detail view
  const [selectedBourg, setSelectedBourg] = useState(null);

  // List filters & sort
  const [search,          setSearch]          = useState('');
  const [filterClan,      setFilterClan]      = useState('');
  const [filterType,      setFilterType]      = useState('');
  const [filterImportance,setFilterImportance] = useState('');
  const [sortCol,         setSortCol]         = useState('nom');
  const [sortDir,         setSortDir]         = useState(1);

  // ── Fetch ──
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [{ data: clansData }, { data: bourgsData }, { data: lieuxData }] = await Promise.all([
          supabase.from('clans').select('*').order('nom'),
          supabase.from('bourgs').select('*, clan:clans!bourgs_clan_dominant_id_fkey(*)').order('nom'),
          supabase.from('lieux').select('*').order('nom'),
        ]);
        setClans(clansData   || []);
        setBourgs(bourgsData || []);
        setLieux(lieuxData   || []);
      } catch (err) {
        setError(`Erreur de chargement : ${err.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Open detail directly when coming from Carte popup ──
  useEffect(() => {
    if (!initialBourgId || !bourgs.length) return;
    const bourg = bourgs.find(b => b.id === initialBourgId);
    if (bourg) setSelectedBourg(bourg);
    onInitialBourgConsumed();
  }, [initialBourgId, bourgs]);

  // ── Sort handler ──
  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d * -1);
    else { setSortCol(col); setSortDir(1); }
  };

  const sortIcon = (col) => {
    if (sortCol !== col) return <span className="bt-sort-icon">↕</span>;
    return <span className="bt-sort-icon active">{sortDir === 1 ? '↑' : '↓'}</span>;
  };

  // ── Filtered + sorted rows ──
  const rows = (() => {
    let r = bourgs.filter(b => {
      if (filterClan && b.clan_dominant_id !== filterClan) return false;
      if (filterType && b.type !== filterType) return false;
      if (filterImportance && normStr(b.importance) !== normStr(filterImportance)) return false;
      if (search) {
        const hay = normStr((b.nom || '') + (b.bourgmestre || ''));
        if (!hay.includes(normStr(search))) return false;
      }
      return true;
    });
    r.sort((a, b) => {
      if (sortCol === 'importance') {
        const ia = IMPORTANCE_ORDER.findIndex(x => normStr(x) === normStr(a.importance));
        const ib = IMPORTANCE_ORDER.findIndex(x => normStr(x) === normStr(b.importance));
        return sortDir * (ia - ib);
      }
      const va = normStr(a[sortCol] || ''), vb = normStr(b[sortCol] || '');
      return sortDir * va.localeCompare(vb, 'fr');
    });
    return r;
  })();

  // ── Navigate to personnage ──
  const handlePersonnage = (personnageId) => {
    if (onNavigateToPersonnage) onNavigateToPersonnage(personnageId);
  };

  // ── Navigate: bourg → Carte (polygon) or lieu → Carte (marker) ──
  const handleNavigateToCarte = (bourgId, lieuId = null) => {
    if (onNavigateToCarte) onNavigateToCarte(bourgId, lieuId);
  };

  // ── Detail view ──
  if (selectedBourg) {
    return (
      <BourgDetail
        bourg={selectedBourg}
        lieux={lieux}
        clans={clans}
        onBack={() => setSelectedBourg(null)}
        onNavigateToCarte={handleNavigateToCarte}
        onNavigateToPersonnage={handlePersonnage}
      />
    );
  }

  // ── Loading / Error ──
  if (loading) return (
    <div className="bt-page">
      <div className="bt-loading">
        <div className="bt-spinner" />
        <p>Chargement des bourgs…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bt-page">
      <div className="bt-error">{error}</div>
    </div>
  );

  // ── List view ──
  return (
    <div className="bt-page">
      {/* Header */}
      <header className="bt-header">
        <div className="bt-eyebrow">Paris by Night · Camarilla</div>
        <h1 className="bt-title">Bourgs</h1>
        <p className="bt-subtitle">Territoires et seigneuries de la nuit parisienne</p>
        <div className="bt-count">
          Affichage <span>{rows.length}</span> / <span>{bourgs.length}</span> bourgs
        </div>
      </header>

      {/* Filters */}
      <div className="bt-filters">
        <div className="bt-search-wrap">
          <span className="bt-search-icon">⌕</span>
          <input
            className="bt-search"
            type="text"
            placeholder="Rechercher un bourg ou un bourgmestre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="bt-select" value={filterClan} onChange={e => setFilterClan(e.target.value)}>
          <option value="">Tous les clans</option>
          {clans.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>

        <select className="bt-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="intra-muros">Intra-muros</option>
          <option value="grand-paris">Grand Paris</option>
          <option value="souterrain">Souterrain</option>
          <option value="prestige">Prestige</option>
        </select>

        <select className="bt-select" value={filterImportance} onChange={e => setFilterImportance(e.target.value)}>
          <option value="">Toute importance</option>
          <option value="critique">Critique</option>
          <option value="stratégique">Stratégique</option>
          <option value="majeure">Majeure</option>
          <option value="forte">Forte</option>
          <option value="moyenne">Moyenne</option>
          <option value="mineure">Mineure</option>
          <option value="naturelle">Naturelle</option>
        </select>
      </div>

      {/* Table */}
      <div className="bt-table-wrap">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('clan_dominant_id')}>
                Clan {sortIcon('clan_dominant_id')}
              </th>
              <th onClick={() => handleSort('nom')}>
                Bourg {sortIcon('nom')}
              </th>
              <th className="bt-col-type" onClick={() => handleSort('type')}>
                Type {sortIcon('type')}
              </th>
              <th className="bt-col-imp" onClick={() => handleSort('importance')}>
                Importance {sortIcon('importance')}
              </th>
              <th onClick={() => handleSort('bourgmestre')}>
                Bourgmestre {sortIcon('bourgmestre')}
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="bt-empty">Aucun bourg ne correspond à votre recherche.</div>
                </td>
              </tr>
            ) : rows.map(bourg => {
              const clan  = clans.find(c => c.id === bourg.clan_dominant_id);
              const color = clan?.couleur || '#888';
              return (
                <tr key={bourg.id} onClick={() => setSelectedBourg(bourg)}>
                  <td>
                    <div className="bt-clan-cell">
                      <span
                        className="bt-clan-dot"
                        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                      />
                      <span className="bt-clan-name">{clan?.nom || bourg.clan_dominant_id}</span>
                    </div>
                  </td>
                  <td><span className="bt-nom">{bourg.nom}</span></td>
                  <td className="bt-col-type"><TypeBadge type={bourg.type} /></td>
                  <td className="bt-col-imp"><ImpBadge importance={bourg.importance} /></td>
                  <td><span className="bt-bm">{bourg.bourgmestre}</span></td>
                  <td><span className="bt-row-arrow">→</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BourgsTable;
