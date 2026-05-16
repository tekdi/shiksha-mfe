import subprocess
import json
import torch
from pathlib import Path
from transformers import pipeline as hf_pipeline
from app.core.config import settings
from app.models.schemas import TranscriptSegment, Chapter

# Lazy-loaded model cache
_hindi_pipeline = None

def _get_hindi_pipeline():
    global _hindi_pipeline
    if _hindi_pipeline is None:
        if settings.mock_mode:
            return None
        _hindi_pipeline = hf_pipeline(
            "automatic-speech-recognition",
            model=settings.hindi_model,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device=0 if torch.cuda.is_available() else -1,
        )
    return _hindi_pipeline

def detect_language(audio_path: Path) -> str:
    """Use Whisper's built-in language detection on the first 30 seconds."""
    if settings.mock_mode:
        return 'en'
    import whisper
    model = whisper.load_model("base")  # Small model just for detection
    audio = whisper.load_audio(str(audio_path))
    audio = whisper.pad_or_trim(audio)
    mel = whisper.log_mel_spectrogram(audio).to(model.device)
    _, probs = model.detect_language(mel)
    detected = max(probs, key=probs.get)
    return detected  # ISO 639-1 code: 'en', 'hi', 'ta', etc.

async def transcribe(path: Path, output_dir: Path, language: str = 'auto'):
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if settings.mock_mode:
        transcript = "This is a mock transcript for testing."
        segments = [TranscriptSegment(start=0.0, end=5.0, text="This is a mock transcript", speaker="SPEAKER_00")]
        txt_path = output_dir / path.with_suffix('.txt').name
        vtt_path = output_dir / path.with_suffix('.vtt').name
        txt_path.write_text(transcript, encoding='utf-8')
        _write_vtt(vtt_path, segments)
        return transcript, segments, txt_path, vtt_path

    # Step 1: Detect language if auto
    if language == 'auto':
        language = detect_language(path)
    
    # Step 2: Route to appropriate model
    if language == 'hi':
        return _transcribe_hindi(path, output_dir)
    # Future: elif language in ('ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa'):
    #     return _transcribe_indic(path, output_dir, language)
    else:
        return _transcribe_whisper(path, output_dir)

def _transcribe_hindi(path: Path, output_dir: Path):
    """Use Whisper-Hindi2Hinglish-Swift for Hindi content."""
    pipe = _get_hindi_pipeline()
    result = pipe(
        str(path),
        return_timestamps=True,
        chunk_length_s=30,
        batch_size=8,
    )
    
    segments = []
    for chunk in result.get('chunks', []):
        ts = chunk.get('timestamp', (0, 0))
        segments.append(TranscriptSegment(
            start=ts[0] or 0,
            end=ts[1] or 0,
            text=chunk.get('text', '').strip(),
            speaker='SPEAKER_00',
        ))
    
    transcript = ' '.join(s.text for s in segments)
    
    # Write outputs
    txt_path = output_dir / path.with_suffix('.txt').name
    vtt_path = output_dir / path.with_suffix('.vtt').name
    txt_path.write_text(transcript, encoding='utf-8')
    _write_vtt(vtt_path, segments)
    
    return transcript, segments, txt_path, vtt_path

def _transcribe_whisper(path: Path, output_dir: Path):
    """Use vanilla OpenAI Whisper for English/other content."""
    subprocess.run(
        ['whisper', str(path), '--model', settings.whisper_model,
         '--output_dir', str(output_dir), '--output_format', 'all'],
        check=True, capture_output=True, text=True
    )
    base = output_dir / path.stem
    with open(base.with_suffix('.json'), encoding='utf-8') as fh:
        data = json.load(fh)
    segments = [
        TranscriptSegment(start=s['start'], end=s['end'], text=s['text'].strip())
        for s in data.get('segments', [])
    ]
    transcript = base.with_suffix('.txt').read_text(encoding='utf-8')
    return transcript, segments, base.with_suffix('.txt'), base.with_suffix('.vtt')

def _write_vtt(path: Path, segments: list[TranscriptSegment]):
    """Generate WebVTT subtitle file from segments."""
    lines = ['WEBVTT', '']
    for i, seg in enumerate(segments, 1):
        start = _format_vtt_time(seg.start)
        end = _format_vtt_time(seg.end)
        lines.extend([str(i), f'{start} --> {end}', seg.text, ''])
    path.write_text('\n'.join(lines), encoding='utf-8')

def _format_vtt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f'{h:02}:{m:02}:{s:06.3f}'

def infer_chapters(segments: list[TranscriptSegment], every_seconds: int = 90):
    """Generate chapter markers at regular intervals."""
    chapters = []
    next_mark = 0
    for seg in segments:
        if seg.start >= next_mark:
            words = seg.text.split()[:8]
            chapters.append(Chapter(
                title=' '.join(words) or f'Chapter {len(chapters)+1}',
                start=seg.start
            ))
            next_mark += every_seconds
    return chapters
