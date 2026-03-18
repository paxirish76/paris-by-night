import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── Hidden personnages — veto absolu ──────────────────────────────────────
export const HIDDEN_PERSONNAGE_IDS = ['l-ermite'];

// ── Helpers ───────────────────────────────────────────────────────────────
export const isMJ     = (mode) => mode === 'mj';
export const isPlayer = (mode) => !!mode && mode !== 'mj' && mode !== 'guest' && mode !== 'campagne';
export const isGuest  = (mode) => mode === 'guest';
export const isClan   = (mode, clanId) => mode === clanId; // kept for legacy read paths

// ── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // mode: 'mj' | 'guest' | 'campagne' | null
  const [mode, setMode]     = useState(() => sessionStorage.getItem('pbn-mode') || null);
  // joueur: { id, nom, campagne_id, campagne_nom, clan_id } | null
  const [joueur, setJoueur] = useState(() => {
    const saved = sessionStorage.getItem('pbn-joueur');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (mode) sessionStorage.setItem('pbn-mode', mode);
    else      sessionStorage.removeItem('pbn-mode');
  }, [mode]);

  useEffect(() => {
    if (joueur) sessionStorage.setItem('pbn-joueur', JSON.stringify(joueur));
    else        sessionStorage.removeItem('pbn-joueur');
  }, [joueur]);

  // ── Unified login ─────────────────────────────────────────────────────
  // Special IDs: '__mj__' | '__guest__' | any real joueur ID from Supabase
  // Returns: 'ok' | 'wrong_password' | 'error'
  const loginJoueur = async (joueurId, password) => {
    // MJ
    if (joueurId === '__mj__') {
      if (password === import.meta.env.VITE_PASSWORD_MJ) {
        setMode('mj');
        setJoueur(null);
        return 'ok';
      }
      return 'wrong_password';
    }

    // Guest
    if (joueurId === '__guest__') {
      if (password === import.meta.env.VITE_PASSWORD_INVITE) {
        setMode('guest');
        setJoueur(null);
        return 'ok';
      }
      return 'wrong_password';
    }

    // Campagne joueur
    try {
      const { data, error } = await supabase
        .from('joueurs')
        .select('id, nom, password, campagne_id, clan_id, campagnes(nom)')
        .eq('id', joueurId)
        .single();

      if (error || !data) return 'error';
      if (data.password !== password) return 'wrong_password';

      setJoueur({
        id:           data.id,
        nom:          data.nom,
        campagne_id:  data.campagne_id,
        campagne_nom: data.campagnes?.nom || data.campagne_id,
        clan_id:      data.clan_id,
      });
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
    <AuthContext.Provider value={{ mode, joueur, loginJoueur, logout, isJoueurCampagne }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
