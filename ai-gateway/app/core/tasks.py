from app.core.celery_app import celery_app

@celery_app.task(name='shiksha_ai.ping')
def ping():
    return {'status': 'ok'}
