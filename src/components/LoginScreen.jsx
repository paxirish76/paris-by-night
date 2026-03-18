import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import './LoginScreen.css';

// Special identifiers for non-campagne users
const SPECIAL_USERS = [
  { id: '__mj__',    nom: 'Maître de Jeu', special: true },
  { id: '__guest__', nom: 'Invité',        special: true },
];

export default function LoginScreen() {
  const { loginJoueur } = useAuth();

  // Step 1 — campagne
  const [campagnes, setCampagnes]           = useState([]);
  const [selectedCampagne, setSelectedCampagne] = useState(null);
  const [loadingCampagnes, setLoadingCampagnes] = useState(false);

  // Step 2 — joueur
  const [joueurs, setJoueurs]               = useState([]);
  const [selectedJoueur, setSelectedJoueur] = useState(null); // { id, nom, special? }

  // Step 3 — password
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [shaking, setShaking]     = useState(false);

  // ── Load campagnes on mount, auto-select if only one ─────────────────
  useEffect(() => {
    setLoadingCampagnes(true);
    supabase
      .from('campagnes')
      .select('id, nom')
      .order('nom')
      .then(({ data }) => {
        const list = data || [];
        setCampagnes(list);
        if (list.length === 1) setSelectedCampagne(list[0].id);
        setLoadingCampagnes(false);
      });
  }, []);

  // ── Load joueurs when campagne selected ───────────────────────────────
  useEffect(() => {
    if (!selectedCampagne) { setJoueurs([]); return; }
    supabase
      .from('joueurs')
      .select('id, nom, clan_id')
      .eq('campagne_id', selectedCampagne)
      .order('nom')
      .then(({ data }) => setJoueurs(data || []));
  }, [selectedCampagne]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSelectCampagne = (id) => {
    setSelectedCampagne(id);
    setSelectedJoueur(null);
    setPassword('');
    setError('');
  };

  const handleSelectJoueur = (joueur) => {
    setSelectedJoueur(joueur);
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJoueur || !password) return;

    const result = await loginJoueur(selectedJoueur.id, password);

    if (result !== 'ok') {
      setError('Accès refusé.');
      setShaking(true);
      setPassword('');
      setTimeout(() => setShaking(false), 600);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="login-screen">
      <div className={`login-box ${shaking ? 'shake' : ''}`}>
        <div className="login-ornament">✦</div>
        <h1 className="login-title">Paris by Night</h1>
        <p className="login-subtitle">Domaine de François Villon</p>

        {/* Step 1 — Campagne */}
        {loadingCampagnes ? (
          <p className="login-loading">Chargement…</p>
        ) : campagnes.length > 1 && (
          <div className="login-selector">
            <p className="login-selector-label">Campagne</p>
            <div className="login-selector-grid">
              {campagnes.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`login-selector-btn ${selectedCampagne === c.id ? 'active' : ''}`}
                  onClick={() => handleSelectCampagne(c.id)}
                >
                  {c.nom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Joueur */}
        {selectedCampagne && (
          <div className="login-selector">
            <p className="login-selector-label">Joueur</p>
            <div className="login-selector-grid">
              {joueurs.map(j => (
                <button
                  key={j.id}
                  type="button"
                  className={`login-selector-btn ${selectedJoueur?.id === j.id ? 'active' : ''}`}
                  onClick={() => handleSelectJoueur(j)}
                >
                  {j.nom}
                </button>
              ))}
            </div>

            {/* Special users — MJ & Guest, separated */}
            {joueurs.length > 0 && (
              <div className="login-selector-divider" />
            )}
            <div className="login-selector-grid">
              {SPECIAL_USERS.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className={`login-selector-btn login-selector-btn--special ${selectedJoueur?.id === u.id ? 'active' : ''}`}
                  onClick={() => handleSelectJoueur(u)}
                >
                  {u.nom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Password */}
        {selectedJoueur && (
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="password"
              className={`login-input ${error ? 'error' : ''}`}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoFocus
              autoComplete="off"
            />
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn">Entrer</button>
          </form>
        )}

      </div>
    </div>
  );
}
