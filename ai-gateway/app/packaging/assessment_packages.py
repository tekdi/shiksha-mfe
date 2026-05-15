from pathlib import Path
from app.models.schemas import Question
from app.packaging.common import write_zip, json_text

def build_h5p_question_set(title: str, questions: list[Question], output: Path):
    params = {'introPage': {'showIntroPage': False}, 'questions': []}
    library_by_type = {
        'mcq': 'H5P.MultiChoice 1.16',
        'fill_blank': 'H5P.Blanks 1.14',
        'match_pair': 'H5P.DragQuestion 1.14',
    }
    for q in questions:
        params['questions'].append({'library': library_by_type[q.type.value], 'params': q.model_dump()})
    return write_zip(output, {
        'h5p.json': json_text({'title': title, 'mainLibrary': 'H5P.QuestionSet', 'preloadedDependencies': [{'machineName':'H5P.QuestionSet','majorVersion':1,'minorVersion':20}]}),
        'content/content.json': json_text(params),
    })

def build_scorm_assessment(title: str, questions: list[Question], output: Path):
    html = f'''<!doctype html><html><head><meta charset="utf-8"><title>{title}</title><script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script></head><body><h1>{title}</h1><pre id="data"></pre><script>document.getElementById('data').textContent = {questions!r};</script></body></html>'''
    manifest = f'''<?xml version="1.0" encoding="UTF-8"?><manifest identifier="assessment"><organizations default="org"><organization identifier="org"><title>{title}</title><item identifier="item" identifierref="res"><title>{title}</title></item></organization></organizations><resources><resource identifier="res" type="webcontent" href="index.html"><file href="index.html"/></resource></resources></manifest>'''
    return write_zip(output, {'imsmanifest.xml': manifest, 'index.html': html})
