import React, { useEffect } from 'react';
import './BirdModal.css';

interface Sighting {
  date?: string;
  city?: string;
}

interface Bird {
  id: number;
  name: string;
  color: string;
  image: string;
  order: string;
  family: string;
  genus: string;
  species: string;
}

interface BirdModalProps {
  bird: Bird | null;
  isSeen: boolean;
  sighting?: Sighting;
  onClose: () => void;
  onToggleSeen: (id: number) => void;
}

export default function BirdModal({
  bird,
  isSeen,
  sighting,
  onClose,
  onToggleSeen,
}: BirdModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!bird) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [bird, onClose]);

  // Don't render anything when no bird is selected
  if (!bird) return null;

  return (
    <div
      id="modal-overlay"
      className="open"
      onClick={(e) => {
        // Close when clicking the backdrop (not the modal itself)
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${bird.name} details`}
    >
      <div id="modal">
        {/* ✕ close button — absolute top-right */}
        <button id="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* ── Header bar: name + FOUND / NOT FOUND badge ── */}
        <div id="modal-header">
          <div id="modal-title">{bird.name}</div>
          <div
            id="modal-status"
            className={isSeen ? 'found' : 'not-found'}
          >
            {isSeen ? 'FOUND' : 'NOT FOUND'}
          </div>
        </div>

        {/* ── Body: photo left, taxonomy right ── */}
        <div id="modal-body">
          <img
            id="modal-img"
            src={bird.image}
            alt={bird.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://via.placeholder.com/210x170?text=No+Image';
            }}
          />

          <div id="modal-info">
            <div className="tax-line">
              <strong>Order:</strong> {bird.order}
            </div>
            <div className="tax-line">
              <strong>Family:</strong> {bird.family}
            </div>
            <div className="tax-line">
              <strong>Genus:</strong> {bird.genus}
            </div>
            <div className="tax-line">
              <strong>Species:</strong> <em>{bird.species}</em>
            </div>

            {/* Sighting info — date and city */}
            <div id="modal-sighting">
              <div className="s-line">
                <strong>Date Found:</strong>{' '}
                <span className="sighting-val">{sighting?.date || 'N/A'}</span>
              </div>
              <div className="s-line">
                <strong>City Found:</strong>{' '}
                <span className="sighting-val">{sighting?.city || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer CTA: red = mark found, grey = mark not found ── */}
        <button
          id="modal-footer"
          className={isSeen ? 'seen-footer' : ''}
          onClick={() => onToggleSeen(bird.id)}
        >
          <span id="modal-footer-label">
            {isSeen ? 'MARK AS NOT FOUND' : 'MARK AS FOUND'}
          </span>
        </button>
      </div>
    </div>
  );
}
