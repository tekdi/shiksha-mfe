from pathlib import Path
import subprocess
import json
import webvtt
from app.core.config import settings
from app.models.schemas import TranscriptSegment, Chapter

def transcribe(path: Path, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(['whisper', str(path), '--model', settings.whisper_model, '--output_dir', str(output_dir), '--output_format', 'all'], check=True, capture_output=True, text=True)
    base = output_dir / path.stem
    with open(base.with_suffix('.json'), encoding='utf-8') as fh:
        data = json.load(fh)
    segments = [TranscriptSegment(start=s['start'], end=s['end'], text=s['text'].strip()) for s in data.get('segments', [])]
    transcript = base.with_suffix('.txt').read_text(encoding='utf-8')
    return transcript, segments, base.with_suffix('.txt'), base.with_suffix('.vtt')

def infer_chapters(segments: list[TranscriptSegment], every_seconds: int = 90):
    chapters = []
    next_mark = 0
    for segment in segments:
        if segment.start >= next_mark:
            words = segment.text.split()[:8]
            chapters.append(Chapter(title=' '.join(words) or f'Chapter {len(chapters)+1}', start=segment.start))
            next_mark += every_seconds
    return chapters
