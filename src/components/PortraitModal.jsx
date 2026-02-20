import React from 'react';
import './PortraitModal.css';

function PortraitModal({ imageUrl, personnageName, onClose }) {
  // Fermer en cliquant sur l'overlay ou Échap
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Fermer avec Échap
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="portrait-modal" onClick={handleOverlayClick}>
      <button className="portrait-close" onClick={onClose}>
        ✕
      </button>

      <div className="portrait-container">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={personnageName} 
            className="portrait-image"
          />
        ) : (
          <div className="portrait-placeholder">
            <span className="placeholder-icon">🧛</span>
            <p className="placeholder-text">Portrait non disponible</p>
          </div>
        )}
      </div>

      <div className="portrait-footer">
        <p className="portrait-hint">Cliquer n'importe où ou appuyer sur Échap pour fermer</p>
      </div>
    </div>
  );
}

export default PortraitModal;
