import { useState } from 'react';
import Navigation from './components/Navigation';
import Home from './components/Home';
import PersonnagesTable from './components/PersonnagesTable';
import PersonnageDetail from './components/PersonnageDetail';
import Carte from './components/Carte';
import LieuxTable from './components/LieuxTable';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPersonnageId, setSelectedPersonnageId] = useState(null);
  // When navigating from LieuxTable → Carte, store the target lieu id
  const [targetLieuId, setTargetLieuId] = useState(null);

  // Navigate to carte and pre-select a lieu
  const navigateToCarte = (lieuId) => {
    setTargetLieuId(lieuId);
    setCurrentPage('carte');
  };

  // Once Carte has consumed the target, clear it
  const clearTargetLieu = () => setTargetLieuId(null);

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
            onTargetConsumed={clearTargetLieu}
          />
        );

      case 'lieux':
        return (
          <LieuxTable
            onNavigateToCarte={navigateToCarte}
          />
        );

      case 'clans':
        return (
          <div className="placeholder-page">
            <h1>🎭 Clans</h1>
            <p>Page en construction...</p>
          </div>
        );

      case 'bourgs':
        return (
          <div className="placeholder-page">
            <h1>🏰 Bourgs</h1>
            <p>Page en construction...</p>
          </div>
        );

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
