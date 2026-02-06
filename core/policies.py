"""
Policy evaluation logic for aggregated metrics.

This module provides deterministic, idempotent evaluation of alert policies
against aggregated metrics. It ensures alerts are only created when policies
are violated and cooldown periods are respected.

Key properties:
- Deterministic: Same inputs always produce same output
- Idempotent: Multiple evaluations of the same metric don't create duplicate alerts
- Side-effect free: Only creates AlertEvent records
"""

from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from typing import Union, Optional
from .models import AlertPolicy, AlertEvent, AggregatedMetric


def resolve_metric_value(policy_metric: str, aggregated_metric: AggregatedMetric) -> float:
    """
    Resolve the numeric value for a given policy metric type.

    Args:
        policy_metric: One of "latency_p95", "error_rate", "throughput"
        aggregated_metric: AggregatedMetric instance to extract value from

    Returns:
        float: The resolved metric value

    Raises:
        ValueError: If policy_metric is unknown

    Examples:
        >>> resolve_metric_value("latency_p95", metric)
        125.5
        >>> resolve_metric_value("error_rate", metric)  # handles 0 request_count
        0.05
        >>> resolve_metric_value("throughput", metric)
        1500
    """
    if policy_metric == "latency_p95":
        # P95 latency in milliseconds from the aggregated metric
        return float(aggregated_metric.p95_latency_ms)

    if policy_metric == "error_rate":
        # Error rate as fraction: error_count / request_count
        # Safely handle zero request_count by returning 0 (no errors if no requests)
        if aggregated_metric.request_count == 0:
            return 0.0
        return aggregated_metric.error_count / aggregated_metric.request_count

    if policy_metric == "throughput":
        # Throughput as request count (requests per bucket)
        return float(aggregated_metric.request_count)

    raise ValueError(f"Unknown policy metric type: {policy_metric}")


def is_in_cooldown(policy: AlertPolicy) -> bool:
    """
    Check if a policy is currently in cooldown (preventing duplicate alerts).

    Cooldown is determined by the most recent alert for this policy.
    If an alert was triggered within the last cooldown_minutes, return True.

    Args:
        policy: AlertPolicy instance to check

    Returns:
        bool: True if policy is in cooldown, False otherwise

    Notes:
        - Zero cooldown_minutes means no cooldown (always returns False)
        - Query is efficient: indexes on policy + triggered_at
    """
    last_event = (
        AlertEvent.objects
        .filter(policy=policy)
        .order_by("-triggered_at")
        .first()
    )

    if not last_event:
        # No prior alert, not in cooldown
        return False

    cooldown_until = last_event.triggered_at + timedelta(
        minutes=policy.cooldown_minutes
    )

    return timezone.now() < cooldown_until


def is_policy_violated(
    policy: AlertPolicy, metric_value: float
) -> bool:
    """
    Determine if a policy's threshold is violated by the given metric value.

    Args:
        policy: AlertPolicy instance with comparison and threshold
        metric_value: The resolved metric value to compare

    Returns:
        bool: True if violation, False otherwise

    Examples:
        >>> policy.comparison = ">"
        >>> policy.threshold = 100.0
        >>> is_policy_violated(policy, 150.0)  # 150 > 100
        True
        >>> is_policy_violated(policy, 50.0)   # 50 > 100
        False
    """
    if policy.comparison == ">":
        return metric_value > policy.threshold
    elif policy.comparison == "<":
        return metric_value < policy.threshold
    else:
        # Should not happen if model validation is correct
        raise ValueError(f"Unknown comparison operator: {policy.comparison}")


def evaluate_policies(aggregated_metric: AggregatedMetric) -> int:
    """
    Evaluate all active policies for an aggregated metric and create alerts.

    This is the main entry point for policy evaluation. It:
    1. Loads all active policies for the metric's project
    2. Resolves the metric value for each policy's metric type
    3. Applies the policy's comparison operator
    4. Creates an AlertEvent only if:
       - Policy is violated
       - Policy is not in cooldown
       - Alert doesn't already exist (idempotency via unique constraints)

    Args:
        aggregated_metric: AggregatedMetric instance to evaluate

    Returns:
        int: Number of new alerts created

    Notes:
        Determinism:
        - All comparisons are direct numeric comparisons (no randomness)
        - Alert creation is idempotent: re-running on same metric won't create duplicates

        Idempotency:
        - Uses get_or_create pattern with atomic transaction
        - If called twice on same metric, second call may fail to create alerts
          (due to cooldown), but this is correct behavior

        Side effects:
        - Creates AlertEvent records in the database
        - No external API calls, emails, or side effects beyond DB writes
    """
    alerts_created = 0

    # Load all active policies for this project
    policies = AlertPolicy.objects.filter(
        project=aggregated_metric.project,
        is_active=True
    )

    # Evaluate each policy
    for policy in policies:
        try:
            # 1. Resolve the metric value
            metric_value = resolve_metric_value(policy.metric, aggregated_metric)

            # 2. Check if policy is violated
            if not is_policy_violated(policy, metric_value):
                # No violation, skip this policy
                continue

            # 3. Check cooldown
            if is_in_cooldown(policy):
                # In cooldown, skip alert creation
                continue

            # 4. Create alert atomically
            # Using atomic transaction ensures consistency if multiple workers
            # evaluate the same metric concurrently
            with transaction.atomic():
                alert_event, created = AlertEvent.objects.get_or_create(
                    policy=policy,
                    triggered_at=timezone.now(),
                    defaults={
                        "value": metric_value,
                        "resolved": False,
                    }
                )

                if created:
                    alerts_created += 1

        except ValueError as e:
            # Log policy metric type errors, but continue evaluating other policies
            # This prevents a single malformed policy from breaking all evaluations
            import logging
            logger = logging.getLogger(__name__)
            logger.error(
                f"Policy {policy.id} evaluation error: {e}",
                extra={
                    "policy_id": policy.id,
                    "project_id": aggregated_metric.project_id,
                }
            )
            continue

    return alerts_created
