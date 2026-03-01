import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isMJ } from './AuthContext';
import './PersonnagesTable.css';

const SORT_FIELDS = {
  nom:        (a, b) => a.nom.localeCompare(b.nom, 'fr'),
  clan:       (a, b) => (a.clan_nom || '').localeCompare(b.clan_nom || '', 'fr'),
  generation: (a, b) => (a.generation || 99) - (b.generation || 99),
};

const SortIcon = ({ field, sortField, sortAsc }) => {
  if (sortField !== field) return <span className="pt-sort-icon neutral">⇅</span>;
  return <span className="pt-sort-icon active">{sortAsc ? '↑' : '↓'}</span>;
};

export default function PersonnagesTable({
  onSelectPersonnage,
  mode = 'mj',
  viewerClan = null,
  playerMode = false,
}) {
  const [personnages, setPersonnages] = useState([]);
  const [clans, setClans]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterClan, setFilterClan]   = useState('');
  const [filterConnu, setFilterConnu] = useState('');   // '' | 'connu' | 'inconnu' (MJ only)
  const [sortField, setSortField]     = useState('clan');
  const [sortAsc, setSortAsc]         = useState(true);
  const [toggling, setToggling]       = useState(null); // id being toggled

  const mjMode = isMJ(mode) && !playerMode;

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: clansData }, { data: persoData }] = await Promise.all([
        supabase.from('clans').select('id, nom, couleur').order('nom'),
        supabase.from('personnages')
          .select('id, nom, clan_id, generation, roles, ghost, connu, image_url')
          .eq('ghost', false)
          .order('generation', { ascending: true }),
      ]);

      const clansMap = Object.fromEntries((clansData || []).map(c => [c.id, c]));
      setClans(clansData || []);
      setPersonnages((persoData || []).map(p => ({
        ...p,
        clan_nom:   clansMap[p.clan_id]?.nom    || '',
        clan_color: clansMap[p.clan_id]?.couleur || '#888',
      })));
      setLoading(false);
    })();
  }, []);

  // ── Toggle connu (MJ only) ─────────────────────────────────────────────────
  const toggleConnu = useCallback(async (e, personnage) => {
    e.stopPropagation(); // don't open the detail
    if (!mjMode) return;
    const newVal = !personnage.connu;
    setToggling(personnage.id);
    const { error } = await supabase
      .from('personnages')
      .update({ connu: newVal })
      .eq('id', personnage.id);
    if (!error) {
      setPersonnages(prev =>
        prev.map(p => p.id === personnage.id ? { ...p, connu: newVal } : p)
      );
    }
    setToggling(null);
  }, [mjMode]);

  // ── Filter & sort ──────────────────────────────────────────────────────────
  const filtered = personnages
    .filter(p => {
      // Invité (viewerClan=null) : uniquement connu=true
      // Joueur clan : son clan + connu=true
      if (!mjMode) {
        if (viewerClan && p.clan_id === viewerClan) return true;
        if (!p.connu) return false;
      }

      const q = search.toLowerCase();
      if (q && !p.nom.toLowerCase().includes(q) &&
               !(p.clan_nom || '').toLowerCase().includes(q)) return false;

      if (filterClan && p.clan_id !== filterClan) return false;

      // MJ-only filters
      if (mjMode) {
        if (filterConnu === 'connu'   && !p.connu)  return false;
        if (filterConnu === 'inconnu' &&  p.connu)  return false;
      }

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
    setFilterConnu('');
    setSortField('clan');
    setSortAsc(true);
  };

  const isDirty = search || filterClan || filterConnu || sortField !== 'clan' || !sortAsc;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="pt-loading">
      <div className="pt-spinner" />
      <p>Chargement des personnages...</p>
    </div>
  );

  return (
    <div className="pt-container">
      <div className="pt-header">
        <div className="pt-header-text">
          <h1>Personnages</h1>
          <p>{mjMode ? 'Tous les vampires de Paris' : 'Vampires connus'}</p>
        </div>
        <div className="pt-counter">
          {filtered.length} / {personnages.length} <span>Personnages</span>
        </div>
      </div>

      {/* Controls */}
      <div className="pt-controls">
        <div className="pt-search-wrap">
          <span className="pt-search-icon">🔍</span>
          <input
            className="pt-search"
            type="text"
            placeholder="Rechercher un nom, clan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="pt-clear-search" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <select
          className="pt-select"
          value={filterClan}
          onChange={e => setFilterClan(e.target.value)}
        >
          <option value="">Tous les clans</option>
          {clans.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>

        {/* MJ only: filter by connu status */}
        {mjMode && (
          <select
            className="pt-select"
            value={filterConnu}
            onChange={e => setFilterConnu(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="connu">✓ Connus des joueurs</option>
            <option value="inconnu">◌ Inconnus</option>
          </select>
        )}

        {isDirty && (
          <button className="pt-reset" onClick={handleReset}>↺ Réinitialiser</button>
        )}
      </div>

      {/* Table */}
      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr>
              <th className="pt-th pt-th-icon" />
              <th className="pt-th pt-th-nom" onClick={() => handleSort('nom')}>
                Nom <SortIcon field="nom" sortField={sortField} sortAsc={sortAsc} />
              </th>
              <th className="pt-th pt-th-clan" onClick={() => handleSort('clan')}>
                Clan <SortIcon field="clan" sortField={sortField} sortAsc={sortAsc} />
              </th>
              <th className="pt-th pt-th-gen" onClick={() => handleSort('generation')}>
                Gén. <SortIcon field="generation" sortField={sortField} sortAsc={sortAsc} />
              </th>
              <th className="pt-th pt-th-roles">Rôles</th>
              {/* MJ only: connu toggle column */}
              {mjMode && (
                <th className="pt-th pt-th-connu" title="Visible par les joueurs">👁</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={mjMode ? 6 : 5} className="pt-empty">
                  Aucun personnage ne correspond
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr
                  key={p.id}
                  className={`pt-row ${p.connu ? 'pt-row--connu' : ''}`}
                  onClick={() => onSelectPersonnage(p.id)}
                >
                  {/* Portrait thumbnail */}
                  <td className="pt-td pt-td-icon">
                    <div
                      className="pt-avatar"
                      style={{ borderColor: p.clan_color }}
                    >
                      {p.image_url
                        ? <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/personnages/${p.image_url}`}
                            alt={p.nom}
                          />
                        : <span className="pt-avatar-placeholder">🧛</span>
                      }
                    </div>
                  </td>

                  {/* Nom */}
                  <td className="pt-td pt-td-nom">
                    <span className="pt-nom" style={{ color: p.clan_color }}>
                      {p.nom}
                    </span>
                  </td>

                  {/* Clan */}
                  <td className="pt-td pt-td-clan">
                    <span
                      className="pt-clan-badge"
                      style={{ background: `${p.clan_color}22`, borderColor: `${p.clan_color}66`, color: p.clan_color }}
                    >
                      {p.clan_nom}
                    </span>
                  </td>

                  {/* Génération */}
                  <td className="pt-td pt-td-gen">
                    <span className="pt-gen">{p.generation}ème</span>
                  </td>

                  {/* Rôles */}
                  <td className="pt-td pt-td-roles">
                    <div className="pt-roles">
                      {(p.roles || []).slice(0, 2).map((r, i) => (
                        <span key={i} className="pt-role-badge">{r}</span>
                      ))}
                      {(p.roles || []).length > 2 && (
                        <span className="pt-role-more">+{p.roles.length - 2}</span>
                      )}
                    </div>
                  </td>

                  {/* MJ toggle connu */}
                  {mjMode && (
                    <td className="pt-td pt-td-connu" onClick={e => toggleConnu(e, p)}>
                      <button
                        className={`pt-connu-toggle ${p.connu ? 'pt-connu-toggle--on' : ''}`}
                        disabled={toggling === p.id}
                        title={p.connu ? 'Masquer aux joueurs' : 'Révéler aux joueurs'}
                      >
                        {toggling === p.id ? '…' : p.connu ? '👁' : '◌'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
