import pytest
from app.services.lesson_service import build_lesson, _render_html
from app.models.schemas import Branding
from unittest.mock import AsyncMock, patch

@pytest.fixture
def mock_branding():
    return Branding(
        primary_color="#123B5D",
        secondary_color="#F5A623",
        font_family="Inter, Arial, sans-serif"
    )

@pytest.mark.asyncio
async def test_build_lesson_returns_slides(mock_branding):
    mock_llm_response = {
        "slides": [
            {"id": "s1", "title": "Slide 1", "body": "Body 1"},
            {"id": "s2", "title": "Slide 2", "body": "Body 2"}
        ]
    }
    
    with patch("app.services.lesson_service.llm_client.generate_json", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_llm_response
        
        result = await build_lesson("Test Title", "Some source text", mock_branding)
        
        assert len(result["slides"]) == 2
        assert result["slides"][0]["title"] == "Slide 1"
        assert result["lesson_id"] is not None

def test_build_lesson_generates_html_with_branding(mock_branding):
    slides = [{"id": "s1", "title": "Intro", "body": "Hello world"}]
    html = _render_html("Test Title", slides, mock_branding)
    
    assert "<html" in html
    assert "<body" in html
    assert mock_branding.primary_color in html
    assert mock_branding.secondary_color in html
    assert "Intro" in html
    assert "Hello world" in html

@pytest.mark.asyncio
async def test_build_lesson_measures_generation_time(mock_branding):
    mock_llm_response = {"slides": []}
    with patch("app.services.lesson_service.llm_client.generate_json", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_llm_response
        result = await build_lesson("Title", "Text", mock_branding)
        assert result["generation_ms"] >= 0

def test_lesson_html_is_valid(mock_branding):
    slides = [{"title": "T1", "body": "B1"}]
    html = _render_html("Title", slides, mock_branding)
    assert "<section class=\"slide\">" in html
    assert "<h2>T1</h2>" in html
    assert "<p>B1</p>" in html
