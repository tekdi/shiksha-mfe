from pathlib import Path
from app.models.schemas import Branding
from app.packaging.common import write_zip, json_text

def build_html_lesson(title: str, slides: list[str], branding: Branding, output: Path):
    deck = ''.join(f'<section><h2>{slide}</h2></section>' for slide in slides)
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>body{{font-family:{branding.font_family};color:{branding.primary_color}}}.accent{{color:{branding.secondary_color}}}</style></head><body><main><h1>{title}</h1>{deck}</main></body></html>'''
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding='utf-8')
    return output

def build_h5p_course_presentation(title: str, slides: list[str], output: Path):
    return write_zip(output, {
        'h5p.json': json_text({'title': title, 'mainLibrary': 'H5P.CoursePresentation'}),
        'content/content.json': json_text({'presentation': {'slides': slides}}),
    })

def build_scorm_lesson(title: str, html: str, output: Path):
    manifest = f'''<?xml version="1.0" encoding="UTF-8"?><manifest identifier="lesson"><organizations default="org"><organization identifier="org"><title>{title}</title><item identifier="item" identifierref="res"><title>{title}</title></item></organization></organizations><resources><resource identifier="res" type="webcontent" href="index.html"><file href="index.html"/></resource></resources></manifest>'''
    return write_zip(output, {'imsmanifest.xml': manifest, 'index.html': html})
