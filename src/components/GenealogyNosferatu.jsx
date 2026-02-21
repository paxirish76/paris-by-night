import { useState } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const NODES = [
  {
    id: "l-ermite",
    nom: "L'Ermite",
    generation: 4,
    sire: null,
    ghost: false,
    roles: ["Maître de l'Information", "Gardien du Statu Quo"],
    image_url: "l-ermite.jpg",
  },
  {
    id: "gerard-le-muet",
    nom: "Gérard le Muet",
    generation: 5,
    sire: "l-ermite",
    ghost: false,
    roles: ["Primogène Nosferatu", "Roi de la Cour des Miracles"],
    image_url: "gerard-le-muet.jpg",
  },
  {
    id: "etienne-le-manchot",
    nom: "Étienne le Manchot",
    generation: 6,
    sire: "gerard-le-muet",
    ghost: false,
    roles: ["Gardien des Tréfonds Rive Nord"],
    image_url: "etienne-le-manchot.jpg",
  },
  {
    id: "louise-francoise-la-repentie",
    nom: "Louise-Françoise de la Vallière",
    generation: 6,
    sire: "gerard-le-muet",
    ghost: false,
    roles: ["Bourgmestre du Sous-sol Rive Gauche"],
    image_url: "louise-francoise-la-repentie.jpg",
  },
  {
    id: "marc-antoine-le-compilateur",
    nom: "Marc-Antoine Bréguet",
    generation: 7,
    sire: "etienne-le-manchot",
    ghost: false,
    roles: ["Architecte du Réseau Souterrain"],
    image_url: "marc-antoine-le-compilateur.jpg",
  },
  {
    id: "gregoire-le-scelle",
    nom: "Grégoire le Scellé",
    generation: 7,
    sire: "etienne-le-manchot",
    ghost: true,
    roles: ["Détruit"],
    image_url: null,
  },
  {
    id: "aristide-lecoq",
    nom: 'Aristide "Gueule d\'Acier" Lecoq',
    generation: 7,
    sire: "louise-francoise-la-repentie",
    ghost: false,
    roles: ["Bourgmestre du Nord-Est"],
    image_url: "aristide-lecoq.jpg",
  },
  {
    id: "barthelemy-le-confesseur",
    nom: "Barthélemy-le-confesseur",
    generation: 7,
    sire: "louise-francoise-la-repentie",
    ghost: true,
    roles: ["Détruit"],
    image_url: null,
  },
  {
    id: "thomas-verne-le-cableur",
    nom: "Thomas Verne",
    generation: 8,
    sire: "gregoire-le-scelle",
    ghost: false,
    roles: ["Ange Gardien du Bitume"],
    image_url: "thomas-verne-le-cableur.jpg",
  },
  {
    id: "octave-de-saint-aubin",
    nom: "Octave de Saint-Aubin",
    generation: 8,
    sire: "barthelemy-le-confesseur",
    ghost: false,
    roles: ["Maître du Renseignement Traditionnel"],
    image_url: "octave-de-saint-aubin.jpg",
  },
  {
    id: "yanis-root-le-fantome",
    nom: "Yanis Benmansour",
    generation: 9,
    sire: "thomas-verne-le-cableur",
    ghost: false,
    roles: ["Spécialiste en Intrusion Numérique"],
    image_url: "yanis-root-le-fantome.jpg",
  },
  {
    id: "virginia-oldoini",
    nom: "Virginia Oldoini",
    generation: 9,
    sire: "octave-de-saint-aubin",
    ghost: false,
    roles: ["Comtesse de Castiglione", "Mémoire esthétique"],
    image_url: "virginia-oldoini.jpg",
  },
  {
    id: "lucien-morel-l-objectif",
    nom: "Lucien Morel",
    generation: 10,
    sire: "virginia-oldoini",
    ghost: false,
    roles: ["Documentariste de l'Oubli"],
    image_url: "lucien-morel-l-objectif.jpg",
  },
];

// ─── TREE BUILDER ─────────────────────────────────────────────────────────────

function buildTree(nodes) {
  const map = {};
  nodes.forEach((n) => (map[n.id] = { ...n, children: [] }));
  const roots = [];
  nodes.forEach((n) => {
    if (n.sire && map[n.sire]) {
      map[n.sire].children.push(map[n.id]);
    } else if (!n.sire) {
      roots.push(map[n.id]);
    }
  });
  return roots;
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose }) {
  if (!node) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 340,
        height: "100vh",
        background: "linear-gradient(180deg, #0d1117 0%, #111820 100%)",
        borderLeft: "1px solid #1e3a2f",
        padding: "2rem 1.5rem",
        overflowY: "auto",
        zIndex: 100,
        boxShadow: "-8px 0 40px rgba(0,0,0,0.6)",
        fontFamily: "'Crimson Text', Georgia, serif",
        color: "#c8bfaa",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          background: "none",
          border: "1px solid #1e3a2f",
          color: "#4a7c5f",
          cursor: "pointer",
          fontSize: "1.1rem",
          padding: "0.2rem 0.6rem",
          fontFamily: "inherit",
        }}
      >
        ✕
      </button>

      {/* Generation badge */}
      <div
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#4a7c5f",
          marginBottom: "0.5rem",
        }}
      >
        {node.generation}ème Génération
      </div>

      {/* Name */}
      <h2
        style={{
          fontSize: "1.4rem",
          color: "#e8d5a3",
          margin: "0 0 0.25rem 0",
          lineHeight: 1.2,
          fontWeight: 600,
        }}
      >
        {node.nom}
      </h2>

      {/* Roles */}
      <div style={{ marginBottom: "1.5rem" }}>
        {node.roles.map((r, i) => (
          <div
            key={i}
            style={{
              fontSize: "0.8rem",
              color: "#4a7c5f",
              fontStyle: "italic",
              marginBottom: "0.15rem",
            }}
          >
            {r}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid #1e3a2f",
          marginBottom: "1.5rem",
        }}
      />

      <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "#9aa89e" }}>
        Cliquez sur un personnage pour consulter sa fiche complète.
      </p>
    </div>
  );
}

