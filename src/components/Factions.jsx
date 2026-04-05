import { useState, useEffect } from 'react';
import './Factions.css';

// ── Couleurs par style de faction ─────────────────────────────────────────────

const STYLE_COLORS = {
  conservateur:   '#c9a84c',
  ambitieux:      '#d4537a',
  mondain:        '#9b7fb6',
  progressiste:   '#5b8fc9',
  discret:        '#3a6fb5',
  coercitif:      '#c0392b',
  'neutre actif': '#7d9e7d',
  réformiste:     '#e05c2a',
  radical:        '#cc4466',
};

const REL_CONFIG = {
  alliance: { label: 'Alliance',  icon: '◆', class: 'rel-alliance' },
  tension:  { label: 'Tension',   icon: '◈', class: 'rel-tension'  },
  hostile:  { label: 'Hostile',   icon: '✕', class: 'rel-hostile'  },
  neutre:   { label: 'Neutre',    icon: '·', class: 'rel-neutre'   },
};

const STATUT_CONFIG = {
  npc:     { label: 'NPC',    class: 'ft-badge-npc'  },
  proche:  { label: 'Proche', class: 'ft-badge-proche' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(nom) {
  return nom.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getFactionColor(faction) {
  return STYLE_COLORS[faction.style] || '#888';
}

function buildRelMap(relations) {
  const map = {};
  relations.forEach(r => {
    const [a, b] = r.factions;
    if (!map[a]) map[a] = {};
    if (!map[b]) map[b] = {};
    map[a][b] = r;
    map[b][a] = r;
  });
  return map;
}

// ── Sous-composant : badge membre ─────────────────────────────────────────────

function MembreBadge({ statut }) {
  if (!statut || statut === 'npc') return null;
  const cfg = STATUT_CONFIG[statut];
  if (!cfg) return null;
  return <span className={`ft-badge ${cfg.class}`}>{cfg.label}</span>;
}

// ── Sous-composant : drawer de relation ──────────────────────────────────────

function RelDrawer({ rel, factions }) {
  if (!rel) {
    return (
      <div className="ft-rel-drawer ft-rel-drawer--empty">
        Clique sur une cellule pour voir la nature de la relation.
      </div>
    );
  }
  const cfg = REL_CONFIG[rel.type] || REL_CONFIG.neutre;
  const nomA = factions.find(f => f.id === rel.factions[0])?.nom || rel.factions[0];
  const nomB = factions.find(f => f.id === rel.factions[1])?.nom || rel.factions[1];
  return (
    <div className={`ft-rel-drawer ft-rel-drawer--${rel.type}`}>
      <div className="ft-rel-drawer-head">
        <span className="ft-rel-type-icon">{cfg.icon}</span>
        <strong>{nomA}</strong>
        <span className="ft-rel-arrow">↔</span>
        <strong>{nomB}</strong>
        <span className="ft-rel-type-label">{cfg.label}</span>
      </div>
      <p className="ft-rel-desc">{rel.description}</p>
    </div>
  );
}

// ── Vue : Matrice des relations ───────────────────────────────────────────────

function VueMatrice({ factions, relations, onNavigateToPersonnage, onSelectLieu }) {
  const [activeRel, setActiveRel] = useState(null);
  const [activeFaction, setActiveFaction] = useState(null);
  const relMap = buildRelMap(relations);

  const handleCell = (a, b) => {
    if (a === b) return;
    const rel = relMap[a]?.[b] || { factions: [a, b], type: 'neutre', description: 'Aucune relation documentée — neutralité implicite.' };
    setActiveRel(rel);
    setActiveFaction(null);
  };

  const handleRowHead = (factionId) => {
    setActiveFaction(factionId);
    setActiveRel(null);
  };

  return (
    <div className="ft-matrice-view">
      <div className="ft-matrice-scroll">
        <table className="ft-matrice-table">
          <thead>
            <tr>
              <th className="ft-matrice-corner" />
              {factions.map(f => {
                const color = getFactionColor(f);
                return (
                  <th key={f.id} className="ft-matrice-col-head">
                    <div className="ft-col-head-inner">
                      <span
                        className="ft-col-head-text"
                        style={{ color }}
                      >
                        {f.nom}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {factions.map(rowF => {
              const rowColor = getFactionColor(rowF);
              return (
                <tr key={rowF.id}>
                  <td
                    className="ft-matrice-row-head"
                    style={{ borderLeft: `3px solid ${rowColor}` }}
                    onClick={() => handleRowHead(rowF.id)}
                    title="Voir la fiche faction"
                  >
                    {rowF.nom}
                  </td>
                  {factions.map(colF => {
                    if (rowF.id === colF.id) {
                      return (
                        <td key={colF.id} className="ft-matrice-cell ft-cell-self" />
                      );
                    }
                    const rel = relMap[rowF.id]?.[colF.id];
                    const type = rel?.type || 'neutre';
                    const cfg = REL_CONFIG[type];
                    return (
                      <td
                        key={colF.id}
                        className={`ft-matrice-cell ft-cell-${type}`}
                        onClick={() => handleCell(rowF.id, colF.id)}
                        title={`${rowF.nom} ↔ ${colF.nom}`}
                      >
                        <span className="ft-cell-icon">{cfg.icon}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer — relation ou faction */}
      {activeFaction ? (
        <FactionMiniCard
          faction={factions.find(f => f.id === activeFaction)}
          onClose={() => setActiveFaction(null)}
          onNavigateToPersonnage={onNavigateToPersonnage}
          onSelectLieu={onSelectLieu}
        />
      ) : (
        <RelDrawer rel={activeRel} factions={factions} />
      )}

      {/* Légende */}
      <div className="ft-legend">
        {Object.entries(REL_CONFIG).map(([type, cfg]) => (
          <div key={type} className="ft-legend-item">
            <span className={`ft-legend-dot ft-cell-${type}`}>{cfg.icon}</span>
            <span>{cfg.label}</span>
          </div>
        ))}
        <div className="ft-legend-item ft-legend-tip">
          Clique sur un nom de ligne pour voir la fiche faction
        </div>
      </div>
    </div>
  );
}

// ── Mini-carte faction (dans la matrice) ──────────────────────────────────────

function FactionMiniCard({ faction, onClose, onNavigateToPersonnage, onSelectLieu }) {
  if (!faction) return null;
  const color = getFactionColor(faction);
  const allMembers = [
    ...faction.membres.map(m => ({ ...m, _type: 'membre' })),
    ...(faction.proches || []).map(m => ({ ...m, _type: 'proche' })),
  ];
  return (
    <div className="ft-rel-drawer ft-mini-card">
      <div className="ft-mini-card-head" style={{ borderLeft: `3px solid ${color}` }}>
        <div>
          <strong className="ft-mini-card-nom">{faction.nom}</strong>
          <span className="ft-mini-card-style" style={{ color }}>{faction.style}</span>
        </div>
        <button className="ft-mini-card-close" onClick={onClose}>✕</button>
      </div>
      <p className="ft-mini-card-desc">{faction.description}</p>
      {faction.lieu_de_rencontre && (
        <button
          className="ft-mini-card-lieu ft-mini-card-lieu--btn"
          onClick={() => onSelectLieu?.(faction.lieu_de_rencontre.id)}
          title="Ouvrir la fiche lieu"
        >
          <span className="ft-mini-card-lieu-label">Lieu de rencontre</span>
          <span className="ft-mini-card-lieu-nom">📍 {faction.lieu_de_rencontre.nom}</span>
          <span className="ft-mini-membre-arrow">›</span>
        </button>
      )}
      <div className="ft-mini-themes">
        {faction.themes.map(t => (
          <span key={t} className="ft-theme-pill">{t}</span>
        ))}
      </div>
      {allMembers.length > 0 && (
        <div className="ft-mini-membres">
          <div className="ft-mini-membres-title">Composition</div>
          {allMembers.map(m => {
            const isLeader = m.id === faction.leader_id;
            const isProche = m._type === 'proche';
            return (
              <button
                key={m.id + m._type}
                className={`ft-mini-membre-row ${isProche ? 'ft-mini-membre-row--proche' : ''}`}
                onClick={() => onNavigateToPersonnage?.(m.id)}
                title={m.role}
              >
                <div className="ft-mini-membre-av" style={
                  isProche
                    ? { background: 'transparent', border: `1.5px solid ${color}`, color: color }
                    : { background: color }
                }>
                  {initials(m.nom)}
                </div>
                <div className="ft-mini-membre-info">
                  <span className="ft-mini-membre-nom">
                    {m.nom}
                    {isLeader && <span className="ft-leader-badge">leader</span>}
                    {isProche && <span className="ft-proche-badge">proche</span>}
                  </span>
                  <span className="ft-mini-membre-role">{m.role}</span>
                </div>
                <span className="ft-mini-membre-gen">G{m.generation}</span>
                <span className="ft-mini-membre-arrow">›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Vue : Fiches factions ─────────────────────────────────────────────────────

function VueFiches({ factions, onNavigateToPersonnage, onSelectLieu }) {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId(prev => prev === id ? null : id);

  return (
    <div className="ft-fiches-view">
      {factions.map(faction => {
        const color = getFactionColor(faction);
        const isOpen = openId === faction.id;
        const leader = faction.leader_id
          ? faction.membres.find(m => m.id === faction.leader_id)
          : null;

        return (
          <div key={faction.id} className={`ft-fiche ${isOpen ? 'ft-fiche--open' : ''}`}>
            {/* Header cliquable */}
            <button
              className="ft-fiche-head"
              onClick={() => toggle(faction.id)}
              style={{ '--faction-color': color }}
            >
              <div className="ft-fiche-accent" style={{ background: color }} />
              <div className="ft-fiche-head-body">
                <span className="ft-fiche-nom">{faction.nom}</span>
                <span className="ft-fiche-meta">
                  {faction.style}
                  {leader && <> · {leader.nom}</>}
                  <span className="ft-fiche-count">
                    {faction.membres.length} membres
                    {faction.proches?.length ? ` + ${faction.proches.length} proches` : ''}
                  </span>
                </span>
              </div>
              <span className="ft-fiche-chevron">{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* Corps expandable */}
            {isOpen && (
              <div className="ft-fiche-body">
                {/* Description */}
                <p className="ft-fiche-desc">{faction.description}</p>

                {/* Thèmes */}
                <div className="ft-themes-row">
                  {faction.themes.map(t => (
                    <span key={t} className="ft-theme-pill">{t}</span>
                  ))}
                </div>

                {/* Lieu */}
                {faction.lieu_de_rencontre && (
                  <button
                    className="ft-lieu ft-lieu--btn"
                    onClick={() => onSelectLieu?.(faction.lieu_de_rencontre.id)}
                    title="Ouvrir la fiche lieu"
                  >
                    <span className="ft-lieu-label">Lieu de rencontre</span>
                    <span className="ft-lieu-nom">📍 {faction.lieu_de_rencontre.nom}</span>
                    <span className="ft-membre-arrow">›</span>
                  </button>
                )}

                {/* Membres */}
                <div className="ft-membres-section">
                  <div className="ft-membres-title">Membres</div>
                  <div className="ft-membres-list">
                    {faction.membres.map(m => {
                      const isLeader = m.id === faction.leader_id;
                      const av = initials(m.nom);
                      return (
                        <button
                          key={m.id}
                          className={`ft-membre-row ft-membre-row--btn ${isLeader ? 'ft-membre-row--leader' : ''}`}
                          onClick={() => onNavigateToPersonnage?.(m.id)}
                          title="Ouvrir la fiche personnage"
                        >
                          <div className="ft-membre-av" style={{ background: color }}>
                            {av}
                          </div>
                          <div className="ft-membre-info">
                            <span className="ft-membre-nom">
                              {m.nom}
                              {isLeader && <span className="ft-leader-badge">leader</span>}
                            </span>
                            <span className="ft-membre-role">{m.role}</span>
                          </div>
                          <span className="ft-membre-gen" title="Génération">G{m.generation}</span>
                          <span className="ft-membre-arrow">›</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Proches */}
                {faction.proches?.length > 0 && (
                  <div className="ft-membres-section">
                    <div className="ft-membres-title ft-membres-title--proches">Proches</div>
                    <div className="ft-membres-list ft-membres-list--proches">
                      {faction.proches.map(m => {
                        const av = initials(m.nom);
                        return (
                          <button
                            key={m.id}
                            className="ft-membre-row ft-membre-row--btn ft-membre-row--proche"
                            onClick={() => onNavigateToPersonnage?.(m.id)}
                            title="Ouvrir la fiche personnage"
                          >
                            <div
                              className="ft-membre-av ft-membre-av--proche"
                              style={{ borderColor: color }}
                            >
                              {av}
                            </div>
                            <div className="ft-membre-info">
                              <span className="ft-membre-nom">
                                {m.nom}
                                <span className="ft-proche-badge">proche</span>
                              </span>
                              <span className="ft-membre-role">{m.role}</span>
                            </div>
                            <span className="ft-membre-gen">G{m.generation}</span>
                            <span className="ft-membre-arrow">›</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function Factions({ onNavigateToPersonnage, onSelectLieu }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView]     = useState('matrice'); // 'matrice' | 'fiches'

  useEffect(() => {
    import('../data/paris_factions.json')
      .then(mod => {
        setData(mod.default ?? mod);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="ft-loading">
      <div className="ft-spinner" />
      <p>Chargement des factions…</p>
    </div>
  );

  if (!data) return (
    <div className="ft-loading">
      <p>Fichier factions introuvable.</p>
    </div>
  );

  const { factions, relations } = data;

  return (
    <div className="ft-root">
      <header className="ft-header">
        <div className="ft-header-eyebrow">Paris by Night · MJ</div>
        <h1 className="ft-header-title">Factions &amp; Relations</h1>
        <p className="ft-header-sub">Politique intérieure du Domaine de François Villon</p>

        <div className="ft-view-toggle">
          <button
            className={`ft-toggle-btn ${view === 'matrice' ? 'active' : ''}`}
            onClick={() => setView('matrice')}
          >
            Matrice
          </button>
          <button
            className={`ft-toggle-btn ${view === 'fiches' ? 'active' : ''}`}
            onClick={() => setView('fiches')}
          >
            Fiches
          </button>
        </div>
      </header>

      {view === 'matrice'
        ? <VueMatrice factions={factions} relations={relations} onNavigateToPersonnage={onNavigateToPersonnage} onSelectLieu={onSelectLieu} />
        : <VueFiches factions={factions} onNavigateToPersonnage={onNavigateToPersonnage} onSelectLieu={onSelectLieu} />
      }
    </div>
  );
}
