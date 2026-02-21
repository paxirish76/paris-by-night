import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './ClansTable.css';

/* ── helpers ─────────────────────────────────────────── */
const STORAGE = 'https://jjmiaoodkuwmbrplskif.supabase.co/storage/v1/object/public';
const CLANS_AVEC_ARBRE = ['toreador', 'ventrue', 'brujah', 'nosferatu', 'malkavian'];


// Supabase may return JSON columns as already-parsed arrays OR as strings.
// This handles both cases safely without throwing.
function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

function ClanLogo({ url, nom, couleur, size = 48 }) {
  if (!url) {
    return (
      <div
        className="ct-logo-placeholder"
        style={{ width: size, height: size, borderColor: couleur }}
      >
        {nom?.[0]}
      </div>
    );
  }
  return (
    <div
      className="ct-logo-wrap"
      style={{ width: size, height: size, '--clan-color': couleur }}
    >
      <img src={url} alt={nom} width={size} height={size} />
    </div>
  );
}

function PopBar({ value, max, couleur }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="ct-popbar">
      <div
        className="ct-popbar-fill"
        style={{ width: `${pct}%`, background: couleur }}
      />
      <span className="ct-popbar-label">{value}</span>
    </div>
  );
}

/* ── Relation chip ───────────────────────────────────── */
function RelChip({ rel, clans, onClick }) {
  const clan = clans.find(c => c.id === rel.id);
  return (
    <button
      className="cd-rel-chip"
      style={{ '--chip-color': clan?.couleur ?? '#888' }}
      onClick={() => onClick(rel.id)}
      title={rel.text}
    >
      {clan && clan.icon_url && (
        <span className="cd-rel-chip-icon">
          <img src={clan.icon_url} alt={clan.nom} />
        </span>
      )}
      <span className="cd-rel-chip-name">{clan?.nom ?? rel.id}</span>
      <span className="cd-rel-chip-text">{rel.text}</span>
    </button>
  );
}

/* ── Detail view ─────────────────────────────────────── */
function ClanDetail({ clan, clans, onBack, onSelectClan, onNavigateToGenealogie }) {
  const buts = safeArray(clan.buts);
  const relations = safeArray(clan.relation);

  return (
    <div className="cd-root">
      <button className="cd-back" onClick={onBack}>
        ← Retour aux clans
      </button>

      <div className="cd-hero" style={{ '--clan-color': clan.couleur }}>
        <div className="cd-hero-logo">
          <ClanLogo url={clan.icon_url} nom={clan.nom} couleur={clan.couleur} size={120} />
        </div>
        <div className="cd-hero-info">
          <p className="cd-hero-eyebrow">Clan</p>
          <h1 className="cd-hero-name">{clan.nom}</h1>
          <div className="cd-hero-pop">
            <span className="cd-hero-pop-label">Population</span>
            <span className="cd-hero-pop-val" style={{ color: clan.couleur }}>
              {clan.population}
            </span>
          </div>
        </div>
        <div className="cd-hero-bar" style={{ background: clan.couleur }} />
      </div>

      {clan.description && (
        <section className="cd-section">
          <h2 className="cd-section-title">Description</h2>
          <p className="cd-desc">{clan.description}</p>
        </section>
      )}

      {buts.length > 0 && (
        <section className="cd-section">
          <h2 className="cd-section-title">Objectifs</h2>
          <ul className="cd-buts">
            {buts.map((b, i) => (
              <li key={i} className="cd-but-item">
                <span className="cd-but-bullet" style={{ color: clan.couleur }}>◆</span>
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      {CLANS_AVEC_ARBRE.includes(clan.id) && (
        <section className="cd-section">
          <button
            className="cd-genealogie-btn"
            onClick={() => onNavigateToGenealogie(clan.id, clan.nom)}
          >
            Arbre généalogique →
          </button>
        </section>
      )}

      {relations.length > 0 && (
        <section className="cd-section">
          <h2 className="cd-section-title">Relations avec les autres clans</h2>
          <div className="cd-relations">
            {relations.map(rel => (
              <RelChip
                key={rel.id}
                rel={rel}
                clans={clans}
                onClick={onSelectClan}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────── */
export default function ClansTable({ onNavigateToGenealogie }) {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClan, setSelectedClan] = useState(null);
  const [sortKey, setSortKey] = useState('nom');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    supabase
      .from('clans')
      .select('*')
      .order('nom')
      .then(({ data }) => {
        setClans((data ?? []).filter(c => c.id !== 'mortel'));
        setLoading(false);
      });
  }, []);

  const maxPop = Math.max(...clans.map(c => c.population ?? 0), 1);

  const sorted = [...clans].sort((a, b) => {
    let va = a[sortKey] ?? '';
    let vb = b[sortKey] ?? '';
    if (sortKey === 'population') { va = +va; vb = +vb; }
    else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); }
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="ct-sort-icon ct-sort-none">⇅</span>;
    return <span className="ct-sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return <div className="ct-loading">Chargement des clans…</div>;
  }

  if (selectedClan) {
    return (
      <ClanDetail
        clan={selectedClan}
        clans={clans}
        onBack={() => setSelectedClan(null)}
        onSelectClan={(id) => {
          const c = clans.find(x => x.id === id);
          if (c) setSelectedClan(c);
        }}
        onNavigateToGenealogie={onNavigateToGenealogie}
      />
    );
  }

  return (
    <div className="ct-root">
      <div className="ct-header">
        <h1 className="ct-title">Clans de Paris</h1>
        <p className="ct-subtitle">
          {clans.filter(c => c.population > 0).length} clans actifs ·{' '}
          {clans.reduce((s, c) => s + (c.population ?? 0), 0)} vampires recensés
        </p>
      </div>

      <table className="ct-table">
        <thead>
          <tr>
            <th className="ct-th ct-th-logo" />
            <th className="ct-th ct-th-nom" onClick={() => handleSort('nom')}>
              Clan <SortIcon col="nom" />
            </th>
            <th className="ct-th ct-th-pop" onClick={() => handleSort('population')}>
              Population <SortIcon col="population" />
            </th>
            <th className="ct-th ct-th-desc">Aperçu</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(clan => (
            <tr
              key={clan.id}
              className="ct-row"
              onClick={() => setSelectedClan(clan)}
              style={{ '--clan-color': clan.couleur }}
            >
              <td className="ct-td ct-td-logo">
                <ClanLogo url={clan.icon_url} nom={clan.nom} couleur={clan.couleur} size={40} />
              </td>
              <td className="ct-td ct-td-nom">
                <span className="ct-clan-name">{clan.nom}</span>
              </td>
              <td className="ct-td ct-td-pop">
                <PopBar value={clan.population ?? 0} max={maxPop} couleur={clan.couleur} />
              </td>
              <td className="ct-td ct-td-desc">
                {clan.description
                  ? clan.description.slice(0, 100) + (clan.description.length > 100 ? '…' : '')
                  : <span className="ct-no-desc">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
