import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">
          Paris by Night
        </h1>
        <p className="home-tagline">Domaine de François Villon, Prince de Paris</p>
        <div className="home-divider"></div>
      </div>

      <div className="home-stats">
        <div className="stat-card">
          <div className="stat-number">100</div>
          <div className="stat-label">Vampires</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">8</div>
          <div className="stat-label">Clans</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">21</div>
          <div className="stat-label">Bourgs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">1</div>
          <div className="stat-label">Prince</div>
        </div>
      </div>

      <div className="home-content">
        <section className="home-section">
          <h2 className="section-title">L'Anomalie</h2>
          <p className="section-text">
            Sous la Tour Eiffel dort Malkav, l'Antédiluvien dont la présence psychique 
            influence le Domaine de Paris. Cette force, connue sous le nom de "l'Anomalie", 
            façonne la politique vampirique de la capitale depuis des siècles.
          </p>
        </section>

        <section className="home-section">
          <h2 className="section-title">Le Règne de Villon</h2>
          <p className="section-text">
            Depuis 1799, François Villon règne sur Paris, instaurant une Pax Toreador 
            après les chaos de la Révolution. Sa cour raffinée et sa diplomatie ont 
            stabilisé la Mascarade, mais des tensions persistent entre les clans.
          </p>
        </section>

        <section className="home-section">
          <h2 className="section-title">Les Règles du Domaine</h2>
          <div className="rules-list">
            <div className="rule-item">
              <span className="rule-icon">⚖️</span>
              <span className="rule-text">Mascarade Absolue</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🚫</span>
              <span className="rule-text">Interdiction du Sabbat</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">📚</span>
              <span className="rule-text">Droit de Chasse du Chantry</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">👑</span>
              <span className="rule-text">Neutralité de Versailles</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
