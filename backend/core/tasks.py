"""
Celery tasks for API Performance Monitoring.

Tasks are designed to be:
- Retry-safe: Can be retried without side effects
- Minimal logic: Delegate to pure functions in aggregation.py and policies.py
- Idempotent: Safe to run multiple times on the same data
"""

from celery import shared_task
from django.utils import timezone
from django.core.management import call_command
from datetime import timedelta
import logging
from .aggregation import aggregate_metrics
from .policies import evaluate_policies
from django.core.mail import send_mail
from django.conf import settings
from core.models import AlertEvent


logger = logging.getLogger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=10, retry_kwargs={"max_retries": 3})
def aggregate_metrics_task(self):
    """
    Window-based catch-up aggregation task.

    Processes completed 1-minute windows only (not the current incomplete window).
    This ensures:
    - Restart safety: If task crashes, next run will process same windows
    - Idempotency: aggregate_metrics is idempotent per window
    - Completeness: Only aggregates when all data for a window is likely collected

    After aggregation, evaluates alert policies on all created/updated metrics.

    Runs: Every minute via Celery Beat
    """
    # Process the most recently completed 1-minute window
    # Current time: 14:32:45 -> Process window [14:31:00, 14:32:00)
    now = timezone.now()
    
    # Round down to the previous minute boundary
    end_time = now.replace(second=0, microsecond=0)
    
    # Start time is 1 minute before end_time
    start_time = end_time - timedelta(minutes=1)
    
    try:
        logger.info(
            f"Aggregating metrics for window [{start_time}, {end_time})"
        )
        
        # Delegate aggregation logic to pure function
        aggregated_metrics = aggregate_metrics(start_time, end_time)
        
        logger.info(
            f"Created/updated {len(aggregated_metrics)} aggregated metrics"
        )
        
        # Evaluate policies on each aggregated metric
        total_alerts = 0
        for agg_metric in aggregated_metrics:
            alerts_created = evaluate_policies(agg_metric)
            total_alerts += alerts_created
        
        if total_alerts > 0:
            logger.info(
                f"Policy evaluation created {total_alerts} new alerts"
            )
        
    except Exception as e:
        logger.error(
            f"Aggregation task failed for window [{start_time}, {end_time}): {e}"
        )
        raise  # Re-raise for Celery retry logic


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=30, retry_kwargs={"max_retries": 2})
def cleanup_raw_metrics_task(self):
    """
    Cleanup old raw request metrics.

    Delegates to the existing Django management command cleanup_raw_metrics.
    Contains no business logic - purely a Celery wrapper.

    The management command:
    - Deletes RequestMetric records older than 7 days
    - Keeps aggregated metrics intact (different table)

    Runs: Daily via Celery Beat
    """
    try:
        logger.info("Starting raw metrics cleanup")
        
        # Delegate fully to existing management command
        call_command('cleanup_raw_metrics')
        
        logger.info("Raw metrics cleanup completed")
        
    except Exception as e:
        logger.error(f"Cleanup task failed: {e}")
        raise  # Re-raise for Celery retry logic

@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=30,
    retry_kwargs={"max_retries": 3},
)
def send_alert_email_task(self, alert_event_id):
    alert = (
        AlertEvent.objects
        .select_related("policy", "policy__project")
        .get(id=alert_event_id)
    )

    project = alert.policy.project
    recipient_email = project.email

    if not recipient_email:
        logger.warning(
            f"No email configured for project {project.id}. Skipping alert email."
        )
        return

    subject = f"[ALERT] {alert.policy.metric} violated"

    body = f"""
🚨 Alert Triggered

Project: {project.name}
Metric: {alert.policy.metric}
Threshold: {alert.policy.threshold}
Actual Value: {alert.value}
Severity: {alert.policy.severity}
Triggered At: {alert.triggered_at}

Please investigate.
"""

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient_email],
        fail_silently=False,
    )
