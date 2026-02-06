from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from .models import APIKey, RequestMetric, Project, AggregatedMetric, AlertPolicy, AlertEvent
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

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
            timestamp = timezone.make_aware(timestamp, timezone.utc)


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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def whoami(request):
    return Response({
        "username": request.user.username,
        "user_id": request.user.id
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_projects(request):
    projects = Project.objects.filter(owner=request.user)

    data = [
        {
            "id": str(project.id),
            "name": project.name,
            "created_at": project.created_at,
        }
        for project in projects
    ]

    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_raw_metrics(request, project_id):
    project = get_object_or_404(
        Project,
        id=project_id,
        owner=request.user,
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_aggregated_metrics(request, project_id):
    project = get_object_or_404(
        Project,
        id=project_id,
        owner=request.user,
    )

    bucket = request.GET.get("bucket", "1m")
    start = request.GET.get("from")
    end = request.GET.get("to")

    qs = AggregatedMetric.objects.filter(
        project=project,
        bucket_size=bucket,
    )

    if start:
        qs = qs.filter(bucket_start__gte=start)
    if end:
        qs = qs.filter(bucket_start__lte=end)

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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_policies(request, project_id):
    project = get_object_or_404(
        Project, id=project_id, owner=request.user
    )

    policies = AlertPolicy.objects.filter(project=project)

    return Response([
        {
            "id": p.id,
            "metric": p.metric,
            "comparison": p.comparison,
            "threshold": p.threshold,
            "cooldown_minutes": p.cooldown_minutes,
            "severity": p.severity,
            "is_active": p.is_active,
        }
        for p in policies
    ])

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_alerts(request, project_id):
    project = get_object_or_404(
        Project, id=project_id, owner=request.user
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