"""Celery application configuration."""

from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "code_story",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.story_pipeline"],
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Task execution settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Result backend settings
    result_expires=43200,  # 12 hours in seconds

    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=4,

    # Task time limits
    task_soft_time_limit=600,  # 10 minutes soft limit
    task_time_limit=720,  # 12 minutes hard limit

    # Retry settings
    task_default_retry_delay=30,
    task_max_retries=3,
)

# Task routes for different queues
celery_app.conf.task_routes = {
    "app.tasks.story_pipeline.*": {"queue": "story_generation"},
}
