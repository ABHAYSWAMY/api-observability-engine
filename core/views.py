from django.shortcuts import render, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from datetime import timezone as dt_timezone
from .models import APIKey, RequestMetric, Project, AggregatedMetric, AlertPolicy, AlertEvent, generate_api_key
from rest_framework.permissions import IsAuthenticated, AllowAny
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def whoami(request):
    return Response({
        "username": request.user.username,
        "user_id": request.user.id
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    login(request, user)

    return Response({
        "id": user.id,
        "username": user.username,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out"})


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_view(request):
    name = request.data.get("name")
    email = request.data.get("email")
    password = request.data.get("password")

    if not name or not email or not password:
        return Response(
            {"error": "name, email, and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(password)
    except ValidationError as e:
        return Response(
            {"error": list(e.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create user with explicit password hashing
    user = User(username=email, email=email, first_name=name)
    user.set_password(password)  # Ensures password is hashed
    user.save()

    return Response(
        {"message": "User created successfully"},
        status=status.HTTP_201_CREATED,
    )


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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_project(request):
    name = request.data.get("name")
    if not name:
        return Response(
            {"error": "name is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    project = Project.objects.create(owner=request.user, name=name)

    api_key = (
        APIKey.objects.filter(project=project, is_active=True)
        .order_by("-created_at")
        .first()
    )
    if not api_key:
        api_key = APIKey.objects.create(
            project=project,
            key=generate_api_key(),
        )

    return Response(
        {
            "id": str(project.id),
            "name": project.name,
            "api_key": api_key.key,
            "created_at": project.created_at,
        },
        status=status.HTTP_201_CREATED,
    )

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