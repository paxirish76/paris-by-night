import { useState } from 'react';
import Navigation from './components/Navigation';
import Home from './components/Home';
import PersonnagesListe from './components/PersonnagesListe';
import Carte from './components/Carte';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'personnages':
        return <PersonnagesListe />;
      case 'carte':
        return <Carte />;
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
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
