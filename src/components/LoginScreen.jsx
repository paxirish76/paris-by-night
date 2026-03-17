import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import './LoginScreen.css';

// ── Modes ─────────────────────────────────────────────────────────────────
// 'clan'     → single password field (existing behaviour)
// 'campagne' → campaign selector → player selector → password field

export default function LoginScreen() {
  const { login, loginJoueur } = useAuth();

  const [scheme, setScheme]         = useState('clan'); // 'clan' | 'campagne'

  // Clan path
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState(false);
  const [shaking, setShaking]       = useState(false);

  // Campagne path
  const [campagnes, setCampagnes]   = useState([]);
  const [joueurs, setJoueurs]       = useState([]);
  const [selectedCampagne, setSelectedCampagne] = useState(null);
  const [selectedJoueur, setSelectedJoueur]     = useState(null);
  const [campagnePassword, setCampagnePassword] = useState('');
  const [campagneError, setCampagneError]       = useState('');
  const [campagneShaking, setCampagneShaking]   = useState(false);
  const [loadingCampagnes, setLoadingCampagnes] = useState(false);

  // ── Load campagnes on scheme switch ──────────────────────────────────
  useEffect(() => {
    if (scheme !== 'campagne') return;
    setLoadingCampagnes(true);
    supabase
      .from('campagnes')
      .select('id, nom')
      .order('nom')
      .then(({ data }) => {
        setCampagnes(data || []);
        setLoadingCampagnes(false);
      });
  }, [scheme]);

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

  // ── Clan login ────────────────────────────────────────────────────────
  const handleClanSubmit = (e) => {
    e.preventDefault();
    const ok = login(password);
    if (!ok) {
      setError(true);
      setShaking(true);
      setPassword('');
      setTimeout(() => setShaking(false), 600);
    }
  };

  // ── Campagne login ────────────────────────────────────────────────────
  const handleCampagneSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJoueur || !campagnePassword) return;
    const result = await loginJoueur(selectedJoueur, campagnePassword);
    if (result !== 'ok') {
      setCampagneError('Accès refusé.');
      setCampagneShaking(true);
      setCampagnePassword('');
      setTimeout(() => setCampagneShaking(false), 600);
    }
  };

  const handleSelectCampagne = (id) => {
    setSelectedCampagne(id);
    setSelectedJoueur(null);
    setCampagnePassword('');
    setCampagneError('');
  };

  const handleSelectJoueur = (id) => {
    setSelectedJoueur(id);
    setCampagnePassword('');
    setCampagneError('');
  };

  const handleSchemeChange = (s) => {
    setScheme(s);
    setError(false);
    setPassword('');
    setCampagneError('');
    setSelectedCampagne(null);
    setSelectedJoueur(null);
    setCampagnePassword('');
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="login-screen">
      <div className={`login-box ${(shaking || campagneShaking) ? 'shake' : ''}`}>
        <div className="login-ornament">✦</div>
        <h1 className="login-title">Paris by Night</h1>
        <p className="login-subtitle">Domaine de François Villon</p>

        {/* Scheme toggle */}
        <div className="login-scheme-toggle">
          <button
            className={`login-scheme-btn ${scheme === 'clan' ? 'active' : ''}`}
            onClick={() => handleSchemeChange('clan')}
            type="button"
          >
            Par clan
          </button>
          <button
            className={`login-scheme-btn ${scheme === 'campagne' ? 'active' : ''}`}
            onClick={() => handleSchemeChange('campagne')}
            type="button"
          >
            Par campagne
          </button>
        </div>

        {/* ── Clan path ─────────────────────────────────────────────── */}
        {scheme === 'clan' && (
          <form onSubmit={handleClanSubmit} className="login-form">
            <input
              type="password"
              className={`login-input ${error ? 'error' : ''}`}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              autoFocus
              autoComplete="off"
            />
            {error && <p className="login-error">Accès refusé.</p>}
            <button type="submit" className="login-btn">Entrer</button>
          </form>
        )}

        {/* ── Campagne path ──────────────────────────────────────────── */}
        {scheme === 'campagne' && (
          <div className="login-campagne">

            {/* Step 1 — campaign selection */}
            {loadingCampagnes ? (
              <p className="login-loading">Chargement…</p>
            ) : (
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

            {/* Step 2 — player selection */}
            {selectedCampagne && joueurs.length > 0 && (
              <div className="login-selector">
                <p className="login-selector-label">Joueur</p>
                <div className="login-selector-grid">
                  {joueurs.map(j => (
                    <button
                      key={j.id}
                      type="button"
                      className={`login-selector-btn ${selectedJoueur === j.id ? 'active' : ''}`}
                      onClick={() => handleSelectJoueur(j.id)}
                    >
                      {j.nom}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — password */}
            {selectedJoueur && (
              <form onSubmit={handleCampagneSubmit} className="login-form">
                <input
                  type="password"
                  className={`login-input ${campagneError ? 'error' : ''}`}
                  placeholder="Mot de passe"
                  value={campagnePassword}
                  onChange={(e) => { setCampagnePassword(e.target.value); setCampagneError(''); }}
                  autoFocus
                  autoComplete="off"
                />
                {campagneError && <p className="login-error">{campagneError}</p>}
                <button type="submit" className="login-btn">Entrer</button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
