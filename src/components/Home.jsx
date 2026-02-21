import React from 'react';
import './Home.css';

function Home({ onNavigate }) {
  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">Paris by Night</h1>
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
          <div className="stat-number">22</div>
          <div className="stat-label">Bourgs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">1</div>
          <div className="stat-label">Prince</div>
        </div>
      </div>

      <div className="home-content">
        <section className="home-section">
          <h2 className="section-title">Histoire Mortelle</h2>
          <p className="section-text">
            Paris naît comme cité gallo-romaine sous le nom de <strong>Lutèce</strong>, puis devient
            progressivement un centre politique majeur. En <strong>508</strong>, Clovis en fait la
            capitale du royaume franc, ouvrant une longue période de croissance religieuse,
            commerciale et intellectuelle. Le Moyen Âge voit la construction de Notre‑Dame,
            l'essor de l'Université, et l'expansion d'une ville fortifiée traversée par les
            tensions entre royauté, noblesse et bourgeoisie.
          </p>
          <p className="section-text">
            Aux <strong>XIVᵉ et XVᵉ siècles</strong>, la peste noire, les révoltes urbaines et la{' '}
            <strong>Guerre de Cent Ans</strong> éprouvent Paris. L'époque moderne apporte des
            transformations profondes : centralisation monarchique, surveillance accrue,
            urbanisation, puis les Lumières qui préparent les bouleversements à venir.
          </p>
          <p className="section-text">
            La <strong>Révolution française (1789)</strong> renverse l'ordre ancien, suivie par
            l'ascension de <strong>Napoléon Bonaparte</strong> en <strong>1799</strong>, qui
            réorganise l'État et stabilise la nation. Le XIXᵉ siècle est marqué par l'instabilité
            politique (1830, 1848, 1871), l'industrialisation et la transformation haussmannienne.
            Enfin, les guerres mondiales secouent Paris sans toutefois briser son rôle de capitale
            culturelle, scientifique et politique de la France.
          </p>
        </section>

        <section className="home-section">
          <h2 className="section-title">Histoire Vampirique</h2>
          <p className="section-text">
            Dans l'ombre de l'histoire humaine, Paris est façonnée par les intrigues nocturnes.
            En <strong>508</strong>, le Ventrue de 4ᵉ génération <strong>Alexander</strong> devient
            le premier Prince de Paris, imposant une autorité quasi absolue et jetant les bases
            d'une Mascarade primitive. À partir du XIIIᵉ siècle, la montée de l'Inquisition force
            les vampires parisiens à adopter une discrétion extrême, bien avant la fondation
            officielle de la Camarilla.
          </p>
          <p className="section-text">
            La <strong>Guerre de Cent Ans</strong> se double d'un conflit surnaturel entre
            lignées françaises et anglaises, culminant avec la révolte anarch de{' '}
            <strong>1358</strong>, brutalement écrasée par Alexander. En <strong>1438</strong>, une
            attaque de loups‑garous met la ville en péril avant d'être repoussée. L'instauration
            d'un éclairage public en <strong>1667</strong> chasse les Nosferatu et Malkaviens des
            rues pour les reléguer aux entrailles de Paris.
          </p>
          <p className="section-text">
            La <strong>Révolution de 1789</strong> déclenche un assaut conjoint des Anarchs et du
            Sabbat : la domination millénaire d'Alexander s'effondre, et il disparaît dans
            l'ombre. En <strong>1799</strong>, avec l'ordre napoléonien naissant,{' '}
            <strong>François Villon</strong> reprend la cité et devient Prince. Le XIXᵉ siècle
            reste agité par plusieurs soulèvements anarchs, tous écrasés, jusqu'à la grande
            Commune de <strong>1871</strong>. En <strong>1889</strong>, l'Exposition universelle
            sert de cadre à un conseil majeur de la Camarilla. Les guerres mondiales n'apportent
            que des perturbations mineures, les maîtres de la nuit conservant leur emprise sur
            Paris.
          </p>
        </section>

        <div className="home-timeline-cta">
          <button className="timeline-button" onClick={() => onNavigate('chronologie')}>
            <span className="timeline-button-icon">⏳</span>
            Consulter la Chronologie
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
