// AdminPanel.jsx
// MJ-only record editor. Slides in as a right-side drawer over the current view.
//
// Props:
//   table      {string}   — "personnages" | "lieux" | "clans" | "bourgs" | "influences"
//   recordId   {any}      — text slug (most tables) or integer id (influences)
//   onClose    {function} — called when the drawer is dismissed
//   onSaved    {function} — optional, called after a successful save

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import "./AdminPanel.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─────────────────────────────────────────────────────────────────────────────
// Table icons shown in the drawer header
// ─────────────────────────────────────────────────────────────────────────────
const TABLE_ICONS = {
  personnages: "🦇",
  lieux:       "🗺️",
  clans:       "⚜️",
  bourgs:      "🏰",
  influences:  "🕸️",
};

const TABLE_LABELS = {
  personnages: "Personnages",
  lieux:       "Lieux",
  clans:       "Clans",
  bourgs:      "Bourgs",
  influences:  "Influences",
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema definitions — one entry per editable field
// type: "text" | "textarea" | "textarea-tall" | "number" | "boolean"
//       | "json" | "select" | "array-text" | "color" | "readonly"
// ─────────────────────────────────────────────────────────────────────────────
const SCHEMAS = {
  personnages: {
    sections: [
      {
        title: "Identité",
        fields: [
          { key: "id",           label: "ID",             type: "readonly" },
          { key: "nom",          label: "Nom",            type: "text" },
          { key: "clan_id",      label: "Clan ID",        type: "text",    hint: "Ex: toreador, brujah, ventrue…" },
          { key: "generation",   label: "Génération",     type: "number" },
          { key: "sire",         label: "Sire (ID)",      type: "text",    hint: "ID slug d'un autre personnage. Laisser vide pour les racines." },
          { key: "image_url",    label: "URL image",      type: "text" },
        ],
      },
      {
        title: "Statut",
        fields: [
          { key: "ghost",          label: "Fantôme / Détruit",  type: "boolean", hint: "Apparaît dans l'arbre généalogique avec bordure pointillée." },
          { key: "connu",          label: "Connu des joueurs",  type: "boolean" },
          { key: "hors_structure", label: "Hors structure",     type: "boolean", hint: "Exclut du listing normal du clan. Apparaît sous 'Présences isolées'." },
        ],
      },
      {
        title: "Description",
        fields: [
          { key: "apparence",    label: "Apparence",      type: "textarea" },
          { key: "personnalite", label: "Personnalité",   type: "textarea" },
          { key: "histoire",     label: "Histoire",       type: "textarea-tall" },
          { key: "abilities",    label: "Compétences",    type: "textarea",      hint: "Texte libre (pas du JSON)." },
          { key: "notes",        label: "Notes",          type: "textarea",      hint: "Texte libre (pas du JSON)." },
        ],
      },
      {
        title: "Données structurées (JSON)",
        fields: [
          { key: "roles",       label: "Rôles",           type: "json", hint: "Tableau JSON. Ex: [{\"titre\": \"Sheriff\", \"detail\": \"...\"}]" },
          { key: "disciplines", label: "Disciplines",     type: "json", hint: "Tableau JSON. Visible MJ uniquement." },
          { key: "relations",   label: "Relations",       type: "json", hint: "Tableau JSON. Ex: [{\"nom\": \"François Villon\", \"type\": \"Allié\"}]" },
          { key: "secrets_mj",  label: "Secrets MJ",     type: "json", hint: "Objet JSON. Visible MJ uniquement." },
          { key: "attributes",  label: "Attributs",      type: "json", hint: "Objet JSON avec sous-objets mental / social / physique." },
        ],
      },
    ],
  },

  lieux: {
    sections: [
      {
        title: "Identité",
        fields: [
          { key: "id",        label: "ID",              type: "readonly" },
          { key: "nom",       label: "Nom",             type: "text",    required: true },
          { key: "adresse",   label: "Adresse",         type: "text" },
          { key: "bourg_id",  label: "Bourg ID",        type: "text",    hint: "Slug du bourg parent." },
          { key: "clan_id",   label: "Clan propriétaire", type: "text", hint: "Slug du clan." },
          { key: "statut",    label: "Statut",          type: "text",    hint: "Ex: Elysium, Antre, Façade, Ruine…" },
          { key: "protection",label: "Protection",      type: "number",  hint: "Niveau de protection (entier)." },
          { key: "image_url", label: "URL image",       type: "text" },
        ],
      },
      {
        title: "Coordonnées",
        fields: [
          { key: "latitude",  label: "Latitude",        type: "number" },
          { key: "longitude", label: "Longitude",       type: "number" },
        ],
      },
      {
        title: "Visibilité",
        fields: [
          { key: "connu",         label: "Connu des joueurs",    type: "boolean", hint: "Par défaut: vrai pour les lieux." },
          { key: "clan_overrides",label: "Clan overrides",       type: "array-text", hint: "Clans pouvant voir ce lieu même si connu=false." },
        ],
      },
      {
        title: "Description (JSON)",
        fields: [
          { key: "description", label: "Description", type: "json",
            hint: "Objet JSON. Clés attendues: ambiance, utilite, securite_occulte, gardien_special, secrets_mj." },
        ],
      },
    ],
  },

  clans: {
    sections: [
      {
        title: "Identité",
        fields: [
          { key: "id",         label: "ID",           type: "readonly" },
          { key: "nom",        label: "Nom",          type: "text",    required: true },
          { key: "population", label: "Population",   type: "number" },
          { key: "couleur",    label: "Couleur",      type: "color",   hint: "Valeur CSS. Ex: #8b1a1a ou rgba(139,26,26,0.8)" },
          { key: "icon_url",   label: "URL icône",    type: "text" },
          { key: "clan_mineur",label: "Clan mineur",  type: "boolean", hint: "Exclut du tableau principal — apparaît dans le volet AUTRES." },
        ],
      },
      {
        title: "Contenu",
        fields: [
          { key: "description", label: "Description",           type: "textarea-tall" },
          { key: "buts",        label: "Objectifs / Buts",      type: "json", hint: "JSONB. Structure libre." },
          { key: "relation",    label: "Relations inter-clans", type: "json", hint: "JSONB. Structure libre." },
        ],
      },
    ],
  },

  bourgs: {
    sections: [
      {
        title: "Identité",
        fields: [
          { key: "id",               label: "ID",                    type: "readonly" },
          { key: "nom",              label: "Nom",                   type: "text",    required: true },
          { key: "clan_dominant_id", label: "Clan dominant (ID)",    type: "text",    hint: "Slug du clan." },
          { key: "type",             label: "Type",                  type: "text" },
          { key: "importance",       label: "Importance",            type: "text" },
          { key: "bourgmestre",      label: "Bourgmestre (nom)",     type: "text" },
          { key: "bourgmestre_id",   label: "Bourgmestre (ID personnage)", type: "text", hint: "Slug personnage. FK avec ON DELETE SET NULL." },
        ],
      },
      {
        title: "Description",
        fields: [
          { key: "narr_description", label: "Description narrative", type: "textarea-tall" },
          { key: "description",      label: "Description (JSON)",    type: "json", hint: "JSONB. Structure libre." },
          { key: "territoire",       label: "Territoire (JSON)",     type: "json", hint: "JSONB. Structure libre." },
          { key: "territoire_codes", label: "Codes territoire (JSON)", type: "json",
            hint: "Objet JSON. Ex: {\"communes\": [\"75001\"], \"arrondissements\": [1]}" },
        ],
      },
    ],
  },

  influences: {
    sections: [
      {
        title: "Influence",
        fields: [
          { key: "id",       label: "ID",             type: "readonly", hint: "Entier auto-incrémenté." },
          { key: "clan_id",  label: "Clan ID",        type: "text",    required: true, hint: "Slug du clan." },
          { key: "categorie",label: "Catégorie",      type: "text",    required: true },
          { key: "sous_cat", label: "Sous-catégorie", type: "text",    required: true },
          { key: "niveau",   label: "Niveau",         type: "select",  required: true,
            options: ["dominant","important","secondaire","present","contextuel","chaotique","montante","faible","nulle"] },
          { key: "detail",   label: "Détail",         type: "textarea" },
        ],
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** JSON textarea with live validation */
function JsonField({ value, onChange }) {
  const [raw, setRaw]     = useState(() => value == null ? "" : JSON.stringify(value, null, 2));
  const [error, setError] = useState(false);

  // Sync when parent resets (e.g. fresh fetch)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setRaw(value == null ? "" : JSON.stringify(value, null, 2));
      setError(false);
    }
  }, [value]);

  function handleChange(e) {
    const str = e.target.value;
    setRaw(str);
    if (!str.trim()) { setError(false); onChange(null); return; }
    try {
      onChange(JSON.parse(str));
      setError(false);
    } catch {
      setError(true);
    }
  }

  return (
    <div>
      <textarea
        className={`ap-input ap-textarea ap-json${error ? " ap-json-error" : ""}`}
        value={raw}
        onChange={handleChange}
        spellCheck={false}
      />
      {error && <div className="ap-json-error-msg">⚠ JSON invalide — les modifications ne seront pas sauvegardées tant que la syntaxe est incorrecte.</div>}
    </div>
  );
}

/** Tag-based editor for Postgres text[] (clan_overrides) */
function ArrayTextField({ value = [], onChange }) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (!v || value.includes(v)) { setInput(""); return; }
    onChange([...value, v]);
    setInput("");
  }

  function remove(tag) {
    onChange(value.filter(t => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  }

  return (
    <div>
      <div className="ap-array-tags">
        {value.length === 0
          ? <span className="ap-array-empty">Aucun clan</span>
          : value.map(tag => (
            <span key={tag} className="ap-tag">
              {tag}
              <button className="ap-tag-remove" onClick={() => remove(tag)} title="Supprimer">×</button>
            </span>
          ))
        }
      </div>
      <div className="ap-array-add">
        <input
          className="ap-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter un clan ID…"
        />
        <button className="ap-array-add-btn" onClick={add}>Ajouter</button>
      </div>
    </div>
  );
}

/** Toggle switch */
function BooleanField({ id, value, onChange, label }) {
  return (
    <div className="ap-bool-row">
      <label className="ap-toggle">
        <input type="checkbox" id={id} checked={!!value} onChange={e => onChange(e.target.checked)} />
        <span className="ap-toggle-track" />
      </label>
      <label className="ap-toggle-label" htmlFor={id}>{value ? "Oui" : "Non"}</label>
    </div>
  );
}

/** Color input with live swatch */
function ColorField({ value, onChange }) {
  return (
    <div className="ap-color-row">
      <div
        className="ap-color-swatch"
        style={{ backgroundColor: value || "transparent" }}
      />
      <input
        className="ap-input"
        type="text"
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        placeholder="#c0c0c0"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic field renderer
// ─────────────────────────────────────────────────────────────────────────────
function renderField(field, draft, setDraft) {
  const { key, type, options, hint, required } = field;
  const val = draft[key];
  const uid = `ap-field-${key}`;

  function set(v) { setDraft(prev => ({ ...prev, [key]: v })); }

  let input;
  switch (type) {
    case "readonly":
      input = <input className="ap-input" readOnly value={val ?? ""} />;
      break;

    case "text":
      input = (
        <input
          id={uid}
          className="ap-input"
          type="text"
          value={val ?? ""}
          onChange={e => set(e.target.value === "" ? null : e.target.value)}
        />
      );
      break;

    case "number":
      input = (
        <input
          id={uid}
          className="ap-input"
          type="number"
          value={val ?? ""}
          onChange={e => set(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
      break;

    case "textarea":
    case "textarea-tall":
      input = (
        <textarea
          id={uid}
          className={`ap-input ap-textarea${type === "textarea-tall" ? " ap-textarea-tall" : ""}`}
          value={val ?? ""}
          onChange={e => set(e.target.value === "" ? null : e.target.value)}
        />
      );
      break;

    case "boolean":
      input = <BooleanField id={uid} value={val} onChange={set} />;
      break;

    case "json":
      input = <JsonField value={val} onChange={set} />;
      break;

    case "select":
      input = (
        <select
          id={uid}
          className="ap-input ap-select"
          value={val ?? ""}
          onChange={e => set(e.target.value)}
        >
          <option value="">— choisir —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;

    case "array-text":
      input = <ArrayTextField value={Array.isArray(val) ? val : []} onChange={set} />;
      break;

    case "color":
      input = <ColorField value={val} onChange={set} />;
      break;

    default:
      input = <input className="ap-input" type="text" value={val ?? ""} onChange={e => set(e.target.value)} />;
  }

  return (
    <div className="ap-field" key={key}>
      <label className="ap-label" htmlFor={uid}>
        {field.label}
        {required && <span className="ap-required" title="Champ obligatoire"> *</span>}
      </label>
      {hint && <div className="ap-hint">{hint}</div>}
      {input}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation — check NOT NULL fields before saving
// ─────────────────────────────────────────────────────────────────────────────
function validate(table, draft) {
  const schema = SCHEMAS[table];
  const errors = [];
  schema.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.required) {
        const v = draft[field.key];
        if (v === null || v === undefined || v === "") {
          errors.push(`"${field.label}" est obligatoire.`);
        }
      }
    });
  });
  // JSON fields: check none are in error state (they'd still be the old parsed value)
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AdminPanel component
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPanel({ table, recordId, onClose, onSaved }) {
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [draft, setDraft]           = useState(null);
  const [original, setOriginal]     = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | dirty | saving | saved | error
  const [saveError, setSaveError]   = useState(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch the record
  useEffect(() => {
    if (!table || recordId == null) return;
    setLoading(true);
    setFetchError(null);
    setDraft(null);

    const pkColumn = table === "influences" ? "id" : "id";

    supabase
      .from(table)
      .select("*")
      .eq(pkColumn, recordId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setFetchError(error.message);
        } else {
          setDraft(data);
          setOriginal(data);
          setSaveStatus("idle");
        }
        setLoading(false);
      });
  }, [table, recordId]);

  // Mark dirty when draft diverges from original
  useEffect(() => {
    if (!draft || !original) return;
    const changed = JSON.stringify(draft) !== JSON.stringify(original);
    if (changed && saveStatus === "idle") setSaveStatus("dirty");
    if (!changed && saveStatus === "dirty") setSaveStatus("idle");
  }, [draft, original, saveStatus]);

  // Save
  const handleSave = useCallback(async () => {
    if (!draft) return;

    const errors = validate(table, draft);
    if (errors.length > 0) {
      setSaveError(errors.join(" "));
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);

    // Build the payload — exclude field_visibility (managed by the app)
    // and exclude created_at (managed by Postgres)
    const EXCLUDED_KEYS = ["created_at", "field_visibility"];
    const payload = Object.fromEntries(
      Object.entries(draft).filter(([k]) => !EXCLUDED_KEYS.includes(k))
    );

    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", draft.id);

    if (error) {
      setSaveStatus("error");
      setSaveError(error.message);
    } else {
      setOriginal(draft);
      setSaveStatus("saved");
      if (onSaved) onSaved(draft);
      // Reset to idle after a moment
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }, [draft, table, onSaved]);

  // ── Status bar content ──────────────────────────────────────────────────────
  function renderStatus() {
    const map = {
      idle:   { cls: "ap-status-idle",   dot: true,  text: "Aucune modification" },
      dirty:  { cls: "ap-status-dirty",  dot: true,  text: "Modifications non sauvegardées" },
      saving: { cls: "ap-status-saving", dot: true,  text: "Sauvegarde en cours…" },
      saved:  { cls: "ap-status-saved",  dot: true,  text: "Sauvegardé ✓" },
      error:  { cls: "ap-status-error",  dot: true,  text: saveError || "Erreur lors de la sauvegarde" },
    };
    const s = map[saveStatus] ?? map.idle;
    return (
      <div className={`ap-status ${s.cls}`}>
        {s.dot && <span className="ap-status-dot" />}
        {s.text}
      </div>
    );
  }

  // ── Record display name in header ───────────────────────────────────────────
  const recordLabel = draft?.nom ?? draft?.id ?? String(recordId);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="ap-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ap-drawer">

        {/* Header */}
        <div className="ap-header">
          <span className="ap-header-icon">{TABLE_ICONS[table] ?? "✏️"}</span>
          <div className="ap-header-titles">
            <div className="ap-header-table">{TABLE_LABELS[table] ?? table}</div>
            <div className="ap-header-record">{loading ? "Chargement…" : recordLabel}</div>
          </div>
          <button className="ap-close-btn" onClick={onClose} title="Fermer">✕</button>
        </div>

        {/* Status bar */}
        {renderStatus()}

        {/* Body */}
        {loading && (
          <div className="ap-loading">
            <span className="ap-loading-spinner" />
            Chargement…
          </div>
        )}

        {!loading && fetchError && (
          <div className="ap-fetch-error">
            Impossible de charger l'enregistrement.<br />
            <small>{fetchError}</small>
          </div>
        )}

        {!loading && !fetchError && draft && (
          <div className="ap-body">
            {SCHEMAS[table].sections.map((section, si) => (
              <div className="ap-section" key={si}>
                {section.title && (
                  <div className="ap-section-title">{section.title}</div>
                )}
                {section.fields.map(field => renderField(field, draft, setDraft))}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && !fetchError && draft && (
          <div className="ap-footer">
            <button className="ap-btn ap-btn-cancel" onClick={onClose}>Annuler</button>
            <button
              className="ap-btn ap-btn-save"
              onClick={handleSave}
              disabled={saveStatus === "saving" || saveStatus === "saved" || saveStatus === "idle"}
            >
              {saveStatus === "saving" ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
