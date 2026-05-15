from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import LlmAnalysis, GlossaryTerm
from app.routers import ingestion

def test_pdf_upload_endpoint(sample_pdf, monkeypatch):
    async def fake_analysis(text, speaker_notes=''):
        return LlmAnalysis(takeaways=['Plants use sunlight'], glossary=[GlossaryTerm(term='Photosynthesis', definition='Energy conversion')])
    monkeypatch.setattr(ingestion, 'analyze_document', fake_analysis)
    client = TestClient(app)
    with sample_pdf.open('rb') as fh:
        response = client.post('/api/v1/ingestion/upload', files={'file': ('sample.pdf', fh, 'application/pdf')})
    assert response.status_code == 200
    body = response.json()
    assert body['document_type'] == 'pdf'
    assert body['pages'][0]['blocks'][0]['text'] == 'Photosynthesis'
