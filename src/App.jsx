import { useState } from 'react';
import Navigation from './components/Navigation';
import Home from './components/Home';
import PersonnagesTable from './components/PersonnagesTable';
import PersonnageDetail from './components/PersonnageDetail';
import Carte from './components/Carte';
import LieuxTable from './components/LieuxTable';
import BourgsTable from './components/BourgsTable';
import ClansTable from './components/ClansTable';
import Genealogie from './components/Genealogie';
import Chronologie from './components/Chronologie';
import Influences from './components/Influences';
import Organisation from './components/Organisation';
import LoginScreen from './components/LoginScreen';
import { AuthProvider, useAuth, isMJ, isPlayer, isGuest, HIDDEN_PERSONNAGE_IDS } from './components/AuthContext';
import './App.css';

// ─── Inner app (has access to auth context) ───────────────
function AppInner() {
  const { mode, logout } = useAuth();

  const [currentPage, setCurrentPage]               = useState('home');
  const [selectedPersonnageId, setSelectedPersonnageId] = useState(null);
  const [targetLieuId, setTargetLieuId]             = useState(null);
  const [targetBourgId, setTargetBourgId]           = useState(null);
  const [targetBourgDetailId, setTargetBourgDetailId] = useState(null);
  const [genealogieClan, setGenealogieClan]         = useState(null);

  // Not logged in → show login screen
  if (!mode) return <LoginScreen />;

  const viewerClan  = isPlayer(mode) ? mode : null;   // null pour MJ et invité
  const playerMode  = isPlayer(mode) || isGuest(mode); // invité = restrictions joueur

  // ── Navigation helpers ──────────────────────────────────
  const navigateToCarteFromLieu = (lieuId) => {
    setTargetLieuId(lieuId);
    setTargetBourgId(null);
    setCurrentPage('carte');
  };

  const navigateToCarteFromBourg = (bourgId, lieuId = null) => {
    setTargetBourgId(bourgId);
    setTargetLieuId(lieuId);
    setCurrentPage('carte');
  };

  const navigateToPersonnage = (personnageId) => {
    // Block globally hidden personnages for all players and guests
    if (playerMode && HIDDEN_PERSONNAGE_IDS.includes(personnageId)) return;
    setSelectedPersonnageId(personnageId);
  };

  const navigateFromCarteToBourg = (bourgId) => {
    setTargetBourgDetailId(bourgId);
    setCurrentPage('bourgs');
  };

  const navigateToGenealogie = (clanId, clanLabel) => {
    setGenealogieClan({ id: clanId, label: clanLabel });
    setCurrentPage('genealogie');
  };

  const clearTargetLieu  = () => setTargetLieuId(null);
  const clearTargetBourg = () => setTargetBourgId(null);

  // ── Page guard: redirect players away from MJ-only pages ─
  const safePage = (page) => {
    return page;
  };

  const navigate = (page) => setCurrentPage(safePage(page));

  // ── PersonnageDetail: props vary by mode ────────────────
  const renderPersonnageDetail = (id) => (
    <PersonnageDetail
      personnageId={id}
      onClose={() => setSelectedPersonnageId(null)}
      playerMode={playerMode}
      viewerClan={viewerClan}
    />
  );

  // ── Page renderer ───────────────────────────────────────
  const renderPage = () => {
    if (selectedPersonnageId) {
      return renderPersonnageDetail(selectedPersonnageId);
    }

    switch (currentPage) {
      case 'home':
        return <Home onNavigate={navigate} />;

      case 'organisation':
        return (
          <Organisation
            onNavigateToPersonnage={navigateToPersonnage}
            onNavigateToBourg={(bourgId) => {
              setTargetBourgDetailId(bourgId);
              setCurrentPage('bourgs');
            }}
          />
        );

      case 'personnages':
        return (
          <PersonnagesTable
            onSelectPersonnage={navigateToPersonnage}
            mode={mode}
            viewerClan={viewerClan}
            playerMode={playerMode}
          />
        );

      case 'carte':
        return (
          <Carte
            targetLieuId={targetLieuId}
            onTargetLieuConsumed={clearTargetLieu}
            onTargetConsumed={clearTargetLieu}
            targetBourgId={targetBourgId}
            onTargetBourgConsumed={clearTargetBourg}
            onNavigateToBourg={navigateFromCarteToBourg}
            playerMode={playerMode}
            viewerClan={viewerClan}
          />
        );

      case 'lieux':
        return (
          <LieuxTable
            onNavigateToCarte={navigateToCarteFromLieu}
            playerMode={playerMode}
            viewerClan={viewerClan}
          />
        );

      case 'bourgs':
        return (
          <BourgsTable
            onNavigateToCarte={navigateToCarteFromBourg}
            onNavigateToPersonnage={navigateToPersonnage}
            initialBourgId={targetBourgDetailId}
            onInitialBourgConsumed={() => setTargetBourgDetailId(null)}
          />
        );

      case 'clans':
        return (
          <ClansTable
            onNavigateToGenealogie={navigateToGenealogie}
            onNavigateToPersonnage={navigateToPersonnage}
            playerMode={playerMode}
          />
        );

      case 'genealogie':
        if (playerMode) return <Home onNavigate={navigate} />;
        return (
          <Genealogie
            clanId={genealogieClan?.id}
            clanLabel={genealogieClan?.label}
            onNavigateToPersonnage={navigateToPersonnage}
            onBack={() => setCurrentPage('clans')}
            playerMode={playerMode}
          />
        );

      case 'chronologie':
        return <Chronologie />;

      case 'influences':
        return (
          <Influences
            playerMode={isPlayer(mode)}
            viewerClan={isPlayer(mode) ? mode : null}
          />
        );

      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="app">
      {!selectedPersonnageId && (
        <Navigation
          currentPage={currentPage}
          onNavigate={navigate}
          mode={mode}
          onLogout={logout}
        />
      )}
      <main className={`main-content ${selectedPersonnageId ? 'fullscreen' : ''}`}>
        {renderPage()}
      </main>
    </div>
  );
}

// ─── Root: wrap everything in AuthProvider ─────────────
function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
