import React, { useCallback, useRef, useState } from 'react';
import styles from './IngestionDemo.module.css';
import { checkAiEngineHealth, ingestPdf, IngestResponse } from '../../utils/aiEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface HealthBadgeProps {
  status: 'checking' | 'online' | 'offline';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HealthBadge({ status }: HealthBadgeProps) {
  const labels: Record<HealthBadgeProps['status'], string> = {
    checking: 'Checking backend…',
    online: 'Backend Online',
    offline: 'Backend Offline',
  };
  return (
    <span
      id="ai-engine-health-badge"
      className={`${styles.healthBadge} ${styles[`healthBadge--${status}`]}`}
      aria-live="polite"
    >
      <span className={styles.healthDot} />
      {labels[status]}
    </span>
  );
}

function ResponseSummary({ data }: { data: IngestResponse }) {
  return (
    <div id="ingest-response-summary" className={styles.responseSummary}>
      <h3 className={styles.responseTitle}>✓ Extraction Complete</h3>

      <div className={styles.responseGrid}>
        {/* Metadata */}
        <div className={styles.responseCard}>
          <p className={styles.responseCardLabel}>Metadata</p>
          {Object.entries(data.metadata).filter(([, v]) => v).length === 0 ? (
            <p className={styles.responseEmpty}>No metadata found</p>
          ) : (
            <ul className={styles.responseList}>
              {Object.entries(data.metadata)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <li key={k}>
                    <span className={styles.responseKey}>{k}:</span> {v}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Headers */}
        <div className={styles.responseCard}>
          <p className={styles.responseCardLabel}>
            Headings ({data.headers.length})
          </p>
          {data.headers.length === 0 ? (
            <p className={styles.responseEmpty}>None detected</p>
          ) : (
            <ul className={styles.responseList}>
              {data.headers.slice(0, 8).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
              {data.headers.length > 8 && (
                <li className={styles.responseMore}>
                  +{data.headers.length - 8} more…
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Body text preview */}
        <div className={`${styles.responseCard} ${styles.responseCardWide}`}>
          <p className={styles.responseCardLabel}>
            Body Text ({data.body_text.length.toLocaleString()} chars)
          </p>
          <p className={styles.responseBodyPreview}>
            {data.body_text.slice(0, 400) || '(empty)'}
            {data.body_text.length > 400 && '…'}
          </p>
        </div>

        {/* Images */}
        <div className={styles.responseCard}>
          <p className={styles.responseCardLabel}>
            Images ({data.images.length})
          </p>
          {data.images.length === 0 ? (
            <p className={styles.responseEmpty}>No images found</p>
          ) : (
            <div className={styles.imageThumbs}>
              {data.images.slice(0, 4).map((img, i) => (
                <img
                  key={i}
                  src={`data:image/${img.ext};base64,${img.data}`}
                  alt={`Page ${img.page} image ${img.index + 1}`}
                  className={styles.imageThumb}
                />
              ))}
              {data.images.length > 4 && (
                <span className={styles.imageMore}>
                  +{data.images.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Key takeaways */}
        <div className={styles.responseCard}>
          <p className={styles.responseCardLabel}>
            Key Takeaways ({data.key_takeaways.length})
          </p>
          {data.key_takeaways.length === 0 ? (
            <p className={styles.responseEmpty}>None extracted</p>
          ) : (
            <ul className={styles.responseList}>
              {data.key_takeaways.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Glossary */}
        <div className={styles.responseCard}>
          <p className={styles.responseCardLabel}>
            Glossary ({Object.keys(data.glossary).length} terms)
          </p>
          {Object.keys(data.glossary).length === 0 ? (
            <p className={styles.responseEmpty}>No terms extracted</p>
          ) : (
            <ul className={styles.responseList}>
              {Object.entries(data.glossary).map(([term, def]) => (
                <li key={term}>
                  <span className={styles.responseKey}>{term}:</span> {def}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Narration Script */}
        {data.narration_script && (
          <div className={`${styles.responseCard} ${styles.responseCardWide}`}>
            <p className={styles.responseCardLabel}>Narration Script</p>
            <p className={styles.responseBodyPreview} style={{ maxHeight: '160px' }}>
              {data.narration_script}
            </p>
          </div>
        )}
      </div>

      {/* Raw JSON toggle */}
      <details className={styles.rawJson}>
        <summary>View raw JSON response</summary>
        <pre id="ingest-raw-json">
          {JSON.stringify(
            { ...data, images: `[${data.images.length} image(s) omitted]` },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IngestionDemo() {
  const [healthStatus, setHealthStatus] = useState<
    'checking' | 'online' | 'offline'
  >('checking');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [response, setResponse] = useState<IngestResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Health check on mount
  React.useEffect(() => {
    checkAiEngineHealth().then((ok) =>
      setHealthStatus(ok ? 'online' : 'offline')
    );
  }, []);

  const processFile = useCallback(async (file: File) => {
    // Validate
    if (file.type !== 'application/pdf') {
      setErrorMsg(
        `"${file.name}" is not a PDF. Only PDF files are supported at this time.`
      );
      setUploadStatus('error');
      return;
    }

    setUploadStatus('loading');
    setErrorMsg(null);
    setResponse(null);

    try {
      const result = await ingestPdf(file);
      setResponse(result);
      setUploadStatus('success');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(msg);
      setUploadStatus('error');
    }
  }, []);

  // Drag handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setErrorMsg(null);
    setResponse(null);
  };

  return (
    <div className={styles.demoSection} id="module-a-demo">
      {/* Section header */}
      <div className={styles.demoHeader}>
        <span className={styles.demoTag}>MODULE A · DEMO</span>
        <div className={styles.demoTitleRow}>
          <h2 className={styles.demoTitle}>Upload Raw Asset</h2>
          <HealthBadge status={healthStatus} />
        </div>
        <p className={styles.demoSubtitle}>
          Drop a PDF file. The AI engine will extract headers, body text,
          images, metadata, key takeaways, glossary, and a narration
          script — all grounded strictly in the document&rsquo;s own text.
        </p>
      </div>

      {/* Drop zone */}
      {uploadStatus !== 'success' && (
        <div
          id="pdf-drop-zone"
          role="button"
          tabIndex={0}
          aria-label="Drop a PDF file here or click to browse"
          className={`${styles.dropZone} ${dragActive ? styles.dropZoneDragging : ''} ${uploadStatus === 'loading' ? styles.dropZoneLoading : ''} ${uploadStatus === 'error' ? styles.dropZoneError : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => uploadStatus !== 'loading' && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
        >
          <input
            ref={inputRef}
            id="pdf-file-input"
            type="file"
            accept="application/pdf,.pdf"
            className={styles.hiddenInput}
            onChange={onFileChange}
            disabled={uploadStatus === 'loading'}
            aria-hidden="true"
          />

          {uploadStatus === 'loading' ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} aria-hidden="true" />
              <p className={styles.dropText}>Uploading &amp; processing PDF…</p>
              <p className={styles.dropHint}>
                This may take a few seconds for large files.
              </p>
            </div>
          ) : (
            <div className={styles.idleState}>
              <div className={styles.uploadIcon} aria-hidden="true">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className={styles.dropText}>
                Drag &amp; drop or{' '}
                <span className={styles.browseLink}>browse</span>
              </p>
              <p className={styles.dropHint}>Supported · PDF only · Max 10 MB</p>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {uploadStatus === 'error' && (
        <div
          id="upload-error-message"
          className={styles.errorBanner}
          role="alert"
        >
          <span className={styles.errorIcon}>⚠</span>
          <span>{errorMsg}</span>
          <button
            id="upload-retry-btn"
            className={styles.retryBtn}
            onClick={resetUpload}
          >
            Try again
          </button>
        </div>
      )}

      {/* Success state */}
      {uploadStatus === 'success' && response && (
        <>
          <ResponseSummary data={response} />
          <button
            id="upload-another-btn"
            className={styles.uploadAnotherBtn}
            onClick={resetUpload}
          >
            Upload another PDF
          </button>
        </>
      )}
    </div>
  );
}
