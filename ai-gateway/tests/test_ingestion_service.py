from app.services.ingestion_service import ingestion_service

def test_parse_pdf_extracts_headings_and_body(sample_pdf):
    pages = ingestion_service.parse_pdf(sample_pdf)
    assert len(pages) == 1
    blocks = pages[0].blocks
    assert any(b.kind == "heading" and b.text == "Photosynthesis" for b in blocks)
    assert any("chemical" in b.text.lower() and "energy" in b.text.lower() for b in blocks)

def test_parse_pptx_extracts_title_body_notes(sample_pptx):
    slides = ingestion_service.parse_pptx(sample_pptx)
    assert len(slides) == 1
    slide = slides[0]
    assert slide.title == "Water Cycle"
    assert any("Evaporation" in b for b in slide.body)
    assert "solar energy" in slide.speaker_notes
