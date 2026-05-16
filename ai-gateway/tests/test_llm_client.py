import pytest
from app.services.llm_client import llm_client

def test_llm_client_repairs_markdown_fenced_json():
    raw = "```json\n{\"key\": \"value\"}\n```"
    repaired = llm_client._repair_json(raw)
    assert repaired == {"key": "value"}

def test_llm_client_repairs_unfenced_json():
    raw = "Some text before {\"key\": \"value\"} some text after"
    repaired = llm_client._repair_json(raw)
    assert repaired == {"key": "value"}

def test_llm_client_fails_on_invalid_json():
    raw = "Not json at all"
    with pytest.raises(ValueError, match="Could not parse LLM output as JSON"):
        llm_client._repair_json(raw)
