"""
Tests for Module A — AI Engine pipeline
=========================================
Covers:
  - /health endpoint
  - /ingest validation (bad file type, too large)
  - Key-takeaway extraction (TF-IDF extractive)
  - Glossary extraction (noun-phrase heuristic)
  - Narration script fallback (no GROQ_API_KEY)
  - Full ingest pipeline with a synthetic minimal PDF

Run with:
    cd services/ai-engine
    python -m pytest tests/ -v
"""
from __future__ import annotations

import io
import struct
import zlib
from unittest.mock import patch

import fitz  # PyMuPDF
import pytest
from fastapi.testclient import TestClient

from main import (
    app,
    extract_glossary,
    extract_key_takeaways,
    generate_narration_script,
    _build_narration_extractive,
)

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers — create minimal valid in-memory PDFs
# ---------------------------------------------------------------------------

def _make_pdf_bytes(text: str) -> bytes:
    """Create a real single-page PDF containing `text` via PyMuPDF."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        fitz.Point(72, 72),
        text,
        fontsize=12,
    )
    return doc.tobytes()


def _pdf_file(text: str, filename: str = "test.pdf") -> tuple[str, bytes, str]:
    return (filename, _make_pdf_bytes(text), "application/pdf")


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

class TestHealth:
    def test_returns_healthy(self):
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"

    def test_includes_backend_info(self):
        r = client.get("/health")
        data = r.json()
        assert "llm_backend" in data
        assert "spacy_available" in data


# ---------------------------------------------------------------------------
# /ingest — validation
# ---------------------------------------------------------------------------

class TestIngestValidation:
    def test_rejects_non_pdf(self):
        r = client.post(
            "/ingest",
            files={"file": ("doc.txt", b"hello world", "text/plain")},
        )
        assert r.status_code == 400
        assert "PDF" in r.json()["detail"]

    def test_rejects_empty_file(self):
        r = client.post(
            "/ingest",
            files={"file": ("empty.pdf", b"", "application/pdf")},
        )
        # Either 400 (empty file) or 400 (invalid PDF) — both acceptable
        assert r.status_code == 400

    def test_rejects_invalid_pdf_bytes(self):
        r = client.post(
            "/ingest",
            files={"file": ("bad.pdf", b"not a pdf at all", "application/pdf")},
        )
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# /ingest — full pipeline
# ---------------------------------------------------------------------------

SAMPLE_TEXT = (
    "Machine Learning is a subset of Artificial Intelligence that enables "
    "systems to learn from data without being explicitly programmed. "
    "Supervised Learning uses labelled training data to teach models to predict outcomes. "
    "Unsupervised Learning discovers hidden patterns in data without labelled examples. "
    "Neural Networks are computational models inspired by the human brain. "
    "Deep Learning uses multi-layer Neural Networks to learn complex representations. "
    "Feature Engineering involves selecting and transforming raw data into useful inputs. "
    "Model Evaluation measures how well a trained model generalises to new data. "
    "Cross Validation splits data into folds to provide an unbiased performance estimate. "
    "Overfitting occurs when a model memorises training data and fails on unseen examples. "
    "Regularisation techniques like dropout and weight decay reduce overfitting."
)


class TestIngestPipeline:
    def test_successful_ingest_returns_all_fields(self):
        r = client.post(
            "/ingest",
            files={"file": _pdf_file(SAMPLE_TEXT)},
        )
        assert r.status_code == 200
        data = r.json()
        for field in [
            "headers", "body_text", "images", "metadata",
            "key_takeaways", "glossary", "narration_script",
        ]:
            assert field in data, f"Missing field: {field}"

    def test_body_text_is_non_empty(self):
        r = client.post(
            "/ingest",
            files={"file": _pdf_file(SAMPLE_TEXT)},
        )
        data = r.json()
        assert len(data["body_text"]) > 50

    def test_key_takeaways_are_non_empty(self):
        r = client.post(
            "/ingest",
            files={"file": _pdf_file(SAMPLE_TEXT)},
        )
        data = r.json()
        assert len(data["key_takeaways"]) > 0, "Expected at least one key takeaway"

    def test_key_takeaways_are_grounded_in_source(self):
        """Every takeaway must be a substring of the body text (no hallucination)."""
        r = client.post(
            "/ingest",
            files={"file": _pdf_file(SAMPLE_TEXT)},
        )
        data = r.json()
        body = data["body_text"]
        for takeaway in data["key_takeaways"]:
            # The takeaway must share at least 60% of its words with the source
            takeaway_words = set(takeaway.lower().split())
            body_words = set(body.lower().split())
            overlap = takeaway_words & body_words
            ratio = len(overlap) / max(len(takeaway_words), 1)
            assert ratio > 0.6, (
                f"Takeaway appears hallucinated (overlap {ratio:.0%}): {takeaway!r}"
            )

    def test_glossary_is_non_empty(self):
        r = client.post(
            "/ingest",
            files={"file": _pdf_file(SAMPLE_TEXT)},
        )
        data = r.json()
        assert len(data["glossary"]) > 0, "Expected at least one glossary term"

    def test_glossary_definitions_grounded_in_source(self):
        """Every glossary definition must be sourced from the body text."""
        r = client.post(
            "/ingest",
            files={"file": _pdf_file(SAMPLE_TEXT)},
        )
        data = r.json()
        body = data["body_text"].lower()
        for term, defn in data["glossary"].items():
            # Strip trailing ellipsis, then check the core is in the body
            core = defn.rstrip("…").lower()[:100]
            words = core.split()[:6]
            found = any(
                " ".join(words[i : i + 3]) in body
                for i in range(max(1, len(words) - 2))
            )
            assert found, (
                f"Glossary definition for {term!r} does not appear in source: {defn!r}"
            )

    def test_narration_script_non_empty(self):
        r = client.post(
            "/ingest",
            files={"file": _pdf_file(SAMPLE_TEXT)},
        )
        data = r.json()
        assert len(data["narration_script"]) > 20

    def test_images_field_is_list(self):
        r = client.post(
            "/ingest",
            files={"file": _pdf_file(SAMPLE_TEXT)},
        )
        assert isinstance(r.json()["images"], list)


# ---------------------------------------------------------------------------
# Unit tests — extraction functions
# ---------------------------------------------------------------------------

class TestExtractKeyTakeaways:
    def test_returns_list(self):
        result = extract_key_takeaways(SAMPLE_TEXT)
        assert isinstance(result, list)

    def test_respects_max_count(self):
        result = extract_key_takeaways(SAMPLE_TEXT, n=3)
        assert len(result) <= 3

    def test_empty_text_returns_empty(self):
        assert extract_key_takeaways("") == []

    def test_short_text_returns_empty(self):
        # Sentence < 40 chars — filtered out
        assert extract_key_takeaways("Hello.") == []

    def test_all_takeaways_are_strings(self):
        for t in extract_key_takeaways(SAMPLE_TEXT):
            assert isinstance(t, str)


class TestExtractGlossary:
    def test_returns_dict(self):
        result = extract_glossary(SAMPLE_TEXT)
        assert isinstance(result, dict)

    def test_respects_max_terms(self):
        result = extract_glossary(SAMPLE_TEXT, n=5)
        assert len(result) <= 5

    def test_empty_text_returns_empty(self):
        assert extract_glossary("") == {}

    def test_all_values_are_strings(self):
        for v in extract_glossary(SAMPLE_TEXT).values():
            assert isinstance(v, str)


class TestNarrationScript:
    def test_extractive_fallback_no_crash(self):
        script = _build_narration_extractive(
            key_takeaways=["Machine Learning enables systems to learn."],
            headers=["Introduction to Machine Learning"],
        )
        assert isinstance(script, str)
        assert len(script) > 10

    def test_generate_without_groq_key(self):
        with patch("main.GROQ_API_KEY", ""):
            script = generate_narration_script(
                body_text=SAMPLE_TEXT,
                key_takeaways=["ML uses data."],
                headers=["Machine Learning"],
            )
        assert isinstance(script, str)
        assert len(script) > 10

    def test_generate_groq_failure_falls_back(self):
        """If Groq SDK raises, we must still get the extractive fallback."""
        with patch("main.GROQ_API_KEY", "fake-key"), \
             patch("main._GROQ_SDK_OK", True), \
             patch("main.GroqClient") as mock_groq:
            mock_groq.return_value.chat.completions.create.side_effect = (
                Exception("network error")
            )
            script = generate_narration_script(
                body_text=SAMPLE_TEXT,
                key_takeaways=["ML uses data."],
                headers=["Machine Learning"],
            )
        # Should not raise; must return the fallback string
        assert isinstance(script, str)
        assert len(script) > 10