// ─── NODE COMPONENT ───────────────────────────────────────────────────────────

function TreeNode({ node, onSelect, selectedId, depth = 0 }) {
  const isSelected = selectedId === node.id;
  const isGhost = node.ghost;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Node bubble */}
      <div
        onClick={() => !isGhost && onSelect(node)}
        title={node.nom}
        style={{
          width: isGhost ? 64 : 80,
          height: isGhost ? 64 : 80,
          borderRadius: "50%",
          border: isGhost
            ? "1px dashed #2a3a30"
            : isSelected
            ? "2px solid #e8d5a3"
            : "1px solid #1e3a2f",
          background: isGhost
            ? "transparent"
            : isSelected
            ? "linear-gradient(135deg, #1a2e22, #0d1e16)"
            : "linear-gradient(135deg, #0f1e17, #0a1510)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: isGhost ? "default" : "pointer",
          transition: "all 0.2s ease",
          position: "relative",
          flexShrink: 0,
          boxShadow: isSelected
            ? "0 0 20px rgba(232, 213, 163, 0.15)"
            : isGhost
            ? "none"
            : "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        {isGhost ? (
          <>
            {/* Skull / destroyed icon */}
            <div style={{ fontSize: "1.4rem", opacity: 0.4 }}>†</div>
            <div
              style={{
                fontSize: "0.45rem",
                color: "#2a3a30",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                textAlign: "center",
                lineHeight: 1.2,
                padding: "0 4px",
              }}
            >
              Détruit
            </div>
          </>
        ) : (
          <>
            {/* Generation ring */}
            <div
              style={{
                fontSize: "0.55rem",
                color: isSelected ? "#e8d5a3" : "#4a7c5f",
                letterSpacing: "0.05em",
                marginBottom: "2px",
              }}
            >
              GÉN. {node.generation}
            </div>
            {/* Initials */}
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: isSelected ? "#e8d5a3" : "#c8bfaa",
                fontFamily: "'Crimson Text', Georgia, serif",
                lineHeight: 1,
              }}
            >
              {node.nom
                .replace(/^(L'|Le |La |Les )/, "")
                .charAt(0)
                .toUpperCase()}
            </div>
          </>
        )}
      </div>

      {/* Name label */}
      <div
        style={{
          marginTop: "0.4rem",
          textAlign: "center",
          maxWidth: 110,
          fontSize: "0.65rem",
          lineHeight: 1.3,
          color: isGhost ? "#2a3a30" : isSelected ? "#e8d5a3" : "#7a9080",
          fontFamily: "'Crimson Text', Georgia, serif",
          fontStyle: isGhost ? "italic" : "normal",
        }}
      >
        {node.nom}
      </div>

      {/* Children connector + row */}
      {node.children && node.children.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Vertical line down */}
          <div
            style={{
              width: 1,
              height: 28,
              background: isGhost ? "#1a2820" : "#1e3a2f",
              marginTop: "0.4rem",
            }}
          />

          {/* Horizontal bar + children */}
          <div style={{ position: "relative", display: "flex", gap: 0 }}>
            {node.children.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: `calc(100% - 80px)`,
                  height: 1,
                  background: "#1e3a2f",
                }}
              />
            )}
            <div
              style={{
                display: "flex",
                gap: "2rem",
                alignItems: "flex-start",
              }}
            >
              {node.children.map((child) => (
                <div
                  key={child.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* Short vertical to child */}
                  <div
                    style={{
                      width: 1,
                      height: 20,
                      background: child.ghost ? "#1a2820" : "#1e3a2f",
                    }}
                  />
                  <TreeNode
                    node={child}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function GenealogyNosferatu() {
  const [selected, setSelected] = useState(null);
  const roots = buildTree(NODES);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f0c",
        fontFamily: "'Crimson Text', Georgia, serif",
        color: "#c8bfaa",
        position: "relative",
      }}
    >
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');`}</style>

      {/* Header */}
      <div
        style={{
          padding: "2rem 2.5rem 1rem",
          borderBottom: "1px solid #1e3a2f",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#4a7c5f",
            marginBottom: "0.4rem",
          }}
        >
          Clan Nosferatu · Lignée de Paris
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "1.8rem",
            fontWeight: 600,
            color: "#e8d5a3",
            letterSpacing: "0.02em",
          }}
        >
          Arbre Généalogique
        </h1>
        <div
          style={{
            marginTop: "0.8rem",
            display: "flex",
            gap: "1.5rem",
            fontSize: "0.7rem",
            color: "#4a7c5f",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "1px solid #1e3a2f",
                background: "#0f1e17",
                display: "inline-block",
              }}
            />
            Vampire actif
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "1px dashed #2a3a30",
                display: "inline-block",
                textAlign: "center",
                lineHeight: "14px",
                fontSize: "10px",
                color: "#2a3a30",
              }}
            >
              †
            </span>
            Détruit
          </span>
        </div>
      </div>

      {/* Tree */}
      <div
        style={{
          padding: "3rem 2.5rem",
          overflowX: "auto",
          paddingRight: selected ? "380px" : "2.5rem",
          transition: "padding-right 0.3s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", minWidth: "fit-content" }}>
          {roots.map((root) => (
            <TreeNode
              key={root.id}
              node={root}
              onSelect={setSelected}
              selectedId={selected?.id}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <DetailPanel node={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
