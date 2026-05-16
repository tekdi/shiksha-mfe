import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styles from './ai-demo.module.css';

// Load IngestionDemo only on the client (drag-and-drop uses browser APIs)
const IngestionDemo = dynamic(
  () => import('../components/ai-demo/IngestionDemo'),
  { ssr: false }
);

// ─── Static data ─────────────────────────────────────────────────────────────

const modules = [
  {
    id: 'A',
    label: 'Ingestion',
    tags: ['PDF', 'PPT', 'OCR'],
    accent: '#e87722',
    available: true,
  },
  {
    id: 'B',
    label: 'Assessment',
    tags: ['MCQ', 'Match', 'Fill'],
    accent: '#e87722',
    available: false,
  },
  {
    id: 'C',
    label: 'Multimedia',
    tags: ['Whisper', 'VTT', 'H5P'],
    accent: '#e87722',
    available: false,
  },
  {
    id: 'D',
    label: 'Micro-Lesson',
    tags: ['HITL', 'SCORM', 'xAPI'],
    accent: '#e87722',
    available: false,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiDemoPage() {
  return (
    <>
      <Head>
        <title>AI Ingestion Demo · Pluggable AI Microservice Platform</title>
        <meta
          name="description"
          content="Module A demo: upload a PDF to extract structured content via the open-source AI engine powering the Shiksha multi-tenant LMS."
        />
      </Head>

      <div className={styles.page}>
        {/* ── Top nav bar ─────────────────────────────────────────────── */}
        <header className={styles.topBar} role="banner">
          <div className={styles.topBarLeft}>
            <div
              className={styles.c4Logo}
              aria-label="Code for GovTech 2026 logo"
            >
              C4
            </div>
            <div className={styles.topBarText}>
              <span className={styles.topBarTitle}>Code for GovTech 2026</span>
              <span className={styles.topBarSub}>Project Proposal</span>
            </div>
          </div>
          <div className={styles.topBarRight}>
            <span className={styles.topBarMeta}>Submitted: May 2026</span>
            <span className={styles.topBarVersion}>v1.0</span>
          </div>
        </header>

        {/* ── Hero section ────────────────────────────────────────────── */}
        <main className={styles.main} id="main-content">
          <div className={styles.orgBadge} aria-label="Organisation">
            <span className={styles.orgDot} />
            ORGANISATION · TEKDI TECHNOLOGIES
          </div>

          <h1 className={styles.heroTitle}>
            Pluggable AI Microservice Platform{' '}
            <span className={styles.heroAccent}>
              for Multi-Tenant SaaS LMS
            </span>
          </h1>

          <p className={styles.heroSubtitle}>
            An open-source-first AI engine that automates the full educational
            content lifecycle — from raw asset ingestion (PDF, PPT, Video,
            Audio) to publishable interactive micro-learning experiences in{' '}
            <strong>H5P, SCORM 1.2, HTML5, and xAPI</strong> formats.
          </p>

          {/* ── Module cards ──────────────────────────────────────────── */}
          <div className={styles.moduleGrid} role="list" aria-label="AI modules">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className={`${styles.moduleCard} ${!mod.available ? styles.moduleCardDisabled : ''}`}
                role="listitem"
                aria-label={`Module ${mod.id}: ${mod.label}`}
              >
                <div className={styles.moduleCardHeader}>
                  <span
                    className={styles.moduleBadge}
                    style={{ background: mod.accent }}
                    aria-hidden="true"
                  >
                    {mod.id}
                  </span>
                  <span className={styles.moduleLabel}>{mod.label}</span>
                  {!mod.available && (
                    <span className={styles.moduleSoon}>Coming soon</span>
                  )}
                </div>
                <p className={styles.moduleTags}>{mod.tags.join(' · ')}</p>
              </div>
            ))}
          </div>

          {/* ── Divider ───────────────────────────────────────────────── */}
          <hr className={styles.divider} />

          {/* ── Module A demo ─────────────────────────────────────────── */}
          <IngestionDemo />
        </main>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className={styles.footer} role="contentinfo">
          <div className={styles.footerInner}>
            <div className={styles.footerCol}>
              <p className={styles.footerLabel}>CONTRIBUTOR</p>
              <p className={styles.footerName}>Surya Pratap</p>
              <p className={styles.footerMeta}>
                IIIT · Branch: fix/pdf-memory-optimization
              </p>
            </div>

            <div className={styles.footerCol}>
              <p className={styles.footerLabel}>MENTORS</p>
              <p className={styles.footerName}>Siddhi Shinde</p>
              <p className={styles.footerName}>Dnyanesh Kulkarni</p>
            </div>

            <div className={styles.footerCol}>
              <p className={styles.footerLabel}>STACK</p>
              <p className={styles.footerStack}>
                Python 3.11 · FastAPI · Celery
                <br />
                Ollama (Llama 3 8B / Mistral 7B)
                <br />
                <code>Whisper large-v3 · Redis · Nx · Next.js</code>
              </p>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>TEKDI/SHIKSHA-MFE</span>
            <span>DOMAIN · EDUCATION</span>
            <span>PAGE 01</span>
          </div>
        </footer>
      </div>
    </>
  );
}
