// ─────────────────────────────────────────────────────────
//  lieuxRestrictions.js
//
//  Controls which lieux are visible to players.
//
//  Logic (evaluated in order):
//  1. MJ → sees everything
//  2. If lieu.connu === true → VISIBLE to all players
//  3. If a lieu ID is in CLAN_OVERRIDES[clanMode] → VISIBLE
//  4. If a lieu ID is in RESTRICTED_LIEUX → HIDDEN
//  5. Otherwise → HIDDEN (default closed for players)
//
// ─────────────────────────────────────────────────────────

// Lieux always hidden regardless of connu flag
// (absolute MJ secrets — override everything)
export const RESTRICTED_LIEUX = [
  // 'haven-secret-villon',
];

// Per-clan overrides: visible to that clan even if not connu
export const CLAN_OVERRIDES = {
  brujah:   [],
  gangrel:  [],
  lasombra: [],
  malkavian:[],
  nosferatu:[],
  toreador: [],
  tremere:  [],
  ventrue:  [],
};

// ─────────────────────────────────────────────────────────
//  Main filter function
//  Usage: filterLieux(allLieux, mode)
// ─────────────────────────────────────────────────────────
export function filterLieux(lieux, mode) {
  if (!lieux) return [];
  if (mode === 'mj') return lieux;

  const clanVisible = CLAN_OVERRIDES[mode] || [];

  return lieux.filter(lieu => {
    const id = lieu.id;
    // Absolute restriction — always hide
    if (RESTRICTED_LIEUX.includes(id)) return false;
    // Clan override — always show
    if (clanVisible.includes(id)) return true;
    // connu flag — show to all players
    if (lieu.connu) return true;
    // Default: hidden for players
    return false;
  });
}
