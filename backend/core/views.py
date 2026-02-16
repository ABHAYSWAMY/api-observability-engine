from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from datetime import timezone as dt_timezone
from .models import APIKey, RequestMetric, Project, AggregatedMetric, AlertPolicy, AlertEvent, generate_api_key
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

class IngestMetricView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        # 1. Read API key
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"error": "Missing API key"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        key = auth_header.split(" ")[1]

        try:
            api_key = APIKey.objects.get(key=key, is_active=True)
        except APIKey.DoesNotExist:
            return Response(
                {"error": "Invalid API key"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 2. Parse payload
        data = request.data

        required_fields = ["endpoint", "status_code", "latency_ms", "timestamp"]
        for field in required_fields:
            if field not in data:
                return Response(
                    {"error": f"Missing field: {field}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        timestamp = parse_datetime(data["timestamp"])
        if not timestamp:
            return Response(
                {"error": "Invalid timestamp format"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if timezone.is_naive(timestamp):
            timestamp = timezone.make_aware(timestamp, dt_timezone.utc)


        # 3. Insert raw metric
        RequestMetric.objects.create(
            project=api_key.project,
            endpoint=data["endpoint"],
            method=data.get("method", "GET"),
            status_code=data["status_code"],
            latency_ms=data["latency_ms"],
            timestamp=timestamp,
        )

        # 4. Return immediately
        return Response(status=status.HTTP_204_NO_CONTENT)


@permission_classes([AllowAny])
@api_view(["GET"])
def list_projects(request):
    projects = Project.objects.all()

    data = [
        {
            "id": str(project.id),
            "name": project.name,
            "created_at": project.created_at,
        }
        for project in projects
    ]

    return Response(data)

@permission_classes([AllowAny])
@api_view(["POST"])
def create_project(request):
    name = request.data.get("name")
    email = request.data.get("email")

    if not name:
        return Response(
            {"error": "name is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not email:
        return Response(
            {"error": "email is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create project (auth-free)
    project = Project.objects.create(
        owner=None,
        name=name,
        email=email,
    )

    # BUG FIX: The post_save signal in signals.py already creates an APIKey for new projects.
    # Previously, we were creating a second API key here, causing duplicates.
    # Now we fetch the existing API key that was created by the signal handler.
    # This guarantees exactly ONE API key per project.
    api_key = APIKey.objects.get(project=project)

    return Response(
        {
            "id": str(project.id),
            "name": project.name,
            "email": project.email,
            "api_key": api_key.key,
            "created_at": project.created_at,
        },
        status=status.HTTP_201_CREATED,
    )

@permission_classes([AllowAny])
@api_view(["GET"])
def list_raw_metrics(request, project_id):
    project = get_object_or_404(
        Project,
        id=project_id,
    )

    metrics = RequestMetric.objects.filter(project=project).order_by("-timestamp")[:100]

    data = [
        {
            "endpoint": m.endpoint,
            "method": m.method,
            "status_code": m.status_code,
            "latency_ms": m.latency_ms,
            "timestamp": m.timestamp,
        }
        for m in metrics
    ]

    return Response(data)

@permission_classes([AllowAny])
@api_view(["GET"])
def list_aggregated_metrics(request, project_id):
    project = get_object_or_404(
        Project,
        id=project_id,
    )

    bucket = request.GET.get("bucket", "1m")
    start = request.GET.get("from")
    end = request.GET.get("to")

    if bucket not in {"1m", "5m", "1h"}:
        return Response(
            {"error": "Invalid bucket value"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def parse_to_utc(value):
        if not value:
            return None
        parsed = parse_datetime(value)
        if not parsed:
            return "invalid"
        if timezone.is_naive(parsed):
            return timezone.make_aware(parsed, dt_timezone.utc)
        return parsed.astimezone(dt_timezone.utc)

    start_dt = parse_to_utc(start)
    end_dt = parse_to_utc(end)

    if start_dt == "invalid" or end_dt == "invalid":
        return Response(
            {"error": "Invalid datetime format"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    qs = AggregatedMetric.objects.filter(
        project=project,
        bucket_size=bucket,
    )

    if start_dt:
        qs = qs.filter(bucket_start__gte=start_dt)
    if end_dt:
        qs = qs.filter(bucket_start__lte=end_dt)

    qs = qs.order_by("bucket_start")

    return Response([
        {
            "bucket_start": m.bucket_start,
            "request_count": m.request_count,
            "error_count": m.error_count,
            "p95_latency_ms": m.p95_latency_ms,
        }
        for m in qs
    ])

@permission_classes([AllowAny])
@api_view(["GET", "POST"])
def get_policies(request, project_id):
    project = get_object_or_404(
        Project, id=project_id
    )
    if request.method == "GET":
        policies = AlertPolicy.objects.filter(project=project)

        return Response([
            {
                "id": p.id,
                "name": p.name,
                "metric": p.metric,
                "comparison": p.comparison,
                "threshold": p.threshold,
                "cooldown_minutes": p.cooldown_minutes,
                "severity": p.severity,
                "is_active": p.is_active,
            }
            for p in policies
        ])

    elif request.method == "POST":
        # Validate required fields
        name = request.data.get("name")
        metric = request.data.get("metric")
        comparison = request.data.get("comparison")
        threshold = request.data.get("threshold")
        severity = request.data.get("severity")

        if not name:
            return Response(
                {"error": "name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not metric:
            return Response(
                {"error": "metric is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if metric not in ["latency_p95", "error_rate", "throughput"]:
            return Response(
                {"error": "metric must be one of: latency_p95, error_rate, throughput"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not comparison:
            return Response(
                {"error": "comparison is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if comparison not in [">", "<"]:
            return Response(
                {"error": "comparison must be > or <"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if threshold is None:
            return Response(
                {"error": "threshold is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not severity:
            return Response(
                {"error": "severity is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if severity not in ["info", "warn", "critical"]:
            return Response(
                {"error": "severity must be one of: info, warn, critical"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get cooldown_minutes (default to 15)
        cooldown_minutes = request.data.get("cooldown_minutes", 15)

        # Create the alert policy
        policy = AlertPolicy.objects.create(
            project=project,
            name=name,
            metric=metric,
            comparison=comparison,
            threshold=float(threshold),
            severity=severity,
            cooldown_minutes=cooldown_minutes,
            is_active=True,
        )

        return Response(
            {
                "id": policy.id,
                "name": policy.name,
                "metric": policy.metric,
                "comparison": policy.comparison,
                "threshold": policy.threshold,
                "severity": policy.severity,
                "cooldown_minutes": policy.cooldown_minutes,
                "is_active": policy.is_active,
            },
            status=status.HTTP_201_CREATED,
        )

@permission_classes([AllowAny])
@api_view(["GET"])
def get_alerts(request, project_id):
    project = get_object_or_404(
        Project, id=project_id
    )

    alerts = (
        AlertEvent.objects
        .filter(policy__project=project)
        .select_related("policy")
        .order_by("-triggered_at")
    )

    return Response([
        {
            "metric": a.policy.metric,
            "threshold": a.policy.threshold,
            "value": a.value,
            "severity": a.policy.severity,
            "triggered_at": a.triggered_at,
        }
        for a in alerts
    ])