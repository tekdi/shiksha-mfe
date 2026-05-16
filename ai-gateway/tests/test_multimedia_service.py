import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path
from app.services.multimedia_service import (
    detect_language, 
    _write_vtt, 
    _format_vtt_time, 
    infer_chapters,
    transcribe
)
from app.models.schemas import TranscriptSegment

@pytest.fixture
def mock_settings():
    with patch('app.services.multimedia_service.settings') as mock:
        mock.mock_mode = False
        mock.whisper_model = 'base'
        mock.hindi_model = 'Oriserve/Whisper-Hindi2Hinglish-Swift'
        yield mock

def test_format_vtt_time():
    assert _format_vtt_time(0) == "00:00:00.000"
    assert _format_vtt_time(3661.123) == "01:01:01.123"

def test_write_vtt(tmp_path):
    segments = [
        TranscriptSegment(start=0.0, end=2.5, text="Hello world"),
        TranscriptSegment(start=2.5, end=5.0, text="Second segment")
    ]
    vtt_path = tmp_path / "test.vtt"
    _write_vtt(vtt_path, segments)
    
    content = vtt_path.read_text()
    assert "WEBVTT" in content
    assert "00:00:00.000 --> 00:00:02.500" in content
    assert "Hello world" in content
    assert "2" in content

def test_infer_chapters():
    segments = [
        TranscriptSegment(start=0, end=10, text="Introduction to biology"),
        TranscriptSegment(start=95, end=105, text="Cell structure details"),
        TranscriptSegment(start=190, end=200, text="Mitochondria function")
    ]
    chapters = infer_chapters(segments, every_seconds=90)
    
    assert len(chapters) == 3
    assert chapters[0].title == "Introduction to biology"
    assert chapters[0].start == 0
    assert chapters[1].title == "Cell structure details"
    assert chapters[1].start == 95
    assert chapters[2].title == "Mitochondria function"
    assert chapters[2].start == 190

@patch('whisper.load_model')
@patch('whisper.load_audio')
@patch('whisper.pad_or_trim')
@patch('whisper.log_mel_spectrogram')
def test_detect_language_returns_iso_code(mock_mel, mock_trim, mock_audio, mock_load, mock_settings):
    mock_model = MagicMock()
    mock_load.return_value = mock_model
    mock_model.detect_language.return_value = (None, {'en': 0.9, 'hi': 0.1})
    
    result = detect_language(Path("test.wav"))
    assert result == 'en'
    mock_model.detect_language.assert_called_once()

@patch('app.services.multimedia_service._get_hindi_pipeline')
@patch('app.services.multimedia_service.detect_language')
@pytest.mark.asyncio
async def test_transcribe_routes_to_hindi_for_hi(mock_detect, mock_get_pipe, tmp_path, mock_settings):
    mock_pipe = MagicMock()
    mock_get_pipe.return_value = mock_pipe
    mock_pipe.return_value = {
        'chunks': [{'timestamp': (0.0, 5.0), 'text': 'Namaste world'}]
    }
    
    audio_path = tmp_path / "input.wav"
    audio_path.write_text("dummy")
    
    transcript, segments, txt_path, vtt_path = await transcribe(audio_path, tmp_path, language='hi')
    
    assert transcript == "Namaste world"
    assert len(segments) == 1
    assert segments[0].text == "Namaste world"
    mock_get_pipe.assert_called_once()

@patch('subprocess.run')
@patch('app.services.multimedia_service.detect_language')
@pytest.mark.asyncio
async def test_transcribe_routes_to_whisper_for_en(mock_detect, mock_sub, tmp_path, mock_settings):
    # Mock subprocess creating the JSON output
    def side_effect(*args, **kwargs):
        base = tmp_path / "input"
        base.with_suffix('.json').write_text('{"segments": [{"start": 0.0, "end": 5.0, "text": "Hello"}]}')
        base.with_suffix('.txt').write_text('Hello')
        base.with_suffix('.vtt').write_text('WEBVTT')
        return MagicMock()

    mock_sub.side_effect = side_effect
    
    audio_path = tmp_path / "input.wav"
    audio_path.write_text("dummy")
    
    transcript, segments, txt_path, vtt_path = await transcribe(audio_path, tmp_path, language='en')
    
    assert transcript == "Hello"
    assert mock_sub.called
    assert '--model' in mock_sub.call_args[0][0]
