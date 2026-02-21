import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Genealogie.css';

// ─── TREE BUILDER ─────────────────────────────────────────────────────────────

function buildTree(nodes) {
  const map = {};
  nodes.forEach((n) => (map[n.id] = { ...n, children: [] }));
  const roots = [];
  nodes.forEach((n) => {
    if (n.sire && map[n.sire]) {
      map[n.sire].children.push(map[n.id]);
    } else if (!n.sire || !map[n.sire]) {
      roots.push(map[n.id]);
    }
  });
  // Sort children by generation then name
  function sortChildren(node) {
    node.children.sort((a, b) => a.generation - b.generation || a.nom.localeCompare(b.nom));
    node.children.forEach(sortChildren);
    return node;
  }
  return roots.map(sortChildren);
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose, onNavigate }) {
  if (!node) return null;
  return (
    <div className="genealogie-panel">
      <button className="genealogie-panel-close" onClick={onClose}>✕</button>

      <div className="genealogie-panel-gen">
        {node.generation}ème Génération · {node.clan_id}
      </div>

      <h2 className="genealogie-panel-nom">{node.nom}</h2>

      {node.roles && node.roles.length > 0 && (
        <div className="genealogie-panel-roles">
          {node.roles.map((r, i) => (
            <div key={i} className="genealogie-panel-role">{r}</div>
          ))}
        </div>
      )}

      <div className="genealogie-panel-divider" />

      {node.apparence && (
        <p className="genealogie-panel-text">{node.apparence}</p>
      )}

      <button
        className="genealogie-panel-btn"
        onClick={() => { onNavigate(node.id); onClose(); }}
      >
        Voir la fiche complète →
      </button>
    </div>
  );
}

// ─── NODE ─────────────────────────────────────────────────────────────────────

function TreeNode({ node, onSelect, selectedId }) {
  const isSelected = selectedId === node.id;
  const isGhost = node.ghost;

  return (
    <div className="tree-node-wrapper">
      {/* Card */}
      <div
        className={`tree-card ${isGhost ? 'tree-card--ghost' : ''} ${isSelected ? 'tree-card--selected' : ''}`}
        onClick={() => !isGhost && onSelect(node)}
        title={node.nom}
      >
        <div className="tree-card-gen">GÉN. {node.generation}</div>
        <div className="tree-card-sep" />
        <div className="tree-card-nom">{node.nom}</div>
        {isGhost && <div className="tree-card-detruit">† DÉTRUIT</div>}
      </div>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="tree-children-wrapper">
          <div className="tree-vline-down" />
          <div className="tree-children-row">
            {node.children.map((child, i) => (
              <div key={child.id} className="tree-child-col">
                <div className={`tree-vline-to-child ${child.ghost ? 'tree-vline--ghost' : ''}`} />
                <TreeNode
                  node={child}
                  onSelect={onSelect}
                  selectedId={selectedId}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function Genealogie({ clanId, clanLabel, onNavigateToPersonnage, onBack }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSelected(null);
      const { data, error } = await supabase
        .from('personnages')
        .select('id, nom, clan_id, generation, sire, roles, apparence, ghost')
        .eq('clan_id', clanId)
        .order('generation', { ascending: true });

      if (!error) setNodes(data || []);
      setLoading(false);
    }
    load();
  }, [clanId]);

  const roots = buildTree(nodes);

  return (
    <div className={`genealogie-root ${selected ? 'genealogie-root--panel-open' : ''}`}>

      {/* Header */}
      <div className="genealogie-header">
        <button className="genealogie-back" onClick={onBack}>← Clans</button>
        <div>
          <div className="genealogie-header-sub">Clan {clanLabel} · Lignée de Paris</div>
          <h1 className="genealogie-header-title">Arbre Généalogique</h1>
        </div>
        <div className="genealogie-legend">
          <span className="genealogie-legend-item">
            <span className="genealogie-legend-active" /> Vampire actif
          </span>
          <span className="genealogie-legend-item">
            <span className="genealogie-legend-ghost">†</span> Détruit
          </span>
        </div>
      </div>

      {/* Tree area */}
      <div className="genealogie-canvas">
        {loading ? (
          <div className="genealogie-loading">Chargement de la lignée…</div>
        ) : (
          <div className="genealogie-tree">
            {roots.map((root) => (
              <TreeNode
                key={root.id}
                node={root}
                onSelect={setSelected}
                selectedId={selected?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <DetailPanel
        node={selected}
        onClose={() => setSelected(null)}
        onNavigate={onNavigateToPersonnage}
      />
    </div>
  );
}
