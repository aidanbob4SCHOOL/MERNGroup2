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

  function openUploadPicker(): void {
    fileInputRef.current?.click();
  }

  function resetFlow(): void {
    setIdentifiedBird(null);
    setUploadError('');
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
      const responseError = data?.error || (!response.ok ? 'BirdBrain could not identify that image.' : '');

      if (responseError) {
        setUploadError(responseError);
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

  function handleLogBird(): void {
    if (!identifiedBird) {
      return;
    }

    // Placeholder for the future logging API call.
    // eslint-disable-next-line no-console
    console.info('TODO: log identified bird', identifiedBird);
  }

  const identifiedImageSrc = identifiedBird
    ? `/images/birds/${encodeURIComponent(identifiedBird.name)}.jpg`
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

