import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Home from './components/Home';
import PersonnagesListe from './components/PersonnagesListe';
import PersonnageDetail from './components/PersonnageDetail';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPersonnageId, setSelectedPersonnageId] = useState(null);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setSelectedPersonnageId(null); // Reset personnage sélectionné
  };

  const handleSelectPersonnage = (id) => {
    setSelectedPersonnageId(id);
    setCurrentPage('personnage-detail');
  };

  const handleBackToList = () => {
    setSelectedPersonnageId(null);
    setCurrentPage('personnages');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      
      case 'personnages':
        return <PersonnagesListe onSelectPersonnage={handleSelectPersonnage} />;
      
      case 'personnage-detail':
        return (
          <PersonnageDetail 
            personnageId={selectedPersonnageId} 
            onBack={handleBackToList}
          />
        );
      
      case 'clans':
        return (
          <div className="placeholder-page">
            <h1>📜 Clans</h1>
            <p>Page en construction - Les 8 clans de Paris seront affichés ici</p>
          </div>
        );
      
      case 'bourgs':
        return (
          <div className="placeholder-page">
            <h1>🏛️ Bourgs</h1>
            <p>Page en construction - Les 21 bourgs du Domaine seront affichés ici</p>
          </div>
        );
      
      case 'carte':
        return (
          <div className="placeholder-page">
            <h1>🗺️ Carte Interactive</h1>
            <p>Page en construction - La carte de Paris by Night sera intégrée ici</p>
          </div>
        );
      
      default:
        return <Home />;
    }
  };

  return (
    <div className="app">
      <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
