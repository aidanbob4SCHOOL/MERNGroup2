import React, { ChangeEvent, useRef, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LogBird.css';

interface IdentifyBirdResponse {
  error: string;
  id: string;
  index: number;
  name: string;
  image: string;
  color: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  aiConfidenceScore: number;
}

function LogBird(): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [identifiedBird, setIdentifiedBird] = useState<IdentifyBirdResponse | null>(null);
  const [foundDate, setFoundDate] = useState('');
  const [foundCity, setFoundCity] = useState('');

  function openUploadPicker(): void {
    fileInputRef.current?.click();
  }

  function resetFlow(): void {
    setIdentifiedBird(null);
    setUploadError('');
    setFoundDate('');
    setFoundCity('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/identify-birds', {
        method: 'POST',
        body: formData,
      });

      const data: IdentifyBirdResponse = await response.json();
      const responseError = data.error || (!response.ok ? 'BirdBrain could not identify that image.' : '');

      if (responseError || !data.name || !data.image) {
        setUploadError(responseError || 'BirdBrain response is missing bird details.');
        setIdentifiedBird(null);
        return;
      }

      setIdentifiedBird(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'BirdBrain could not identify that image.';
      setUploadError(message);
      setIdentifiedBird(null);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleLogBird(): Promise<void> {
    if (!identifiedBird) {
      return;
    }

    const userId = localStorage.getItem('userID');
    if (!userId) {
      setUploadError('User not logged in.');
      return;
    }

    try {
      const response = await fetch('/api/save-bird', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          birdId: identifiedBird.index,
          foundDate: foundDate.trim() || undefined,
          foundCity: foundCity.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.error) {
        setUploadError(data.error);
      } else {
        // Success, perhaps show message or reset
        setUploadError('');
        resetFlow();
      }
    } catch (error) {
      setUploadError('Failed to log bird.');
    }
  }

  const identifiedImageSrc = identifiedBird
    ? identifiedBird.image
    : '';

  return (
    <div className="log-bird-page">
      <Header />

      <main className="log-bird-main">
        {identifiedBird ? (
          <section className="identified-state" aria-live="polite">
            <img
              className="identified-bird-image"
              src={identifiedImageSrc}
              alt={identifiedBird.name}
            />

            <div className="identified-sighting-fields">
              <label className="identified-field-row">
                <span className="identified-field-label">Date Found:</span>
                <input
                  className="identified-field-input"
                  type="date"
                  value={foundDate}
                  onChange={(e) => setFoundDate(e.target.value)}
                />
              </label>

              <label className="identified-field-row">
                <span className="identified-field-label">City Found:</span>
                <input
                  className="identified-field-input"
                  type="text"
                  placeholder="e.g. Orlando"
                  value={foundCity}
                  onChange={(e) => setFoundCity(e.target.value)}
                />
              </label>
            </div>

            <div className="identified-actions">
              <button type="button" className="action-btn log-btn" onClick={handleLogBird}>
                Log
              </button>
              <button type="button" className="action-btn cancel-btn" onClick={resetFlow}>
                Cancel
              </button>
            </div>

            <p className="identified-text">
              BIRDBRAIN identified this as a {identifiedBird.name}
            </p>

            {uploadError && <p className="upload-error">{uploadError}</p>}
          </section>
        ) : (
          <section className="default-state" aria-live="polite">
            <div className="compare-row">
              <figure className="bird-example">
                <img
                  className="example-image greyed"
                  src="/images/Florida-Scrub-Jay.jpg"
                  alt="Florida Scrub Jay greyscale"
                />
              </figure>

              <div className="log-bird-arrow" aria-hidden="true">&rarr;</div>

              <figure className="bird-example">
                <img
                  className="example-image"
                  src="/images/Florida-Scrub-Jay.jpg"
                  alt="Florida Scrub Jay color"
                />
                <figcaption>Florida Scrub Jay</figcaption>
              </figure>
            </div>

            <p className="upload-help">
              Upload a photo of a bird
              <br />
              to have BIRDBRAIN attempt to identify it
            </p>

            <button
              type="button"
              className="upload-btn"
              onClick={openUploadPicker}
              disabled={isUploading}
            >
              {isUploading ? 'Identifying...' : 'Upload'}
            </button>

            {uploadError && <p className="upload-error">{uploadError}</p>}
          </section>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="file-input"
        />
      </main>

      <Footer />
    </div>
  );
}

export default LogBird;

