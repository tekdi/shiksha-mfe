from app.services.ingestion_service import parse_pdf, parse_pptx

def test_parse_pdf_extracts_heading_and_text(sample_pdf):
    metadata, pages, text = parse_pdf(sample_pdf)
    assert pages[0].blocks[0].text == 'Photosynthesis'
    assert 'Plants convert sunlight' in text

def test_parse_pptx_extracts_slide_content(sample_pptx):
    metadata, slides, text = parse_pptx(sample_pptx)
    assert metadata['slide_count'] == 1
    assert slides[0].title == 'Water Cycle'
    assert 'Evaporation' in text
