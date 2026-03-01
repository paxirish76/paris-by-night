import { createContext, useContext, useState } from 'react';

// ─────────────────────────────────────────────────────────
//  PASSWORDS — change before distributing to players!
// ─────────────────────────────────────────────────────────
const PASSWORDS = {
  // MJ
  '7 ai principi dei nani':   'mj',
  // Clans — customize each one
  'anarchie':   'brujah',
  'forestier':  'gangrel',
  'noirceur':  'lasombra',
  'alienes': 'malkavian',
  'horreur':  'nosferatu',
  'mecenes':  'toreador',
  'alchimie':   'tremere',
  'couronne': 'ventrue',
  // Invité — vue publique (connu=true uniquement, sans overrides de clan)
  'paris':      'invite',
};

// ─────────────────────────────────────────────────────────
//  Personnage IDs always hidden from ALL players
//  (regardless of clan) — add as needed
// ─────────────────────────────────────────────────────────
export const HIDDEN_PERSONNAGE_IDS = [
  "l-ermite",
];

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────
export const CLAN_IDS = [
  'brujah', 'gangrel', 'lasombra', 'malkavian',
  'nosferatu', 'toreador', 'tremere', 'ventrue',
];

export const isMJ     = (mode) => mode === 'mj';
export const isGuest  = (mode) => mode === 'invite';
export const isClan   = (mode) => CLAN_IDS.includes(mode);
export const isPlayer = (mode) => isClan(mode); // invité exclu volontairement

// ─────────────────────────────────────────────────────────
//  Context
// ─────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return sessionStorage.getItem('pbn_mode') || null;
  });

  const login = (password) => {
    const resolved = PASSWORDS[password.trim().toLowerCase()];
    if (resolved) {
      sessionStorage.setItem('pbn_mode', resolved);
      setMode(resolved);
      return resolved;
    }
    return null;
  };

  const logout = () => {
    sessionStorage.removeItem('pbn_mode');
    setMode(null);
  };

  return (
    <AuthContext.Provider value={{ mode, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
