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
import LieuDetail from './components/LieuDetail';
import './components/theme-day.css';
import { AuthProvider, useAuth, isMJ, isGuest, HIDDEN_PERSONNAGE_IDS } from './components/AuthContext';
import './App.css';

// ─── Inner app (has access to auth context) ───────────────
function AppInner() {
  const { mode, joueur, logout } = useAuth();

  const [currentPage, setCurrentPage]                   = useState('home');
  const [selectedPersonnageId, setSelectedPersonnageId] = useState(null);
  const [selectedLieuId, setSelectedLieuId]             = useState(null);
  const [targetLieuId, setTargetLieuId]                 = useState(null);
  const [targetBourgId, setTargetBourgId]               = useState(null);
  const [targetBourgDetailId, setTargetBourgDetailId]   = useState(null);
  const [genealogieClan, setGenealogieClan]             = useState(null);
  const [selectedCampagne, setSelectedCampagne]         = useState(null);

  // Not logged in → show login screen
  if (!mode) return <LoginScreen />;

  // ── Auth mode resolution ────────────────────────────────
  const isCampagneMode = mode === 'campagne';
  // viewerClan: used to restrict visible data to a single clan
  // — for campagne joueurs, read from joueur.clan_id
  const viewerClan = isCampagneMode ? (joueur?.clan_id ?? null) : null;
  // playerMode: true for anyone who isn't MJ
  const playerMode = !isMJ(mode);

  // ── Navigation helpers ──────────────────────────────────
  const navigateToCarteFromLieu = (lieuId) => {
    setSelectedLieuId(null);
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

  const navigate = (page) => {
    setSelectedPersonnageId(null);
    setSelectedLieuId(null);
    setCurrentPage(page);
  };

  // ── PersonnageDetail ────────────────────────────────────
  const renderPersonnageDetail = (id) => (
    <PersonnageDetail
      personnageId={id}
      onClose={() => setSelectedPersonnageId(null)}
      playerMode={playerMode}
      viewerClan={viewerClan}
      joueur={joueur}
      selectedCampagne={selectedCampagne}
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
            joueur={joueur}
            selectedCampagne={selectedCampagne}
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
            onSelectLieu={setSelectedLieuId}
            playerMode={playerMode}
            viewerClan={viewerClan}
            joueur={joueur}
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
            playerMode={playerMode}
            viewerClan={viewerClan}
          />
        );

      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="app">
      <Navigation
        currentPage={currentPage}
        onNavigate={navigate}
        mode={mode}
        joueur={joueur}
        onLogout={logout}
        onCampagneChange={setSelectedCampagne}
      />
      <main className="main-content">
        {renderPage()}
      </main>
      {selectedLieuId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          left: 'var(--nav-width, 280px)',
          zIndex: 500,
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #0d0a0b 0%, #1a1517 100%)',
        }}>
          <LieuDetail
            lieuId={selectedLieuId}
            onClose={() => setSelectedLieuId(null)}
            onNavigateToCarte={navigateToCarteFromLieu}
            playerMode={playerMode}
            viewerClan={viewerClan}
            joueur={joueur}
            selectedCampagne={selectedCampagne}
          />
        </div>
      )}
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
