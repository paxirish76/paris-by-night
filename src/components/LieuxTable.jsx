import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isMJ } from './AuthContext';
import './LieuxTable.css';
import { filterLieux } from '../lieuxRestrictions';

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

const LieuxTable = ({ onNavigateToCarte, playerMode = false, viewerClan = null, mode = 'mj' }) => {
  const mjMode = isMJ(mode);
  const [lieux, setLieux]         = useState([]);
  const [clans, setClans]         = useState([]);
  const [bourgs, setBourgs]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterClan, setFilterClan]     = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [sortField, setSortField] = useState('nom');
  const [sortAsc, setSortAsc]     = useState(true);
  const [toggling, setToggling]   = useState(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [{ data: clansData }, { data: bourgsData }, { data: lieuxData }] = await Promise.all([
          supabase.from('clans').select('*').order('nom'),
          supabase.from('bourgs').select('id, nom').order('nom'),
          supabase.from('lieux').select('*, bourg:bourgs!lieux_bourg_id_fkey(nom)').order('nom'),
        ]);
        setClans(clansData || []);
        setBourgs(bourgsData || []);
        // Enrich lieux with clan nom for sorting
        const clansMap = Object.fromEntries((clansData || []).map(c => [c.id, c]));
        setLieux((lieuxData || []).map(l => ({
          ...l,
          clan_nom:   clansMap[l.clan_id]?.nom || '',
          clan_color: clansMap[l.clan_id]?.couleur || '#666',
        })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      setLieux(prev =>
        prev.map(l => l.id === lieu.id ? { ...l, connu: newVal } : l)
      );
    }
    setToggling(null);
  }, [mjMode]);

  // ── Filter & sort ─────────────────────────────────────────────────────────
  const filtered = filterLieux(lieux, playerMode ? viewerClan || 'joueur' : 'mj')
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

  // ── Navigate to carte ─────────────────────────────────────────────────────
  const handleRowClick = (lieu) => {
    // Pass the lieu id so Carte can fly to it and open its popup/drawer
    onNavigateToCarte(lieu.id);
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
                <th className="lt-th lt-th-connu" title="Visible par les joueurs">👁</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="lt-empty">
                  Aucun lieu ne correspond à la recherche
                </td>
              </tr>
            ) : (
              filtered.map(lieu => {
                const isElysium = (lieu.statut || '').toLowerCase().includes('elysium');
                return (
                  <tr
                    key={lieu.id}
                    className="lt-row"
                    onClick={() => handleRowClick(lieu)}
                    title={`Voir ${lieu.nom} sur la carte`}
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
                          title={lieu.connu ? 'Masquer aux joueurs' : 'Révéler aux joueurs'}
                        >
                          {toggling === lieu.id ? '…' : lieu.connu ? '👁' : '◌'}
                        </button>
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
