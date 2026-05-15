from app.models.schemas import LlmAnalysis
from app.services.ingestion_service import chunk_text
from app.services.llm_client import llm_client

async def analyze_document(text: str, speaker_notes: str = '') -> LlmAnalysis:
    chunks = chunk_text(text)[:8]
    partials = []
    for chunk in chunks:
        prompt = f'''Return strict JSON with keys takeaways(list[str]) and glossary(list[{{term,definition}}]). Use only the source.\nSOURCE:\n{chunk}'''
        partials.append(await llm_client.generate_json(prompt))
    merge_prompt = f'''Merge these analyses into strict JSON keys takeaways(list[str]) and glossary(list[{{term,definition}}]) with duplicates removed:\n{partials}'''
    merged = await llm_client.generate_json(merge_prompt)
    narration = None
    if speaker_notes.strip():
        narration_prompt = f'''Return strict JSON with key narration_script. Convert these speaker notes into a concise narration, using only the notes:\n{speaker_notes}'''
        narration = (await llm_client.generate_json(narration_prompt)).get('narration_script')
    return LlmAnalysis(**merged, narration_script=narration)
