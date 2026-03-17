import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { isMJ } from './AuthContext';
import LieuDetail from './LieuDetail';
import './LieuxTable.css';

const SORT_FIELDS = {
  nom:    (a, b) => a.nom.localeCompare(b.nom, 'fr'),
  statut: (a, b) => (a.statut || '').localeCompare(b.statut || '', 'fr'),
  bourg:  (a, b) => (a.bourg?.nom || '').localeCompare(b.bourg?.nom || '', 'fr'),
  clan:   (a, b) => (a.clan_nom || '').localeCompare(b.clan_nom || '', 'fr'),
};

const SortIcon = ({ field, sortField, sortAsc }) => {
  if (sortField !== field) return <span className="lt-sort-icon neutral">⇅</span>;
  return <span className="lt-sort-icon active">{sortAsc ? '↑' : '↓'}</span>;
};

// ── JoueursDropdown ────────────────────────────────────────────────────────
// Même pattern que PersonnagesTable — X/N + popover avec toggles
const JoueursDropdown = ({ lieu, joueurs, fieldVisibility, onTogglePresence, selectedCampagne }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filteredJoueurs = selectedCampagne
    ? joueurs.filter(j => j.campagne_id === selectedCampagne)
    : joueurs;

  const presentCount = filteredJoueurs.filter(j => fieldVisibility?.[j.id] !== undefined).length;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="lt-joueurs-cell" ref={ref}>
      <button
        className={`lt-joueurs-btn ${presentCount > 0 ? 'lt-joueurs-btn--active' : ''}`}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        title="Gérer la visibilité joueurs"
      >
        {presentCount}/{filteredJoueurs.length}
      </button>

      {open && (
        <div className="lt-joueurs-popover" onClick={e => e.stopPropagation()}>
          <div className="lt-joueurs-popover-header">
            <span>Visibilité joueurs</span>
            <div className="lt-joueurs-popover-actions">
              <button
                className="lt-joueurs-all"
                onClick={() => filteredJoueurs.forEach(j => {
                  if (fieldVisibility?.[j.id] === undefined) onTogglePresence(lieu.id, j.id, false, fieldVisibility);
                })}
              >Tous</button>
              <button
                className="lt-joueurs-none"
                onClick={() => filteredJoueurs.forEach(j => {
                  if (fieldVisibility?.[j.id] !== undefined) onTogglePresence(lieu.id, j.id, true, fieldVisibility);
                })}
              >Aucun</button>
            </div>
          </div>
          <div className="lt-joueurs-list">
            {filteredJoueurs.map(j => {
              const isPresent = fieldVisibility?.[j.id] !== undefined;
              return (
                <div key={j.id} className="lt-joueurs-item">
                  <button
                    className={`lt-joueurs-toggle ${isPresent ? 'on' : 'off'}`}
                    onClick={() => onTogglePresence(lieu.id, j.id, isPresent, fieldVisibility)}
                  >
                    {isPresent ? '👁' : '◌'}
                  </button>
                  <span className="lt-joueurs-nom">{j.nom}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── LieuxTable ─────────────────────────────────────────────────────────────
const LieuxTable = ({
  onNavigateToCarte,
  playerMode = false,
  viewerClan = null,
  mode = 'mj',
  joueur = null,
  selectedCampagne = null,
}) => {
  const mjMode = playerMode ? false : isMJ(mode);
  const isJoueurCampagne = !mjMode && joueur != null;

  const [lieux, setLieux]         = useState([]);
  const [clans, setClans]         = useState([]);
  const [bourgs, setBourgs]       = useState([]);
  const [joueurs, setJoueurs]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterClan, setFilterClan]     = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [sortField, setSortField] = useState('nom');
  const [sortAsc, setSortAsc]     = useState(true);
  const [toggling, setToggling]   = useState(null);
  const [selectedLieuId, setSelectedLieuId] = useState(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const queries = [
          supabase.from('clans').select('*').order('nom'),
          supabase.from('bourgs').select('id, nom').order('nom'),
          supabase.from('lieux').select('*, bourg:bourgs!lieux_bourg_id_fkey(nom), field_visibility').order('nom'),
        ];
        if (mjMode) {
          queries.push(supabase.from('joueurs').select('id, nom, campagne_id, clan_id').order('nom'));
        }
        const results = await Promise.all(queries);
        const [{ data: clansData }, { data: bourgsData }, { data: lieuxData }] = results;
        setClans(clansData || []);
        setBourgs(bourgsData || []);
        const clansMap = Object.fromEntries((clansData || []).map(c => [c.id, c]));
        setLieux((lieuxData || []).map(l => ({
          ...l,
          clan_nom:   clansMap[l.clan_id]?.nom || '',
          clan_color: clansMap[l.clan_id]?.couleur || '#666',
        })));
        if (mjMode) {
          setJoueurs(results[3]?.data || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [mjMode]);

  // ── Toggle connu (MJ only) ─────────────────────────────────────────────────
  const toggleConnu = useCallback(async (e, lieu) => {
    e.stopPropagation();
    if (!mjMode) return;
    const newVal = !lieu.connu;
    setToggling(lieu.id);
    const { error } = await supabase
      .from('lieux')
      .update({ connu: newVal })
      .eq('id', lieu.id);
    if (!error) {
      setLieux(prev => prev.map(l => l.id === lieu.id ? { ...l, connu: newVal } : l));
    }
    setToggling(null);
  }, [mjMode]);

  // ── Toggle présence joueur (depuis dropdown) ───────────────────────────────
  const toggleJoueurPresence = useCallback(async (lieuId, joueurId, isPresent, currentFv) => {
    let next;
    if (isPresent) {
      next = { ...(currentFv || {}) };
      delete next[joueurId];
    } else {
      next = { ...(currentFv || {}), [joueurId]: {} };
    }
    const { error } = await supabase.from('lieux').update({ field_visibility: next }).eq('id', lieuId);
    if (!error) {
      setLieux(prev => prev.map(l => l.id === lieuId ? { ...l, field_visibility: next } : l));
    }
  }, []);

  // ── Filter & sort ─────────────────────────────────────────────────────────
  const filtered = (() => {
    let base;
    if (mjMode) {
      base = lieux;
    } else if (isJoueurCampagne) {
      // Campagne joueur : seulement les lieux où joueur.id est clé dans field_visibility
      base = lieux.filter(l => {
        const fv = l.field_visibility || {};
        return joueur.id in fv;
      });
    } else {
      // Clan player : connu ou clan_overrides
      base = lieux.filter(l => {
        if (viewerClan && (l.clan_overrides || []).includes(viewerClan)) return true;
        return l.connu;
      });
    }
    return base
      .filter(l => {
        const q = search.toLowerCase();
        if (q && !l.nom.toLowerCase().includes(q) &&
                 !(l.statut || '').toLowerCase().includes(q) &&
                 !(l.bourg?.nom || '').toLowerCase().includes(q) &&
                 !(l.clan_nom || '').toLowerCase().includes(q)) return false;
        if (filterClan && l.clan_id !== filterClan) return false;
        if (filterStatut === 'elysium' && !(l.statut || '').toLowerCase().includes('elysium')) return false;
        if (filterStatut === 'autre'   &&  (l.statut || '').toLowerCase().includes('elysium')) return false;
        return true;
      })
      .sort((a, b) => {
        const cmp = SORT_FIELDS[sortField]?.(a, b) ?? 0;
        return sortAsc ? cmp : -cmp;
      });
  })();

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(v => !v);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleReset = () => {
    setSearch('');
    setFilterClan('');
    setFilterStatut('');
    setSortField('nom');
    setSortAsc(true);
  };

  const isDirty = search || filterClan || filterStatut || sortField !== 'nom' || !sortAsc;

  // ── Navigate to detail ────────────────────────────────────────────────────
  const handleRowClick = (lieu) => setSelectedLieuId(lieu.id);

  const handleOpenCarte = (lieuId) => {
    setSelectedLieuId(null);
    onNavigateToCarte(lieuId);
  };

  // ── Filtered joueurs for dropdown (par campagne sélectionnée) ─────────────
  const filteredJoueurs = selectedCampagne
    ? joueurs.filter(j => j.campagne_id === selectedCampagne)
    : joueurs;

  // ── Render detail ─────────────────────────────────────────────────────────
  if (selectedLieuId) return (
    <LieuDetail
      lieuId={selectedLieuId}
      onClose={() => setSelectedLieuId(null)}
      onNavigateToCarte={handleOpenCarte}
      playerMode={playerMode}
      viewerClan={viewerClan}
      joueur={joueur}
      selectedCampagne={selectedCampagne}
    />
  );

  // ── Render table ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="lt-loading">
      <div className="lt-spinner" />
      <p>Chargement des lieux...</p>
    </div>
  );

  return (
    <div className="lt-container">
      <div className="lt-header">
        <div className="lt-header-text">
          <h1>Lieux de Paris</h1>
          <p>Sites & Domaines Vampiriques</p>
        </div>
        <div className="lt-counter">
          {filtered.length} / {lieux.length} <span>Lieux</span>
        </div>
      </div>

      {/* Controls */}
      <div className="lt-controls">
        <div className="lt-search-wrap">
          <span className="lt-search-icon">🔍</span>
          <input
            className="lt-search"
            type="text"
            placeholder="Rechercher un lieu, bourg, clan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="lt-clear-search" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <select
          className="lt-select"
          value={filterClan}
          onChange={e => setFilterClan(e.target.value)}
        >
          <option value="">Tous les clans</option>
          {clans.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>

        <select
          className="lt-select"
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="elysium">Elysiums ♦</option>
          <option value="autre">Autres lieux ●</option>
        </select>

        {isDirty && (
          <button className="lt-reset" onClick={handleReset}>
            ↺ Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="lt-table-wrap">
        <table className="lt-table">
          <thead>
            <tr>
              <th className="lt-th lt-th-icon" />
              <th className="lt-th lt-th-nom" onClick={() => handleSort('nom')}>
                Nom <SortIcon field="nom" sortField={sortField} sortAsc={sortAsc} />
              </th>
              <th className="lt-th lt-th-statut" onClick={() => handleSort('statut')}>
                Statut <SortIcon field="statut" sortField={sortField} sortAsc={sortAsc} />
              </th>
              <th className="lt-th lt-th-bourg" onClick={() => handleSort('bourg')}>
                Bourg <SortIcon field="bourg" sortField={sortField} sortAsc={sortAsc} />
              </th>
              <th className="lt-th lt-th-clan" onClick={() => handleSort('clan')}>
                Clan <SortIcon field="clan" sortField={sortField} sortAsc={sortAsc} />
              </th>
              {mjMode && (
                <th className="lt-th lt-th-connu" title="Visible par les joueurs clan">👁</th>
              )}
              {mjMode && (
                <th className="lt-th lt-th-joueurs" title="Visibilité joueurs campagne">👥</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={mjMode ? 7 : 5} className="lt-empty">
                  Aucun lieu ne correspond à la recherche
                </td>
              </tr>
            ) : (
              filtered.map(lieu => {
                const isElysium = (lieu.statut || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('elysium');
                return (
                  <tr
                    key={lieu.id}
                    className="lt-row"
                    onClick={() => handleRowClick(lieu)}
                  >
                    {/* Shape marker */}
                    <td className="lt-td lt-td-icon">
                      {isElysium
                        ? <span className="lt-shape diamond" style={{ background: lieu.clan_color, boxShadow: `0 0 6px ${lieu.clan_color}88` }} />
                        : <span className="lt-shape circle"  style={{ background: lieu.clan_color, boxShadow: `0 0 6px ${lieu.clan_color}88` }} />
                      }
                    </td>

                    {/* Nom */}
                    <td className="lt-td lt-td-nom">
                      <span className="lt-nom" style={{ color: lieu.clan_color }}>{lieu.nom}</span>
                      {lieu.adresse && <span className="lt-adresse">{lieu.adresse}</span>}
                    </td>

                    {/* Statut */}
                    <td className="lt-td lt-td-statut">
                      {lieu.statut
                        ? <span className="lt-statut-badge" style={{ borderColor: lieu.clan_color, color: lieu.clan_color }}>
                            {lieu.statut}
                          </span>
                        : <span className="lt-empty-cell">—</span>
                      }
                    </td>

                    {/* Bourg */}
                    <td className="lt-td lt-td-bourg">
                      <span className="lt-bourg">{lieu.bourg?.nom || '—'}</span>
                    </td>

                    {/* Clan */}
                    <td className="lt-td lt-td-clan">
                      <span className="lt-clan-badge" style={{ background: `${lieu.clan_color}22`, borderColor: `${lieu.clan_color}66`, color: lieu.clan_color }}>
                        {lieu.clan_nom || '—'}
                      </span>
                    </td>

                    {/* MJ toggle connu */}
                    {mjMode && (
                      <td className="lt-td lt-td-connu" onClick={e => toggleConnu(e, lieu)}>
                        <button
                          className={`lt-connu-toggle ${lieu.connu ? 'lt-connu-toggle--on' : ''}`}
                          disabled={toggling === lieu.id}
                          title={lieu.connu ? 'Masquer aux joueurs clan' : 'Révéler aux joueurs clan'}
                        >
                          {toggling === lieu.id ? '…' : lieu.connu ? '👁' : '◌'}
                        </button>
                      </td>
                    )}

                    {/* MJ joueurs dropdown */}
                    {mjMode && (
                      <td className="lt-td lt-td-joueurs" onClick={e => e.stopPropagation()}>
                        <JoueursDropdown
                          lieu={lieu}
                          joueurs={filteredJoueurs}
                          fieldVisibility={lieu.field_visibility || {}}
                          onTogglePresence={toggleJoueurPresence}
                          selectedCampagne={selectedCampagne}
                        />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LieuxTable;
