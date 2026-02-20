import { useState } from 'react';
import Navigation from './components/Navigation';
import Home from './components/Home';
import PersonnagesTable from './components/PersonnagesTable';
import PersonnageDetail from './components/PersonnageDetail';
import Carte from './components/Carte';
import LieuxTable from './components/LieuxTable';
import BourgsTable from './components/BourgsTable';
import ClansTable from './components/ClansTable';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPersonnageId, setSelectedPersonnageId] = useState(null);

  // LieuxTable → Carte: highlight a lieu marker
  const [targetLieuId, setTargetLieuId] = useState(null);

  // BourgsTable → Carte: highlight a bourg polygon OR a lieu marker
  const [targetBourgId, setTargetBourgId] = useState(null);

  // Navigate from LieuxTable row → Carte (existing pattern)
  const navigateToCarteFromLieu = (lieuId) => {
    setTargetLieuId(lieuId);
    setTargetBourgId(null);
    setCurrentPage('carte');
  };

  // Navigate from BourgsTable → Carte
  // bourgId: fly to bourg polygon (null if souterrain/no polygon)
  // lieuId:  fly to a specific lieu marker inside that bourg (optional)
  const navigateToCarteFromBourg = (bourgId, lieuId = null) => {
    setTargetBourgId(bourgId);
    setTargetLieuId(lieuId);
    setCurrentPage('carte');
  };

  // BourgsTable → PersonnageDetail
  const navigateToPersonnage = (personnageId) => {
    setSelectedPersonnageId(personnageId);
  };

  // Carte bourg popup → BourgsTable detail page
  const [targetBourgDetailId, setTargetBourgDetailId] = useState(null);

  const navigateFromCarteToBourg = (bourgId) => {
    setTargetBourgDetailId(bourgId);
    setCurrentPage('bourgs');
  };

  // Callbacks to clear consumed targets
  const clearTargetLieu = () => setTargetLieuId(null);
  const clearTargetBourg = () => setTargetBourgId(null);

  const renderPage = () => {
    if (selectedPersonnageId) {
      return (
        <PersonnageDetail
          personnageId={selectedPersonnageId}
          onClose={() => setSelectedPersonnageId(null)}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return <Home />;

      case 'personnages':
        return (
          <PersonnagesTable
            onSelectPersonnage={(id) => setSelectedPersonnageId(id)}
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
          />
        );

      case 'lieux':
        return (
          <LieuxTable
            onNavigateToCarte={navigateToCarteFromLieu}
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
        return <ClansTable />;

      default:
        return <Home />;
    }
  };

  return (
    <div className="app">
      {!selectedPersonnageId && (
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      )}
      <main className={`main-content ${selectedPersonnageId ? 'fullscreen' : ''}`}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
