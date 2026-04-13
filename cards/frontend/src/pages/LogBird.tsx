import React, { ChangeEvent, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Link, useNavigate } from 'react-router-dom';
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

const SERVER_MAX_UPLOAD_BYTES = 1024 * 1024;
const COMPRESS_THRESHOLD_BYTES = SERVER_MAX_UPLOAD_BYTES;
const MAX_INPUT_BYTES = 30 * 1024 * 1024;

function LogBird(): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingUpload, setIsPreparingUpload] = useState(false);
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

  async function compressImageForUpload(file: File): Promise<File> {
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: 0.95,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.82,
    });

    return new File([compressedBlob], file.name, {
      type: compressedBlob.type || file.type,
      lastModified: Date.now(),
    });
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file.');
      return;
    }

    if (file.size > MAX_INPUT_BYTES) {
      setUploadError('Image is too large. Please use an image under 30MB before upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      let uploadFile = file;

      if (file.size >= COMPRESS_THRESHOLD_BYTES) {
        setIsPreparingUpload(true);
        try {
          uploadFile = await compressImageForUpload(file);
        } finally {
          setIsPreparingUpload(false);
        }
      }

      if (uploadFile.size > SERVER_MAX_UPLOAD_BYTES) {
        setUploadError('Image is still too large for the server limit (1MB). Please crop or resize and try again.');
        setIdentifiedBird(null);
        return;
      }

      const formData = new FormData();
      formData.append('image', uploadFile, uploadFile.name);

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
      setIsPreparingUpload(false);
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
        navigate('/floridex');
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

            <p className="identified-note">
              If this looks incorrect, you can manually log a bird from the{' '}
              <Link to="/floridex">main Floridex page</Link>.
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
              {isPreparingUpload ? 'Preparing...' : (isUploading ? 'Identifying...' : 'Upload')}
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

