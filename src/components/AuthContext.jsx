import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── Hardcoded clan passwords (from .env) ──────────────────────────────────
const CLAN_PASSWORDS = {
  [import.meta.env.VITE_PASSWORD_MJ]:       'mj',
  [import.meta.env.VITE_PASSWORD_BRUJAH]:   'brujah',
  [import.meta.env.VITE_PASSWORD_GANGREL]:  'gangrel',
  [import.meta.env.VITE_PASSWORD_LASOMBRA]: 'lasombra',
  [import.meta.env.VITE_PASSWORD_MALKAVIAN]:'malkavian',
  [import.meta.env.VITE_PASSWORD_NOSFERATU]:'nosferatu',
  [import.meta.env.VITE_PASSWORD_TOREADOR]: 'toreador',
  [import.meta.env.VITE_PASSWORD_TREMERE]:  'tremere',
  [import.meta.env.VITE_PASSWORD_VENTRUE]:  'ventrue',
};

// ── Hidden personnages — veto absolu ──────────────────────────────────────
export const HIDDEN_PERSONNAGE_IDS = ['l-ermite'];

// ── Helpers ───────────────────────────────────────────────────────────────
export const isMJ      = (mode) => mode === 'mj';
export const isPlayer  = (mode) => !!mode && mode !== 'mj' && mode !== 'guest' && mode !== 'campagne';
export const isGuest   = (mode) => mode === 'guest';
export const isClan    = (mode, clanId) => mode === clanId;

// ── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // mode: 'mj' | clan_id | 'guest' | null
  const [mode, setMode]     = useState(() => sessionStorage.getItem('pbn-mode') || null);
  // joueur: { id, nom, campagne_id, campagne_nom, clan_id } | null
  const [joueur, setJoueur] = useState(() => {
    const saved = sessionStorage.getItem('pbn-joueur');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist to sessionStorage on change
  useEffect(() => {
    if (mode) sessionStorage.setItem('pbn-mode', mode);
    else      sessionStorage.removeItem('pbn-mode');
  }, [mode]);

  useEffect(() => {
    if (joueur) sessionStorage.setItem('pbn-joueur', JSON.stringify(joueur));
    else        sessionStorage.removeItem('pbn-joueur');
  }, [joueur]);

  // ── Clan login (existing path) ────────────────────────────────────────
  const login = (password) => {
    const matched = CLAN_PASSWORDS[password];
    if (!matched) return false;
    setMode(matched);
    setJoueur(null);
    return true;
  };

  // ── Campagne login ────────────────────────────────────────────────────
  // Returns: 'ok' | 'wrong_password' | 'error'
  const loginJoueur = async (joueurId, password) => {
    try {
      const { data, error } = await supabase
        .from('joueurs')
        .select('id, nom, password, campagne_id, clan_id, campagnes(nom)')
        .eq('id', joueurId)
        .single();

      if (error || !data) return 'error';
      if (data.password !== password) return 'wrong_password';

      const joueurData = {
        id:           data.id,
        nom:          data.nom,
        campagne_id:  data.campagne_id,
        campagne_nom: data.campagnes?.nom || data.campagne_id,
        clan_id:      data.clan_id,
      };

      setJoueur(joueurData);
      setMode('campagne');
      return 'ok';
    } catch {
      return 'error';
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = () => {
    setMode(null);
    setJoueur(null);
  };

  // ── isJoueurCampagne helper ───────────────────────────────────────────
  const isJoueurCampagne = () => mode === 'campagne' && !!joueur;

  return (
    <AuthContext.Provider value={{ mode, joueur, login, loginJoueur, logout, isJoueurCampagne }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
