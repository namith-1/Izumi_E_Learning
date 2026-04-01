import React from 'react';
import MagazineWiki from './magazineWiki'; // Same folder import
import './magazine.css'; 

const Magazine = () => {
  const articles = [
    { title: "Quantum_computing", tall: true },
    { title: "SpaceX", tall: false },
    { title: "Artificial_intelligence", tall: false },
    { title: "Great_Barrier_Reef", tall: true },
    { title: "Renaissance_art", tall: false },
    { title: "Cyberpunk", tall: false },
    { title: "Electric_vehicle", tall: true },
    { title: "Coffee", tall: false },
    { title: "Architecture", tall: false },
  ];

  return (
    <div className="magazine-page-container">
      <div className="dashboard-intro">
        <h1 className="mag-title">Izumi Explore</h1>
        <p className="mag-subtitle">Curated knowledge snippets for your BTP research.</p>
      </div>

      <div className="explore-grid">
        {articles.map((art, index) => (
          <MagazineWiki 
            key={index} 
            wikiTitle={art.title} 
            isTall={art.tall} 
          />
        ))}
      </div>
    </div>
  );
};

export default Magazine;