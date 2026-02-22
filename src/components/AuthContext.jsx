import { createContext, useContext, useState } from 'react';

// ─────────────────────────────────────────────────────────
//  PASSWORDS — change before distributing to players!
// ─────────────────────────────────────────────────────────
const PASSWORDS = {
  // MJ
  'camarilla':   'mj',
  // Clans — customize each one
  'sang-brul':   'brujah',
  'nuit-verte':  'gangrel',
  'ombre-pure':  'lasombra',
  'voile-brise': 'malkavian',
  'egout-dore':  'nosferatu',
  'rose-noire':  'toreador',
  'feu-froid':   'tremere',
  'or-saignant': 'ventrue',
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
export const isClan   = (mode) => CLAN_IDS.includes(mode);
export const isPlayer = (mode) => isClan(mode);

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
