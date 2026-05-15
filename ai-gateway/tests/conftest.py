import pytest
from pathlib import Path
from reportlab.pdfgen import canvas
from pptx import Presentation
from pptx.util import Inches

@pytest.fixture
def sample_pdf(tmp_path):
    path = tmp_path / 'sample.pdf'
    c = canvas.Canvas(str(path))
    c.setFont('Helvetica-Bold', 18)
    c.drawString(72, 760, 'Photosynthesis')
    c.setFont('Helvetica', 12)
    c.drawString(72, 730, 'Plants convert sunlight into chemical energy.')
    c.showPage(); c.save()
    return path

@pytest.fixture
def sample_pptx(tmp_path):
    path = tmp_path / 'sample.pptx'
    prs = Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    slide.shapes.title.text = 'Water Cycle'
    slide.placeholders[1].text = 'Evaporation\nCondensation\nPrecipitation'
    prs.save(path)
    return path
