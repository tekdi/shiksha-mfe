import re
from pathlib import Path
import fitz
from pptx import Presentation
from app.models.schemas import DocumentBlock, ImageAsset, ParsedPage, ParsedSlide

def parse_pdf(path: Path):
    doc = fitz.open(path)
    pages = []
    all_text = []
    for page_index, page in enumerate(doc):
        blocks = []
        spans = []
        data = page.get_text('dict')
        for block in data.get('blocks', []):
            if block.get('type') != 0:
                continue
            for line in block.get('lines', []):
                line_text = ''.join(span.get('text', '') for span in line.get('spans', [])).strip()
                if not line_text:
                    continue
                max_size = max((span.get('size', 0) for span in line.get('spans', [])), default=0)
                spans.append((line_text, max_size))
        normal_sizes = sorted([size for _, size in spans])
        body_size = normal_sizes[len(normal_sizes)//2] if normal_sizes else 0
        for text, size in spans:
            kind = 'heading' if size > body_size * 1.15 and len(text) < 180 else 'paragraph'
            blocks.append(DocumentBlock(kind=kind, text=text))
            all_text.append(text)
        images = []
        for idx, image in enumerate(page.get_images(full=True), start=1):
            xref = image[0]
            info = doc.extract_image(xref)
            images.append(ImageAsset(page_number=page_index+1,index=idx,width=info.get('width'),height=info.get('height'),extension=info.get('ext')))
        pages.append(ParsedPage(page_number=page_index+1, blocks=blocks, images=images))
    metadata = doc.metadata
    doc.close()
    return metadata, pages, '\n'.join(all_text)

def parse_pptx(path: Path):
    prs = Presentation(path)
    slides = []
    all_text = []
    for idx, slide in enumerate(prs.slides, start=1):
        title = None
        body = []
        images = []
        for shape in slide.shapes:
            if getattr(shape, 'has_text_frame', False):
                text = '\n'.join(p.text for p in shape.text_frame.paragraphs if p.text.strip()).strip()
                if not text:
                    continue
                if shape == slide.shapes.title:
                    title = text
                else:
                    body.extend([line for line in text.split('\n') if line.strip()])
            if shape.shape_type == 13:
                images.append(shape.name)
        notes = ''
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
            notes = slide.notes_slide.notes_text_frame.text.strip()
        slides.append(ParsedSlide(slide_number=idx, title=title, body=body, images=images, speaker_notes=notes))
        all_text.extend([title or '', *body, notes])
    return {'slide_count': len(slides)}, slides, '\n'.join(part for part in all_text if part)

def chunk_text(text: str, size: int = 3500):
    paragraphs = re.split(r'\n+', text)
    chunks, current = [], ''
    for paragraph in paragraphs:
        if len(current) + len(paragraph) + 1 > size and current:
            chunks.append(current)
            current = paragraph
        else:
            current = f'{current}\n{paragraph}'.strip()
    if current:
        chunks.append(current)
    return chunks
