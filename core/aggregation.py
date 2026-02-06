from collections import defaultdict
from datetime import timedelta
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import RequestMetric, AggregatedMetric

BUCKET_DEFINITIONS = {
    "1m": timedelta(minutes=1),
    "5m": timedelta(minutes=5),
    "1h": timedelta(hours=1),
}

def compute_p95(latencies):
    if not latencies:
        return 0

    latencies.sort()
    index = int(len(latencies) * 0.95) - 1
    index = max(index, 0)
    return latencies[index]

def get_bucket_start(timestamp, bucket_delta):
    """
    Calculate the start time of the bucket that contains the given timestamp.
    Buckets are aligned to epoch (e.g., 1m buckets start at :00, :01, :02...).
    """
    epoch = timezone.make_aware(timezone.datetime.min)
    offset = (timestamp - epoch).total_seconds()
    bucket_seconds = bucket_delta.total_seconds()
    bucket_index = int(offset // bucket_seconds)
    bucket_start = epoch + timedelta(seconds=bucket_index * bucket_seconds)
    return bucket_start

def aggregate_metrics(start_time, end_time):
    """
    Aggregate raw RequestMetric into AggregatedMetric
    for all bucket sizes (1m, 5m, 1h).

    This function is:
    - pure (no Celery)
    - idempotent per time window
    - safe to run multiple times

    Returns:
        list[AggregatedMetric]: List of created or updated AggregatedMetric objects
    """
    created_metrics = []

    # 1. Fetch raw metrics in window
    raw_metrics = RequestMetric.objects.filter(
        timestamp__gte=start_time,
        timestamp__lt=end_time,
    )

    if not raw_metrics.exists():
        return created_metrics  # nothing to do

    # 2. For each bucket size, aggregate metrics by which bucket they belong to
    for bucket_size, bucket_delta in BUCKET_DEFINITIONS.items():
        # Group metrics by (project, endpoint, bucket_start)
        bucket_groups = defaultdict(list)

        for metric in raw_metrics:
            bucket_start = get_bucket_start(metric.timestamp, bucket_delta)
            key = (metric.project_id, metric.endpoint, bucket_start)
            bucket_groups[key].append(metric)

        # 3. Process each bucket group
        with transaction.atomic():
            for (project_id, endpoint, bucket_start), metrics in bucket_groups.items():
                latencies = [m.latency_ms for m in metrics]
                error_count = sum(1 for m in metrics if m.status_code >= 500)
                request_count = len(metrics)
                p95_latency = compute_p95(latencies)

                # Check if bucket already exists
                agg_metric, created = AggregatedMetric.objects.get_or_create(
                    project_id=project_id,
                    endpoint=endpoint,
                    bucket_start=bucket_start,
                    bucket_size=bucket_size,
                    defaults={
                        "request_count": request_count,
                        "error_count": error_count,
                        "p95_latency_ms": p95_latency,
                    },
                )

                # If bucket already exists, accumulate the counts
                if not created:
                    agg_metric.request_count += request_count
                    agg_metric.error_count += error_count
                    # Recalculate p95 across all latencies (fetch existing metrics)
                    existing_latencies = RequestMetric.objects.filter(
                        project_id=project_id,
                        endpoint=endpoint,
                        timestamp__gte=bucket_start,
                        timestamp__lt=bucket_start + bucket_delta,
                    ).values_list("latency_ms", flat=True)
                    all_latencies = list(existing_latencies)
                    agg_metric.p95_latency_ms = compute_p95(all_latencies)
                    agg_metric.save()

                # Track created/updated metric for policy evaluation
                created_metrics.append(agg_metric)

    return created_metrics


