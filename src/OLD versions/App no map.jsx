import { useState } from 'react';
import Navigation from './components/Navigation';
import Home from './components/Home';
import PersonnagesListe from './components/PersonnagesListe';
import './App.css';

function App() {
  // État pour savoir quelle page afficher
  const [currentPage, setCurrentPage] = useState('home');

  // Fonction pour changer de page
  const handleNavigate = (page) => {
    console.log('📍 Navigation vers:', page);
    setCurrentPage(page);
  };

  // Fonction pour afficher la bonne page selon currentPage
  const renderPage = () => {
    // Switch = comme un "si... alors... sinon..."
    switch (currentPage) {
      case 'home':
        return <Home />;
      
      case 'personnages':
        return <PersonnagesListe />;
      
      case 'clans':
        return (
          <div className="placeholder-page">
            <h1>📜 Clans</h1>
            <p>Page en construction - Les 8 clans de Paris</p>
          </div>
        );
      
      case 'bourgs':
        return (
          <div className="placeholder-page">
            <h1>🏛️ Bourgs</h1>
            <p>Page en construction - Les 22 territoires</p>
          </div>
        );
      
      case 'carte':
        return (
          <div className="placeholder-page">
            <h1>🗺️ Carte Interactive</h1>
            <p>Page en construction - La carte de Paris</p>
          </div>
        );
      
      default:
        return <Home />;
    }
  };

  return (
    <div className="app">
      {/* Menu de navigation à gauche */}
      <Navigation 
        onNavigate={handleNavigate} 
        currentPage={currentPage} 
      />
      
      {/* Contenu principal à droite */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
