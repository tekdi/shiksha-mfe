from pathlib import Path
from app.models.schemas import Chapter
from app.packaging.common import write_zip, json_text

def build_h5p_interactive_video(title: str, vtt_name: str, chapters: list[Chapter], output: Path):
    content = {
        'interactiveVideo': {
            'video': {'files': [], 'tracks': [{'kind': 'subtitles', 'src': vtt_name, 'label': 'Transcript'}]},
            'bookmarks': [chapter.model_dump() for chapter in chapters],
            'interactions': [],
        }
    }
    return write_zip(output, {
        'h5p.json': json_text({'title': title, 'mainLibrary': 'H5P.InteractiveVideo'}),
        'content/content.json': json_text(content),
    })
