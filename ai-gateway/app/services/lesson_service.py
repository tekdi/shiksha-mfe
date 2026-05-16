import time, uuid
from app.models.schemas import Branding, LessonStatus
from app.services.llm_client import llm_client
from app.services.review_service import init_status

async def build_lesson(title: str, source_text: str, branding: Branding):
    started = time.perf_counter()
    lesson_id = str(uuid.uuid4())
    
    # Use LLM to split source text into slide-sized chunks
    prompt = f'''Split this text into 4-8 lesson slides. Return strict JSON:
{{"slides": [{{"id": "s1", "title": "...", "body": "..."}}]}}
Only use content from SOURCE. Each slide body should be 1-3 sentences.
SOURCE:
{source_text[:5000]}'''
    
    result = await llm_client.generate_json(prompt)
    slides = result.get('slides', [])
    
    # Ensure slides have IDs
    for i, slide in enumerate(slides):
        if 'id' not in slide:
            slide['id'] = f's{i+1}'
    
    # Generate HTML
    html_content = _render_html(title, slides, branding)
    
    init_status(lesson_id)
    
    xapi_events = [
        {'verb': 'started', 'object': lesson_id},
        {'verb': 'progressed', 'object': lesson_id, 'result': {'progress': 0}},
        {'verb': 'completed', 'object': lesson_id, 'result': {'completion': True}},
    ]
    
    generation_ms = int((time.perf_counter() - started) * 1000)
    
    # TODO: Implement H5P Course Presentation packaging
    # TODO: Implement SCORM lesson packaging
    
    return {
        'lesson_id': lesson_id,
        'title': title,
        'status': LessonStatus.draft,
        'slides': slides,
        'html_content': html_content,
        'xapi_events': xapi_events,
        'generation_ms': generation_ms,
    }

def _render_html(title: str, slides: list[dict], branding: Branding) -> str:
    slide_html = ''
    for slide in slides:
        slide_html += f'''
        <section class="slide">
          <h2>{slide.get("title", "")}</h2>
          <p>{slide.get("body", "")}</p>
        </section>'''
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: {branding.font_family}; background: #f5f5f5; }}
    .deck {{ max-width: 800px; margin: 0 auto; padding: 2rem; }}
    h1 {{ color: {branding.primary_color}; margin-bottom: 2rem; font-size: 2rem; }}
    .slide {{
      background: white; border-radius: 12px; padding: 2rem;
      margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid {branding.secondary_color};
    }}
    .slide h2 {{ color: {branding.primary_color}; margin-bottom: 0.5rem; }}
    .slide p {{ color: #333; line-height: 1.6; }}
  </style>
</head>
<body>
  <main class="deck">
    <h1>{title}</h1>
    {slide_html}
  </main>
</body>
</html>'''
