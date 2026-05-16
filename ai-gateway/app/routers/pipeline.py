from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
import json

router = APIRouter()

@router.get("/stream")
async def stream_pipeline(job_id: str):
    async def event_generator():
        stages = [
            ("UPLOAD", "File uploaded successfully"),
            ("TRANSCRIBE", "Transcribing multimedia..."),
            ("SUMMARISE", "Generating summary..."),
            ("GENERATE_QUESTIONS", "Creating assessment questions..."),
            ("PACKAGE_H5P", "Packaging as H5P...")
        ]
        
        for i, (stage, msg) in enumerate(stages):
            # Simulate progress
            yield f"event: pipeline:stage\ndata: {json.dumps({'jobId': job_id, 'stage': stage, 'status': 'processing', 'message': msg})}\n\n"
            await asyncio.sleep(1)
            
            yield f"event: pipeline:progress\ndata: {json.dumps({'jobId': job_id, 'stage': stage, 'percent': (i+1)*20, 'detail': msg})}\n\n"
            await asyncio.sleep(1)
            
        yield f"event: pipeline:complete\ndata: {json.dumps({'jobId': job_id, 'artifactUrl': f'/artifacts/{job_id}.zip', 'totalDurationMs': 5000})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
