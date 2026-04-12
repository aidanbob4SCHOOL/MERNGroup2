import React, { useEffect, useState } from 'react';
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
  onUpdateSighting: (id: number, city?: string, date?: string) => void;
}

export default function BirdModal({
  bird,
  isSeen,
  sighting,
  onClose,
  onToggleSeen,
  onUpdateSighting,
}: BirdModalProps) {
  const [foundCity, setFoundCity] = useState('');
  const [foundDate, setFoundDate] = useState('');

  // Reset inputs whenever a new bird is opened
  useEffect(() => {
    if (!bird) return;
    setFoundCity(sighting?.city ?? '');
    setFoundDate(sighting?.date ?? '');
  }, [bird?.id]);

  // Close on Escape key
  useEffect(() => {
    if (!bird) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [bird, onClose]);

  if (!bird) return null;

  async function handleToggle() {
    const userId = localStorage.getItem('userID');
    if (!userId) {
      alert('User not logged in.');
      return;
    }

    try {
      if (!isSeen) {
        // Saving — send city + date to /api/save-bird
        const response = await fetch('/api/save-bird', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            birdId: bird!.id,
            foundCity: foundCity.trim() || undefined,
            foundDate: foundDate.trim() || undefined,
          }),
        });
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return;
        }
      } else {
        // Unsaving — call /api/delete-saved-bird
        const response = await fetch('/api/delete-saved-bird', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, birdId: bird!.id }),
        });
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return;
        }
      }
      // Success, update parent
      onToggleSeen(bird!.id);
      onUpdateSighting(bird!.id, foundCity.trim() || undefined, foundDate.trim() || undefined);
    } catch (error) {
      alert('Failed to update bird status.');
    }
  }

  return (
    <div
      id="modal-overlay"
      className="open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${bird.name} details`}
    >
      <div id="modal">
        {/* ✕ close button */}
        <button id="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* ── Header: name + FOUND / NOT FOUND badge ── */}
        <div id="modal-header">
          <div id="modal-title">{bird.name}</div>
          <div id="modal-status" className={isSeen ? 'found' : 'not-found'}>
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
            <div className="tax-line"><strong>Order:</strong> {bird.order}</div>
            <div className="tax-line"><strong>Family:</strong> {bird.family}</div>
            <div className="tax-line"><strong>Genus:</strong> {bird.genus}</div>
            <div className="tax-line"><strong>Species:</strong> <em>{bird.species}</em></div>

            {/* Sighting info — editable when not yet seen, read-only when seen */}
            <div id="modal-sighting">
              {isSeen ? (
                <>
                  <div className="s-line">
                    <strong>Date Found:</strong>{' '}
                    <span className="sighting-val">{sighting?.date || 'N/A'}</span>
                  </div>
                  <div className="s-line">
                    <strong>City Found:</strong>{' '}
                    <span className="sighting-val">{sighting?.city || 'N/A'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="s-line">
                    <strong>Date Found:</strong>{' '}
                    <input
                      className="sighting-input"
                      type="date"
                      value={foundDate}
                      onChange={(e) => setFoundDate(e.target.value)}
                    />
                  </div>
                  <div className="s-line">
                    <strong>City Found:</strong>{' '}
                    <input
                      className="sighting-input"
                      type="text"
                      placeholder="e.g. Orlando"
                      value={foundCity}
                      onChange={(e) => setFoundCity(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <button
          id="modal-footer"
          className={isSeen ? 'seen-footer' : ''}
          onClick={handleToggle}
        >
          <span id="modal-footer-label">
            {isSeen ? 'MARK AS NOT FOUND' : 'MARK AS FOUND'}
          </span>
        </button>
      </div>
    </div>
  );
}
