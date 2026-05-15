import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from reportlab.pdfgen import canvas
from app.services.ingestion_service import parse_pdf

path = Path('/tmp/shiksha-benchmark-50-page.pdf')
if not path.exists():
    c = canvas.Canvas(str(path))
    for page in range(50):
        c.setFont('Helvetica-Bold', 18)
        c.drawString(72, 760, f'Page {page + 1}')
        c.setFont('Helvetica', 12)
        c.drawString(72, 730, 'Plants convert sunlight into chemical energy during photosynthesis.')
        c.showPage()
    c.save()
started = time.perf_counter(); parse_pdf(path); elapsed = time.perf_counter() - started
print({'file': str(path), 'pages': 50, 'seconds': round(elapsed, 3)})
