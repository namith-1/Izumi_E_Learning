import React, { useState, useEffect } from 'react';

const MagazineWiki = ({ wikiTitle, isTall = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWiki = async () => {
      try {
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
        );
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Wiki fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWiki();
  }, [wikiTitle]);

  if (loading) return <div className="explore-placeholder animate-pulse" />;
  if (!data || data.type === 'error') return null;

  // Consistent seeded image logic
  const imageUrl = `https://picsum.photos/seed/${wikiTitle}/${isTall ? '400/600' : '400/400'}`;

  return (
    <a 
      href={data.content_urls?.desktop?.page || "#"} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`explore-card ${isTall ? 'tall' : ''}`}
    >
      <img src={imageUrl} alt={data.title} className="explore-image" />
      <div className="explore-overlay">
        <div className="explore-text">
          <span className="explore-tag">Discover</span>
          <h3>{data.title}</h3>
          <p>{data.extract ? data.extract.substring(0, 60) + '...' : 'Read more'}</p>
        </div>
      </div>
    </a>
  );
};

export default MagazineWiki;