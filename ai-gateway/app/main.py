from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingestion, assessment, multimedia, lessons, pipeline

from app.core.config import settings

app = FastAPI(title='Shiksha AI Gateway', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(ingestion.router, prefix='/api/v1/ingestion', tags=['Module A'])
app.include_router(assessment.router, prefix='/api/v1/assessment', tags=['Module B'])
app.include_router(multimedia.router, prefix='/api/v1/multimedia', tags=['Module C'])
app.include_router(lessons.router, prefix='/api/v1/lessons', tags=['Module D'])
app.include_router(pipeline.router, prefix='/api/v1/pipeline', tags=['SSE'])

@app.get('/health')
def health():
    return {'status': 'healthy', 'service': 'ai-gateway'}
